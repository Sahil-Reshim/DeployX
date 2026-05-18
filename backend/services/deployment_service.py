from datetime import datetime
from database import get_db_connection


def save_deployment(
    repo_url,
    framework_result,
    docker_result,
    container_result
):

    conn = get_db_connection()
    cursor = conn.cursor()

    status = (
        "live"
        if container_result.get("success")
        else "failed"
    )

    created_at = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    framework = framework_result.get(
        "framework"
    )

    cursor.execute("""
    INSERT INTO deployments (
        repo_url,
        framework,
        image_name,
        image_id,
        container_id,
        port,
        url,
        status,
        created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        repo_url,
        framework,
        docker_result.get("image_name"),
        docker_result.get("image_id"),
        container_result.get("container_id"),
        container_result.get("port"),
        container_result.get("url"),
        status,
        created_at
    ))

    conn.commit()

    deployment_id = cursor.lastrowid

    conn.close()

    return {
        "id": deployment_id,
        "repo_url": repo_url,
        "framework": framework,
        "image_name": docker_result.get("image_name"),
        "image_id": docker_result.get("image_id"),
        "container_id": container_result.get("container_id"),
        "port": container_result.get("port"),
        "url": container_result.get("url"),
        "local_url": container_result.get("local_url"),
        "status": status,
        "created_at": created_at
    }
    
def create_pending_deployment(repo_url):

    conn = get_db_connection()
    cursor = conn.cursor()

    created_at = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    cursor.execute("""
    INSERT INTO deployments (
        repo_url,
        framework,
        image_name,
        image_id,
        container_id,
        port,
        url,
        status,
        created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        repo_url,
        None,
        None,
        None,
        None,
        None,
        None,
        "queued",
        created_at
    ))

    conn.commit()

    deployment_id = cursor.lastrowid

    conn.close()

    return deployment_id


def update_deployment_status(deployment_id, status):

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE deployments
        SET status = ?
        WHERE id = ?
    """, (
        status,
        deployment_id
    ))

    conn.commit()
    conn.close()


def get_all_deployments():

    conn = get_db_connection()

    deployments = conn.execute("""
        SELECT * FROM deployments
        ORDER BY id DESC
    """).fetchall()

    conn.close()

    return [
        dict(deployment)
        for deployment in deployments
    ]
    

