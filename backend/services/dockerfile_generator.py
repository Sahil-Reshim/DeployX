import os


def dockerfile_exists(repo_path):
    dockerfile_path = os.path.join(repo_path, "Dockerfile")
    return os.path.exists(dockerfile_path)


def generate_dockerfile(repo_path, framework):
    try:
        dockerfile_path = os.path.join(repo_path, "Dockerfile")

        if dockerfile_exists(repo_path):
            return {
                "success": True,
                "generated": False,
                "message": "Dockerfile already exists"
            }

        if framework == "flask":
            dockerfile_content = """FROM python:3.11-alpine

WORKDIR /app

COPY . .

RUN pip install -r requirements.txt

EXPOSE 5000

CMD ["python", "app.py"]
"""

        elif framework == "react-vite":
            dockerfile_content = """FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
"""

        else:
            return {
                "success": False,
                "generated": False,
                "message": f"Dockerfile generation not supported for framework: {framework}"
            }

        with open(dockerfile_path, "w", encoding="utf-8") as file:
            file.write(dockerfile_content)

        return {
            "success": True,
            "generated": True,
            "message": f"Dockerfile generated successfully for {framework}"
        }

    except Exception as e:
        return {
            "success": False,
            "generated": False,
            "message": str(e)
        }