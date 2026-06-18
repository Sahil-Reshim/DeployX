import docker
import threading
import time
from database import get_db_connection

from sockets.socket_manager import (
    emit_monitoring_update
)

client = docker.from_env()

monitor_threads = {}


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

    try:

        container = client.containers.get(
            container_id
        )

        while deployment_id in monitor_threads:

            container.reload()

            if container.status != "running":

                emit_monitoring_update(
                    deployment_id,
                    {
                        "cpu": 0,
                        "ram": 0,
                        "network_rx": 0,
                        "network_tx": 0,
                        "health": "offline"
                    }
                )

                monitor_threads.pop(
                    deployment_id,
                    None
                )

                break

            stats = container.stats(
                stream=False
            )

            cpu = calculate_cpu_percent(
                stats
            )

            ram = calculate_memory_mb(
                stats
            )

            network_rx, network_tx = (
                calculate_network_kb(
                    stats
                )
            )

            health = get_health(cpu)

            metrics = {
                "cpu": cpu,
                "ram": ram,
                "network_rx": network_rx,
                "network_tx": network_tx,
                "health": health
            }

            save_metrics(
                deployment_id,
                metrics
            )

            emit_monitoring_update(
                deployment_id,
                metrics
            )

            time.sleep(2)

    except Exception as e:

        monitor_threads.pop(
            deployment_id,
            None
        )

        print(
            "Monitoring Error:",
            str(e)
        )


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