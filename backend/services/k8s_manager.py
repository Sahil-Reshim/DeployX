# =========================================================
# KUBERNETES MANAGER
# ---------------------------------------------------------
# Responsibilities:
#   - Create Kubernetes Deployments, Services, and Ingresses
#     for deployed applications inside the `deployx` namespace.
#   - Each user deployment gets:
#       Deployment: deployx-app-<id>
#       Service:    deployx-app-<id>  (port 80 -> targetPort container_port)
#       Ingress:    deployx.local/apps/<id>  (path-based, no localhost)
# =========================================================

import os
import time
import logging

BASE_DOMAIN = os.getenv("DEPLOYX_BASE_DOMAIN", "deployx.local")


try:
    from kubernetes import client, config
    HAS_K8S = True
except ImportError:
    HAS_K8S = False

logger = logging.getLogger(__name__)

NAMESPACE = os.getenv("DEPLOYX_NAMESPACE", "deployx")
INGRESS_CLASS = os.getenv("DEPLOYX_INGRESS_CLASS", "nginx")


def _load_config():
    """Load Kubernetes configuration.
    Tries in-cluster config first (inside a K8s pod), falls back to kubeconfig.
    """
    if not HAS_K8S:
        raise ImportError("kubernetes package not installed")

    try:
        config.load_incluster_config()
        logger.info("K8s: using in-cluster config")
        return True
    except Exception:
        pass

    try:
        config.load_kube_config()
        logger.info("K8s: using kubeconfig")
        return True
    except Exception as e:
        logger.error(f"K8s: failed to load config: {e}")
        return False


def _get_apps_api():
    return client.AppsV1Api()


def _get_core_api():
    return client.CoreV1Api()


def _get_networking_api():
        return client.NetworkingV1Api()


def get_pod_name(deployment_name, max_retries=30, retry_interval=2):
    """Wait for and return the name of the first Pod for a Deployment."""
    core = _get_core_api()
    for _ in range(max_retries):
        try:
            pods = core.list_namespaced_pod(
                namespace=NAMESPACE,
                label_selector=f"app={deployment_name}",
            )
            if pods.items:
                return pods.items[0].metadata.name
        except Exception:
            pass
        time.sleep(retry_interval)
        return None


def wait_for_deployment_ready(deployment_name, timeout_seconds=180, interval=3):
    """
    Poll until the Deployment has at least one READY replica.
    Returns (ready: bool, message: str).
    """
    apps_api = _get_apps_api()
    deadline = time.time() + timeout_seconds

    while time.time() < deadline:
        try:
            dep = apps_api.read_namespaced_deployment(
                name=deployment_name, namespace=NAMESPACE
            )
            ready = dep.status.ready_replicas or 0
            if ready > 0:
                return True, f"Deployment {deployment_name} is ready"
        except Exception:
            pass
        time.sleep(interval)

    return False, f"Deployment {deployment_name} did not become ready within {timeout_seconds}s"


def create_deployment_and_service(image_name, deployment_name, container_port, framework):
    """
    Create a Kubernetes Deployment + Service + Ingress for a deployed app.

    Routing model (path-based, no localhost, no NodePort):
        http://deployx.local/apps/<deployment-id>/  ->  Service deployx-app-<id>  ->  Pod

    Parameters
    ----------
    image_name : str
    deployment_name : str   (e.g. "deployx-app-17")
    container_port : int    (internal port the app listens on)
    framework : str

    Returns
    -------
    dict with keys: success, message, deployment_name, service_name,
                    ingress_name, custom_url, url, ready, pod_name
    """
    if not _load_config():
        return {"success": False, "message": "Could not load Kubernetes configuration"}

    # The public routing id is the numeric suffix of the K8s resource name
    app_id = deployment_name.rsplit("-", 1)[-1]

    try:
        # ---- 1. Deployment ----
        deployment_manifest = {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {
                "name": deployment_name,
                "namespace": NAMESPACE,
                "labels": {
                    "app": deployment_name,
                    "deployx-app": "true",
                    "framework": framework or "unknown",
                },
            },
            "spec": {

                "replicas": 1,
                "selector": {"matchLabels": {"app": deployment_name}},
                "template": {
                    "metadata": {"labels": {"app": deployment_name}},
                    "spec": {
                        "containers": [{
                            "name": deployment_name,
                            "image": image_name,
                            "imagePullPolicy": "IfNotPresent",
                            "ports": [{"containerPort": container_port}],
                            "env": [{"name": "PORT", "value": str(container_port)}],
                            # TCP readiness gate: the app must actually accept
                            # connections on its port before it is "Ready".
                            "readinessProbe": {
                                "tcpSocket": {"port": container_port},
                                "initialDelaySeconds": 5,
                                "periodSeconds": 5,
                                "failureThreshold": 12,
                            },
                            "resources": {
                                "requests": {"memory": "64Mi", "cpu": "50m"},
                                "limits": {"memory": "512Mi", "cpu": "500m"},
                            },
                        }],
                    },
                },
            },
        }

        apps_api = _get_apps_api()
        try:
            apps_api.create_namespaced_deployment(namespace=NAMESPACE, body=deployment_manifest)
        except Exception as e:
            if "already exists" in str(e):
                apps_api.patch_namespaced_deployment(
                    name=deployment_name, namespace=NAMESPACE, body=deployment_manifest
                )
            else:
                raise

        # ---- 2. Service ----
        # External users never see the internal container port:
        # the Service listens on 80 and maps to the app's actual port.
        service_manifest = {
            "apiVersion": "v1",
            "kind": "Service",
            "metadata": {
                "name": deployment_name,
                "namespace": NAMESPACE,
                "labels": {"app": deployment_name, "deployx-app": "true"},
            },
            "spec": {
                "selector": {"app": deployment_name},
                "ports": [{
                    "port": 80,
                    "targetPort": container_port,
                    "protocol": "TCP",
                    "name": "http",
                }],
                "type": "ClusterIP",
            },
        }

        core_api = _get_core_api()
        try:
            core_api.create_namespaced_service(namespace=NAMESPACE, body=service_manifest)
        except Exception as e:
            if "already exists" not in str(e):
                raise

        # ---- 3. Ingress (path-based on the existing deployx.local host) ----
        # Adds:  deployx.local/apps/<id> -> Service deployx-app-<id>:80
        # The main deployx-ingress (/, /api, /socket.io) is NOT touched;
        # nginx ingress merges rules for the same host across Ingress
        # resources and picks the longest matching path.
        app_path = f"/apps/{app_id}(/|$)(.*)"
        public_url = f"http://{BASE_DOMAIN}/apps/{app_id}/"

        ingress_manifest = {
            "apiVersion": "networking.k8s.io/v1",
            "kind": "Ingress",
            "metadata": {
                "name": deployment_name,
                "namespace": NAMESPACE,
                "annotations": {
                    # Regex path so we can strip the /apps/<id> prefix:
                    # /apps/17/some/path -> /some/path on the app pod
                    "nginx.ingress.kubernetes.io/use-regex": "true",
                    "nginx.ingress.kubernetes.io/rewrite-target": "/$2",
                    "kubernetes.io/ingress.class": INGRESS_CLASS,
                },
                "labels": {"app": deployment_name, "deployx-app": "true"},
            },
            "spec": {
                "ingressClassName": INGRESS_CLASS,
                "rules": [{
                    "host": BASE_DOMAIN,
                    "http": {
                        "paths": [{
                            "path": app_path,
                            "pathType": "ImplementationSpecific",
                            "backend": {
                                "service": {
                                    "name": deployment_name,
                                    "port": {"number": 80},
                                }
                            },
                        }]
                    },
                }],
            },
        }

        net_api = _get_networking_api()
        try:
            net_api.create_namespaced_ingress(namespace=NAMESPACE, body=ingress_manifest)
        except Exception as e:
            if "already exists" not in str(e):
                raise

        # ---- 4. Wait for Pod readiness (health gate) ----
        pod_name = get_pod_name(deployment_name, max_retries=30, retry_interval=2)
        ready, ready_message = wait_for_deployment_ready(deployment_name)

        if not ready:
            return {
                "success": False,
                "message": f"Application failed to start in Kubernetes: {ready_message}",
                "deployment_name": deployment_name,
                "pod_name": pod_name,
            }

        return {
            "success": True,
            "message": "Kubernetes Deployment, Service, and Ingress created; Pod is Ready",
            "deployment_name": deployment_name,
            "service_name": deployment_name,
            "ingress_name": deployment_name,
            "subdomain": f"apps/{app_id}",
            "custom_url": public_url,
            "url": public_url,
            "container_port": container_port,
            "pod_name": pod_name,
        }

    except Exception as e:
        logger.error(f"K8s create deployment error: {e}")
        return {"success": False, "message": f"Kubernetes deployment failed: {str(e)}"}


def delete_deployment_resources(deployment_name):
    """Delete a Kubernetes Deployment + Service + Ingress."""
    if not _load_config():
        return {"success": False, "message": "Could not load Kubernetes configuration"}

    errors = []
    results = []

    # Delete Deployment
    try:
        apps_api = _get_apps_api()
        apps_api.delete_namespaced_deployment(
            name=deployment_name, namespace=NAMESPACE,
            body=client.V1DeleteOptions(propagation_policy="Foreground")
        )
        results.append(f"Deployment {deployment_name} deleted")
    except Exception as e:
        if "not found" not in str(e).lower():
            errors.append(f"Deployment: {e}")
        else:
            results.append(f"Deployment {deployment_name} not found (OK)")

    # Delete Service
    try:
        core_api = _get_core_api()
        core_api.delete_namespaced_service(
            name=deployment_name, namespace=NAMESPACE,
            body=client.V1DeleteOptions()
        )
        results.append(f"Service {deployment_name} deleted")
    except Exception as e:
        if "not found" not in str(e).lower():
            errors.append(f"Service: {e}")
        else:
            results.append(f"Service {deployment_name} not found (OK)")

    # Delete Ingress
    try:
        net_api = _get_networking_api()
        net_api.delete_namespaced_ingress(
            name=deployment_name, namespace=NAMESPACE,
            body=client.V1DeleteOptions()
        )
        results.append(f"Ingress {deployment_name} deleted")
    except Exception as e:
        if "not found" not in str(e).lower():
            errors.append(f"Ingress: {e}")
        else:
            results.append(f"Ingress {deployment_name} not found (OK)")

    if errors:
        return {"success": False, "message": "; ".join(errors), "results": results}
    return {"success": True, "message": "; ".join(results)}


def scale_deployment_k8s(deployment_name, replicas):
    """Scale a Deployment to the given number of replicas."""
    if not _load_config():
        return {"success": False, "message": "Could not load Kubernetes configuration"}

    try:
        apps_api = _get_apps_api()
        body = {"spec": {"replicas": replicas}}
        apps_api.patch_namespaced_deployment_scale(
            name=deployment_name, namespace=NAMESPACE, body=body
        )
        return {"success": True, "message": f"Scaled to {replicas} replica(s)"}
    except Exception as e:
        if "not found" in str(e).lower():
            return {"success": False, "message": "Deployment not found"}
        return {"success": False, "message": str(e)}


def restart_deployment_k8s(deployment_name):
    """Restart a Deployment by patching an annotation (forces pod restart)."""
    if not _load_config():
        return {"success": False, "message": "Could not load Kubernetes configuration"}

    try:
        apps_api = _get_apps_api()
        body = {
            "spec": {
                "template": {
                    "metadata": {
                        "annotations": {"deployx-restart": str(time.time())}
                    }
                }
            }
        }
        apps_api.patch_namespaced_deployment(
            name=deployment_name, namespace=NAMESPACE, body=body
        )
        return {"success": True, "message": "Deployment restart initiated"}
    except Exception as e:
        if "not found" in str(e).lower():
            return {"success": False, "message": "Deployment not found"}
        return {"success": False, "message": str(e)}


def get_deployment_status_k8s(deployment_name):
    """Get the status of a Deployment and its Pods."""
    if not _load_config():
        return {"success": False, "message": "Could not load Kubernetes configuration"}

    try:
        apps_api = _get_apps_api()
        dep = apps_api.read_namespaced_deployment(
            name=deployment_name, namespace=NAMESPACE
        )

        core_api = _get_core_api()
        pods = core_api.list_namespaced_pod(
            namespace=NAMESPACE,
            label_selector=f"app={deployment_name}",
        )

        pod_status = "unknown"
        pod_ready = False
        for pod in pods.items:
            if pod.status.phase == "Running":
                pod_status = "running"
                ready = pod.status.container_statuses[0].ready if pod.status.container_statuses else False
                pod_ready = pod_ready or ready
                break
            elif pod.status.phase == "Pending":
                pod_status = "pending"

        replicas = dep.status.ready_replicas or 0
        desired = dep.spec.replicas or 0

        if replicas == 0 and desired == 0:
            return {"success": True, "status": "stopped", "ready": False,
                    "message": "Deployment stopped (0 replicas)"}

        if pod_ready:
            return {"success": True, "status": "running", "ready": True,
                    "message": "Deployment running and ready"}
        elif pod_status == "pending":
            return {"success": True, "status": "starting", "ready": False,
                    "message": "Pods are starting..."}
        elif pod_status == "running" and not pod_ready:
            return {"success": True, "status": "running", "ready": False,
                    "message": "Running but not ready yet"}
        else:
            return {"success": True, "status": pod_status, "ready": False,
                    "message": f"Pod status: {pod_status}"}

    except Exception as e:
        if "not found" in str(e).lower():
            return {"success": True, "status": "stopped", "ready": False,
                    "message": "Deployment not found (stopped or deleted)"}
        return {"success": False, "message": str(e)}


def get_pod_logs_k8s(deployment_name, tail_lines=100):
    """Fetch logs from the Pod(s) of a Deployment."""
    if not _load_config():
        return {"success": False, "message": "Could not load Kubernetes configuration", "logs": []}

    try:
        core_api = _get_core_api()
        pods = core_api.list_namespaced_pod(
            namespace=NAMESPACE,
            label_selector=f"app={deployment_name}",
        )

        logs = []
        for pod in pods.items:
            pod_name = pod.metadata.name
            try:
                log_resp = core_api.read_namespaced_pod_log(
                    name=pod_name, namespace=NAMESPACE,
                    tail_lines=tail_lines, follow=False,
                )
                for line in log_resp.strip().split("\n"):
                    if line:
                        logs.append(line)
            except Exception as e:
                logs.append(f"[log error: {e}]")

        return {"success": True, "logs": logs}

    except Exception as e:
        return {"success": False, "message": str(e), "logs": []}


def stream_pod_logs_k8s(pod_name, deployment_id, emit_func):
    """
    Continuously stream Pod logs to the frontend via Socket.IO.
    Polls periodically since K8s log API doesn't support streaming easily.
    """
    if not _load_config():
        emit_func(deployment_id, "K8s: could not load config for log streaming")
        return

    core_api = _get_core_api()
    seen_lines = 0

    while True:
        try:
            log_resp = core_api.read_namespaced_pod_log(
                name=pod_name, namespace=NAMESPACE, follow=False
            )
            lines = log_resp.strip().split("\n")
            new_lines = lines[seen_lines:]
            for line in new_lines:
                if line:
                    emit_func(deployment_id, line)
            seen_lines = len(lines)
        except Exception:
            pass
        time.sleep(3)