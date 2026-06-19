import os
import json
from datetime import datetime

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

        # Write logs as JSON lines so each entry contains timestamp and level
        with open(log_file_path, "w", encoding="utf-8") as file:
            for entry in logs:
                if isinstance(entry, dict):
                    obj = entry
                else:
                    text = str(entry)
                    lt = text.lower()
                    if "error" in lt or "failed" in lt or "exception" in lt:
                        level = "error"
                    elif "success" in lt or "completed" in lt or "running" in lt:
                        level = "success"
                    elif "warn" in lt or "warning" in lt:
                        level = "warn"
                    else:
                        level = "info"

                    obj = {
                        "message": text,
                        "level": level,
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                    }

                file.write(json.dumps(obj, ensure_ascii=False) + "\n")

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

        results = []

        with open(log_file_path, "r", encoding="utf-8") as file:
            for line in file:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    results.append(obj)
                except Exception:
                    # Fallback for legacy plaintext logs
                    text = line
                    lt = text.lower()
                    if "error" in lt or "failed" in lt or "exception" in lt:
                        level = "error"
                    elif "success" in lt or "completed" in lt or "running" in lt:
                        level = "success"
                    elif "warn" in lt or "warning" in lt:
                        level = "warn"
                    else:
                        level = "info"

                    results.append({
                        "message": text,
                        "level": level,
                        "timestamp": None,
                    })

        return {
            "success": True,
            "message": "Build logs fetched successfully",
            "logs": results,
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
            for entry in logs:
                if isinstance(entry, dict):
                    obj = entry
                else:
                    text = str(entry)
                    lt = text.lower()
                    if "error" in lt or "failed" in lt or "exception" in lt:
                        level = "error"
                    elif "success" in lt or "completed" in lt or "running" in lt:
                        level = "success"
                    elif "warn" in lt or "warning" in lt:
                        level = "warn"
                    else:
                        level = "info"

                    obj = {
                        "message": text,
                        "level": level,
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                    }

                file.write(json.dumps(obj, ensure_ascii=False) + "\n")

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

        results = []

        with open(log_file_path, "r", encoding="utf-8") as file:
            for line in file:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    results.append(obj)
                except Exception:
                    text = line
                    lt = text.lower()
                    if "error" in lt or "failed" in lt or "exception" in lt:
                        level = "error"
                    elif "success" in lt or "completed" in lt or "running" in lt:
                        level = "success"
                    elif "warn" in lt or "warning" in lt:
                        level = "warn"
                    else:
                        level = "info"

                    results.append({
                        "message": text,
                        "level": level,
                        "timestamp": None,
                    })

        return {
            "success": True,
            "message": "Container logs fetched successfully",
            "logs": results,
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e),
            "logs": []
        }