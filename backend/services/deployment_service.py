from datetime import datetime
from database import get_db_connection
from services.monitor_service import start_monitoring
from managers.state_manager import (
    remove_state
)

from sockets.socket_manager import (
    emit_deployment_started,
    emit_deployment_stopped,
    emit_deployment_restarted
)

from services.docker_service import (
    stop_container
)

from services.monitor_service import (
    start_monitoring,
    stop_monitoring
)

from services.cleanup_service import (
    remove_container,
    remove_image
)

from managers.state_manager import (
    set_state,
    get_state,
    update_state
)

from services.docker_service import (
    stop_container,
    start_container
)

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

    # NEW: Register runtime state

    set_state(
        str(deployment_id),
        {
            "container_id": container_result.get(
                "container_id"
            ),

            "status": "running",

            "internal_port":
            container_result.get(
                "internal_port"
            ),
            "public_port": container_result.get(
                "port"
            ),

            "monitoring_active": True,
            "log_streaming": True
        }
    )

    # Existing monitoring

    start_monitoring(
        deployment_id,
        container_result.get(
            "container_id"
        )
    )

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
    
def get_deployment_by_id(deployment_id):

    conn = get_db_connection()

    deployment = conn.execute("""
        SELECT * FROM deployments
        WHERE id = ?
    """, (
        deployment_id,
    )).fetchone()

    conn.close()

    if deployment:
        return dict(deployment)

    return None

def stop_deployment(
    deployment_id
):

    state = get_state(
        str(deployment_id)
    )

    if not state:

        return {
            "success": False,
            "message": "Deployment not found"
        }

    result = stop_container(
        state["container_id"]
    )

    if not result["success"]:

        return result

    update_deployment_status(
        deployment_id,
        "stopped"
    )

    update_state(
        str(deployment_id),
        {
            "status": "stopped",
            "monitoring_active": False,
            "log_streaming": False
        }
    )

    emit_deployment_stopped(
        deployment_id
    )

    return {
        "success": True,
        "message": "Deployment stopped"
    }
    
def start_deployment(
    deployment_id
):

    state = get_state(
        str(deployment_id)
    )

    if not state:

        return {
            "success": False,
            "message": "Deployment not found"
        }

    result = start_container(
        state["container_id"]
    )

    if not result["success"]:

        return result

    update_deployment_status(
        deployment_id,
        "running"
    )

    update_state(
        str(deployment_id),
        {
            "status": "running",
            "monitoring_active": True,
            "log_streaming": True
        }
    )

    start_monitoring(
        deployment_id,
        state["container_id"]
    )

    emit_deployment_started(
        deployment_id
    )

    return {
        "success": True,
        "message": "Deployment started"
    }

def restart_deployment(
    deployment_id
):

    update_deployment_status(
        deployment_id,
        "restarting"
    )

    update_state(
        str(deployment_id),
        {
            "status":"restarting"
        }
    )

    stop_result = stop_deployment(
        deployment_id
    )

    if not stop_result["success"]:
        return stop_result

    start_result = start_deployment(
        deployment_id
    )

    if not start_result["success"]:
        return start_result

    emit_deployment_restarted(
        deployment_id
    )

    return {
        "success": True,
        "message": "Deployment restarted"
    }
    
def delete_deployment_lifecycle(
    deployment_id
):

    deployment = get_deployment_by_id(
        deployment_id
    )

    if not deployment:

        return {
            "success": False,
            "message": "Deployment not found"
        }

    stop_monitoring(
        deployment_id
    )

    container_id = deployment.get(
        "container_id"
    )

    image_name = deployment.get(
        "image_name"
    )

    if container_id:

        remove_container(
            container_id
        )

    if image_name:

        remove_image(
            image_name
        )

    remove_state(
        str(deployment_id)
    )

    return {
        "success": True,
        "message":"Lifecycle cleanup completed"
    }