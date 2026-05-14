from database import init_db
from flask import Flask, request, jsonify
from flask_cors import CORS

from services.git_service import clone_repository
from services.docker_service import (
    build_docker_image,
    run_docker_container
)
from services.deployment_service import (
    save_deployment,
    get_all_deployments
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

        # =====================================================
        # STEP 1 → Clone Repository
        # =====================================================

        print("\n[STEP 1] Cloning Repository...")

        clone_result = clone_repository(repo_url)

        print("Clone Result:", clone_result)

        if not clone_result["success"]:

            return jsonify({
                "success": False,
                "step": "clone_repository",
                "error": clone_result.get(
                    "message",
                    "Repository cloning failed"
                ),
                "details": clone_result
            }), 400

        # =====================================================
        # STEP 2 → Build Docker Image
        # =====================================================

        print("\n[STEP 2] Building Docker Image...")

        docker_result = build_docker_image(
            clone_result["repo_path"]
        )

        print("Docker Result:", docker_result)

        if not docker_result["success"]:

            return jsonify({
                "success": False,
                "step": "docker_build",
                "error": docker_result.get(
                    "message",
                    "Docker image build failed"
                ),
                "details": docker_result
            }), 400

        # =====================================================
        # STEP 3 → Run Docker Container
        # =====================================================

        print("\n[STEP 3] Running Docker Container...")

        container_result = run_docker_container(
            docker_result["image_name"]
        )

        print("Container Result:", container_result)

        if not container_result["success"]:

            return jsonify({
                "success": False,
                "step": "container_runtime",
                "error": container_result.get(
                    "message",
                    "Container startup failed"
                ),
                "details": container_result
            }), 400

        # =====================================================
        # STEP 4 → Save Deployment
        # =====================================================

        print("\n[STEP 4] Saving Deployment...")

        deployment = save_deployment(
            repo_url,
            docker_result,
            container_result
        )

        print("Deployment Saved:", deployment)

        # =====================================================
        # SUCCESS RESPONSE
        # =====================================================

        return jsonify({

            "success": True,

            "message":
            "Deployment Successful 🚀",

            "clone":
            clone_result,

            "docker":
            docker_result,

            "container":
            container_result,

            "deployment":
            deployment

        })

    except Exception as e:

        print("\n========== DEPLOY ERROR ==========")
        print(str(e))

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


if __name__ == "__main__":

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )