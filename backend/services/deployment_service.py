from datetime import datetime

deployments = []


def save_deployment(repo_url, docker_result, container_result):
    deployment = {
        "id": len(deployments) + 1,
        "repo_url": repo_url,
        "image_name": docker_result.get("image_name"),
        "image_id": docker_result.get("image_id"),
        "container_id": container_result.get("container_id"),
        "port": container_result.get("port"),
        "url": container_result.get("url"),
        "status": "running" if container_result.get("success") else "failed",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    deployments.append(deployment)

    return deployment


def get_all_deployments():
    return deployments