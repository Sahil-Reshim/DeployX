from flask_socketio import SocketIO

socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode="threading"
)


def get_deployment_room(deployment_id):

    return f"deployment_{deployment_id}"


def emit_deployment_update(
    deployment_id,
    status,
    message
):

    room = get_deployment_room(
        deployment_id
    )

    socketio.emit(
        "deployment_update",
        {
            "deployment_id": deployment_id,
            "status": status,
            "message": message
        },
        room=room
    )


def emit_log(
    deployment_id,
    log
):

    room = get_deployment_room(
        deployment_id
    )

    socketio.emit(
        "log_update",
        {
            "deployment_id": deployment_id,
            "log": log
        },
        room=room
    )


def emit_monitoring_update(
    deployment_id,
    metrics
):

    room = get_deployment_room(
        deployment_id
    )

    socketio.emit(
        "deployment_update",
        {
            "deployment_id": deployment_id,
            "status": "running",
            "metrics": metrics
        },
        room=room
    )