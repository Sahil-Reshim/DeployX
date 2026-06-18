from flask_socketio import SocketIO

import os

_debug = os.getenv("SOCKETIO_DEBUG", "false").lower() in ("1", "true", "yes")

socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode="threading",
    logger=_debug,
    engineio_logger=_debug
)


def get_deployment_room(deployment_id):
    return f"deployment_{int(deployment_id)}"


def emit_deployment_update(
    deployment_id,
    status,
    message,
    jenkins_status=None,
    jenkins_build_number=None,
    current_step=None,
    jenkins_stages=None,
    url=None,
    container_id=None,
    metrics=None,
):
    room = get_deployment_room(deployment_id)

    payload = {
        "deployment_id": deployment_id,
        "status": status,
        "message": message,
    }

    if jenkins_status is not None:
        payload["jenkins_status"] = jenkins_status

    if jenkins_build_number is not None:
        payload["jenkins_build_number"] = jenkins_build_number

    if current_step is not None:
        payload["current_step"] = current_step

    # Include jenkins_stages when explicitly provided (even empty list)
    # so the frontend can clear previous stage data when appropriate.
    if jenkins_stages is not None:
        payload["jenkins_stages"] = jenkins_stages

    if url is not None:
        payload["url"] = url

    if container_id is not None:
        payload["container_id"] = container_id

    if metrics is not None:
        payload["metrics"] = metrics

    # Temporary debug: print the payload being emitted so backend logs
    # show exactly what the frontend will receive.
    print("emit_deployment_update payload:", payload)

    socketio.emit(
        "deployment_update",
        payload,
        room=room
    )


def emit_log(deployment_id, log):
    room = get_deployment_room(deployment_id)

    socketio.emit(
        "log_update",
        {
            "deployment_id": deployment_id,
            "log": log,
        },
        room=room
    )


def emit_monitoring_update(deployment_id, metrics):
    room = get_deployment_room(deployment_id)

    socketio.emit(
        "deployment_update",
        {
            "deployment_id": deployment_id,
            "status": "running",
            "message": "Monitoring update",
            "metrics": metrics,
        },
        room=room
    )


def emit_deployment_started(deployment_id):
    socketio.emit(
        "deployment_started",
        {
            "deployment_id": deployment_id,
            "status": "running",
        }
    )


def emit_deployment_stopped(deployment_id):
    socketio.emit(
        "deployment_stopped",
        {
            "deployment_id": deployment_id,
            "status": "stopped",
        }
    )


def emit_deployment_restarted(deployment_id):
    socketio.emit(
        "deployment_restarted",
        {
            "deployment_id": deployment_id,
            "status": "running",
        }
    )
