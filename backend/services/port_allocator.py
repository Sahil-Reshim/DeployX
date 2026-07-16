# =========================================================
# PORT ALLOCATOR
# ---------------------------------------------------------
# Responsibilities:
#   - Track host ports already assigned to a deployment
#     (persisted in the SQLite "deployments" table).
#   - Hand out a free port from a safe range so two
#     deployments never bind the same host port.
#   - Double-check the port is actually free on the
#     machine before returning it. This prevents the
#     "port already in use" error at container start.
# =========================================================

import socket

from database import get_db_connection


# Safe host port range. We deliberately avoid:
#   0-1024  -> system/reserved ports
#   5000    -> DeployX backend API
#   5173    -> frontend dev server
#   8080    -> Jenkins
START_PORT = 5001
END_PORT = 5999


def get_used_ports():
    """
    Return the set of host ports already recorded in the
    deployments table so we never reuse one.
    """

    conn = get_db_connection()

    rows = conn.execute(
        """
        SELECT assigned_port
        FROM deployments
        WHERE assigned_port IS NOT NULL
        """
    ).fetchall()

    conn.close()

    return {row["assigned_port"] for row in rows}


def is_port_free(port):
    """
    Verify a TCP port is not currently bound on this host.
    Returns True if nothing is listening on it.
    """

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.3)
        # If the connect succeeds, something is already using the port.
        return sock.connect_ex(("127.0.0.1", port)) != 0


def allocate_port():
    """
    Find and return the first port in the safe range that is
    neither already assigned to a deployment nor currently
    in use on the machine. Raises if the range is exhausted.
    """

    used_ports = get_used_ports()

    for port in range(START_PORT, END_PORT + 1):
        if port in used_ports:
            continue
        if not is_port_free(port):
            continue
        return port

    raise Exception("No available ports remaining in range")


def release_port(port):
    """
    Placeholder for explicit port release. Ports are freed
    automatically when a deployment row is deleted
    (assigned_port becomes NULL), so this is a no-op that
    exists for API symmetry.
    """

    return True