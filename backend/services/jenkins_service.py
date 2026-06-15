from urllib import response

import requests
import time

from services.deployment_service import (
    save_jenkins_build_number,
    update_jenkins_status
)

from sockets.socket_manager import (
    emit_deployment_update
)

JENKINS_URL = "http://localhost:8081"
JOB_NAME = "flask-docker-build"

JENKINS_USER = "sahil-reshim"
JENKINS_API_TOKEN = "11ebabcad133524570f87bbedb04dd8fe5"


def get_jenkins_crumb():
    """
    Get Jenkins CSRF crumb token
    """

    endpoint = f"{JENKINS_URL}/crumbIssuer/api/json"

    response = requests.get(
        endpoint,
        auth=(JENKINS_USER, JENKINS_API_TOKEN)
    )
    
    print("CRUMB RESPONSE:", response.text)
    data = response.json()

    return {
        "crumb": data["crumb"],
        "field": data["crumbRequestField"]
    }


def trigger_jenkins_job(repo_url):

    print("\n===== TRIGGERING JENKINS =====")
    print("Repo URL:", repo_url)

    crumb_data = get_jenkins_crumb()

    endpoint = f"{JENKINS_URL}/job/{JOB_NAME}/buildWithParameters"

    params = {
        "REPO_URL": repo_url
    }

    headers = {
        crumb_data["field"]: crumb_data["crumb"]
    }

    response = requests.post(
        endpoint,
        params=params,
        headers=headers,
        auth=(JENKINS_USER, JENKINS_API_TOKEN)
    )

    print("Jenkins response code:", response.status_code)

    if response.status_code == 201:

        queue_url = response.headers["Location"]
        queue_id = queue_url.split("/")[-2]

        print("Queue ID:", queue_id)

        return {
            "success": True,
            "queue_id": int(queue_id)
        }

    print("Trigger failed:", response.text)

    return {
        "success": False,
        "message": response.text
    }
    
def get_build_number(queue_id):
    """
    Convert queue id into actual Jenkins build number
    """

    endpoint = f"{JENKINS_URL}/queue/item/{queue_id}/api/json"

    response = requests.get(
        endpoint,
        auth=(JENKINS_USER, JENKINS_API_TOKEN)
    )

    print("BUILD NUMBER URL:", endpoint)
    print("STATUS CODE:", response.status_code)
#   print("RAW RESPONSE:", response.text)

    print("QUEUE RESPONSE:", response.text)
    data = response.json()

    # build started
    if "executable" in data:

        build_number = data["executable"]["number"]

        return {
            "success": True,
            "build_number": build_number
        }

    # still waiting in queue
    return {
        "success": False,
        "message": "Build still in queue"
    }
    
def get_build_status(build_number):
    """
    Get Jenkins build status
    """

    endpoint = f"{JENKINS_URL}/job/{JOB_NAME}/{build_number}/api/json"

    response = requests.get(
        endpoint,
        auth=(JENKINS_USER, JENKINS_API_TOKEN)
    )

    print("BUILD STATUS URL:", endpoint)
    print("STATUS CODE:", response.status_code)
#   print("RAW RESPONSE:", response.text)

    print("BUILD STATUS RESPONSE:", response.text)
    data = response.json()

    # still running
    if data["building"]:

        return {
            "status": "BUILDING"
        }

    # finished
    result = data["result"]

    if result == "SUCCESS":
        return {
            "status": "SUCCESS"
        }

    if result == "FAILURE":
        return {
            "status": "FAILED"
        }

    return {
        "status": result
    }
    
def get_pipeline_stages(build_number):

    endpoint = (
        f"{JENKINS_URL}/job/"
        f"{JOB_NAME}/"
        f"{build_number}/wfapi/describe"
    )

    response = requests.get(
        endpoint,
        auth=(JENKINS_USER, JENKINS_API_TOKEN)
    )

    print("PIPELINE API:", endpoint)
    print("STATUS:", response.status_code)
    print("RAW:", response.text)

    data = response.json()

    return data.get("stages", [])

def wait_for_pipeline(deployment_id,queue_id):

    print("\n===== WAITING FOR PIPELINE =====")
    print("Queue ID:", queue_id)

    # wait for build number
    while True:

        build_result = get_build_number(queue_id)

        print("Build Result:", build_result)

        if build_result["success"]:
            break

        time.sleep(3)

    build_number = build_result["build_number"]

    save_jenkins_build_number(
        deployment_id,
        build_number
    )

    print("Build Number:", build_number)
    
    last_stage = None

    # wait until build finishes
    while True:

        # get current build status
        status_result = get_build_status(
            build_number
        )

        update_jenkins_status(
            deployment_id,
            status_result["status"]
        )

        # get pipeline stages
        stages = get_pipeline_stages(
            build_number
        )

        # find active stage
        active_stage = None

        for stage in stages:

            if stage["status"] in [
                "IN_PROGRESS",
                "PAUSED_PENDING_INPUT"
            ]:

                active_stage = stage["name"]
                break


        if active_stage and active_stage != last_stage:

            last_stage = active_stage

            emit_deployment_update(
                deployment_id,
                active_stage.lower().replace(" ", "_"),
                active_stage
            )

            print(
                "Current Stage:",
                active_stage
            )

        print(
            "Build Status:",
            status_result
        )

        if status_result["status"] != "BUILDING":
            break

        time.sleep(3)

    print("Final Pipeline Status:", status_result["status"])

    return {
        "build_number": build_number,
        "status": status_result["status"]
    }
    
