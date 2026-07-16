# =========================================================
# DOCKER SERVICE
# ---------------------------------------------------------
# Responsibilities:
#   - Build Docker images from repository code
#   - Run containers with proper port mapping
#   - Stream container logs to the frontend via WebSocket
#   - Stop / start existing containers
#
# Key fix: The internal_port is now passed explicitly from
# the framework detector so we don't hardcode 3000.
# =========================================================

import docker
import os
import uuid
import time
import re
import threading

from sockets.socket_manager import emit_log

client = docker.from_env()


# =========================================================
# DETECT EXPOSED PORT (from Dockerfile)
# =========================================================

def detect_exposed_port(repo_path):
    """
    Scan the repository's Dockerfile for an EXPOSE directive.
    Returns the last exposed port number, or None if not found.
    """

    dockerfile_path = os.path.join(repo_path, "Dockerfile")

    if not os.path.exists(dockerfile_path):
        return None

    try:
        with open(dockerfile_path, "r", encoding="utf-8") as f:
            content = f.read()

        matches = re.findall(r"EXPOSE\s+(\d+)", content, re.IGNORECASE)

        if matches:
            return int(matches[-1])

    except Exception:
        pass

    return None


# =========================================================
# BUILD DOCKER IMAGE
# =========================================================

def build_docker_image(repo_path, deployment_id):
    """
    Build a Docker image from the repository path.
    Emits build logs to the frontend in real-time.
    Returns the image name and ID on success.
    """

    dockerfile_path = os.path.join(repo_path, "Dockerfile")

    if not os.path.exists(dockerfile_path):
        return {
            "success": False,
            "message": "Dockerfile not found in repository."
        }

    # Unique image name per deployment
    image_name = f"deployx-app-{uuid.uuid4().hex[:8]}"

    try:
        build_logs = client.api.build(
            path=repo_path,
            tag=image_name,
            rm=True,          # Remove intermediate containers
            decode=True       # Stream JSON-encoded logs
        )

        logs = []

        for log in build_logs:
            if "stream" in log:
                line = log["stream"].strip()
                if line:
                    logs.append(line)
                    emit_log(deployment_id, line)

            elif "error" in log:
                error_line = f"ERROR: {log['error']}"
                logs.append(error_line)
                emit_log(deployment_id, error_line)

        # Verify the image was created
        image = client.images.get(image_name)

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
# STREAM CONTAINER LOGS (background thread)
# =========================================================

def stream_container_logs(container, deployment_id):
    """
    Run in a daemon thread. Continuously reads stdout/stderr
    from the container and emits each line to the frontend.
    """

    try:
        for line in container.logs(stream=True):
            decoded = line.decode("utf-8", errors="ignore").strip()
            if decoded:
                emit_log(deployment_id, decoded)

    except Exception as e:
        emit_log(deployment_id, f"Log stream error: {str(e)}")


# =========================================================
# RUN DOCKER CONTAINER
# =========================================================

def run_docker_container(
    image_name,
    deployment_id,
    assigned_port,
    repo_path=None,
    internal_port=None       # <-- NEW: passed from framework detector
):
    """
    Create and start a Docker container from the built image.

    Parameters
    ----------
    image_name : str       — Docker image tag
    deployment_id : int    — database ID for log streaming
    assigned_port : int    — host port to bind (from port_allocator)
    repo_path : str | None — used to detect port from Dockerfile
    internal_port : int | None — port the app listens on inside the
                                 container (detected by framework detector)

    Returns
    -------
    dict with keys: success, message, container_id, port, url, logs
    """

    try:
        # --- Determine the internal container port ---
        # Priority: 1) explicit argument, 2) Dockerfile EXPOSE, 3) fallback 3000
        if internal_port is None:
            if repo_path:
                internal_port = detect_exposed_port(repo_path)
            if internal_port is None:
                internal_port = 3000  # safe fallback

        # --- Run the container ---
        container = client.containers.run(
            image=image_name,
            detach=True,
            ports={f"{internal_port}/tcp": assigned_port},
            environment={"PORT": str(internal_port)}
        )

        # --- Wait briefly for the container to start ---
        for _ in range(10):
            time.sleep(1)
            container.reload()
            if container.status == "running":
                break

        # --- If the container exited immediately, report the error ---
        if container.status != "running":
            raw_logs = container.logs(stdout=True, stderr=True, tail=50)
            logs = raw_logs.decode("utf-8", errors="ignore").splitlines()

            return {
                "success": False,
                "message": f"Container exited with status: {container.status}",
                "error": "\n".join(logs[-10:]),
                "logs": logs
            }

        # --- Start background log streaming ---
        threading.Thread(
            target=stream_container_logs,
            args=(container, deployment_id),
            daemon=True
        ).start()

        # --- Build response ---
        local_url = f"http://localhost:{assigned_port}"

        raw_logs = container.logs(stdout=True, stderr=True, tail=100)
        logs = raw_logs.decode("utf-8", errors="ignore").splitlines()

        return {
            "success": True,
            "message": "Container started successfully",
            "container_id": container.id,
            "port": assigned_port,
            "assigned_port": assigned_port,
            "internal_port": internal_port,
            "url": local_url,
            "local_url": local_url,
            "logs": logs
        }

    except Exception as e:
        return {
            "success": False,
            "message": "Container failed to start",
            "error": str(e),
            "logs": []
        }


# =========================================================
# STOP CONTAINER
# =========================================================

def stop_container(container_id):
    """
    Gracefully stop a running container by its Docker ID.
    """

    try:
        container = client.containers.get(container_id)
        container.stop()
        return {"success": True, "message": "Container stopped"}

    except Exception as e:
        return {"success": False, "message": str(e)}


# =========================================================
# START CONTAINER
# =========================================================

def start_container(container_id):
    """
    Restart a previously stopped container.
    """

    try:
        container = client.containers.get(container_id)
        container.start()
        return {"success": True, "message": "Container started"}

    except Exception as e:
        return {"success": False, "message": str(e)}