from flask import Flask, request, jsonify
from flask_cors import CORS

from services.git_service import clone_repository
from services.docker_service import build_docker_image, run_docker_container

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return {
        "message": "DeployX Backend Running",
        "role": "DevOps Backend"
    }


@app.route("/deploy", methods=["POST"])
def deploy():

    data = request.get_json()

    repo_url = data.get("repo_url")

    if not repo_url:
        return jsonify({
            "status": "error",
            "message": "GitHub repo URL is required"
        }), 400

    # STEP 1 → Clone Repository
    clone_result = clone_repository(repo_url)

    if not clone_result["success"]:
        return jsonify(clone_result), 400

    # STEP 2 → Build Docker Image
    docker_result = build_docker_image(
        clone_result["repo_path"]
    )

    if not docker_result["success"]:
        return jsonify({
            "clone": clone_result,
            "docker": docker_result
        }), 400

    # STEP 3 → Run Docker Container
    container_result = run_docker_container(
        docker_result["image_name"]
    )

    return jsonify({
        "clone": clone_result,
        "docker": docker_result,
        "container": container_result
    })


if __name__ == "__main__":
    app.run(debug=True)