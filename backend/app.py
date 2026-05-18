from database import init_db
from flask import Flask, request, jsonify
from flask_cors import CORS

from services.git_service import clone_repository
from services.framework_detector import detect_framework
from services.dockerfile_generator import generate_dockerfile

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
    get_all_deployments
)

from services.cleanup_service import (
    remove_container,
    remove_image,
    remove_repo_folder
)

app = Flask(__name__)

CORS(app)

init_db()


@app.route("/")
def home():
    return jsonify({
        "success": True,
        "message": "DeployX Backend Running 🚀"
    })


@app.route("/deploy", methods=["POST"])
def deploy():

    repo_path = None
    image_name = None
    container_id = None

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "No JSON data received"
            }), 400

        repo_url = data.get("repo_url")

        if not repo_url:
            return jsonify({
                "success": False,
                "error": "GitHub repo URL is required"
            }), 400

        # CREATE DEPLOYMENT ENTRY
        deployment = create_deployment(repo_url)

        deployment_id = deployment["id"]

        print("\n========== DEPLOY REQUEST ==========")
        print("Incoming Repo:", repo_url)

        # STEP 1 → CLONING
        update_deployment_step(
            deployment_id,
            "cloning"
        )

        print("\n[STEP 1] Cloning Repository...")

        clone_result = clone_repository(repo_url)

        print("Clone Result:", clone_result)

        if not clone_result["success"]:

            fail_deployment(
                deployment_id,
                "failed"
            )

            return jsonify({
                "success": False,
                "step": "cloning",
                "error": clone_result.get("error")
            }), 400

        repo_path = clone_result["repo_path"]

        # STEP 2 → FRAMEWORK DETECTION
        update_deployment_step(
            deployment_id,
            "building"
        )

        print("\n[STEP 2] Detecting Framework...")

        framework_result = detect_framework(repo_path)

        print("Framework Result:", framework_result)

        if not framework_result["success"]:

            fail_deployment(
                deployment_id,
                "failed"
            )

            return jsonify({
                "success": False,
                "step": "framework",
                "error": framework_result.get("message")
            }), 400

        # STEP 3 → GENERATE DOCKERFILE
        print("\n[STEP 3] Generating Dockerfile...")

        dockerfile_result = generate_dockerfile(
            repo_path,
            framework_result["framework"]
        )

        print("Dockerfile Result:", dockerfile_result)

        if not dockerfile_result["success"]:

            fail_deployment(
                deployment_id,
                "failed"
            )

            return jsonify({
                "success": False,
                "step": "dockerfile",
                "error": dockerfile_result.get("message")
            }), 400

        # STEP 4 → BUILD IMAGE
        update_deployment_step(
            deployment_id,
            "deploying"
        )

        print("\n[STEP 4] Building Docker Image...")

        docker_result = build_docker_image(repo_path)

        print("Docker Result:", docker_result)

        if not docker_result["success"]:

            fail_deployment(
                deployment_id,
                "failed"
            )

            return jsonify({
                "success": False,
                "step": "docker_build",
                "error": docker_result.get("message")
            }), 400

        image_name = docker_result["image_name"]

        # STEP 5 → RUN CONTAINER
        print("\n[STEP 5] Running Container...")

        container_result = run_docker_container(
            image_name,
            repo_path=repo_path
        )

        print("Container Result:", container_result)

        if not container_result["success"]:

            fail_deployment(
                deployment_id,
                "failed"
            )

            return jsonify({
                "success": False,
                "step": "container",
                "error": container_result.get("message")
            }), 400

        container_id = container_result["container_id"]

        # COMPLETE DEPLOYMENT
        complete_deployment(
            deployment_id,
            framework_result,
            docker_result,
            container_result
        )

        # SAVE LOGS
        save_build_logs(
            deployment_id,
            docker_result.get("logs", [])
        )

        save_container_logs(
            deployment_id,
            container_result.get("logs", [])
        )

        return jsonify({
            "success": True,
            "message": "Deployment Successful 🚀",
            "deployment_id": deployment_id,
            "url": container_result.get("url"),
            "status": "live"
        })

    except Exception as e:

        print("\n========== DEPLOY ERROR ==========")
        print(str(e))

        if container_id:
            remove_container(container_id)

        if image_name:
            remove_image(image_name)

        if repo_path:
            remove_repo_folder(repo_path)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/deployments", methods=["GET"])
def get_deployments():

    try:

        deployments = get_all_deployments()

        return jsonify({
            "success": True,
            "deployments": deployments
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/deployments/<int:deployment_id>/logs", methods=["GET"])
def deployment_logs(deployment_id):

    try:

        logs_result = get_build_logs(
            deployment_id
        )

        return jsonify(logs_result)

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/deployments/<int:deployment_id>/container-logs", methods=["GET"])
def deployment_container_logs(deployment_id):

    try:

        logs_result = get_container_logs(
            deployment_id
        )

        return jsonify(logs_result)

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )