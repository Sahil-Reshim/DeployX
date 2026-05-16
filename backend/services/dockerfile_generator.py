import os


def dockerfile_exists(repo_path):
    dockerfile_path = os.path.join(repo_path, "Dockerfile")
    return os.path.exists(dockerfile_path)


DOCKERFILES = {
    "flask": {
        "port": 5000,
        "content": """FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

ENV FLASK_ENV=production

CMD ["python", "app.py"]
"""
    },

    "react-vite": {
        "port": 80,
        "content": """FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo 'server { \\
    listen 80; \\
    root /usr/share/nginx/html; \\
    index index.html; \\
    location / { try_files $uri $uri/ /index.html; } \\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
"""
    },

    "nextjs": {
        "port": 3000,
        "content": """FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
"""
    },

    "express": {
        "port": 3000,
        "content": """FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
"""
    },

    "static-html": {
        "port": 80,
        "content": """FROM nginx:alpine

COPY . /usr/share/nginx/html

RUN echo 'server { \\
    listen 80; \\
    root /usr/share/nginx/html; \\
    index index.html; \\
    location / { try_files $uri $uri/ /index.html; } \\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
"""
    },

    "node": {
        "port": 3000,
        "content": """FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
"""
    },
}


def generate_dockerfile(repo_path, framework):
    try:
        dockerfile_path = os.path.join(repo_path, "Dockerfile")

        if dockerfile_exists(repo_path):
            return {
                "success": True,
                "generated": False,
                "message": "Dockerfile already exists"
            }

        template = DOCKERFILES.get(framework)

        if not template:
            return {
                "success": False,
                "generated": False,
                "message": f"Dockerfile generation not supported for framework: {framework}"
            }

        # For Express: try to detect entry file
        if framework == "express":
            entry_candidates = ["index.js", "server.js", "app.js", "main.js"]
            files = os.listdir(repo_path)
            entry_file = next((f for f in entry_candidates if f in files), None)
            content = template["content"]
            if entry_file and entry_file != "index.js":
                content = content.replace(
                    'CMD ["node", "index.js"]',
                    f'CMD ["node", "{entry_file}"]'
                )
        else:
            content = template["content"]

        with open(dockerfile_path, "w", encoding="utf-8") as file:
            file.write(content)

        return {
            "success": True,
            "generated": True,
            "port": template["port"],
            "message": f"Dockerfile generated successfully for {framework}"
        }

    except Exception as e:
        return {
            "success": False,
            "generated": False,
            "message": str(e)
        }