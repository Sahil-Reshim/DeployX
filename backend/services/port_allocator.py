from database import get_db_connection

START_PORT = 5001
END_PORT = 5999


def get_used_ports():

    conn = get_db_connection()

    rows = conn.execute("""
    SELECT assigned_port
    FROM deployments
    WHERE assigned_port IS NOT NULL
    """).fetchall()

    conn.close()

    return {
        row["assigned_port"]
        for row in rows
    }


def allocate_port():

    used_ports = get_used_ports()

    for port in range(
        START_PORT,
        END_PORT + 1
    ):

        if port not in used_ports:

            return port

    raise Exception(
        "No available ports remaining"
    )


def release_port(
    port
):

    return True