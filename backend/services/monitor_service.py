import docker
import threading
import time

from sockets.socket_manager import emit_log

client = docker.from_env()

monitor_threads = {}


def get_container_stats(container_id):

    try:

        container = client.containers.get(
            container_id
        )

        stats = container.stats(
            stream=False
        )

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

        cpu_percent = 0.0

        if system_delta > 0:

            cpu_percent = (
                cpu_delta / system_delta
            ) * 100.0

        memory_usage = (
            stats["memory_stats"]["usage"]
            /
            (1024 * 1024)
        )

        memory_limit = (
            stats["memory_stats"]["limit"]
            /
            (1024 * 1024)
        )

        memory_percent = (
            memory_usage / memory_limit
        ) * 100

        network_rx = 0
        network_tx = 0

        networks = stats.get(
            "networks",
            {}
        )

        for interface in networks.values():

            network_rx += interface.get(
                "rx_bytes",
                0
            )

            network_tx += interface.get(
                "tx_bytes",
                0
            )

        return {
            "success": True,
            "cpu_percent": round(
                cpu_percent,
                2
            ),
            "memory_usage_mb": round(
                memory_usage,
                2
            ),
            "memory_limit_mb": round(
                memory_limit,
                2
            ),
            "memory_percent": round(
                memory_percent,
                2
            ),
            "network_rx_mb": round(
                network_rx / (1024 * 1024),
                2
            ),
            "network_tx_mb": round(
                network_tx / (1024 * 1024),
                2
            ),
            "status": container.status,
            "container_name": container.name,
            "container_id": container.short_id
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }


def stream_container_monitoring(
    deployment_id,
    container_id
):

    while True:

        try:

            stats = get_container_stats(
                container_id
            )

            if not stats["success"]:

                emit_log(
                    deployment_id,
                    f"[MONITOR ERROR] {stats['error']}"
                )

                break

            monitoring_log = (
                f"[MONITOR] "
                f"CPU: {stats['cpu_percent']}% | "
                f"RAM: {stats['memory_usage_mb']}MB "
                f"({stats['memory_percent']}%) | "
                f"NET RX: {stats['network_rx_mb']}MB | "
                f"NET TX: {stats['network_tx_mb']}MB"
            )

            emit_log(
                deployment_id,
                monitoring_log
            )

            if stats["status"] != "running":

                emit_log(
                    deployment_id,
                    "[MONITOR] Container stopped"
                )

                break

            time.sleep(5)

        except Exception as e:

            emit_log(
                deployment_id,
                f"[MONITOR ERROR] {str(e)}"
            )

            break


def start_monitoring(
    deployment_id,
    container_id
):

    if deployment_id in monitor_threads:

        return

    thread = threading.Thread(
        target=stream_container_monitoring,
        args=(
            deployment_id,
            container_id
        ),
        daemon=True
    )

    monitor_threads[deployment_id] = thread

    thread.start()


def stop_monitoring(
    deployment_id
):

    if deployment_id in monitor_threads:

        del monitor_threads[deployment_id]