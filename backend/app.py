# =========================================================
# DEPLOYX — BACKEND API SERVER
# ---------------------------------------------------------
# This Flask application is the core orchestration engine.
#
# Deployment flow (run_deployment_job):
#   1. Clone the GitHub repository
#   2. Detect the framework (Flask, React, Express, etc.)
#   3. Generate a Dockerfile if none exists
#   4. Trigger Jenkins CI pipeline
#   5. Build a Docker image
#   6. Allocate a free host port
#   7. Run the container with correct port mapping
#   8. Start real-time monitoring & log streaming
#
# API endpoints (all under /api so the Ingress /api -> backend rule
# reaches Flask without requiring a path rewrite):
#   POST /api/deploy           — start a new deployment
#   GET  /api/deployments      — list all deployments
#   GET  /api/deployments/:id  — get one deployment
#   DELETE /api/deployments/:id — delete a deployment
#   POST /api/deployment/:id/stop   — stop a running container
#   POST /api/deployment/:id/start  — start a stopped container
#   POST /api/deployment/:id/restart — restart a container
# =========================================================

import threading
import sqlite3
from dotenv import load_dotenv

load_dotenv()

import os

from flask import Flask, request, jsonify
from flask_cors import CORS

from database import init_db, get_db_connection

from services.runtime_recovery import restore_runtime_states
from services.git_service import clone_repository
from services.framework_detector import detect_framework
from services.dockerfile_generator import generate_dockerfile
from services.log_service import save_build_logs, get_build_logs, save_container_logs, get_container_logs, append_build_log
from services.docker_service import build_docker_image, run_docker_container
from services.jenkins_service import trigger_jenkins_job, wait_for_pipeline
from services.monitor_service import stop_monitoring
from services.cleanup_service import remove_container, remove_image, remove_repo_folder, cleanup_proxy_route
from services.port_allocator import allocate_port
from services.domain_service import generate_subdomain, build_custom_url
from services.proxy_manager import create_route, reload_proxy

from services.deployment_service import (
    create_deployment,
    update_deployment_step,
    complete_deployment,
    fail_deployment,
    save_jenkins_queue,
    save_jenkins_build_number,
    update_jenkins_status,
    get_all_deployments,
    get_deployment_by_id,
    stop_deployment,
    start_deployment,
    restart_deployment,
    delete_deployment_lifecycle,
)

from services.analytics_service import (
    get_analytics,
    get_docker_stats,
    get_all_metrics,
)

from sockets.socket_manager import socketio, emit_deployment_update, emit_log
import sockets.deployment_socket
import sockets.logs_socket


# =========================================================
# APP CONFIG
# =========================================================

app = Flask(__name__)
CORS(app)

socketio.init_app(app, cors_allowed_origins="*", async_mode="threading")


# =========================================================
# DATABASE INIT
# =========================================================

init_db()


# =========================================================
# RUNTIME RECOVERY (restore state after server restart)
# =========================================================

restore_runtime_states()


# =========================================================
# DEPLOYMENT FAILURE HELPER
# =========================================================

def mark_deployment_failed(deployment_id, message):
    """Update DB + emit socket event for a failed deployment."""
    fail_deployment(deployment_id, "failed")
    emit_deployment_update(deployment_id, "failed", message)
    emit_log(deployment_id, f"ERROR: {message}")
    append_build_log(deployment_id, f"ERROR: {message}")


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():
    return jsonify({"success": True, "message": "DeployX Backend Running 🚀"})


# =========================================================
# BACKGROUND DEPLOYMENT JOB
# =========================================================

def run_deployment_job(deployment_id, repo_url):
    """
    Run the full deployment pipeline in a background thread.
    Each stage updates the DB and emits socket events so the
    frontend shows real-time progress.
    """

    repo_path = None
    image_name = None
    container_id = None

    try:
        # =================================================
        # STEP 1 — CLONE REPOSITORY
        # =================================================

        update_deployment_step(deployment_id, "cloning")
        emit_deployment_update(deployment_id, "cloning", "Cloning repository...")
        emit_log(deployment_id, "Starting repository clone...")
        append_build_log(deployment_id, "Starting repository clone...")

        clone_result = clone_repository(repo_url)

        if not clone_result["success"]:
            mark_deployment_failed(
                deployment_id,
                clone_result.get("message", "Repository clone failed")
            )
            append_build_log(deployment_id, f"ERROR: {clone_result.get('message', 'Repository clone failed')}")
            repo_path = clone_result.get("repo_path")
            if repo_path:
                remove_repo_folder(repo_path)
            return

        repo_path = clone_result["repo_path"]
        append_build_log(deployment_id, f"Repository cloned successfully: {repo_url}")

        # =================================================
        # STEP 2 — DETECT FRAMEWORK
        # =================================================

        update_deployment_step(deployment_id, "detecting")
        emit_deployment_update(deployment_id, "detecting", "Detecting framework...")
        append_build_log(deployment_id, "Detecting framework...")

        framework_result = detect_framework(repo_path)

        if not framework_result["success"]:
            mark_deployment_failed(
                deployment_id,
                framework_result.get("message", "Framework detection failed")
            )
            append_build_log(deployment_id, f"ERROR: {framework_result.get('message', 'Framework detection failed')}")
            remove_repo_folder(repo_path)
            return

        # Store the detected internal port for container creation
        detected_port = framework_result.get("port")
        append_build_log(deployment_id, f"Framework detected: {framework_result['framework']} (port {detected_port})")

        # =================================================
        # STEP 3 — GENERATE DOCKERFILE
        # =================================================

        update_deployment_step(deployment_id, "dockerfile_generating")
        emit_deployment_update(deployment_id, "dockerfile_generating", "Generating Dockerfile...")
        append_build_log(deployment_id, "Generating Dockerfile...")

        dockerfile_result = generate_dockerfile(repo_path, framework_result["framework"])

        if not dockerfile_result["success"]:
            mark_deployment_failed(
                deployment_id,
                dockerfile_result.get("message", "Dockerfile generation failed")
            )
            append_build_log(deployment_id, f"ERROR: {dockerfile_result.get('message', 'Dockerfile generation failed')}")
            remove_repo_folder(repo_path)
            return

        append_build_log(deployment_id, "Dockerfile generated successfully")

        # =================================================
        # STEP 4 — JENKINS CI PIPELINE
        # =================================================

        update_deployment_step(deployment_id, "ci_pipeline")
        emit_deployment_update(
            deployment_id, "ci_pipeline",
            "Running Jenkins CI pipeline...",
            jenkins_status="TRIGGERED",
            current_step="triggering_jenkins",
        )
        append_build_log(deployment_id, "Running Jenkins CI pipeline...")

        jenkins_result = trigger_jenkins_job(repo_url, framework_result["framework"])

        if not jenkins_result["success"]:
            mark_deployment_failed(
                deployment_id,
                jenkins_result.get("message", "Jenkins pipeline trigger failed")
            )
            append_build_log(deployment_id, f"ERROR: {jenkins_result.get('message', 'Jenkins pipeline trigger failed')}")
            remove_repo_folder(repo_path)
            return

        queue_id = jenkins_result["queue_id"]
        save_jenkins_queue(deployment_id, queue_id)
        append_build_log(deployment_id, f"Jenkins pipeline triggered (queue ID: {queue_id})")

        pipeline_result = wait_for_pipeline(deployment_id, queue_id)

        if not pipeline_result.get("success"):
            mark_deployment_failed(
                deployment_id,
                pipeline_result.get("message", "Jenkins pipeline failed")
            )
            append_build_log(deployment_id, f"ERROR: {pipeline_result.get('message', 'Jenkins pipeline failed')}")
            remove_repo_folder(repo_path)
            return

        emit_deployment_update(deployment_id, "ci_pipeline", "Jenkins pipeline successful")
        append_build_log(deployment_id, "Jenkins pipeline completed successfully")

        # =================================================
        # STEP 5 — BUILD DOCKER IMAGE
        # =================================================

        update_deployment_step(deployment_id, "docker_build")
        emit_deployment_update(deployment_id, "docker_build", "Building Docker image...")
        append_build_log(deployment_id, "Building Docker image...")

        docker_result = build_docker_image(repo_path, deployment_id)

        if not docker_result["success"]:
            mark_deployment_failed(
                deployment_id,
                docker_result.get("message", "Docker image build failed")
            )
            append_build_log(deployment_id, f"ERROR: {docker_result.get('message', 'Docker image build failed')}")
            remove_repo_folder(repo_path)
            return

        image_name = docker_result["image_name"]
        append_build_log(deployment_id, f"Docker image built: {image_name}")

        # =================================================
        # STEP 6 — ALLOCATE PORT
        # =================================================

        assigned_port = allocate_port()
        custom_url = f"http://localhost:{assigned_port}"
        append_build_log(deployment_id, f"Port allocated: {assigned_port}")

        # =================================================
        # STEP 7 — RUN CONTAINER
        # =================================================

        update_deployment_step(deployment_id, "deploying")
        emit_deployment_update(deployment_id, "deploying", "Starting container...")
        append_build_log(deployment_id, "Starting container...")

        container_result = run_docker_container(
            image_name,
            deployment_id,
            assigned_port,
            repo_path,
            internal_port=detected_port  # <-- Pass detected port here
        )

        if not container_result["success"]:
            mark_deployment_failed(
                deployment_id,
                container_result.get("message", "Container failed to start")
            )
            append_build_log(deployment_id, f"ERROR: {container_result.get('message', 'Container failed to start')}")
            remove_image(image_name)
            remove_repo_folder(repo_path)
            return

        container_id = container_result["container_id"]
        append_build_log(deployment_id, f"Container started: {container_id}")

        # =================================================
        # STEP 8 — MARK AS RUNNING
        # =================================================

        update_deployment_step(deployment_id, "running")
        emit_deployment_update(
            deployment_id, "running",
            "Container running",
            url=custom_url,
            container_id=container_id
        )

        container_result["assigned_port"] = assigned_port
        container_result["subdomain"] = None
        container_result["custom_url"] = custom_url
        container_result["url"] = custom_url

        complete_deployment(deployment_id, framework_result, docker_result, container_result)

        emit_deployment_update(
            deployment_id, "live",
            "Deployment completed successfully",
            url=custom_url,
            container_id=container_id,
            state_key="LIVE",
            state_label="Live",
            progress=100
        )

        # --- Save logs to database ---
        save_build_logs(deployment_id, docker_result.get("logs", []))
        save_container_logs(deployment_id, container_result.get("logs", []))
        append_build_log(deployment_id, f"Deployment completed successfully! Live at {custom_url}")

        print("\n========== DEPLOYMENT COMPLETED ==========")

    except Exception as e:
        print("\n========== DEPLOYMENT ERROR ==========")
        print(str(e))

        mark_deployment_failed(deployment_id, str(e))
        append_build_log(deployment_id, f"ERROR: {str(e)}")

        if container_id:
            remove_container(container_id)
        if image_name:
            remove_image(image_name)
        if repo_path:
            remove_repo_folder(repo_path)


# =========================================================
# API ENDPOINTS
# =========================================================

@app.route("/api/deploy", methods=["POST"])
def deploy():
    """Start a new deployment for a GitHub repository."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No JSON data received"}), 400

        repo_url = data.get("repo_url")
        if not repo_url:
            return jsonify({"success": False, "error": "GitHub repo URL required"}), 400

        deployment = create_deployment(repo_url)
        deployment_id = deployment["id"]

        update_deployment_step(deployment_id, "queued")

        # Run deployment in a background thread so the API responds immediately
        deployment_thread = threading.Thread(
            target=run_deployment_job, args=(deployment_id, repo_url)
        )
        deployment_thread.start()

        emit_deployment_update(deployment_id, "queued", "Deployment queued")

        return jsonify({
            "success": True,
            "message": "Deployment started",
            "deployment_id": deployment_id,
            "status": "queued"
        }), 202

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/deployments", methods=["GET"])
def get_deployments():
    """Return all deployments ordered by newest first."""
    try:
        deployments = get_all_deployments()
        return jsonify({"success": True, "count": len(deployments), "deployments": deployments})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/deployments/<int:deployment_id>", methods=["DELETE"])
def delete_deployment(deployment_id):
    """Delete a deployment and its associated resources."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM deployments WHERE id=?", (deployment_id,))
        deployment = cursor.fetchone()

        if not deployment:
            conn.close()
            return jsonify({"success": False, "message": "Deployment not found"}), 404

        cleanup_result = delete_deployment_lifecycle(deployment_id)

        if not cleanup_result["success"]:
            conn.close()
            return jsonify(cleanup_result), 400

        stop_monitoring(deployment_id)

        # Clean up related tables
        cursor.execute("DELETE FROM build_logs WHERE deployment_id=?", (deployment_id,))
        cursor.execute("DELETE FROM container_logs WHERE deployment_id=?", (deployment_id,))
        cursor.execute("DELETE FROM deployment_metrics WHERE deployment_id=?", (deployment_id,))
        cursor.execute("DELETE FROM deployments WHERE id=?", (deployment_id,))

        conn.commit()
        conn.close()

        return jsonify({"success": True, "message": "Deployment deleted successfully"}), 200

    except Exception as e:
        print("DELETE ERROR:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/deployments/<int:deployment_id>/status", methods=["GET"])
def get_deployment_status(deployment_id):
    """Return the current status of a single deployment."""
    try:
        deployment = get_deployment_by_id(deployment_id)
        if not deployment:
            return jsonify({"success": False, "message": "Deployment not found"}), 404

        return jsonify({"success": True, "deployment": deployment})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/deployment/<int:deployment_id>/stop", methods=["POST"])
def stop_deployment_route(deployment_id):
    """Stop a running deployment container."""
    try:
        result = stop_deployment(deployment_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/deployment/<int:deployment_id>/start", methods=["POST"])
def start_deployment_route(deployment_id):
    """Start a stopped deployment container."""
    try:
        result = start_deployment(deployment_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/deployment/<int:deployment_id>/restart", methods=["POST"])
def restart_deployment_route(deployment_id):
    """Restart a deployment container."""
    try:
        result = restart_deployment(deployment_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/deployments/<int:deployment_id>/metrics", methods=["GET"])
def get_metrics_history(deployment_id):
    """Return stored monitoring metrics for a deployment."""
    try:
        conn = get_db_connection()

        rows = conn.execute(
            """
            SELECT cpu, ram, network_rx, network_tx, created_at
            FROM deployment_metrics
            WHERE deployment_id=?
            ORDER BY created_at ASC
            LIMIT 200
            """,
            (deployment_id,),
        ).fetchall()

        conn.close()

        metrics = []
        for row in rows:
            metrics.append({
                "cpu": row["cpu"],
                "ram": row["ram"],
                "network_rx": row["network_rx"],
                "network_tx": row["network_tx"],
                "timestamp": row["created_at"],
            })

        return jsonify({"success": True, "metrics": metrics})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/deployments/<int:deployment_id>/logs", methods=["GET"])
def get_logs_route(deployment_id):
    """Return stored deployment logs."""
    try:
        build_result = get_build_logs(deployment_id)
        container_result = get_container_logs(deployment_id)

        build_logs = build_result.get("logs", []) if isinstance(build_result, dict) else []
        container_logs = container_result.get("logs", []) if isinstance(container_result, dict) else []

        return jsonify({
            "success": True,
            "build_logs": build_logs,
            "container_logs": container_logs,
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/deployments/latest", methods=["GET"])
def get_latest_deployment():
    """Return the most recent deployment."""
    try:
        deployments = get_all_deployments()
        if deployments:
            return jsonify({"success": True, "deployment": deployments[0]})
        return jsonify({"success": False, "message": "No deployments found"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# =========================================================
# ANALYTICS ENDPOINTS
# =========================================================

@app.route("/api/analytics", methods=["GET"])
def analytics_endpoint():
    """Return aggregated analytics data for the dashboard."""
    try:
        analytics = get_analytics()
        return jsonify({"success": True, "analytics": analytics})
    except Exception as e:
        print("Analytics error:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/docker/stats", methods=["GET"])
def docker_stats_endpoint():
    """Return Docker container and image statistics."""
    try:
        stats = get_docker_stats()
        return jsonify({"success": True, "stats": stats})
    except Exception as e:
        print("Docker stats error:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/metrics/all", methods=["GET"])
def all_metrics_endpoint():
    """Return all stored monitoring metrics."""
    try:
        metrics = get_all_metrics()
        return jsonify({"success": True, "metrics": metrics})
    except Exception as e:
        print("Metrics error:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500


# =========================================================
# RUN SERVER
# =========================================================

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True, allow_unsafe_werkzeug=True)