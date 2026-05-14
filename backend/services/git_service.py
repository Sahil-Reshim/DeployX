import os
import shutil
import uuid

from git import Repo


BASE_DIR = "deployments"


def clone_repository(repo_url):

    try:

        if not os.path.exists(BASE_DIR):
            os.makedirs(BASE_DIR)

        unique_name = str(uuid.uuid4())[:8]

        repo_path = os.path.join(
            BASE_DIR,
            unique_name
        )

        Repo.clone_from(
            repo_url,
            repo_path
        )

        return {
            "success": True,
            "repo_path": repo_path,
            "repo_name": unique_name
        }

    except Exception as e:

        return {
            "success": False,
            "message": str(e)
        }