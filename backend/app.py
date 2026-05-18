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
    deployment_id = None

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

            repo_path = clone_result.get("repo_path")

            if repo_path:
                remove_repo_folder(repo_path)

            return jsonify({
                "success": False,
                "status": "failed",
                "step": "cloning",
                "error": clone_result.get(
                    "error",
                    "Repository cloning failed"
                ),
                "error_type": clone_result.get(
                    "error_type",
                    "CLONE_ERROR"
                ),
                "details": clone_result
            }), 400

        repo_path = clone_result["repo_path"]

        # STEP 2 → FRAMEWORK DETECTION
        update_deployment_step(
            deployment_id,
            "detecting"
        )

        print("\n[STEP 2] Detecting Framework...")
        framework_result = detect_framework(repo_path)

        print("Framework Result:", framework_result)

        if not framework_result["success"]:

            fail_deployment(
                deployment_id,
                "failed"
            )

            repo_cleanup_result = remove_repo_folder(repo_path)

            return jsonify({
                "success": False,
                "status": "failed",
                "step": "framework_detection",
                "error": framework_result.get(
                    "message",
                    "Framework detection failed"
                ),
                "details": framework_result,
                "cleanup": {
                    "repo": repo_cleanup_result
                }
            }), 400

        # STEP 3 → GENERATE DOCKERFILE
        update_deployment_step(
            deployment_id,
            "dockerfile_generating"
        )

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

            repo_cleanup_result = remove_repo_folder(repo_path)

            return jsonify({
                "success": False,
                "status": "failed",
                "step": "dockerfile_generation",
                "error": dockerfile_result.get(
                    "message",
                    "Dockerfile generation failed"
                ),
                "details": dockerfile_result,
                "cleanup": {
                    "repo": repo_cleanup_result
                }
            }), 400

        # STEP 4 → BUILD IMAGE
        update_deployment_step(
            deployment_id,
            "building"
        )

        print("\n[STEP 4] Building Docker Image...")
        docker_result = build_docker_image(repo_path)

        print("Docker Result:", docker_result)

        if not docker_result["success"]:

            fail_deployment(
                deployment_id,
                "failed"
            )

            repo_cleanup_result = remove_repo_folder(repo_path)

            return jsonify({
                "success": False,
                "status": "failed",
                "step": "docker_build",
                "error": docker_result.get(
                    "message",
                    "Docker image build failed"
                ),
                "details": docker_result,
                "cleanup": {
                    "repo": repo_cleanup_result
                }
            }), 400

        image_name = docker_result["image_name"]

        # STEP 5 → RUN CONTAINER
        update_deployment_step(
            deployment_id,
            "deploying"
        )

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

            image_cleanup_result = remove_image(image_name)
            repo_cleanup_result = remove_repo_folder(repo_path)

            return jsonify({
                "success": False,
                "status": "failed",
                "step": "container_runtime",
                "error": container_result.get(
                    "message",
                    "Container startup failed"
                ),
                "details": container_result,
                "cleanup": {
                    "image": image_cleanup_result,
                    "repo": repo_cleanup_result
                }
            }), 400

        container_id = container_result["container_id"]

        # STEP 6 → COMPLETE DEPLOYMENT
        update_deployment_step(
            deployment_id,
            "running"
        )

        complete_deployment(
            deployment_id,
            framework_result,
            docker_result,
            container_result
        )

        # STEP 7 → SAVE BUILD LOGS
        save_build_logs(
            deployment_id,
            docker_result.get("logs", [])
        )

        # STEP 8 → SAVE CONTAINER LOGS
        save_container_logs(
            deployment_id,
            container_result.get("logs", [])
        )

        return jsonify({
            "success": True,
            "message": "Deployment Successful 🚀",
            "deployment_id": deployment_id,
            "url": container_result.get("url"),
            "status": "running"
        })

    except Exception as e:

        if deployment_id:
            fail_deployment(
                deployment_id,
                "failed"
            )

        print("\n========== DEPLOY ERROR ==========")
        print(str(e))

        cleanup = {}

        if container_id:
            cleanup["container"] = remove_container(container_id)

        if image_name:
            cleanup["image"] = remove_image(image_name)

        if repo_path:
            cleanup["repo"] = remove_repo_folder(repo_path)

        return jsonify({
            "success": False,
            "status": "failed",
            "error": str(e),
            "cleanup": cleanup
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