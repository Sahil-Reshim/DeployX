import os
from git import Repo

DEPLOYMENTS_FOLDER = "deployments"


def clone_repository(repo_url):

    repo_name = repo_url.split("/")[-1].replace(".git", "")

    clone_path = os.path.join(
        DEPLOYMENTS_FOLDER,
        repo_name
    )

    # Check if already exists
    if os.path.exists(clone_path):
        return {
            "success": False,
            "message": "Repository already exists"
        }

    try:
        # Clone Repository
        Repo.clone_from(repo_url, clone_path)

        return {
            "success": True,
            "message": "Repository cloned successfully",
            "repo_path": clone_path
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }