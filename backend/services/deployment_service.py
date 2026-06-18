import json
from datetime import datetime

from database import get_db_connection


from managers.state_manager import (
    set_state,
    get_state,
    update_state,
    remove_state
)

from sockets.socket_manager import (
    emit_deployment_started,
    emit_deployment_stopped,
    emit_deployment_restarted,
    emit_deployment_update,
)

from services.monitor_service import (
    start_monitoring,
    stop_monitoring
)

from services.cleanup_service import (
    remove_container,
    remove_image
)

from services.docker_service import (
    stop_container,
    start_container
)

from services.proxy_manager import (
    delete_route,
    reload_proxy
)

from services.port_allocator import (
    release_port
)


def serialize_deployment(row):
    """
    Normalize a deployment row dict for API responses and sockets.
    Ensures Jenkins fields are always present with safe defaults.
    """

    if not row:
        return None

    d = dict(row)

    raw_stages = d.get("jenkins_stages")
    if isinstance(raw_stages, str) and raw_stages:
        try:
            d["jenkins_stages"] = json.loads(raw_stages)
        except (TypeError, json.JSONDecodeError):
            d["jenkins_stages"] = []
    elif not isinstance(d.get("jenkins_stages"), list):
        d["jenkins_stages"] = []

    d.setdefault("jenkins_status", None)
    d.setdefault("jenkins_build_number", None)
    d.setdefault("current_step", None)
    d.setdefault("status", "queued")
    d.setdefault("url", None)
    d.setdefault("container_id", None)

    return d


def create_deployment(repo_url):

    conn = get_db_connection()
    cursor = conn.cursor()

    created_at = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    cursor.execute(
        """
        INSERT INTO deployments (
            repo_url,
            status,
            created_at
        )
        VALUES (?, ?, ?)
        """,
        (
            repo_url,
            "queued",
            created_at
        )
    )

    conn.commit()

    deployment_id = cursor.lastrowid

    conn.close()

    return {
        "id": deployment_id
    }


# =========================================================
# UPDATE STATUS
# =========================================================

def update_deployment_status(
    deployment_id,
    status
):
    conn = get_db_connection()

    conn.execute(
        """
        UPDATE deployments
        SET status=?
        WHERE id=?
        """,
        (
            status,
            deployment_id
        )
    )

    conn.commit()
    conn.close()


# =========================================================
# UPDATE STEP
# =========================================================

def update_deployment_step(
    deployment_id,
    status
):
    conn = get_db_connection()

    conn.execute(
        """
        UPDATE deployments
        SET current_step=?,
            status=?
        WHERE id=?
        """,
        (
            status,
            status,
            deployment_id
        )
    )

    conn.commit()
    conn.close()

# =========================================================
# SAVE JENKINS QUEUE
# =========================================================

def save_jenkins_queue(
    deployment_id,
    queue_id
):
    conn = get_db_connection()

    conn.execute(
        """
        UPDATE deployments
        SET
            jenkins_queue_id=?,
            jenkins_status=?
        WHERE id=?
        """,
        (
            queue_id,
            "QUEUED",
            deployment_id
        )
    )

    conn.commit()
    conn.close()


# =========================================================
# SAVE JENKINS BUILD NUMBER
# =========================================================

def save_jenkins_build_number(
    deployment_id,
    build_number
):
    conn = get_db_connection()

    conn.execute(
        """
        UPDATE deployments
        SET
            jenkins_build_number=?,
            jenkins_status=?
        WHERE id=?
        """,
        (
            build_number,
            "BUILDING",
            deployment_id
        )
    )

    conn.commit()
    conn.close()


# =========================================================
# UPDATE JENKINS STATUS
# =========================================================

def update_jenkins_status(
    deployment_id,
    status
):
    conn = get_db_connection()

    conn.execute(
        """
        UPDATE deployments
        SET jenkins_status=?
        WHERE id=?
        """,
        (
            status,
            deployment_id
        )
    )

    conn.commit()
    conn.close()


# =========================================================
# SAVE JENKINS STAGES   ← NEW
# =========================================================

def save_jenkins_stages(
    deployment_id,
    stages,
    current_stage=None
):
    """
    Persists the latest Jenkins stage list and active stage
    to the database so the API can return them on page reload.

    stages   : list of dicts  [{"name": ..., "status": ...}, ...]
    current_stage : str | None  — the stage currently IN_PROGRESS
    """

    conn = get_db_connection()

    if stages:
        conn.execute(
            """
            UPDATE deployments
            SET
                jenkins_stages=?,
                current_step=?
            WHERE id=?
            """,
            (
                json.dumps(stages),
                current_stage,
                deployment_id
            )
        )
    elif current_stage is not None:
        conn.execute(
            """
            UPDATE deployments
            SET current_step=?
            WHERE id=?
            """,
            (
                current_stage,
                deployment_id
            )
        )

    conn.commit()
    conn.close()


# =========================================================
# SAVE TEST RESULTS
# =========================================================

def save_test_results(
    deployment_id,
    total,
    passed,
    failed
):
    conn = get_db_connection()

    conn.execute(
        """
        UPDATE deployments
        SET
            test_count=?,
            passed_tests=?,
            failed_tests=?
        WHERE id=?
        """,
        (
            total,
            passed,
            failed,
            deployment_id
        )
    )

    conn.commit()
    conn.close()


# =========================================================
# SAVE JENKINS CONSOLE LOG
# =========================================================

def save_console_log(
    deployment_id,
    log_text
):
    conn = get_db_connection()

    conn.execute(
        """
        UPDATE deployments
        SET jenkins_console_log=?
        WHERE id=?
        """,
        (
            log_text,
            deployment_id
        )
    )

    conn.commit()
    conn.close()


# =========================================================
# PIPELINE STARTED
# =========================================================

def mark_pipeline_started(
    deployment_id
):
    conn = get_db_connection()

    conn.execute(
        """
        UPDATE deployments
        SET pipeline_started_at=?
        WHERE id=?
        """,
        (
            datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
            deployment_id
        )
    )

    conn.commit()
    conn.close()


# =========================================================
# PIPELINE FINISHED
# =========================================================

def mark_pipeline_finished(
    deployment_id
):
    conn = get_db_connection()

    conn.execute(
        """
        UPDATE deployments
        SET pipeline_finished_at=?
        WHERE id=?
        """,
        (
            datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
            deployment_id
        )
    )

    conn.commit()
    conn.close()


# =========================================================
# UPDATE PIPELINE STAGE
# =========================================================

def update_pipeline_stage(
    deployment_id,
    stage
):
    conn = get_db_connection()

    conn.execute(
        """
        UPDATE deployments
        SET current_step=?
        WHERE id=?
        """,
        (
            stage,
            deployment_id
        )
    )

    conn.commit()
    conn.close()

# =========================================================
# COMPLETE DEPLOYMENT
# =========================================================

def complete_deployment(
    deployment_id,
    framework_result,
    docker_result,
    container_result
):

    conn = get_db_connection()

    conn.execute(
        """
        UPDATE deployments
        SET
            framework=?,
            image_name=?,
            image_id=?,
            container_id=?,

            port=?,
            assigned_port=?,

            subdomain=?,
            custom_url=?,

            url=?,
            local_url=?,

            status=?,
            current_step=?

        WHERE id=?
        """,
        (
            framework_result.get(
                "framework"
            ),

            docker_result.get(
                "image_name"
            ),

            docker_result.get(
                "image_id"
            ),

            container_result.get(
                "container_id"
            ),

            container_result.get(
                "port"
            ),

            container_result.get(
                "assigned_port"
            ),

            container_result.get(
                "subdomain"
            ),

            container_result.get(
                "custom_url"
            ),

            container_result.get(
                "url"
            ),

            container_result.get(
                "local_url"
            ),

            "running",
            "running",

            deployment_id
        )
    )

    conn.commit()
    conn.close()

    # Runtime state

    set_state(
        str(deployment_id),
        {
            "container_id": container_result.get(
                "container_id"
            ),

            "status": "running",

            "internal_port": container_result.get(
                "internal_port"
            ),

            "public_port": container_result.get(
                "assigned_port"
            ),

            "assigned_port": container_result.get(
                "assigned_port"
            ),

            "subdomain": container_result.get(
                "subdomain"
            ),

            "custom_url": container_result.get(
                "custom_url"
            ),

            "monitoring_active": True,

            "log_streaming": True
        }
    )

    start_monitoring(
        deployment_id,
        container_result.get(
            "container_id"
        )
    )


# =========================================================
# FAIL DEPLOYMENT
# =========================================================

def fail_deployment(
    deployment_id,
    status="failed"
):
    conn = get_db_connection()

    conn.execute(
        """
        UPDATE deployments
        SET
            status=?,
            current_step=?
        WHERE id=?
        """,
        (
            status,
            status,
            deployment_id
        )
    )

    conn.commit()
    conn.close()


# =========================================================
# GET ALL DEPLOYMENTS
# =========================================================

def get_all_deployments():

    conn = get_db_connection()

    deployments = conn.execute(
        """
        SELECT *
        FROM deployments
        ORDER BY id DESC
        """
    ).fetchall()

    conn.close()

    result = []

    for row in deployments:
        result.append(serialize_deployment(row))

    return result


# =========================================================
# GET ONE DEPLOYMENT
# =========================================================

def get_deployment_by_id(
    deployment_id
):

    conn = get_db_connection()

    deployment = conn.execute(
        """
        SELECT *
        FROM deployments
        WHERE id=?
        """,
        (
            deployment_id,
        )
    ).fetchone()

    conn.close()

    if not deployment:
        return None

    return serialize_deployment(deployment)


# =========================================================
# STOP
# =========================================================

def stop_deployment(
    deployment_id
):

    state = get_state(
        str(deployment_id)
    )

    if not state:

        deployment = get_deployment_by_id(
            deployment_id
        )

        if (
            deployment and
            deployment.get("container_id")
        ):

            state = {
                "container_id": deployment.get(
                    "container_id"
                ),
                "status": deployment.get(
                    "status",
                    "running"
                ),
                "internal_port": None,
                "public_port": deployment.get(
                    "assigned_port"
                ),
                "assigned_port": deployment.get(
                    "assigned_port"
                ),
                "subdomain": deployment.get(
                    "subdomain"
                ),
                "custom_url": deployment.get(
                    "custom_url"
                ),
                "monitoring_active": True,
                "log_streaming": True,
            }

            set_state(
                str(deployment_id),
                state
            )

        else:

            return {
                "success": False,
                "message": "Deployment not found"
            }

    result = stop_container(
        state["container_id"]
    )

    if not result["success"]:
        return result

    update_deployment_step(
        deployment_id,
        "stopped"
    )

    stop_monitoring(
        deployment_id
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

    emit_deployment_update(
        deployment_id,
        "stopped",
        "Deployment stopped"
    )

    return {
        "success": True,
        "message": "Deployment stopped"
    }


# =========================================================
# START
# =========================================================

def start_deployment(
    deployment_id
):

    state = get_state(
        str(deployment_id)
    )

    if not state:

        deployment = get_deployment_by_id(
            deployment_id
        )

        if (
            deployment and
            deployment.get("container_id")
        ):

            state = {
                "container_id": deployment.get(
                    "container_id"
                ),
                "status": deployment.get(
                    "status",
                    "stopped"
                ),
                "internal_port": None,
                "public_port": deployment.get(
                    "assigned_port"
                ),
                "assigned_port": deployment.get(
                    "assigned_port"
                ),
                "subdomain": deployment.get(
                    "subdomain"
                ),
                "custom_url": deployment.get(
                    "custom_url"
                ),
                "monitoring_active": False,
                "log_streaming": False,
            }

            set_state(
                str(deployment_id),
                state
            )

        else:

            return {
                "success": False,
                "message": "Deployment not found"
            }

    result = start_container(
        state["container_id"]
    )

    if not result["success"]:
        return result

    update_deployment_step(
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

    emit_deployment_update(
        deployment_id,
        "running",
        "Deployment started"
    )

    return {
        "success": True,
        "message": "Deployment started"
    }


# =========================================================
# RESTART
# =========================================================

def restart_deployment(deployment_id):

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

    emit_deployment_update(
        deployment_id,
        "running",
        "Deployment restarted"
    )

    return {
        "success": True,
        "message": "Deployment restarted"
    }

# =========================================================
# DELETE LIFECYCLE
# =========================================================

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

    try:

        # =====================================
        # STOP MONITORING
        # =====================================

        stop_monitoring(
            deployment_id
        )

        # =====================================
        # GET RESOURCES
        # =====================================

        container_id = deployment.get(
            "container_id"
        )

        image_name = deployment.get(
            "image_name"
        )

        assigned_port = deployment.get(
            "assigned_port"
        )

        subdomain = deployment.get(
            "subdomain"
        )

        # =====================================
        # REMOVE CONTAINER
        # =====================================

        if container_id:

            remove_container(
                container_id
            )

        # =====================================
        # REMOVE IMAGE
        # =====================================

        if image_name:

            remove_image(
                image_name
            )

        # =====================================
        # REMOVE PROXY ROUTE
        # =====================================

        if subdomain:

            delete_route(
                subdomain
            )

            reload_proxy()

        # =====================================
        # RELEASE PORT
        # =====================================

        if assigned_port:

            release_port(
                assigned_port
            )

        # =====================================
        # REMOVE RUNTIME STATE
        # =====================================

        remove_state(
            str(deployment_id)
        )

        return {
            "success": True,
            "message":
                "Lifecycle cleanup completed"
        }

    except Exception as e:

        return {
            "success": False,
            "message": str(e)
        }