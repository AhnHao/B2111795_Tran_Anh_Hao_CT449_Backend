pipeline {
    agent any
    
    environment {
        APP_NAME = 'library-backend-app'
        DOCKER_IMAGE = "anhhao/${APP_NAME}"
        DOCKER_TAG = "${BUILD_NUMBER}"
        MONGODB_URI = credentials('MONGODB_URI')
        JWT_SECRET = credentials('JWT_SECRET')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                }
            }
        }

        stage('Clean Old Container') {
            steps {
                script {
                    sh '''
                        docker stop ${APP_NAME} || true
                        docker rm ${APP_NAME} || true
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                sh """
                    docker run -d \
                        --name ${APP_NAME} \
                        --restart always \
                        -p 3000:3000 \
                        -e MONGODB_URI=\${MONGODB_URI} \
                        -e JWT_SECRET=\${JWT_SECRET} \
                        ${DOCKER_IMAGE}:${DOCKER_TAG}
                """
            }
        }
    }

    post {
        always {
            sh 'docker logout'
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
