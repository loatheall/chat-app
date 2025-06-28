pipeline {
    agent any

    environment {
        IMAGE_NAME = "chat-app"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'master', url: 'http://localhost:8080/narzedzia_projekt/chat-app.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $IMAGE_NAME .'
            }
        }

        stage('Run Container') {
            steps {
                sh '''
                    docker stop $IMAGE_NAME || true
                    docker rm $IMAGE_NAME || true
                    docker run -d --name $IMAGE_NAME -p 3000:3000 $IMAGE_NAME
                '''
            }
        }
    }
}
