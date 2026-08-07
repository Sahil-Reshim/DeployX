# =========================================================
# ANALYTICS SERVICE
# ---------------------------------------------------------
# Aggregates deployment data from the database and Docker
# to power the Analytics dashboard.
# =========================================================

import json
from datetime import datetime, timedelta
from collections import Counter

from database import get_db_connection
from services.deployment_service import serialize_deployment


def get_analytics():
    """
    Compute aggregate analytics from the deployments table.
    Returns a dict with:
      - total, successful, failed, running, queued, stopped
      - success_rate, avg_deployment_time, avg_build_time
      - framework_distribution, deployments_per_day
      - latest_deployments, most_used_framework
    """

    conn = get_db_connection()

    # --- Fetch all deployments ---
    rows = conn.execute(
        """
        SELECT *
        FROM deployments
        ORDER BY id DESC
        """
    ).fetchall()

    conn.close()

    deployments = [serialize_deployment(row) for row in rows]

    # --- Status counts ---
    total = len(deployments)
    successful = sum(1 for d in deployments if d.get("status") in ("running", "live", "completed"))
    failed = sum(1 for d in deployments if d.get("status") == "failed")
    running = sum(1 for d in deployments if d.get("status") == "running")
    queued = sum(1 for d in deployments if d.get("status") in ("queued", "cloning", "detecting", "dockerfile_generating", "ci_pipeline", "docker_build", "deploying"))
    stopped = sum(1 for d in deployments if d.get("status") == "stopped")

    # --- Success rate ---
    success_rate = round((successful / total) * 100, 1) if total > 0 else 0

    # --- Average deployment time (from created_at to pipeline_finished_at) ---
    deploy_times = []
    build_times = []

    for d in deployments:
        created = d.get("created_at")
        finished = d.get("pipeline_finished_at")
        started = d.get("pipeline_started_at")

        if created and finished:
            try:
                t0 = datetime.strptime(created, "%Y-%m-%d %H:%M:%S")
                t1 = datetime.strptime(finished, "%Y-%m-%d %H:%M:%S")
                deploy_times.append((t1 - t0).total_seconds())
            except (ValueError, TypeError):
                pass

        if started and finished:
            try:
                t0 = datetime.strptime(started, "%Y-%m-%d %H:%M:%S")
                t1 = datetime.strptime(finished, "%Y-%m-%d %H:%M:%S")
                build_times.append((t1 - t0).total_seconds())
            except (ValueError, TypeError):
                pass

    avg_deployment_time = round(sum(deploy_times) / len(deploy_times), 1) if deploy_times else 0
    avg_build_time = round(sum(build_times) / len(build_times), 1) if build_times else 0

    # --- Framework distribution ---
    framework_counts = Counter(d.get("framework") for d in deployments if d.get("framework"))
    framework_distribution = [
        {"framework": fw, "count": count}
        for fw, count in framework_counts.most_common()
    ]

    # --- Most used framework ---
    most_used_framework = None
    if framework_distribution:
        most_used_framework = framework_distribution[0]

    # --- Deployments per day (last 30 days) ---
    per_day = Counter()
    cutoff = datetime.now() - timedelta(days=30)

    for d in deployments:
        created = d.get("created_at")
        if not created:
            continue
        try:
            dt = datetime.strptime(created, "%Y-%m-%d %H:%M:%S")
            if dt >= cutoff:
                per_day[dt.strftime("%Y-%m-%d")] += 1
        except (ValueError, TypeError):
            pass

    deployments_per_day = [
        {"day": day, "count": count}
        for day, count in sorted(per_day.items())
    ]

    # --- Latest deployments (top 10) ---
    latest_deployments = deployments[:10]

    # --- Deployment durations ---
    durations = []
    for d in deployments:
        created = d.get("created_at")
        finished = d.get("pipeline_finished_at")
        if created and finished:
            try:
                t0 = datetime.strptime(created, "%Y-%m-%d %H:%M:%S")
                t1 = datetime.strptime(finished, "%Y-%m-%d %H:%M:%S")
                durations.append({
                    "id": d.get("id"),
                    "repo": d.get("repo_name") or d.get("repo_url"),
                    "duration": (t1 - t0).total_seconds(),
                })
            except (ValueError, TypeError):
                pass

    # --- Average health check count ---
    conn = get_db_connection()
    health_row = conn.execute(
        """
        SELECT COUNT(*) as total_checks
        FROM deployment_metrics
        """
    ).fetchone()
    conn.close()

    avg_health_check_count = health_row["total_checks"] if health_row else 0

    return {
        "total": total,
        "successful": successful,
        "failed": failed,
        "running": running,
        "queued": queued,
        "stopped": stopped,
        "success_rate": success_rate,
        "avg_deployment_time": avg_deployment_time,
        "avg_build_time": avg_build_time,
        "avg_health_check_count": avg_health_check_count,
        "framework_distribution": framework_distribution,
        "deployments_per_day": deployments_per_day,
        "latest_deployments": latest_deployments,
        "deployment_durations": durations,
        "most_used_framework": most_used_framework,
    }


def get_docker_stats():
    """
    Get Docker container and image statistics.
    Returns a dict with:
      - total_images, total_containers, running_containers, stopped_containers
      - containers (list of {name, status})
    """

    try:
        import docker
        client = docker.from_env()

        # --- Images ---
        images = client.images.list()
        total_images = len(images)

        # --- Containers ---
        all_containers = client.containers.list(all=True)
        running_containers = 0
        stopped_containers = 0
        container_list = []

        for c in all_containers:
            status = c.status
            if status == "running":
                running_containers += 1
            else:
                stopped_containers += 1

            container_list.append({
                "name": c.name,
                "status": status,
                "image": c.image.tags[0] if c.image.tags else "unknown",
            })

        return {
            "total_images": total_images,
            "total_containers": len(all_containers),
            "running_containers": running_containers,
            "stopped_containers": stopped_containers,
            "containers": container_list,
        }

    except Exception as e:
        print("Docker stats error:", str(e))
        return {
            "total_images": 0,
            "total_containers": 0,
            "running_containers": 0,
            "stopped_containers": 0,
            "containers": [],
        }


def get_all_metrics():
    """
    Get all metrics from the deployment_metrics table.
    Returns a list of metric records.
    """

    conn = get_db_connection()

    rows = conn.execute(
        """
        SELECT *
        FROM deployment_metrics
        ORDER BY id ASC
        LIMIT 500
        """
    ).fetchall()

    conn.close()

    metrics = []
    for row in rows:
        metrics.append({
            "id": row["id"],
            "deployment_id": row["deployment_id"],
            "cpu": row["cpu"],
            "ram": row["ram"],
            "network_rx": row["network_rx"],
            "network_tx": row["network_tx"],
            "health": row["health"],
            "created_at": row["created_at"],
        })

    return metrics