from flask import Flask, request, jsonify
from flask_cors import CORS
from services.git_service import clone_repository

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

    result = clone_repository(repo_url)

    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)