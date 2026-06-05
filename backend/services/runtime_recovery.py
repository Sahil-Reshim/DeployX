import docker

from managers.state_manager import (
    set_state
)

from services.monitor_service import (
    start_monitoring
)

from services.deployment_service import (
    get_all_deployments
)

client = docker.from_env()


def restore_runtime_states():

    print("\n========== RESTORING RUNTIME STATES ==========\n")

    deployments = get_all_deployments()

    restored = 0

    for deployment in deployments:

        try:

            deployment_id = deployment.get(
                "id"
            )

            status = deployment.get(
                "status"
            )

            container_id = deployment.get(
                "container_id"
            )

            # Only restore active deployments
            if status not in [
                "live",
                "running"
            ]:
                continue

            if not container_id:
                continue

            try:

                container = client.containers.get(
                    container_id
                )

            except Exception:

                print(
                    f"[SKIPPED] Deployment {deployment_id} container missing"
                )

                continue

            container.reload()

            if container.status != "running":

                print(
                    f"[SKIPPED] Deployment {deployment_id} container not running"
                )

                continue

            # =========================================
            # RESTORE IN-MEMORY STATE
            # =========================================

            set_state(
                str(deployment_id),
                {
                    "container_id": container_id,

                    "status": "running",

                    "internal_port": None,

                    "public_port": deployment.get(
                        "assigned_port"
                    ),

                    "assigned_port": deployment.get(
                        "assigned_port"
                    ),

                    "subdomain": deployment.get(
                        "subdomain"
                    ),

                    "custom_url": deployment.get(
                        "custom_url"
                    ),

                    "monitoring_active": True,

                    "log_streaming": True
                }
            )

            # =========================================
            # RESTART MONITORING
            # =========================================

            start_monitoring(
                deployment_id,
                container_id
            )

            restored += 1

            print(
                f"[RESTORED] Deployment {deployment_id}"
            )

        except Exception as e:

            print(
                f"[RESTORE ERROR] {deployment.get('id')} -> {str(e)}"
            )

    print(
        f"\n========== RESTORED {restored} DEPLOYMENTS ==========\n"
    )