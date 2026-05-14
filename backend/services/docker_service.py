import docker
import os
import uuid

client = docker.from_env()


def build_docker_image(repo_path):
    dockerfile_path = os.path.join(repo_path, "Dockerfile")

    if not os.path.exists(dockerfile_path):
        return {
            "success": False,
            "message": "Dockerfile not found. Only Dockerfile-based repos are supported now."
        }

    image_name = f"deployx-app-{uuid.uuid4().hex[:8]}"

    try:
        image, build_logs = client.images.build(
            path=repo_path,
            tag=image_name,
            rm=True
        )

        logs = []
        for log in build_logs:
            if "stream" in log:
                logs.append(log["stream"].strip())

        return {
            "success": True,
            "message": "Docker image built successfully",
            "image_name": image_name,
            "image_id": image.short_id,
            "logs": logs
        }

    except Exception as e:
        return {
            "success": False,
            "message": "Docker image build failed",
            "error": str(e)
        }


def run_docker_container(image_name):
    try:
        container = client.containers.run(
            image=image_name,
            detach=True,
            ports={
                "5000/tcp": None
            }
        )

        container.reload()

        assigned_port = container.attrs["NetworkSettings"]["Ports"]["5000/tcp"][0]["HostPort"]

        return {
            "success": True,
            "message": "Container started successfully",
            "container_id": container.short_id,
            "port": assigned_port,
            "url": f"http://localhost:{assigned_port}"
        }

    except Exception as e:
        return {
            "success": False,
            "message": "Container failed to start",
            "error": str(e)
        }