import os
from git import Repo

DEPLOYMENTS_FOLDER = "deployments"

def clone_repository(repo_url):
    repo_name = repo_url.split("/")[-1].replace(".git", "")

    clone_path = os.path.join(DEPLOYMENTS_FOLDER, repo_name)

    if os.path.exists(clone_path):
        return {
            "status": "error",
            "message": "Repository already exists"
        }

    Repo.clone_from(repo_url, clone_path)

    return {
        "status": "success",
        "message": "Repository cloned successfully",
        "path": clone_path
    }