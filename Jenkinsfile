pipeline {
    agent any

    environment {
        IMAGE_NAME = "chat-app"
        CONTAINER_NAME = "chat-app"
        HOST_PORT = "3000"
        CONTAINER_PORT = "3000"
    }

    stages {
        stage('Build Docker image') {
            steps {
                echo "🔧 Budowanie obrazu Dockera..."
                sh "docker build -t $IMAGE_NAME ."
            }
        }

        stage('Stop & Remove old container') {
            steps {
                echo "🧹 Usuwanie starego kontenera..."
                sh """
                    docker stop $CONTAINER_NAME || true
                    docker rm $CONTAINER_NAME || true
                """
            }
        }

        stage('Run new container') {
            steps {
                echo "🚀 Uruchamianie kontenera..."
                sh "docker run -d --name $CONTAINER_NAME -p $HOST_PORT:$CONTAINER_PORT $IMAGE_NAME"
            }
        }
    }

    post {
        success {
            echo "✅ Build zakończony sukcesem!"
        }
        failure {
            echo "❌ Błąd w pipeline – sprawdź logi."
        }
    }
}
