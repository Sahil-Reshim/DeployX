# =========================================================
# FRAMEWORK DETECTOR
# ---------------------------------------------------------
# Responsibilities:
#   - Inspect a cloned repository's files to determine
#     what framework / runtime it uses.
#   - Return the framework name (used to pick a Dockerfile
#     template) and the port the app listens on inside the
#     container.
#
# Port mapping (must match dockerfile_generator.py):
#   flask       -> 5000
#   react-vite  -> 80   (nginx)
#   nextjs      -> 3000
#   express     -> 3000
#   static-html -> 80   (nginx)
#   node        -> 3000
# =========================================================

import os
import json


# Map each framework to its default internal port.
FRAMEWORK_PORTS = {
    "flask": 5000,
    "react-vite": 80,
    "nextjs": 3000,
    "express": 3000,
    "static-html": 80,
    "node": 3000,
}


def detect_framework(repo_path):
    """
    Examine the repository at *repo_path* and return the
    detected framework name, its port, and a human-readable
    message.

    Returns
    -------
    dict with keys:
        success  : bool
        framework: str | None
        port     : int | None   <-- NEW: internal container port
        message  : str
    """

    try:
        files = os.listdir(repo_path)

        # =====================================================
        # Node.js based projects (React / Vite / Next / Express)
        # =====================================================

        if "package.json" in files:
            package_json_path = os.path.join(repo_path, "package.json")

            with open(package_json_path, "r", encoding="utf-8") as file:
                package_data = json.load(file)

            dependencies = package_data.get("dependencies", {})
            dev_dependencies = package_data.get("devDependencies", {})

            all_dependencies = {**dependencies, **dev_dependencies}

            if "vite" in all_dependencies:
                return {
                    "success": True,
                    "framework": "react-vite",
                    "port": FRAMEWORK_PORTS["react-vite"],
                    "message": "React Vite project detected"
                }

            if "next" in all_dependencies:
                return {
                    "success": True,
                    "framework": "nextjs",
                    "port": FRAMEWORK_PORTS["nextjs"],
                    "message": "Next.js project detected"
                }

            if "express" in all_dependencies:
                return {
                    "success": True,
                    "framework": "express",
                    "port": FRAMEWORK_PORTS["express"],
                    "message": "Express.js project detected"
                }

        # =====================================================
        # Flask (Python)
        # =====================================================

        if "requirements.txt" in files:
            requirements_path = os.path.join(repo_path, "requirements.txt")

            with open(requirements_path, "r", encoding="utf-8") as file:
                requirements_content = file.read().lower()

            possible_flask_files = ["app.py", "main.py", "run.py", "wsgi.py"]

            has_flask_dependency = "flask" in requirements_content
            has_flask_entry_file = any(f in files for f in possible_flask_files)

            if has_flask_dependency and has_flask_entry_file:
                return {
                    "success": True,
                    "framework": "flask",
                    "port": FRAMEWORK_PORTS["flask"],
                    "message": "Flask project detected"
                }

        # =====================================================
        # Static HTML
        # =====================================================

        if "index.html" in files:
            return {
                "success": True,
                "framework": "static-html",
                "port": FRAMEWORK_PORTS["static-html"],
                "message": "Static HTML project detected"
            }

        # =====================================================
        # Unsupported
        # =====================================================

        return {
            "success": False,
            "framework": None,
            "port": None,
            "message": "Unsupported framework — could not detect a known project type"
        }

    except Exception as e:
        return {
            "success": False,
            "framework": None,
            "port": None,
            "message": str(e)
        }