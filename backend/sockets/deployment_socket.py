from flask import request
from flask_socketio import join_room, leave_room

from sockets.socket_manager import (
    socketio,
    get_deployment_room,
    emit_deployment_update
)


@socketio.on("connect")
def handle_connect():
    print(
        f"Client connected: {request.sid}"
    )


@socketio.on("disconnect")
def handle_disconnect():
    print(
        f"Client disconnected: {request.sid}"
    )


@socketio.on("join_deployment")
def join_deployment(data):

    deployment_id = data.get(
        "deployment_id"
    )

    if deployment_id is None:
        return

    room = get_deployment_room(
        int(deployment_id)
    )

    join_room(room)

    print(
        f"{request.sid} joined {room}"
    )


@socketio.on("leave_deployment")
def leave_deployment(data):

    deployment_id = data.get(
        "deployment_id"
    )

    if deployment_id is None:
        return

    room = get_deployment_room(
        int(deployment_id)
    )

    leave_room(room)

    print(
        f"{request.sid} left {room}"
    )


# Temporary testing event
@socketio.on("test_update")
def test_update(data):

    deployment_id = data.get(
        "deployment_id"
    )

    emit_deployment_update(
        deployment_id,
        "building",
        "Testing deployment update"
    )