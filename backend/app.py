import threading
import sqlite3
from database import get_db_connection
from database import (
    init_db,
    get_db_connection
)

from flask import (
    Flask,
    request,
    jsonify
)

from flask_cors import CORS

from sockets.socket_manager import (
    socketio,
    emit_deployment_update,
    emit_log
)

import sockets.deployment_socket
import sockets.logs_socket

from services.git_service import clone_repository

from services.framework_detector import (
    detect_framework
)

from services.dockerfile_generator import (
    generate_dockerfile
)

from services.log_service import (
    save_build_logs,
    get_build_logs,
    save_container_logs,
    get_container_logs
)

from services.docker_service import (
    build_docker_image,
    run_docker_container
)

from services.deployment_service import (
    create_deployment,
    update_deployment_step,
    complete_deployment,
    fail_deployment,
    get_all_deployments,
    get_deployment_by_id,
    stop_deployment,
    start_deployment,
    restart_deployment
)

from services.monitor_service import (
    stop_monitoring
)

from services.cleanup_service import (
    remove_container,
    remove_image,
    remove_repo_folder
)

# =========================================================
# APP CONFIG
# =========================================================

app = Flask(__name__)

CORS(app)

socketio.init_app(
    app,
    cors_allowed_origins="*"
)

init_db()

# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():

    return jsonify({
        "success": True,
        "message": "DeployX Backend Running 🚀"
    })


# =========================================================
# BACKGROUND DEPLOYMENT
# =========================================================

def run_deployment_job(
    deployment_id,
    repo_url
):

    repo_path = None
    image_name = None
    container_id = None

    try:

        print("\n========== DEPLOYMENT STARTED ==========")

        # -------------------------------------------------
        # CLONE
        # -------------------------------------------------

        update_deployment_step(
            deployment_id,
            "cloning"
        )

        emit_deployment_update(
            deployment_id,
            "cloning",
            "Cloning repository..."
        )

        emit_log(
            deployment_id,
            "Starting repository clone..."
        )

        clone_result = clone_repository(
            repo_url
        )

        if not clone_result["success"]:

            fail_deployment(
                deployment_id,
                "failed"
            )

            repo_path = clone_result.get(
                "repo_path"
            )

            if repo_path:
                remove_repo_folder(
                    repo_path
                )

            return

        repo_path = clone_result[
            "repo_path"
        ]

        # -------------------------------------------------
        # FRAMEWORK DETECTION
        # -------------------------------------------------

        update_deployment_step(
            deployment_id,
            "detecting"
        )

        emit_deployment_update(
            deployment_id,
            "detecting",
            "Detecting framework..."
        )

        framework_result = detect_framework(
            repo_path
        )

        if not framework_result["success"]:

            fail_deployment(
                deployment_id,
                "failed"
            )

            remove_repo_folder(
                repo_path
            )

            return

        # -------------------------------------------------
        # DOCKERFILE
        # -------------------------------------------------

        update_deployment_step(
            deployment_id,
            "dockerfile_generating"
        )

        emit_deployment_update(
            deployment_id,
            "dockerfile_generating",
            "Generating Dockerfile..."
        )

        dockerfile_result = generate_dockerfile(
            repo_path,
            framework_result["framework"]
        )

        if not dockerfile_result["success"]:

            fail_deployment(
                deployment_id,
                "failed"
            )

            remove_repo_folder(
                repo_path
            )

            return

        # -------------------------------------------------
        # BUILD IMAGE
        # -------------------------------------------------

        update_deployment_step(
            deployment_id,
            "building"
        )

        emit_deployment_update(
            deployment_id,
            "building",
            "Building Docker image..."
        )

        docker_result = build_docker_image(
            repo_path,
            deployment_id
        )

        if not docker_result["success"]:

            fail_deployment(
                deployment_id,
                "failed"
            )

            remove_repo_folder(
                repo_path
            )

            return

        image_name = docker_result[
            "image_name"
        ]

        # -------------------------------------------------
        # RUN CONTAINER
        # -------------------------------------------------

        update_deployment_step(
            deployment_id,
            "deploying"
        )

        emit_deployment_update(
            deployment_id,
            "deploying",
            "Starting container..."
        )

        container_result = run_docker_container(
            image_name,
            deployment_id,
            repo_path
        )

        if not container_result["success"]:

            fail_deployment(
                deployment_id,
                "failed"
            )

            remove_image(
                image_name
            )

            remove_repo_folder(
                repo_path
            )

            return

        container_id = container_result[
            "container_id"
        ]

        # -------------------------------------------------
        # RUNNING
        # -------------------------------------------------

        update_deployment_step(
            deployment_id,
            "running"
        )

        emit_deployment_update(
            deployment_id,
            "running",
            "Container running"
        )

        complete_deployment(
            deployment_id,
            framework_result,
            docker_result,
            container_result
        )

        save_build_logs(
            deployment_id,
            docker_result.get(
                "logs",
                []
            )
        )

        save_container_logs(
            deployment_id,
            container_result.get(
                "logs",
                []
            )
        )

        print(
            "\n========== DEPLOYMENT COMPLETED =========="
        )

    except Exception as e:

        print(
            "\n========== DEPLOYMENT ERROR =========="
        )

        print(str(e))

        emit_deployment_update(
            deployment_id,
            "failed",
            str(e)
        )

        emit_log(
            deployment_id,
            f"ERROR: {str(e)}"
        )

        fail_deployment(
            deployment_id,
            "failed"
        )

        if container_id:
            remove_container(
                container_id
            )

        if image_name:
            remove_image(
                image_name
            )

        if repo_path:
            remove_repo_folder(
                repo_path
            )


# =========================================================
# DEPLOY API
# =========================================================

@app.route(
    "/deploy",
    methods=["POST"]
)
def deploy():

    try:

        data = request.get_json()

        if not data:

            return jsonify({
                "success": False,
                "error": "No JSON data received"
            }), 400

        repo_url = data.get(
            "repo_url"
        )

        if not repo_url:

            return jsonify({
                "success": False,
                "error": "GitHub repo URL required"
            }), 400

        deployment = create_deployment(
            repo_url
        )

        deployment_id = deployment["id"]

        update_deployment_step(
            deployment_id,
            "queued"
        )

        deployment_thread = threading.Thread(
            target=run_deployment_job,
            args=(
                deployment_id,
                repo_url
            )
        )

        deployment_thread.start()

        return jsonify({
            "success": True,
            "message": "Deployment started",
            "deployment_id": deployment_id,
            "status": "queued"
        }), 202

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================================================
# GET ALL DEPLOYMENTS
# =========================================================

@app.route(
    "/deployments",
    methods=["GET"]
)
def get_deployments():

    try:

        deployments = get_all_deployments()

        return jsonify({
            "success": True,
            "count": len(deployments),
            "deployments": deployments
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================================================
# DELETE DEPLOYMENT
# =========================================================

@app.route(
    "/deployments/<int:deployment_id>",
    methods=["DELETE"]
)
def delete_deployment(deployment_id):

    try:

        conn =  get_db_connection()

        cursor = conn.cursor()

        # =================================================
        # CHECK DEPLOYMENT EXISTS
        # =================================================

        cursor.execute(
            """
            SELECT *
            FROM deployments
            WHERE id=?
            """,
            (deployment_id,)
        )

        deployment = cursor.fetchone()

        if not deployment:

            conn.close()

            return jsonify({

                "success": False,
                "message": "Deployment not found"

            }), 404

        # =================================================
        # STOP ACTIVE MONITORING
        # =================================================

        stop_monitoring(
            deployment_id
        )

        # =================================================
        # DELETE BUILD LOGS
        # =================================================

        cursor.execute(
            """
            DELETE FROM build_logs
            WHERE deployment_id=?
            """,
            (deployment_id,)
        )

        # =================================================
        # DELETE CONTAINER LOGS
        # =================================================

        cursor.execute(
            """
            DELETE FROM container_logs
            WHERE deployment_id=?
            """,
            (deployment_id,)
        )

        # =================================================
        # DELETE METRICS
        # =================================================

        cursor.execute(
            """
            DELETE FROM deployment_metrics
            WHERE deployment_id=?
            """,
            (deployment_id,)
        )

        # =================================================
        # DELETE DEPLOYMENT
        # =================================================

        cursor.execute(
            """
            DELETE FROM deployments
            WHERE id=?
            """,
            (deployment_id,)
        )

        conn.commit()

        conn.close()

        return jsonify({

            "success": True,
            "message": "Deployment deleted successfully"

        }), 200

    except Exception as e:

        print("DELETE ERROR:", str(e))

        return jsonify({

            "success": False,
            "error": str(e)

        }), 500

# =========================================================
# DEPLOYMENT STATUS
# =========================================================

@app.route(
    "/deployments/<int:deployment_id>/status",
    methods=["GET"]
)
def get_deployment_status(
    deployment_id
):

    try:

        deployment = get_deployment_by_id(
            deployment_id
        )

        if not deployment:

            return jsonify({
                "success": False,
                "message": "Deployment not found"
            }), 404

        return jsonify({
            "success": True,
            "deployment": deployment
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# =========================================================
# STOP DEPLOYMENT
# =========================================================

@app.route(
    "/deployment/<int:deployment_id>/stop",
    methods=["POST"]
)
def stop_deployment_route(
    deployment_id
):

    try:

        result = stop_deployment(
            deployment_id
        )

        return jsonify(
            result
        )

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# =========================================================
# START DEPLOYMENT
# =========================================================

@app.route(
    "/deployment/<int:deployment_id>/start",
    methods=["POST"]
)
def start_deployment_route(
    deployment_id
):

    try:

        result = start_deployment(
            deployment_id
        )

        return jsonify(
            result
        )

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# =========================================================
# RESTART DEPLOYMENT
# =========================================================

@app.route(
    "/deployment/<int:deployment_id>/restart",
    methods=["POST"]
)
def restart_deployment_route(
    deployment_id
):

    try:

        result = restart_deployment(
            deployment_id
        )

        return jsonify(
            result
        )

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# =========================================================
# METRICS HISTORY
# =========================================================

@app.route(
    "/deployments/<int:deployment_id>/metrics",
    methods=["GET"]
)
def get_metrics_history(
    deployment_id
):

    try:

        conn = get_db_connection()

        metrics = conn.execute("""
        SELECT
            cpu,
            ram,
            network_rx,
            network_tx,
            health,
            created_at

        FROM deployment_metrics

        WHERE deployment_id=?

        ORDER BY created_at ASC
        """, (
            deployment_id,
        )).fetchall()

        conn.close()

        return jsonify({

            "success": True,

            "metrics": [

                dict(row)
                for row in metrics
            ]

        })

    except Exception as e:

        return jsonify({

            "success": False,
            "error": str(e)

        }), 500


# =========================================================
# LATEST METRICS
# =========================================================

@app.route(
    "/deployments/<int:deployment_id>/metrics/latest",
    methods=["GET"]
)
def get_latest_metrics(
    deployment_id
):

    try:

        conn = get_db_connection()

        metric = conn.execute("""
        SELECT
            cpu,
            ram,
            network_rx,
            network_tx,
            health,
            created_at

        FROM deployment_metrics

        WHERE deployment_id=?

        ORDER BY id DESC
        LIMIT 1
        """, (
            deployment_id,
        )).fetchone()

        conn.close()

        if metric:

            return jsonify({

                "success": True,
                "metrics": dict(metric)

            })

        return jsonify({

            "success": False,
            "metrics": None

        })

    except Exception as e:

        return jsonify({

            "success": False,
            "error": str(e)

        }), 500

# =========================================================
# BUILD LOGS
# =========================================================

@app.route(
    "/deployments/<int:deployment_id>/logs",
    methods=["GET"]
)
def deployment_logs(
    deployment_id
):

    try:

        logs_result = get_build_logs(
            deployment_id
        )

        return jsonify(
            logs_result
        )

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================================================
# CONTAINER LOGS
# =========================================================

@app.route(
    "/deployments/<int:deployment_id>/container-logs",
    methods=["GET"]
)
def deployment_container_logs(
    deployment_id
):

    try:

        logs_result = get_container_logs(
            deployment_id
        )

        return jsonify(
            logs_result
        )

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================================================
# CLEANUP ROUTES
# =========================================================

@app.route(
    "/cleanup/container",
    methods=["DELETE"]
)
def cleanup_container():

    try:

        data = request.get_json()

        container_id = data.get(
            "container_id"
        )

        result = remove_container(
            container_id
        )

        return jsonify(result)

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@app.route(
    "/cleanup/image",
    methods=["DELETE"]
)
def cleanup_image():

    try:

        data = request.get_json()

        image_name = data.get(
            "image_name"
        )

        result = remove_image(
            image_name
        )

        return jsonify(result)

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@app.route(
    "/cleanup/repo",
    methods=["DELETE"]
)
def cleanup_repo():

    try:

        data = request.get_json()

        repo_path = data.get(
            "repo_path"
        )

        result = remove_repo_folder(
            repo_path
        )

        return jsonify(result)

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================================
# MAIN
# =========================================================

if __name__ == "__main__":

    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=True
    )