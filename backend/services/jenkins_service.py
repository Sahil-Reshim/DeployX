import os
import time
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from services.deployment_service import (
    save_jenkins_build_number,
    update_jenkins_status,
    save_jenkins_stages
)

from sockets.socket_manager import (
    emit_deployment_update
)

# =========================================================
# ENVIRONMENT VARIABLES
# =========================================================

def _get_config():
    return {
        "url": os.getenv("JENKINS_URL"),
        "job": os.getenv("JENKINS_JOB_NAME", "flask-docker-build"),
        "user": os.getenv("JENKINS_USER"),
        "token": os.getenv("JENKINS_API_TOKEN"),
    }

REQUEST_TIMEOUT = 15
QUEUE_WAIT_TIMEOUT = 600
BUILD_WAIT_TIMEOUT = 3600
POLL_INTERVAL = 3



# Create a requests Session with simple retry/backoff for transient errors
def _make_session():
    s = requests.Session()
    s.headers.update({
        "Accept": "application/json",
        "User-Agent": "DeployX/1.0"
    })
    retries = Retry(total=3, backoff_factor=0.5, status_forcelist=(429, 500, 502, 503, 504))
    s.mount("https://", HTTPAdapter(max_retries=retries))
    s.mount("http://", HTTPAdapter(max_retries=retries))
    cfg = _get_config()
    if cfg.get("user") and cfg.get("token"):
        s.auth = (cfg.get("user"), cfg.get("token"))
    return s


_SESSION = None


def _get_session():
    # create a fresh session each time to ensure env vars (loaded at runtime)
    # are honored even if .env was loaded after module import
    return _make_session()



# =========================================================
# VALIDATE CONFIG
# =========================================================

def validate_jenkins_config():

    missing = []

    cfg = _get_config()

    if not cfg.get("url"):
        missing.append("JENKINS_URL")

    if not cfg.get("user"):
        missing.append("JENKINS_USER")

    if not cfg.get("token"):
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

    cfg = _get_config()
    endpoint = f"{cfg.get('url')}/crumbIssuer/api/json"

    try:
        session = _get_session()
        response = session.get(endpoint, timeout=REQUEST_TIMEOUT)
        # Provide detailed debug info on failure
        if response.status_code >= 400:
            body = response.text[:1000]
            # Mask token for logging
            cfg = _get_config()
            token = cfg.get("token") or ""
            token_mask = (token[:4] + "..." + token[-4:]) if len(token) > 8 else "****"
            user = cfg.get("user") or ""
            # Attempt to show Authorization header presence (masked)
            auth_hdr = response.request.headers.get("Authorization") if getattr(response, 'request', None) else None
            if auth_hdr:
                # show only prefix and suffix
                auth_mask = auth_hdr[:10] + "..." if len(auth_hdr) > 13 else "***"
            else:
                auth_mask = None

            print("Jenkins crumb request failed:", {
                "endpoint": endpoint,
                "user": user,
                "token_mask": token_mask,
                "auth_header_masked": auth_mask,
                "status": response.status_code,
            })

            print("Response headers:", dict(list(response.headers.items())[:10]))
            print("Response body (trimmed):", body)

            raise Exception(f"Crumb request failed ({response.status_code}): {body}")

        data = response.json()

        return {
            "crumb": data.get("crumb"),
            "field": data.get("crumbRequestField")
        }
    except requests.HTTPError as exc:
        status_code = getattr(exc.response, "status_code", None)
        if status_code in (401, 403):
            raise Exception(
                "Jenkins authentication failed when fetching crumb. "
                "Check JENKINS_USER and JENKINS_API_TOKEN values. "
                f"HTTP {status_code}."
            ) from exc
        raise
    except Exception as exc:
        raise Exception(
            "Failed to fetch Jenkins crumb. "
            f"Endpoint: {endpoint}. "
            f"Error: {str(exc)}"
        ) from exc


# =========================================================
# TRIGGER JOB
# =========================================================

def trigger_jenkins_job(repo_url):

    print("\n===== TRIGGERING JENKINS =====")
    print("Repo URL sent to Jenkins:", repo_url)

    try:
        crumb_data = get_jenkins_crumb()

        cfg = _get_config()
        endpoint = f"{cfg.get('url')}/job/{cfg.get('job')}/buildWithParameters"

        params = {"REPO_URL": repo_url}

        headers = {crumb_data["field"]: crumb_data["crumb"]} if crumb_data else {}

        response = _get_session().post(
            endpoint,
            params=params,
            headers=headers,
            timeout=REQUEST_TIMEOUT,
            allow_redirects=False,
        )

        # Jenkins may return 201 Created with Location header, or 302 redirect to queue
        status = response.status_code
        print("Jenkins trigger status:", status)

        if status in (201, 302):
            queue_url = response.headers.get("Location")
            if not queue_url:
                # Sometimes Jenkins returns a redirect location in 'location' lower-case
                queue_url = response.headers.get("location")

            if not queue_url:
                return {"success": False, "message": "Jenkins did not return queue Location header"}


            queue_id = queue_url.rstrip("/").split("/")[-1]
            if not queue_id.isdigit():
                return {"success": False, "message": f"Invalid Jenkins queue id from URL: {queue_url}"}

            if not queue_url:
                return {
                    "success": False,
                    "message": "Jenkins did not return queue Location header"
                }

            queue_id = queue_url.rstrip("/").split("/")[-1]

            if not queue_id.isdigit():
                return {
                    "success": False,
                    "message": f"Invalid Jenkins queue id from URL: {queue_url}"
                }


            print("Queue ID:", queue_id)
            return {"success": True, "queue_id": int(queue_id)}

        # If Jenkins returns 200 with JSON, try to parse for queue
        try:
            body = response.text
        except Exception:
            body = ''

        return {"success": False, "message": f"Unexpected Jenkins response ({status}): {body[:1000]}"}

    except Exception as e:
        return {"success": False, "message": str(e)}


# =========================================================
# GET BUILD NUMBER
# =========================================================

def get_build_number(queue_id):

    try:

        cfg = _get_config()
        endpoint = f"{cfg.get('url')}/queue/item/{queue_id}/api/json"

        response = _get_session().get(endpoint, timeout=REQUEST_TIMEOUT)
        if response.status_code >= 400:
            return {"success": False, "message": f"Queue request failed: {response.status_code} - {response.text[:500]}"}

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

        cfg = _get_config()
        endpoint = f"{cfg.get('url')}/job/{cfg.get('job')}/{build_number}/api/json"

        response = _get_session().get(endpoint, timeout=REQUEST_TIMEOUT)
        if response.status_code >= 400:
            return {"status": "UNKNOWN"}

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

        cfg = _get_config()
        endpoint = f"{cfg.get('url')}/job/{cfg.get('job')}/{build_number}/wfapi/describe"

        response = _get_session().get(endpoint, timeout=REQUEST_TIMEOUT)
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
# NORMALIZE STAGES FOR FRONTEND
# =========================================================

def normalize_stages(raw_stages):
    """
    Jenkins' wfapi returns stages with lots of extra fields
    (durations, links, ids...). The frontend only cares about
    name + status, so trim it down to exactly what
    JenkinsPipeline.jsx expects:

        [{"name": ..., "status": ...}, ...]
    """

    normalized = []

    for stage in raw_stages:

        normalized.append({
            "name": stage.get("name", "Unknown Stage"),
            "status": stage.get("status", "UNKNOWN")
        })

    return normalized


# =========================================================
# CONSOLE LOG
# =========================================================

def get_console_log(build_number):

    try:

        cfg = _get_config()
        endpoint = f"{cfg.get('url')}/job/{cfg.get('job')}/{build_number}/consoleText"

        response = requests.get(
            endpoint,
            auth=(
                cfg.get("user"),
                cfg.get("token")
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

    # Let the frontend light up the CI step and show "queued"
    # immediately, instead of sitting on "Waiting" with no
    # jenkins_status at all until the first build-number poll
    # resolves.

    update_jenkins_status(
        deployment_id,
        "QUEUED"
    )

    emit_deployment_update(
        deployment_id,
        "ci_pipeline",
        "Waiting in Jenkins queue...",
        jenkins_status="QUEUED",
        current_step="queued_in_jenkins",
    )

    build_number = None
    queue_started = time.time()

    # -----------------------------------------
    # WAIT FOR BUILD NUMBER
    # -----------------------------------------

    while True:

        if time.time() - queue_started > QUEUE_WAIT_TIMEOUT:
            update_jenkins_status(
                deployment_id,
                "TIMEOUT"
            )

            emit_deployment_update(
                deployment_id,
                "ci_pipeline",
                "Timed out waiting for Jenkins build number",
                jenkins_status="TIMEOUT",
                current_step="queue_timeout",
            )

            return {
                "success": False,
                "build_number": None,
                "status": "TIMEOUT",
                "message": "Timed out waiting in Jenkins queue"
            }

        result = get_build_number(
            queue_id
        )

        if result["success"]:

            build_number = result[
                "build_number"
            ]

            break

        time.sleep(POLL_INTERVAL)

    save_jenkins_build_number(
        deployment_id,
        build_number
    )

    print(
        "Build Number:",
        build_number
    )

    emit_deployment_update(
        deployment_id,
        "ci_pipeline",
        f"Jenkins build #{build_number} started",
        jenkins_status="BUILDING",
        jenkins_build_number=build_number,
        current_step="build_started",
    )

    last_stage = None
    build_started = time.time()

    # -----------------------------------------
    # WAIT FOR BUILD
    # -----------------------------------------

    while True:

        if time.time() - build_started > BUILD_WAIT_TIMEOUT:
            update_jenkins_status(
                deployment_id,
                "TIMEOUT"
            )

            emit_deployment_update(
                deployment_id,
                "ci_pipeline",
                "Timed out waiting for Jenkins pipeline",
                jenkins_status="TIMEOUT",
                jenkins_build_number=build_number,
                current_step="build_timeout",
            )

            return {
                "success": False,
                "build_number": build_number,
                "status": "TIMEOUT",
                "message": "Timed out waiting for Jenkins pipeline"
            }

        status_result = get_build_status(
            build_number
        )

        update_jenkins_status(
            deployment_id,
            status_result["status"]
        )

        raw_stages = get_pipeline_stages(
            build_number
        )

        stages = normalize_stages(
            raw_stages
        )

        active_stage = None

        for stage in raw_stages:

            if stage.get("status") in [
                "IN_PROGRESS",
                "PAUSED_PENDING_INPUT"
            ]:

                active_stage = stage.get(
                    "name"
                )

                break

        current_step_slug = (
            active_stage.lower().replace(" ", "_")
            if active_stage else None
        )
        # the DB (and therefore REST GET /deployments) always
        # reflects what Jenkins is doing right now, not just the
        # last stage transition.

        save_jenkins_stages(
            deployment_id,
            stages,
            current_stage=current_step_slug
        )

        # Emit a full CI payload on every poll (not just on stage
        # change) so jenkins_status / build number / stage list
        # stay live even while the same stage is still running.

        emit_deployment_update(
            deployment_id,
            "ci_pipeline",
            active_stage or "Running Jenkins pipeline...",
            jenkins_status=status_result["status"],
            jenkins_build_number=build_number,
            current_step=current_step_slug,
            jenkins_stages=stages
        )

        if (
            active_stage and
            active_stage != last_stage
        ):

            last_stage = active_stage

            print(
                "Current Stage:",
                active_stage
            )

        if (
            status_result["status"]
            != "BUILDING"
        ):
            break

        time.sleep(POLL_INTERVAL)

    print(
        "Pipeline Finished:",
        status_result["status"]
    )

    # Final stage snapshot once the build leaves BUILDING, so the
    # frontend gets a last update with the terminal jenkins_status
    # (SUCCESS/FAILED/ABORTED) and the final stage list.

    final_raw_stages = get_pipeline_stages(build_number)
    final_stages = normalize_stages(final_raw_stages)

    save_jenkins_stages(
        deployment_id,
        final_stages,
        current_stage=None
    )

    emit_deployment_update(
        deployment_id,
        "ci_pipeline",
        f"Jenkins pipeline finished: {status_result['status']}",
        jenkins_status=status_result["status"],
        jenkins_build_number=build_number,
        jenkins_stages=final_stages
    )

    pipeline_success = (
        status_result["status"] == "SUCCESS"
    )


    result = {

    return {

        "success": pipeline_success,
        "build_number": build_number,
        "status": status_result["status"],
        "message": (
            "Jenkins pipeline completed successfully"
            if pipeline_success
            else f"Jenkins pipeline ended with status {status_result['status']}"
        )

    }

    if not pipeline_success:
        # attach console log for debugging; keep it reasonably sized
        console = get_console_log(build_number) or ""
        result["console_log"] = console[:8000]

    return result

    }

