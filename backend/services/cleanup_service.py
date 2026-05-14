import docker
import shutil
import os
import stat

client = docker.from_env()


def remove_container(container_id):
    try:

        if not container_id:
            return {
                "success": False,
                "message": "No container ID provided"
            }

        container = client.containers.get(container_id)

        container.remove(force=True)

        return {
            "success": True,
            "message": "Container removed successfully"
        }

    except Exception as e:

        return {
            "success": False,
            "message": str(e)
        }


def remove_image(image_name):
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

    except Exception as e:

        return {
            "success": False,
            "message": str(e)
        }


def handle_remove_readonly(func, path, exc_info):

    os.chmod(path, stat.S_IWRITE)

    func(path)


def remove_repo_folder(repo_path):
    try:

        if not repo_path:
            return {
                "success": False,
                "message": "No repo path provided"
            }

        if os.path.exists(repo_path):

            shutil.rmtree(
                repo_path,
                onerror=handle_remove_readonly
            )

            return {
                "success": True,
                "message": "Repository folder removed successfully"
            }

        return {
            "success": False,
            "message": "Repository folder does not exist"
        }

    except Exception as e:

        return {
            "success": False,
            "message": str(e)
        }