FROM jenkins/jenkins:lts

USER root

RUN apt-get update && \
    apt-get install -y docker.io && \
    rm -rf /var/lib/apt/lists/*

# Install the Pipeline (workflow) plugin suite so the DeployX
# `flask-docker-build` Declarative Pipeline job can be created and
# executed. (Base jenkins/jenkins:lts does NOT ship the Pipeline
# plugin; without it the backend's job never exists.)
RUN jenkins-plugin-cli --plugins "workflow-aggregator" "git" "plain-credentials"

CMD ["/usr/local/bin/jenkins.sh"]