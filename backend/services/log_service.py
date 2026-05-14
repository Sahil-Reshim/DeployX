import os


LOG_DIR = "logs"


def ensure_logs_folder():
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR)


def save_build_logs(deployment_id, logs):
    try:
        ensure_logs_folder()

        log_file_path = os.path.join(
            LOG_DIR,
            f"deployment_{deployment_id}_build.log"
        )

        with open(log_file_path, "w", encoding="utf-8") as file:
            for line in logs:
                file.write(str(line) + "\n")

        return {
            "success": True,
            "message": "Build logs saved successfully",
            "log_file": log_file_path
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }


def get_build_logs(deployment_id):
    try:
        log_file_path = os.path.join(
            LOG_DIR,
            f"deployment_{deployment_id}_build.log"
        )

        if not os.path.exists(log_file_path):
            return {
                "success": False,
                "message": "Build logs not found",
                "logs": []
            }

        with open(log_file_path, "r", encoding="utf-8") as file:
            logs = file.readlines()

        return {
            "success": True,
            "message": "Build logs fetched successfully",
            "logs": [line.strip() for line in logs]
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e),
            "logs": []
        }
        
def save_container_logs(deployment_id, logs):
    try:
        ensure_logs_folder()

        log_file_path = os.path.join(
            LOG_DIR,
            f"deployment_{deployment_id}_container.log"
        )

        with open(log_file_path, "w", encoding="utf-8") as file:
            for line in logs:
                file.write(str(line) + "\n")

        return {
            "success": True,
            "message": "Container logs saved successfully",
            "log_file": log_file_path
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }


def get_container_logs(deployment_id):
    try:
        log_file_path = os.path.join(
            LOG_DIR,
            f"deployment_{deployment_id}_container.log"
        )

        if not os.path.exists(log_file_path):
            return {
                "success": False,
                "message": "Container logs not found",
                "logs": []
            }

        with open(log_file_path, "r", encoding="utf-8") as file:
            logs = file.readlines()

        return {
            "success": True,
            "message": "Container logs fetched successfully",
            "logs": [line.strip() for line in logs]
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e),
            "logs": []
        }