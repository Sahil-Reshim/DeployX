import docker
import os
import uuid
import time
import re

client = docker.from_env()


def detect_exposed_port(repo_path):
    """Read Dockerfile to find the EXPOSE port."""
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


def get_container_url(container, internal_port):
    """Reliably extract the host-mapped port from a running container."""
    try:
        container.reload()
        port_key = f"{internal_port}/tcp"
        port_bindings = container.attrs["NetworkSettings"]["Ports"].get(port_key)
        if port_bindings and len(port_bindings) > 0:
            host_port = port_bindings[0]["HostPort"]
            return host_port
    except Exception:
        pass
    return None


def build_docker_image(repo_path):
    dockerfile_path = os.path.join(repo_path, "Dockerfile")

    if not os.path.exists(dockerfile_path):
        return {
            "success": False,
            "message": "Dockerfile not found."
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
                line = log["stream"].strip()
                if line:
                    logs.append(line)
            elif "error" in log:
                logs.append(f"ERROR: {log['error'].strip()}")

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


def run_docker_container(image_name, repo_path=None):
    try:
        # Detect exposed port from Dockerfile
        internal_port = 3000  # fallback
        if repo_path:
            detected = detect_exposed_port(repo_path)
            if detected:
                internal_port = detected

        # Try multiple candidate ports if detection fails
        candidate_ports = []

        for port in [
            internal_port,
            5000,
            3000,
            5173,
            8000,
            8080
        ]:
            if port not in candidate_ports:
                candidate_ports.append(port)

        container = client.containers.run(
            image=image_name,
            detach=True,
            ports={f"{p}/tcp": None for p in candidate_ports},
            environment={"PORT": str(internal_port)},
        )

        # Wait for container to initialize
        for _ in range(10):
            time.sleep(1)
            container.reload()
            if container.status == "running":
                break

        if container.status != "running":
            raw_logs = container.logs(stdout=True, stderr=True, tail=50)
            logs = raw_logs.decode("utf-8", errors="ignore").splitlines()
            return {
                "success": False,
                "message": f"Container exited with status: {container.status}",
                "error": "\n".join(logs[-10:]),
                "logs": logs
            }

        # Find the mapped host port
        preferred_ports = [
            5000,
            3000,
            5173,
            8000,
            8080
        ]

        host_port = None

        for p in preferred_ports:
            host_port = get_container_url(container, p)

            if host_port:
                internal_port = p
                break
    
        if not host_port:
            container.remove(force=True)
            return {
                "success": False,
                "message": "Could not determine container port mapping",
                "logs": []
            }

        local_url = f"http://localhost:{host_port}"

        raw_logs = container.logs(stdout=True, stderr=True, tail=100)
        logs = raw_logs.decode("utf-8", errors="ignore").splitlines()

        return {
            "success": True,
            "message": "Container started successfully",
            "container_id": container.short_id,
            "port": host_port,
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