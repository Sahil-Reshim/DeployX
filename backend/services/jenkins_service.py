import os
import time
import requests

from services.deployment_service import (
    save_jenkins_build_number,
    update_jenkins_status
)

from sockets.socket_manager import (
    emit_deployment_update
)

# =========================================================
# ENVIRONMENT VARIABLES
# =========================================================

JENKINS_URL = os.getenv("JENKINS_URL")
JENKINS_JOB_NAME = os.getenv(
    "JENKINS_JOB_NAME",
    "flask-docker-build"
)

JENKINS_USER = os.getenv("JENKINS_USER")
JENKINS_API_TOKEN = os.getenv(
    "JENKINS_API_TOKEN"
)

REQUEST_TIMEOUT = 15


# =========================================================
# VALIDATE CONFIG
# =========================================================

def validate_jenkins_config():

    missing = []

    if not JENKINS_URL:
        missing.append("JENKINS_URL")

    if not JENKINS_USER:
        missing.append("JENKINS_USER")

    if not JENKINS_API_TOKEN:
        missing.append("JENKINS_API_TOKEN")

    if missing:
        raise Exception(
            f"Missing Jenkins env vars: {', '.join(missing)}"
        )


# =========================================================
# GET CRUMB
# =========================================================

def get_jenkins_crumb():

    validate_jenkins_config()

    endpoint = (
        f"{JENKINS_URL}/crumbIssuer/api/json"
    )

    response = requests.get(
        endpoint,
        auth=(
            JENKINS_USER,
            JENKINS_API_TOKEN
        ),
        timeout=REQUEST_TIMEOUT
    )

    response.raise_for_status()

    data = response.json()

    return {
        "crumb": data["crumb"],
        "field": data["crumbRequestField"]
    }


# =========================================================
# TRIGGER JOB
# =========================================================

def trigger_jenkins_job(repo_url):

    print("\n===== TRIGGERING JENKINS =====")
    print("Repo URL:", repo_url)

    try:

        crumb_data = get_jenkins_crumb()

        endpoint = (
            f"{JENKINS_URL}/job/"
            f"{JENKINS_JOB_NAME}/buildWithParameters"
        )

        params = {
            "REPO_URL": repo_url
        }

        headers = {
            crumb_data["field"]:
            crumb_data["crumb"]
        }

        response = requests.post(
            endpoint,
            params=params,
            headers=headers,
            auth=(
                JENKINS_USER,
                JENKINS_API_TOKEN
            ),
            timeout=REQUEST_TIMEOUT
        )

        print(
            "Jenkins Status:",
            response.status_code
        )

        if response.status_code == 201:

            queue_url = response.headers.get(
                "Location"
            )

            queue_id = queue_url.split("/")[-2]

            print(
                "Queue ID:",
                queue_id
            )

            return {
                "success": True,
                "queue_id": int(queue_id)
            }

        return {
            "success": False,
            "message": response.text
        }

    except Exception as e:

        return {
            "success": False,
            "message": str(e)
        }


# =========================================================
# GET BUILD NUMBER
# =========================================================

def get_build_number(queue_id):

    try:

        endpoint = (
            f"{JENKINS_URL}/queue/item/"
            f"{queue_id}/api/json"
        )

        response = requests.get(
            endpoint,
            auth=(
                JENKINS_USER,
                JENKINS_API_TOKEN
            ),
            timeout=REQUEST_TIMEOUT
        )

        response.raise_for_status()

        data = response.json()

        if "executable" in data:

            return {
                "success": True,
                "build_number":
                data["executable"]["number"]
            }

        return {
            "success": False,
            "message": "Still queued"
        }

    except Exception as e:

        return {
            "success": False,
            "message": str(e)
        }


# =========================================================
# BUILD STATUS
# =========================================================

def get_build_status(build_number):

    try:

        endpoint = (
            f"{JENKINS_URL}/job/"
            f"{JENKINS_JOB_NAME}/"
            f"{build_number}/api/json"
        )

        response = requests.get(
            endpoint,
            auth=(
                JENKINS_USER,
                JENKINS_API_TOKEN
            ),
            timeout=REQUEST_TIMEOUT
        )

        response.raise_for_status()

        data = response.json()

        if data.get("building"):

            return {
                "status": "BUILDING"
            }

        result = data.get("result")

        if result == "SUCCESS":

            return {
                "status": "SUCCESS"
            }

        if result == "FAILURE":

            return {
                "status": "FAILED"
            }

        if result == "ABORTED":

            return {
                "status": "ABORTED"
            }

        return {
            "status": result
        }

    except Exception:

        return {
            "status": "UNKNOWN"
        }


# =========================================================
# PIPELINE STAGES
# =========================================================

def get_pipeline_stages(build_number):

    try:

        endpoint = (
            f"{JENKINS_URL}/job/"
            f"{JENKINS_JOB_NAME}/"
            f"{build_number}/wfapi/describe"
        )

        response = requests.get(
            endpoint,
            auth=(
                JENKINS_USER,
                JENKINS_API_TOKEN
            ),
            timeout=REQUEST_TIMEOUT
        )

        if response.status_code != 200:
            return []

        data = response.json()

        return data.get(
            "stages",
            []
        )

    except Exception:
        return []


# =========================================================
# CONSOLE LOG
# =========================================================

def get_console_log(build_number):

    try:

        endpoint = (
            f"{JENKINS_URL}/job/"
            f"{JENKINS_JOB_NAME}/"
            f"{build_number}/consoleText"
        )

        response = requests.get(
            endpoint,
            auth=(
                JENKINS_USER,
                JENKINS_API_TOKEN
            ),
            timeout=REQUEST_TIMEOUT
        )

        return response.text

    except Exception:
        return ""


# =========================================================
# WAIT FOR PIPELINE
# =========================================================

def wait_for_pipeline(
    deployment_id,
    queue_id
):

    print(
        "\n===== WAITING FOR PIPELINE ====="
    )

    print("Queue:", queue_id)

    build_number = None

    # -----------------------------------------
    # WAIT FOR BUILD NUMBER
    # -----------------------------------------

    while True:

        result = get_build_number(
            queue_id
        )

        if result["success"]:

            build_number = result[
                "build_number"
            ]

            break

        time.sleep(3)

    save_jenkins_build_number(
        deployment_id,
        build_number
    )

    print(
        "Build Number:",
        build_number
    )

    last_stage = None

    # -----------------------------------------
    # WAIT FOR BUILD
    # -----------------------------------------

    while True:

        status_result = get_build_status(
            build_number
        )

        update_jenkins_status(
            deployment_id,
            status_result["status"]
        )

        stages = get_pipeline_stages(
            build_number
        )

        active_stage = None

        for stage in stages:

            if stage.get("status") in [
                "IN_PROGRESS",
                "PAUSED_PENDING_INPUT"
            ]:

                active_stage = stage.get(
                    "name"
                )

                break

        if (
            active_stage and
            active_stage != last_stage
        ):

            last_stage = active_stage

            emit_deployment_update(
                deployment_id,
                active_stage
                    .lower()
                    .replace(" ", "_"),
                active_stage
            )

            print(
                "Current Stage:",
                active_stage
            )

        if (
            status_result["status"]
            != "BUILDING"
        ):
            break

        time.sleep(3)

    print(
        "Pipeline Finished:",
        status_result["status"]
    )

    return {
        "success": True,
        "build_number": build_number,
        "status":
            status_result["status"]
    }