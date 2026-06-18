from pathlib import Path

jenkins_paths = [
    'deployments/48007aa2/jenkinsfile',
    'deployments/832a2585/jenkinsfile',
    'deployments/bc831088/jenkinsfile',
    'deployments/c9bcffb7/jenkinsfile',
    'deployments/cc2dacc9/jenkinsfile',
    'deployments/ff1127ef/jenkinsfile',
]

content = '''pipeline {
    agent any

    parameters {
        string(name: 'REPO_URL', defaultValue: '', description: 'Repository URL')
    }

    environment {
        IMAGE_NAME = "sahilreshim/flask-docker-app"
        CONTAINER_NAME = "flask-container"
    }

    stages {
        stage('Clone Code') {
            steps {
                script {
                    echo "Repo URL sent to Jenkins: ${params.REPO_URL}"
                    if (!params.REPO_URL) {
                        error 'REPO_URL parameter is required'
                    }
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: '*/main']],
                        userRemoteConfigs: [[url: params.REPO_URL]]
                    ])
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $IMAGE_NAME:latest .'
            }
        }

        stage('Login to DockerHub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                }
            }
        }

        stage('Push Image to DockerHub') {
            steps {
                sh 'docker push $IMAGE_NAME:latest'
            }
        }

        stage('Remove Old Container') {
            steps {
                sh 'docker rm -f $CONTAINER_NAME || true'
            }
        }

        stage('Run New Container') {
            steps {
                sh 'docker run -d -p 5000:5000 --name $CONTAINER_NAME $IMAGE_NAME:latest'
            }
        }
    }
}
'''

root = Path(__file__).resolve().parents[1]
for rel in jenkins_paths:
    p = root / rel
    if p.exists():
        p.write_text(content, encoding='utf-8')
        print('Patched', p)
    else:
        print('Missing', p)
