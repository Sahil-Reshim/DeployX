import os
import json


def detect_framework(repo_path):
    """
    Detects the framework/type of the cloned repository.
    """

    try:
        files = os.listdir(repo_path)

        # =====================================================
        # React / Vite / Next / Express Detection
        # =====================================================

        if "package.json" in files:
            package_json_path = os.path.join(repo_path, "package.json")

            with open(package_json_path, "r", encoding="utf-8") as file:
                package_data = json.load(file)

            dependencies = package_data.get("dependencies", {})
            dev_dependencies = package_data.get("devDependencies", {})

            all_dependencies = {
                **dependencies,
                **dev_dependencies
            }

            if "vite" in all_dependencies:
                return {
                    "success": True,
                    "framework": "react-vite",
                    "message": "React Vite project detected"
                }

            if "next" in all_dependencies:
                return {
                    "success": True,
                    "framework": "nextjs",
                    "message": "Next.js project detected"
                }

            if "express" in all_dependencies:
                return {
                    "success": True,
                    "framework": "express",
                    "message": "Express.js project detected"
                }

        # =====================================================
        # Flask Detection
        # =====================================================

        if "requirements.txt" in files:
            requirements_path = os.path.join(repo_path, "requirements.txt")

            with open(requirements_path, "r", encoding="utf-8") as file:
                requirements_content = file.read().lower()

            possible_flask_files = [
                "app.py",
                "main.py",
                "run.py",
                "wsgi.py"
            ]

            has_flask_dependency = "flask" in requirements_content

            has_flask_entry_file = any(
                file_name in files for file_name in possible_flask_files
            )

            if has_flask_dependency and has_flask_entry_file:
                return {
                    "success": True,
                    "framework": "flask",
                    "message": "Flask project detected"
                }

        # =====================================================
        # Static HTML Detection
        # =====================================================

        if "index.html" in files:
            return {
                "success": True,
                "framework": "static-html",
                "message": "Static HTML project detected"
            }

        # =====================================================
        # Unsupported Framework
        # =====================================================

        return {
            "success": False,
            "framework": None,
            "message": "Unsupported framework"
        }

    except Exception as e:
        return {
            "success": False,
            "framework": None,
            "message": str(e)
        }