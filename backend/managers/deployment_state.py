from datetime import datetime

STATE_DEFINITIONS = {
    "DEPLOYMENT_REQUESTED": {
        "key": "DEPLOYMENT_REQUESTED",
        "label": "Deployment Requested",
        "progress": 2,
    },
    "QUEUEING": {
        "key": "QUEUEING",
        "label": "Deployment Queued",
        "progress": 5,
    },
    "REPOSITORY_VALIDATION": {
        "key": "REPOSITORY_VALIDATION",
        "label": "Repository Validation",
        "progress": 5,
    },
    "REPOSITORY_CLONING": {
        "key": "REPOSITORY_CLONING",
        "label": "Repository Cloning",
        "progress": 10,
    },
    "FRAMEWORK_DETECTION": {
        "key": "FRAMEWORK_DETECTION",
        "label": "Framework Detection",
        "progress": 15,
    },
    "DOCKERFILE_DETECTION": {
        "key": "DOCKERFILE_DETECTION",
        "label": "Dockerfile Detection",
        "progress": 20,
    },
    "BUILD_CONFIGURATION": {
        "key": "BUILD_CONFIGURATION",
        "label": "Build Configuration",
        "progress": 25,
    },
    "JENKINS_TRIGGERED": {
        "key": "JENKINS_TRIGGERED",
        "label": "Jenkins Triggered",
        "progress": 25,
    },
    "JENKINS_QUEUED": {
        "key": "JENKINS_QUEUED",
        "label": "Jenkins Queue",
        "progress": 30,
    },
    "JENKINS_STARTED": {
        "key": "JENKINS_STARTED",
        "label": "Jenkins Started",
        "progress": 40,
    },
    "JENKINS_CHECKOUT": {
        "key": "JENKINS_CHECKOUT",
        "label": "Jenkins Checkout",
        "progress": 40,
    },
    "JENKINS_BUILD": {
        "key": "JENKINS_BUILD",
        "label": "Jenkins Build",
        "progress": 55,
    },
    "JENKINS_TEST": {
        "key": "JENKINS_TEST",
        "label": "Jenkins Test",
        "progress": 70,
    },
    "JENKINS_PACKAGE": {
        "key": "JENKINS_PACKAGE",
        "label": "Jenkins Package",
        "progress": 80,
    },
    "JENKINS_DEPLOY": {
        "key": "JENKINS_DEPLOY",
        "label": "Jenkins Deploy",
        "progress": 90,
    },
    "IMAGE_CREATED": {
        "key": "IMAGE_CREATED",
        "label": "Image Created",
        "progress": 92,
    },
    "CONTAINER_CREATING": {
        "key": "CONTAINER_CREATING",
        "label": "Container Creating",
        "progress": 93,
    },
    "CONTAINER_RUNNING": {
        "key": "CONTAINER_RUNNING",
        "label": "Container Running",
        "progress": 95,
    },
    "HEALTH_CHECK": {
        "key": "HEALTH_CHECK",
        "label": "Health Check",
        "progress": 98,
    },
    "PRODUCTION_DEPLOYMENT": {
        "key": "PRODUCTION_DEPLOYMENT",
        "label": "Production Deployment",
        "progress": 99,
    },
    "LIVE": {
        "key": "LIVE",
        "label": "Live",
        "progress": 100,
    },
    "FAILED": {
        "key": "FAILED",
        "label": "Failed",
        "progress": 100,
    },
    "CANCELLED": {
        "key": "CANCELLED",
        "label": "Cancelled",
        "progress": 0,
    },
}

STAGE_STATE_MAP = {
    "checkout": "JENKINS_CHECKOUT",
    "build": "JENKINS_BUILD",
    "test": "JENKINS_TEST",
    "package": "JENKINS_PACKAGE",
    "deploy": "JENKINS_DEPLOY",
    "publish": "JENKINS_DEPLOY",
    "artifact": "JENKINS_PACKAGE",
    "triggering": "JENKINS_TRIGGERED",
    "queued": "JENKINS_QUEUED",
}

FALLBACK_MAPPING = {
    "queued": "JENKINS_QUEUED",
    "queued_in_jenkins": "JENKINS_QUEUED",
    "cloning": "REPOSITORY_CLONING",
    "detecting": "FRAMEWORK_DETECTION",
    "dockerfile_generating": "DOCKERFILE_DETECTION",
    "ci_pipeline": "JENKINS_TRIGGERED",
    "triggering_jenkins": "JENKINS_TRIGGERED",
    "docker_build": "JENKINS_BUILD",
    "build_started": "JENKINS_BUILD",
    "building": "JENKINS_STARTED",
    "test_started": "JENKINS_TEST",
    "package_started": "JENKINS_PACKAGE",
    "deploy_started": "JENKINS_DEPLOY",
    "deploying": "CONTAINER_CREATING",
    "running": "CONTAINER_RUNNING",
    "success": "LIVE",
    "completed": "LIVE",
    "live": "LIVE",
    "failed": "FAILED",
    "failure": "FAILED",
    "aborted": "FAILED",
    "timeout": "FAILED",
    "stopped": "CANCELLED",
    "cancelled": "CANCELLED",
}


def get_state_info(key):
    if not key:
        return None

    state = STATE_DEFINITIONS.get(key)
    if state:
        return state

    fallback = FALLBACK_MAPPING.get(key.lower())
    if fallback:
        return STATE_DEFINITIONS.get(fallback)

    return None


def get_stage_state_key(value):
    if not value:
        return None

    normalized = str(value).strip().lower()
    for token, state_key in STAGE_STATE_MAP.items():
        if token in normalized:
            return state_key

    return None


def normalize_state_key(value):
    if not value:
        return None

    key = str(value).strip().upper()
    if key in STATE_DEFINITIONS:
        return key

    fallback = FALLBACK_MAPPING.get(key.lower())
    if fallback:
        return fallback

    return get_stage_state_key(value)

def get_pipeline_stage_progress(stage_name):
    if not stage_name:
        return None

    normalized = str(stage_name).strip().lower()
    stage_map = {
        "checkout": 40,
        "build": 55,
        "test": 70,
        "package": 80,
        "deploy": 90,
        "publish": 90,
        "artifact": 85,
    }

    for token, progress in stage_map.items():
        if token in normalized:
            return progress

    return None


def get_state_payload(value):
    state_key = normalize_state_key(value)
    if state_key:
        state_info = get_state_info(state_key)
        if state_info:
            return {
                "state_key": state_info["key"],
                "state_label": state_info["label"],
                "progress": state_info["progress"],
            }

    stage_key = get_stage_state_key(value)
    if stage_key:
        stage_progress = get_pipeline_stage_progress(value)
        state_info = get_state_info(stage_key)
        if stage_progress is not None and state_info:
            return {
                "state_key": state_info["key"],
                "state_label": state_info["label"],
                "progress": stage_progress,
            }

    return None

def current_timestamp():
    return datetime.utcnow().isoformat() + "Z"
