import docker
import threading
import time
import logging
import traceback
from database import get_db_connection

try:
    from kubernetes import client as k8s_client, config as k8s_config, stream as k8s_stream
    from kubernetes.client import ApiException
    HAS_K8S = True
except ImportError:
    HAS_K8S = False

from sockets.socket_manager import (
    emit_monitoring_update
 )

client = docker.from_env()
monitor_threads = {}
logger = logging.getLogger(__name__)

# Try to load K8s config for pod-level monitoring
_K8S_CONFIG_LOADED = False
if HAS_K8S:
    try:
        k8s_config.load_incluster_config()
        _K8S_CONFIG_LOADED = True
        logger.info("monitor_service: K8s in-cluster config loaded")
    except Exception:
        try:
            k8s_config.load_kube_config()
            _K8S_CONFIG_LOADED = True
            logger.info("monitor_service: K8s kubeconfig loaded")
        except Exception:
            logger.warning("monitor_service: K8s config not available")


def calculate_cpu_percent(stats):

    try:

        cpu_delta = (
            stats["cpu_stats"]["cpu_usage"]["total_usage"]
            -
            stats["precpu_stats"]["cpu_usage"]["total_usage"]
        )

        system_delta = (
            stats["cpu_stats"]["system_cpu_usage"]
            -
            stats["precpu_stats"]["system_cpu_usage"]
        )

        online_cpus = stats["cpu_stats"].get(
            "online_cpus",
            1
        )

        if system_delta > 0:

            return round(
                (cpu_delta / system_delta)
                * online_cpus
                * 100.0,
                2
            )

    except (KeyError, TypeError, ZeroDivisionError):
        pass

    return 0


def calculate_memory_mb(stats):

    memory_usage = stats["memory_stats"].get(
        "usage",
        0
    )

    return round(
        memory_usage / (1024 * 1024),
        2
    )


def calculate_network_kb(stats):

    networks = stats.get(
        "networks",
        {}
    )

    rx = 0
    tx = 0

    for interface in networks.values():

        rx += interface.get(
            "rx_bytes",
            0
        )

        tx += interface.get(
            "tx_bytes",
            0
        )

    return (
        round(rx / 1024, 2),
        round(tx / 1024, 2)
    )


def get_health(cpu):

    if cpu > 85:
        return "critical"

    if cpu > 60:
        return "warning"

    return "healthy"


def _read_pod_network_kb(pod_name, namespace="deployx"):
    """
    Read cumulative network counters from the pod's network namespace
    via `cat /proc/net/dev` (docker stats reports none for K8s pods).

    Returns (rx_kb, tx_kb) or (None, None) if exec is unavailable.
    """
    if not HAS_K8S:
        return (None, None)

    try:
        core_api = k8s_client.CoreV1Api()
        resp = k8s_stream.stream(
            core_api.connect_get_namespaced_pod_exec,
            pod_name,
            namespace,
            command=["cat", "/proc/net/dev"],
            stderr=True,
            stdin=False,
            stdout=True,
            tty=False,
            _preload_content=True,
        )

        rx = tx = 0
        for line in resp.splitlines():
            if ":" not in line:
                continue
            iface, rest = line.split(":", 1)
            iface = iface.strip()
            if iface in ("lo",):
                continue
            fields = rest.split()
            if len(fields) >= 9:
                rx += int(fields[0])    # rx bytes
                tx += int(fields[8])    # tx bytes

        return (round(rx / 1024, 2), round(tx / 1024, 2))

    except Exception as e:
        print(f"pod network exec unavailable for {pod_name}: {e}")
        return (None, None)


def resume_monitoring():
    """
    Restart monitor threads for every DeployX app that is actually
    running in Kubernetes (source of truth = the cluster, not the DB,
    which can go stale after failed/retried deploys). Also marks the
    matching DB rows back to 'running'. Called at backend startup and
    lazily from the metrics endpoint, so monitoring survives restarts.
    """
    if not (_K8S_CONFIG_LOADED and HAS_K8S):
        return

    try:
        apps_api = k8s_client.AppsV1Api()
        deps = apps_api.list_namespaced_deployment(
            namespace="deployx",
            label_selector="deployx-app=true",
        )

        for dep in deps.items:
            # Resource name format: deployx-app-<deployment_id>
            app_id = dep.metadata.name.rsplit("-", 1)[-1]
            if not app_id.isdigit():
                continue

            deployment_id = int(app_id)
            if deployment_id in monitor_threads:
                continue

            # Confirm a pod is actually running before starting a thread
            try:
                core_api = k8s_client.CoreV1Api()
                pods = core_api.list_namespaced_pod(
                    namespace="deployx",
                    label_selector=f"app={dep.metadata.name}",
                )
                if not any(p.status.phase == "Running" for p in pods.items):
                    continue
            except Exception:
                continue

            start_monitoring(deployment_id, dep.metadata.name)
            logger.info(f"monitor: resumed monitoring for deployment {deployment_id}")

            # Sync DB status back to 'running' (may have gone stale),
            # and self-heal rows that vanished (DB/cluster drift).
            try:
                conn = get_db_connection()
                conn.execute(
                    """
                    INSERT OR IGNORE INTO deployments (id, status, subdomain)
                    VALUES (?, 'running', ?)
                    """,
                    (deployment_id, f"apps/{deployment_id}"),
                )
                conn.execute(
                    "UPDATE deployments SET status='running' WHERE id=?",
                    (deployment_id,),
                )
                conn.commit()
                conn.close()
            except Exception:
                pass

    except Exception as e:
        logger.warning(f"monitor: resume_monitoring failed: {e}")


def save_metrics(
    deployment_id,
    metrics
):

    try:

        conn = get_db_connection()

        conn.execute("""
        INSERT INTO deployment_metrics (

            deployment_id,
            cpu,
            ram,
            network_rx,
            network_tx,
            health

        )
        VALUES (?, ?, ?, ?, ?, ?)
        """, (

            deployment_id,
            metrics["cpu"],
            metrics["ram"],
            metrics["network_rx"],
            metrics["network_tx"],
            metrics["health"]

        ))

        # Keep only latest 100 metric rows
        conn.execute("""
        DELETE FROM deployment_metrics

        WHERE id NOT IN (

            SELECT id
            FROM deployment_metrics
            WHERE deployment_id=?
            ORDER BY id DESC
            LIMIT 100

        )

        AND deployment_id=?
        """, (
            deployment_id,
            deployment_id
        ))

        conn.commit()
        conn.close()

    except Exception as e:

        print(
            "Metrics Save Error:",
            str(e)
        )

def monitor_container(
    deployment_id,
    container_id
):
    """
    Monitor a deployment. Works with both legacy Docker containers and
    modern Kubernetes deployments.

    For legacy deployments: container_id is a Docker container ID.
    For K8s deployments: container_id is the Pod name, and we use
    the K8s API to check pod/deployment status.
    """
    # First, try Docker container monitoring (legacy Docker deployments)
    try:
        container = client.containers.get(container_id)
        _monitor_docker_container(deployment_id, container)
        return
    except Exception:
        pass

    # If Docker container not found, try K8s pod monitoring
    if _K8S_CONFIG_LOADED:
        k8s_name = f"deployx-app-{deployment_id}"
        _monitor_k8s_deployment(deployment_id, k8s_name)
    else:
        monitor_threads.pop(deployment_id, None)
        logger.warning(f"monitor: deployment {deployment_id} — no Docker container or K8s available")


def _monitor_docker_container(deployment_id, container):
    """Monitor a Docker container's stats (legacy path)."""
    while deployment_id in monitor_threads:
        container.reload()
        if container.status != "running":
            emit_monitoring_update(deployment_id, {
                "cpu": 0, "ram": 0, "network_rx": 0,
                "network_tx": 0, "health": "offline"
            })
            monitor_threads.pop(deployment_id, None)
            break

        stats = container.stats(stream=False)
        cpu = calculate_cpu_percent(stats)
        ram = calculate_memory_mb(stats)
        network_rx, network_tx = calculate_network_kb(stats)
        health = get_health(cpu)

        metrics = {
            "cpu": cpu, "ram": ram, "network_rx": network_rx,
            "network_tx": network_tx, "health": health
        }
        save_metrics(deployment_id, metrics)
        emit_monitoring_update(deployment_id, metrics)
        time.sleep(2)


def _monitor_k8s_deployment(deployment_id, k8s_name):
    """Monitor a K8s deployment: pod readiness + real CPU/RAM/network stats.

    The backend pod mounts the node's /var/run/docker.sock, and app pods
    run on that same daemon (minikube docker driver), so we can read live
    cgroup stats of the pod's underlying Docker container.
    """
    try:
        core_api = k8s_client.CoreV1Api()
        apps_api = k8s_client.AppsV1Api()
    except Exception:
        monitor_threads.pop(deployment_id, None)
        logger.warning("K8s APIs not available for monitoring")
        return

    while deployment_id in monitor_threads:
        try:
            dep = apps_api.read_namespaced_deployment(
                name=k8s_name, namespace="deployx"
            )
            pods = core_api.list_namespaced_pod(
                namespace="deployx",
                label_selector=f"app={k8s_name}",
            )

            if not pods.items:
                emit_monitoring_update(deployment_id, {
                    "cpu": 0, "ram": 0, "network_rx": 0,
                    "network_tx": 0, "health": "stopped"
                })
                monitor_threads.pop(deployment_id, None)
                break

            running = False
            ready = False
            pod_name = None
            for pod in pods.items:
                if pod.status.phase == "Running":
                    running = True
                    ready = bool(pod.status.container_statuses and
                                 pod.status.container_statuses[0].ready)
                    pod_name = pod.metadata.name
                    break

            if not running:
                emit_monitoring_update(deployment_id, {
                    "cpu": 0, "ram": 0, "network_rx": 0,
                    "network_tx": 0, "health": "offline"
                })
                monitor_threads.pop(deployment_id, None)
                break

            # ---- Real resource stats via the node's Docker daemon ----
            # Pod containers are named k8s_<ctr>_<pod>_<ns>_<uid>_<n>,
            # so filtering by pod name finds the right one.
            cpu = ram = network_rx = network_tx = 0
            try:
                matched = client.containers.list(
                    filters={"name": pod_name}
                ) if pod_name else []
                # Exclude the k8s_POD pause container — it has no real stats
                pod_containers = [
                    c for c in matched
                    if not c.name.startswith("k8s_POD")
                ]
                if pod_containers:
                    stats = pod_containers[0].stats(stream=False)
                    cpu = calculate_cpu_percent(stats)
                    ram = calculate_memory_mb(stats)
                    # Docker stats report no network counters for K8s
                    # containers (pod netns is owned by the pause container),
                    # so read them from inside the pod instead.
                    net_rx, net_tx = _read_pod_network_kb(pod_name)
                    if net_rx is not None:
                        network_rx, network_tx = net_rx, net_tx
            except Exception as stats_err:
                print(f"K8s monitor stats unavailable for {pod_name}: {stats_err}")

            if ready:
                health = get_health(cpu) if cpu > 0 else "healthy"
            else:
                health = "running"

            metrics = {
                "cpu": cpu, "ram": ram,
                "network_rx": network_rx, "network_tx": network_tx,
                "health": health,
                "replicas": dep.status.ready_replicas or 0,
            }
            save_metrics(deployment_id, metrics)
            emit_monitoring_update(deployment_id, metrics)

        except Exception as e:
            print(f"K8s monitor error for {k8s_name}: {e}")
            traceback.print_exc()

        time.sleep(5)


def start_monitoring(
    deployment_id,
    container_id
):

    deployment_key = int(deployment_id)

    if deployment_key in monitor_threads:
        return

    thread = threading.Thread(
        target=monitor_container,
        args=(
            deployment_key,
            container_id
        ),
        daemon=True
    )

    monitor_threads[deployment_key] = thread

    thread.start()


def stop_monitoring(
    deployment_id
):

    monitor_threads.pop(
        int(deployment_id),
        None
    )