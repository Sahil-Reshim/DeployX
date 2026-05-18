from datetime import datetime
from database import get_db_connection


def create_deployment(repo_url):

    conn = get_db_connection()
    cursor = conn.cursor()

    created_at = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    cursor.execute("""
    INSERT INTO deployments (
        repo_url,
        status,
        created_at
    )
    VALUES (?, ?, ?)
    """, (
        repo_url,
        "queued",
        created_at
    ))

    conn.commit()

    deployment_id = cursor.lastrowid

    conn.close()

    return {
        "id": deployment_id
    }


def update_deployment_step(
    deployment_id,
    status
):

    conn = get_db_connection()

    conn.execute("""
    UPDATE deployments
    SET status = ?
    WHERE id = ?
    """, (
        status,
        deployment_id
    ))

    conn.commit()
    conn.close()


def complete_deployment(
    deployment_id,
    framework_result,
    docker_result,
    container_result
):

    conn = get_db_connection()

    conn.execute("""
    UPDATE deployments
    SET
        framework = ?,
        image_name = ?,
        image_id = ?,
        container_id = ?,
        port = ?,
        url = ?,
        status = ?
    WHERE id = ?
    """, (
        framework_result.get("framework"),
        docker_result.get("image_name"),
        docker_result.get("image_id"),
        container_result.get("container_id"),
        container_result.get("port"),
        container_result.get("url"),
        "live",
        deployment_id
    ))

    conn.commit()
    conn.close()


def fail_deployment(
    deployment_id,
    status="failed"
):

    conn = get_db_connection()

    conn.execute("""
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