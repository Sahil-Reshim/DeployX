import re

from database import get_db_connection

BASE_DOMAIN = "deployx.local"


def sanitize_repo_name(repo_name):

    repo_name = repo_name.lower()

    repo_name = repo_name.replace(
        " ",
        "-"
    )

    repo_name = re.sub(
        r"[^a-z0-9\-]",
        "",
        repo_name
    )

    repo_name = re.sub(
        r"-+",
        "-",
        repo_name
    )

    return repo_name.strip("-")


def subdomain_exists(
    subdomain
):

    conn = get_db_connection()

    deployment = conn.execute("""
    SELECT id
    FROM deployments
    WHERE subdomain = ?
    """, (
        subdomain,
    )).fetchone()

    conn.close()

    return deployment is not None


def generate_subdomain(
    repo_name
):

    base_name = sanitize_repo_name(
        repo_name
    )

    candidate = base_name

    counter = 2

    while subdomain_exists(
        candidate
    ):

        candidate = (
            f"{base_name}-{counter}"
        )

        counter += 1

    return candidate


def build_custom_url(
    subdomain
):

    return (
        f"http://{subdomain}.{BASE_DOMAIN}"
    )