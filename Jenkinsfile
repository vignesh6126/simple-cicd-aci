pipeline {
    agent any

    environment {
        DOCKER_CREDS = credentials('docker-id')   // <-- Your Docker Hub credential
        AZ_CLIENT_ID = credentials('AZ_CLIENT_ID')
        AZ_CLIENT_SECRET = credentials('AZ_CLIENT_SECRET')
        AZ_TENANT_ID = credentials('AZ_TENANT_ID')
    }

    stages {

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t vignesg043/node-demo:latest .'
            }
        }

        stage('Login & Push to Docker Hub') {
            steps {
                bat """
                    echo ${DOCKER_CREDS_PSW} | docker login -u ${DOCKER_CREDS_USR} --password-stdin
                    docker push vignesg043/node-demo:latest
                """
            }
        }

        stage('Azure Login') {
            steps {
                bat """
                    az login --service-principal -u ${AZ_CLIENT_ID} -p ${AZ_CLIENT_SECRET} --tenant ${AZ_TENANT_ID}
                """
            }
        }

        stage('Deploy to ACI') {
            steps {
                bat """
                    az group create --name node-rg --location centralindia

                    az container delete --resource-group node-rg --name node-app --yes || echo 'No old container'

                    az container create ^
                        --resource-group node-rg ^
                        --name node-app ^
                        --image vignesg043/node-demo:latest ^
                        --dns-name-label node${BUILD_NUMBER} ^
                        --ports 3000 ^
                        --os-type Linux ^
                        --registry-username ${DOCKER_CREDS_USR} ^
                        --registry-password ${DOCKER_CREDS_PSW}
                """
            }
        }

        stage('Get App URL') {
            steps {
                bat 'az container show --resource-group node-rg --name node-app --query ipAddress.fqdn -o tsv'
            }
        }
    }
}
