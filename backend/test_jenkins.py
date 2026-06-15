from services.jenkins_service import (
    trigger_jenkins_job,
    wait_for_pipeline
)


result = trigger_jenkins_job(
    "https://github.com/Sahil-Reshim/Flask-Docker-App.git"
)

print(result)


queue_id = result["queue_id"]


pipeline = wait_for_pipeline(queue_id)

print(pipeline)