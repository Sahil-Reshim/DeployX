import threading
import sqlite3
from dotenv import load_dotenv

load_dotenv()

import os

print("=" * 50)
print("DEPLOYX ENVIRONMENT")
print("=" * 50)

print("JENKINS_URL =", os.getenv("JENKINS_URL"))
print("JENKINS_USER =", os.getenv("JENKINS_USER"))
print("JENKINS_JOB_NAME =", os.getenv("JENKINS_JOB_NAME"))
def _mask(token):
    if not token:
        return None
    t = str(token)
    if len(t) <= 8:
        return "****"
    return t[:4] + "..." + t[-4:]

print("JENKINS_API_TOKEN =", _mask(os.getenv("JENKINS_API_TOKEN")))

print("=" * 50)

from services.jenkins_service import (
    trigger_jenkins_job,
    wait_for_pipeline
)

from flask import (
    Flask,
    request,
    jsonify
)

from flask_cors import CORS

from database import (
    init_db,
    get_db_connection
)

from services.runtime_recovery import (
    restore_runtime_states
)

from sockets.socket_manager import (
    socketio,
    emit_deployment_update,
    emit_log
)

import sockets.deployment_socket
import sockets.logs_socket

from services.git_service import (
    clone_repository
)

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

    save_jenkins_queue,
    save_jenkins_build_number,
    update_jenkins_status,

    get_all_deployments,
    get_deployment_by_id,
    stop_deployment,
    start_deployment,
    restart_deployment,
    delete_deployment_lifecycle
)

from services.monitor_service import (
    stop_monitoring
)

from services.cleanup_service import (
    remove_container,
    remove_image,
    remove_repo_folder,
    cleanup_proxy_route
)

from services.port_allocator import (
    allocate_port
)

from services.domain_service import (
    generate_subdomain,
    build_custom_url
)

from services.proxy_manager import (
    create_route,
    reload_proxy
)
# =========================================================
# APP CONFIG
# =========================================================

app = Flask(__name__)

CORS(app)

socketio.init_app(
    app,
    cors_allowed_origins="*",
    async_mode="threading"
)

# =========================================================
# DATABASE INIT
# =========================================================

init_db()

# =========================================================
# RUNTIME RECOVERY
# =========================================================

restore_runtime_states()

# =========================================================
# DEPLOYMENT FAILURE HELPER
# =========================================================

def mark_deployment_failed(
    deployment_id,
    message
):
    fail_deployment(
        deployment_id,
        "failed"
    )

    emit_deployment_update(
        deployment_id,
        "failed",
        message
    )

    emit_log(
        deployment_id,
        f"ERROR: {message}"
    )

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

        print(
            "\n========== DEPLOYMENT STARTED =========="
        )

        # =================================================
        # CLONE REPOSITORY
        # =================================================

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

            mark_deployment_failed(
                deployment_id,
                clone_result.get(
                    "message",
                    "Repository clone failed"
                )
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

        # =================================================
        # DETECT FRAMEWORK
        # =================================================

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

            mark_deployment_failed(
                deployment_id,
                framework_result.get(
                    "message",
                    "Framework detection failed"
                )
            )

            remove_repo_folder(
                repo_path
            )

            return

        # =================================================
        # GENERATE DOCKERFILE
        # =================================================

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

            mark_deployment_failed(
                deployment_id,
                dockerfile_result.get(
                    "message",
                    "Dockerfile generation failed"
                )
            )

            remove_repo_folder(
                repo_path
            )

            return

        # ==========================================
        # JENKINS CI PIPELINE
        # ==========================================

        update_deployment_step(
            deployment_id,
            "ci_pipeline"
        )

        emit_deployment_update(
            deployment_id,
            "ci_pipeline",
            "Running Jenkins CI pipeline...",
            jenkins_status="TRIGGERED",
            current_step="triggering_jenkins",
        )


        jenkins_result = trigger_jenkins_job(
            repo_url,
            framework_result["framework"]
        )

        if not jenkins_result["success"]:

            mark_deployment_failed(
                deployment_id,
                jenkins_result.get(
                    "message",
                    "Jenkins pipeline trigger failed"
                )
            )

            remove_repo_folder(
                repo_path
            )

            return


        queue_id = jenkins_result["queue_id"]

        save_jenkins_queue(
            deployment_id,
            queue_id
        )

        pipeline_result = wait_for_pipeline(
            deployment_id,
            queue_id
        )

        if not pipeline_result.get("success"):

            mark_deployment_failed(
                deployment_id,
                pipeline_result.get(
                    "message",
                    "Jenkins pipeline failed"
                )
            )

            remove_repo_folder(
                repo_path
            )

            return


        emit_deployment_update(
            deployment_id,
            "ci_pipeline",
            "Jenkins pipeline successful"
        )

        # =================================================
        # BUILD IMAGE
        # =================================================

        update_deployment_step(
            deployment_id,
            "docker_build"
        )

        emit_deployment_update(
            deployment_id,
            "docker_build",
            "Building Docker image..."
        )

        docker_result = build_docker_image(
            repo_path,
            deployment_id
        )

        if not docker_result["success"]:

            mark_deployment_failed(
                deployment_id,
                docker_result.get(
                    "message",
                    "Docker image build failed"
                )
            )

            remove_repo_folder(
                repo_path
            )

            return

        image_name = docker_result[
            "image_name"
        ]


        
        # =================================================
        # PHASE 7 PORT SETUP
        # =================================================

        assigned_port = allocate_port()

        subdomain = None

        custom_url = f"http://localhost:{assigned_port}"

        # =================================================
        # RUN CONTAINER - THIS ALSO MARKS THE END OF THE DEPLOYMENT PROCESS
        # =================================================

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
            assigned_port,
            repo_path
        ) 

        if not container_result["success"]:

            mark_deployment_failed(
                deployment_id,
                container_result.get(
                    "message",
                    "Container failed to start"
                )
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

        # =================================================
        # RUNNING STATE - UPDATE IN-MEMORY STATE AND DB
        # =================================================

        update_deployment_step(
            deployment_id,
            "running"
        )

        emit_deployment_update(
            deployment_id,
            "running",
            "Container running",
            url=custom_url,
            container_id=container_id
        )

        container_result["assigned_port"] = assigned_port

        container_result["subdomain"] = subdomain

        container_result["custom_url"] = custom_url

        container_result["url"] = custom_url

        complete_deployment(
            deployment_id,
            framework_result,
            docker_result,
            container_result
        )
        
        emit_deployment_update(
            deployment_id,
            "live",
            "Deployment completed successfully",
            url=custom_url,
            container_id=container_id,
            state_key="LIVE",
            state_label="Live",
            progress=100
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

        mark_deployment_failed(
            deployment_id,
            str(e)
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

        if 'subdomain' in locals():
            cleanup_proxy_route(subdomain)


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

        emit_deployment_update(
            deployment_id,
            "queued",
            "Deployment queued"
        )

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
def delete_deployment(
    deployment_id
):

    try:

        conn = get_db_connection()

        cursor = conn.cursor()

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

        cleanup_result = delete_deployment_lifecycle(
            deployment_id
        )

        if not cleanup_result["success"]:

            conn.close()

            return jsonify(
                cleanup_result
            ), 400

        stop_monitoring(
            deployment_id
        )

        cursor.execute(
            """
            DELETE FROM build_logs
            WHERE deployment_id=?
            """,
            (deployment_id,)
        )

        cursor.execute(
            """
            DELETE FROM container_logs
            WHERE deployment_id=?
            """,
            (deployment_id,)
        )

        cursor.execute(
            """
            DELETE FROM deployment_metrics
            WHERE deployment_id=?
            """,
            (deployment_id,)
        )

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

        print(
            "DELETE ERROR:",
            str(e)
        )

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
# CLEANUP CONTAINER
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

        return jsonify(
            result
        )

    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500


# =========================================================
# CLEANUP IMAGE
# =========================================================

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

        return jsonify(
            result
        )

    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500


# =========================================================
# CLEANUP REPOSITORY
# =========================================================

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

        return jsonify(
            result
        )

    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500


# =========================================================
# TEMP TEST ENDPOINT (DEV ONLY)
# POST JSON: { "deployment_id": <id>, "message": "...", "level": "info|warn|error|success" }
# =========================================================
@app.route("/test/emit", methods=["POST"])
def test_emit():
    try:
        data = request.get_json() or {}

        deployment_id = data.get("deployment_id")
        message = data.get("message")
        level = data.get("level", "info")

        if deployment_id is None or message is None:
            return jsonify({
                "success": False,
                "message": "deployment_id and message required"
            }), 400

        emit_log(deployment_id, {
            "message": message,
            "level": level,
            "timestamp": None
        })

        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# =========================================================
# MAIN
# =========================================================

if __name__ == "__main__":

    debug_mode = (
        os.getenv("FLASK_DEBUG", "false").lower()
        in ("1", "true", "yes")
    )

    socketio.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000")),
        debug=debug_mode
    )