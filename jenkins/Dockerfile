FROM jenkins/jenkins:lts

USER root

RUN apt-get update && \
    apt-get install -y docker.io

CMD ["/usr/local/bin/jenkins.sh"]