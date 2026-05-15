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
    save_deployment,
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
        "message": "DeployX Backend Running 🚀",
        "role": "DevOps Backend"
    })


@app.route("/deploy", methods=["POST"])
def deploy():

    try:
        repo_path = None
        image_name = None
        container_id = None

        data = request.get_json()

        print("\n========== DEPLOY REQUEST ==========")
        print("Incoming Data:", data)

        if not data:
            return jsonify({
                "success": False,
                "error": "No JSON data received"
            }), 400

        repo_url = data.get("repo_url")

        print("Repo URL:", repo_url)

        if not repo_url:
            return jsonify({
                "success": False,
                "error": "GitHub repo URL is required"
            }), 400

        # STEP 1 → Clone Repository
        print("\n[STEP 1] Cloning Repository...")

        clone_result = clone_repository(repo_url)
        print("Clone Result:", clone_result)

        if not clone_result["success"]:
            return jsonify({
                "success": False,
                "step": "clone_repository",
                "error": clone_result.get("message", "Repository cloning failed"),
                "details": clone_result
            }), 400

        repo_path = clone_result["repo_path"]

        # STEP 2 → Detect Framework
        print("\n[STEP 2] Detecting Framework...")

        framework_result = detect_framework(repo_path)
        print("Framework Result:", framework_result)

        if not framework_result["success"]:
            repo_cleanup_result = remove_repo_folder(repo_path)
            
            print("Repo Cleanup Result:", repo_cleanup_result)

            return jsonify({
                "success": False,
                "step": "framework_detection",
                "error": framework_result.get("message", "Framework detection failed"),
                "details": framework_result,
                "cleanup": {
                    "repo": repo_cleanup_result
                }
            }), 400

        # STEP 3 → Generate Dockerfile If Missing
        print("\n[STEP 3] Checking / Generating Dockerfile...")

        dockerfile_result = generate_dockerfile(
            repo_path,
            framework_result["framework"]
        )

        print("Dockerfile Result:", dockerfile_result)

        if not dockerfile_result["success"]:
            repo_cleanup_result = remove_repo_folder(repo_path)

            return jsonify({
                "success": False,
                "step": "dockerfile_generation",
                "error": dockerfile_result.get("message", "Dockerfile generation failed"),
                "details": dockerfile_result,
                "cleanup": {
                    "repo": repo_cleanup_result
                }
            }), 400

        # STEP 4 → Build Docker Image
        print("\n[STEP 4] Building Docker Image...")

        docker_result = build_docker_image(repo_path)
        print("Docker Result:", docker_result)

        if not docker_result["success"]:
            repo_cleanup_result = remove_repo_folder(repo_path)

            return jsonify({
                "success": False,
                "step": "docker_build",
                "error": docker_result.get("message", "Docker image build failed"),
                "details": docker_result,
                "cleanup": {
                    "repo": repo_cleanup_result
                }
            }), 400

        image_name = docker_result["image_name"]

        # STEP 5 → Run Docker Container
        print("\n[STEP 5] Running Docker Container...")

        container_result = run_docker_container(image_name)
        print("Container Result:", container_result)

        if not container_result["success"]:
            image_cleanup_result = remove_image(image_name)
            repo_cleanup_result = remove_repo_folder(repo_path)

            return jsonify({
                "success": False,
                "step": "container_runtime",
                "error": container_result.get("message", "Container startup failed"),
                "details": container_result,
                "cleanup": {
                    "image": image_cleanup_result,
                    "repo": repo_cleanup_result
                }
            }), 400

        container_id = container_result["container_id"]

        # STEP 6 → Save Deployment
        print("\n[STEP 6] Saving Deployment...")

        deployment = save_deployment(
            repo_url,
            docker_result,
            container_result
        )

        print("Deployment Saved:", deployment)

        # STEP 7 → Save Build Logs
        print("\n[STEP 7] Saving Build Logs...")

        build_logs_result = save_build_logs(
            deployment["id"],
            docker_result.get("logs", [])
        )

        print("Build Logs Saved:", build_logs_result)

        # STEP 8 → Save Container Logs
        print("\n[STEP 8] Saving Container Logs...")

        container_logs_result = save_container_logs(
            deployment["id"],
            container_result.get("logs", [])
        )

        print("Container Logs Saved:", container_logs_result)

        return jsonify({
            "success": True,
            "message": "Deployment Successful 🚀",
            "clone": clone_result,
            "framework": framework_result,
            "dockerfile": dockerfile_result,
            "docker": docker_result,
            "container": container_result,
            "deployment": deployment,
            "build_logs": build_logs_result,
            "container_logs": container_logs_result
        })

    except Exception as e:

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

        status_code = 200 if result["success"] else 400

        return jsonify(result), status_code

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

        status_code = 200 if result["success"] else 400

        return jsonify(result), status_code

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

        status_code = 200 if result["success"] else 400

        return jsonify(result), status_code

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