import docker
import os
import uuid
import time
import re
import threading

from sockets.socket_manager import emit_log

client = docker.from_env()


# =========================================================
# DETECT EXPOSED PORT
# =========================================================

def detect_exposed_port(repo_path):

    dockerfile_path = os.path.join(
        repo_path,
        "Dockerfile"
    )

    if not os.path.exists(dockerfile_path):
        return None

    try:

        with open(
            dockerfile_path,
            "r",
            encoding="utf-8"
        ) as f:

            content = f.read()

        matches = re.findall(
            r"EXPOSE\s+(\d+)",
            content,
            re.IGNORECASE
        )

        if matches:
            return int(matches[-1])

    except Exception:
        pass

    return None


# =========================================================
# BUILD IMAGE
# =========================================================

def build_docker_image(
    repo_path,
    deployment_id
):

    dockerfile_path = os.path.join(
        repo_path,
        "Dockerfile"
    )

    if not os.path.exists(dockerfile_path):

        return {
            "success": False,
            "message": "Dockerfile not found."
        }

    image_name = (
        f"deployx-app-{uuid.uuid4().hex[:8]}"
    )

    try:

        build_logs = client.api.build(
            path=repo_path,
            tag=image_name,
            rm=True,
            decode=True
        )

        logs = []

        for log in build_logs:

            if "stream" in log:

                line = log["stream"].strip()

                if line:

                    logs.append(line)

                    emit_log(
                        deployment_id,
                        line
                    )

            elif "error" in log:

                error_line = (
                    f"ERROR: {log['error']}"
                )

                logs.append(error_line)

                emit_log(
                    deployment_id,
                    error_line
                )

        image = client.images.get(
            image_name
        )

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
            "error": str(e),
            "logs": []
        }


# =========================================================
# LOG STREAMING
# =========================================================

def stream_container_logs(
    container,
    deployment_id
):

    try:

        for line in container.logs(
            stream=True
        ):

            decoded = line.decode(
                "utf-8",
                errors="ignore"
            ).strip()

            if decoded:

                emit_log(
                    deployment_id,
                    decoded
                )

    except Exception as e:

        emit_log(
            deployment_id,
            f"Log stream error: {str(e)}"
        )


# =========================================================
# RUN CONTAINER
# =========================================================

def run_docker_container(
    image_name,
    deployment_id,
    assigned_port,
    repo_path=None
):

    try:

        internal_port = 3000

        if repo_path:

            detected = detect_exposed_port(
                repo_path
            )

            if detected:
                internal_port = detected

        container = client.containers.run(
            image=image_name,
            detach=True,

            ports={
                f"{internal_port}/tcp":
                assigned_port
            },

            environment={
                "PORT": str(
                    internal_port
                )
            }
        )

        # Wait for startup

        for _ in range(10):

            time.sleep(1)

            container.reload()

            if container.status == "running":
                break

        if container.status != "running":

            raw_logs = container.logs(
                stdout=True,
                stderr=True,
                tail=50
            )

            logs = raw_logs.decode(
                "utf-8",
                errors="ignore"
            ).splitlines()

            return {
                "success": False,
                "message": f"Container exited with status: {container.status}",
                "error": "\n".join(
                    logs[-10:]
                ),
                "logs": logs
            }

        threading.Thread(
            target=stream_container_logs,
            args=(
                container,
                deployment_id
            ),
            daemon=True
        ).start()

        local_url = (
            f"http://localhost:{assigned_port}"
        )

        raw_logs = container.logs(
            stdout=True,
            stderr=True,
            tail=100
        )

        logs = raw_logs.decode(
            "utf-8",
            errors="ignore"
        ).splitlines()

        return {
            "success": True,

            "message":
            "Container started successfully",

            "container_id":
            container.id,

            "port":
            assigned_port,

            "assigned_port":
            assigned_port,

            "internal_port":
            internal_port,

            "url":
            local_url,

            "local_url":
            local_url,

            "logs":
            logs
        }

    except Exception as e:

        return {
            "success": False,
            "message":
            "Container failed to start",
            "error": str(e),
            "logs": []
        }


# =========================================================
# STOP CONTAINER
# =========================================================

def stop_container(
    container_id
):

    try:

        container = client.containers.get(
            container_id
        )

        container.stop()

        return {
            "success": True,
            "message": "Container stopped"
        }

    except Exception as e:

        return {
            "success": False,
            "message": str(e)
        }


# =========================================================
# START CONTAINER
# =========================================================

def start_container(
    container_id
):

    try:

        container = client.containers.get(
            container_id
        )

        container.start()

        return {
            "success": True,
            "message": "Container started"
        }

    except Exception as e:

        return {
            "success": False,
            "message": str(e)
        }