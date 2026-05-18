import threading
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
    get_all_deployments,
    get_deployment_by_id
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

def run_deployment_job(deployment_id, repo_url):

    repo_path = None
    image_name = None
    container_id = None

    try:
        print("\n========== BACKGROUND DEPLOYMENT STARTED ==========")
        print("Deployment ID:", deployment_id)
        print("Repo URL:", repo_url)

        # STEP 1 → CLONING
        update_deployment_step(deployment_id, "cloning")

        clone_result = clone_repository(repo_url)
        print("Clone Result:", clone_result)

        if not clone_result["success"]:
            fail_deployment(deployment_id, "failed")

            repo_path = clone_result.get("repo_path")
            if repo_path:
                remove_repo_folder(repo_path)

            return

        repo_path = clone_result["repo_path"]

        # STEP 2 → FRAMEWORK DETECTION
        update_deployment_step(deployment_id, "detecting")

        framework_result = detect_framework(repo_path)
        print("Framework Result:", framework_result)

        if not framework_result["success"]:
            fail_deployment(deployment_id, "failed")
            remove_repo_folder(repo_path)
            return

        # STEP 3 → DOCKERFILE GENERATION
        update_deployment_step(deployment_id, "dockerfile_generating")

        dockerfile_result = generate_dockerfile(
            repo_path,
            framework_result["framework"]
        )
        print("Dockerfile Result:", dockerfile_result)

        if not dockerfile_result["success"]:
            fail_deployment(deployment_id, "failed")
            remove_repo_folder(repo_path)
            return

        # STEP 4 → BUILD IMAGE
        update_deployment_step(deployment_id, "building")

        docker_result = build_docker_image(repo_path)
        print("Docker Result:", docker_result)

        if not docker_result["success"]:
            fail_deployment(deployment_id, "failed")
            remove_repo_folder(repo_path)
            return

        image_name = docker_result["image_name"]

        # STEP 5 → RUN CONTAINER
        update_deployment_step(deployment_id, "deploying")

        container_result = run_docker_container(
            image_name,
            repo_path=repo_path
        )
        print("Container Result:", container_result)

        if not container_result["success"]:
            fail_deployment(deployment_id, "failed")
            remove_image(image_name)
            remove_repo_folder(repo_path)
            return

        container_id = container_result["container_id"]

        # STEP 6 → COMPLETE DEPLOYMENT
        update_deployment_step(deployment_id, "running")

        complete_deployment(
            deployment_id,
            framework_result,
            docker_result,
            container_result
        )

        # STEP 7 → SAVE LOGS
        save_build_logs(
            deployment_id,
            docker_result.get("logs", [])
        )

        save_container_logs(
            deployment_id,
            container_result.get("logs", [])
        )

        print("\n========== BACKGROUND DEPLOYMENT COMPLETED ==========")

    except Exception as e:
        print("\n========== BACKGROUND DEPLOYMENT ERROR ==========")
        print(str(e))

        fail_deployment(deployment_id, "failed")

        if container_id:
            remove_container(container_id)

        if image_name:
            remove_image(image_name)

        if repo_path:
            remove_repo_folder(repo_path)
            
def run_deployment_job(deployment_id, repo_url):

    repo_path = None
    image_name = None
    container_id = None

    try:
        print("\n========== BACKGROUND DEPLOYMENT STARTED ==========")
        print("Deployment ID:", deployment_id)
        print("Repo URL:", repo_url)

        update_deployment_step(deployment_id, "cloning")

        print("\n[STEP 1] Cloning Repository...")
        clone_result = clone_repository(repo_url)

        if not clone_result["success"]:
            fail_deployment(deployment_id, "failed")

            repo_path = clone_result.get("repo_path")

            if repo_path:
                remove_repo_folder(repo_path)

            return

        repo_path = clone_result["repo_path"]

        update_deployment_step(deployment_id, "detecting")

        print("\n[STEP 2] Detecting Framework...")
        framework_result = detect_framework(repo_path)

        if not framework_result["success"]:
            fail_deployment(deployment_id, "failed")
            remove_repo_folder(repo_path)
            return

        update_deployment_step(deployment_id, "dockerfile_generating")

        print("\n[STEP 3] Generating Dockerfile...")
        dockerfile_result = generate_dockerfile(
            repo_path,
            framework_result["framework"]
        )

        if not dockerfile_result["success"]:
            fail_deployment(deployment_id, "failed")
            remove_repo_folder(repo_path)
            return

        update_deployment_step(deployment_id, "building")

        print("\n[STEP 4] Building Docker Image...")
        docker_result = build_docker_image(repo_path)

        if not docker_result["success"]:
            fail_deployment(deployment_id, "failed")
            remove_repo_folder(repo_path)
            return

        image_name = docker_result["image_name"]

        update_deployment_step(deployment_id, "deploying")

        print("\n[STEP 5] Running Container...")
        container_result = run_docker_container(
            image_name,
            repo_path=repo_path
        )

        if not container_result["success"]:
            fail_deployment(deployment_id, "failed")
            remove_image(image_name)
            remove_repo_folder(repo_path)
            return

        container_id = container_result["container_id"]

        update_deployment_step(deployment_id, "running")

        complete_deployment(
            deployment_id,
            framework_result,
            docker_result,
            container_result
        )

        save_build_logs(
            deployment_id,
            docker_result.get("logs", [])
        )

        save_container_logs(
            deployment_id,
            container_result.get("logs", [])
        )

        print("\n========== BACKGROUND DEPLOYMENT COMPLETED ==========")

    except Exception as e:
        print("\n========== BACKGROUND DEPLOYMENT ERROR ==========")
        print(str(e))

        fail_deployment(deployment_id, "failed")

        if container_id:
            remove_container(container_id)

        if image_name:
            remove_image(image_name)

        if repo_path:
            remove_repo_folder(repo_path)

@app.route("/deploy", methods=["POST"])
def deploy():

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

        deployment = create_deployment(repo_url)
        deployment_id = deployment["id"]

        update_deployment_step(
            deployment_id,
            "queued"
        )

        deployment_thread = threading.Thread(
            target=run_deployment_job,
            args=(deployment_id, repo_url)
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

@app.route("/deployments", methods=["GET"])
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

@app.route("/deployments/<int:deployment_id>/status", methods=["GET"])
def get_deployment_status(deployment_id):

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
            "deployment_id": deployment["id"],
            "repo_url": deployment["repo_url"],
            "framework": deployment["framework"],
            "status": deployment["status"],
            "url": deployment["url"],
            "port": deployment["port"],
            "created_at": deployment["created_at"]
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route("/deployments/<int:deployment_id>/logs", methods=["GET"])
def deployment_logs(deployment_id):

    try:
        logs_result = get_build_logs(deployment_id)

        if not logs_result["success"]:
            return jsonify(logs_result), 404

        return jsonify(logs_result)

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "logs": []
        }), 500


@app.route("/deployments/<int:deployment_id>/container-logs", methods=["GET"])
def deployment_container_logs(deployment_id):

    try:
        logs_result = get_container_logs(deployment_id)

        if not logs_result["success"]:
            return jsonify(logs_result), 404

        return jsonify(logs_result)

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "logs": []
        }), 500


@app.route("/cleanup/container", methods=["DELETE"])
def cleanup_container():

    try:
        data = request.get_json()
        container_id = data.get("container_id")

        result = remove_container(container_id)

        return jsonify(result), 200 if result["success"] else 400

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@app.route("/cleanup/image", methods=["DELETE"])
def cleanup_image():

    try:
        data = request.get_json()
        image_name = data.get("image_name")

        result = remove_image(image_name)

        return jsonify(result), 200 if result["success"] else 400

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@app.route("/cleanup/repo", methods=["DELETE"])
def cleanup_repo():

    try:
        data = request.get_json()
        repo_path = data.get("repo_path")

        result = remove_repo_folder(repo_path)

        return jsonify(result), 200 if result["success"] else 400

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


if __name__ == "__main__":

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )