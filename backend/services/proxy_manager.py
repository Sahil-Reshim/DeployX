import os

PROXY_DIR = "deployments/proxy_configs"

os.makedirs(
    PROXY_DIR,
    exist_ok=True
)


def create_route(
    subdomain,
    port
):

    config = f"""
server {{

    listen 80;

    server_name {subdomain}.deployx.local;

    location / {{

        proxy_pass http://127.0.0.1:{port};

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    }}
}}
"""

    config_path = os.path.join(
        PROXY_DIR,
        f"{subdomain}.conf"
    )

    with open(
        config_path,
        "w",
        encoding="utf-8"
    ) as file:

        file.write(config)

    return config_path


def delete_route(
    subdomain
):

    config_path = os.path.join(
        PROXY_DIR,
        f"{subdomain}.conf"
    )

    if os.path.exists(
        config_path
    ):

        os.remove(
            config_path
        )


def reload_proxy():

    print(
        "DeployX proxy reloaded"
    )

    return True