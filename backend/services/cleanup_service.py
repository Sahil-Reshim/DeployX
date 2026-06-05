import docker
import shutil
import os
import stat

from services.proxy_manager import (
    delete_route,
    reload_proxy
)

client = docker.from_env()


# =========================================================
# CLEANUP PROXY ROUTE
# =========================================================

def cleanup_proxy_route(
    subdomain
):
    try:

        if not subdomain:

            return {
                "success": False,
                "message": "No subdomain provided"
            }

        delete_route(
            subdomain
        )

        reload_proxy()

        return {
            "success": True,
            "message": "Proxy route removed successfully"
        }

    except Exception as e:

        return {
            "success": False,
            "message": str(e)
        }


# =========================================================
# REMOVE CONTAINER
# =========================================================

def remove_container(
    container_id
):
    try:

        if not container_id:

            return {
                "success": False,
                "message": "No container ID provided"
            }

        container = client.containers.get(
            container_id
        )

        container.remove(
            force=True
        )

        return {
            "success": True,
            "message": "Container removed successfully"
        }

    except docker.errors.NotFound:

        return {
            "success": True,
            "message": "Container already removed"
        }

    except Exception as e:

        return {
            "success": False,
            "message": str(e)
        }


# =========================================================
# REMOVE IMAGE
# =========================================================

def remove_image(
    image_name
):
    try:

        if not image_name:

            return {
                "success": False,
                "message": "No image name provided"
            }

        client.images.remove(
            image=image_name,
            force=True
        )

        return {
            "success": True,
            "message": "Image removed successfully"
        }

    except docker.errors.ImageNotFound:

        return {
            "success": True,
            "message": "Image already removed"
        }

    except Exception as e:

        return {
            "success": False,
            "message": str(e)
        }


# =========================================================
# HANDLE WINDOWS READONLY FILES
# =========================================================

def handle_remove_readonly(
    func,
    path,
    exc_info
):

    os.chmod(
        path,
        stat.S_IWRITE
    )

    func(path)


# =========================================================
# REMOVE REPOSITORY FOLDER
# =========================================================

def remove_repo_folder(
    repo_path
):
    try:

        if not repo_path:

            return {
                "success": False,
                "message": "No repo path provided"
            }

        if not os.path.exists(
            repo_path
        ):

            return {
                "success": True,
                "message": "Repository folder already removed"
            }

        shutil.rmtree(
            repo_path,
            onerror=handle_remove_readonly
        )

        return {
            "success": True,
            "message": "Repository folder removed successfully"
        }

    except Exception as e:

        return {
            "success": False,
            "message": str(e)
        }