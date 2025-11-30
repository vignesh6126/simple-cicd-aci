pipeline {
    agent any

    environment {
        DOCKER_USER          = credentials('docker-user')
        DOCKER_PASS          = credentials('docker-pass')

        AZ_CLIENT_ID         = credentials('AZURE_CLIENT_ID')
        AZ_CLIENT_SECRET     = credentials('AZURE_CLIENT_SECRET')
        AZ_TENANT_ID         = credentials('AZURE_TENANT_ID')
        AZ_SUBSCRIPTION_ID   = credentials('AZURE_SUBSCRIPTION_ID')

        IMAGE_NAME           = "vignesg043/node-demo"
        IMAGE_TAG            = "latest"
        RESOURCE_GROUP       = "node-rg"
        CONTAINER_NAME       = "node-app"
        LOCATION             = "eastus"
        PORT                 = "3000"
    }

    stages {

        stage('Install Dependencies') {
            steps {
                bat "npm install"
            }
        }

        stage('Build Docker Image') {
            steps {
                bat """
                    docker build -t %IMAGE_NAME%:%IMAGE_TAG% .
                """
            }
        }

        stage('Login & Push to Docker Hub') {
            steps {
                bat """
                    echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                    docker push %IMAGE_NAME%:%IMAGE_TAG%
                """
            }
        }

        stage('Azure Login') {
            steps {
                bat """
                    az login --service-principal -u %AZ_CLIENT_ID% -p %AZ_CLIENT_SECRET% --tenant %AZ_TENANT_ID%
                    az account set --subscription %AZ_SUBSCRIPTION_ID%
                """
            }
        }

        stage('Deploy to ACI') {
            steps {
                bat """
                    REM Create RG (if already exists, ignore error)
                    az group create --name %RESOURCE_GROUP% --location %LOCATION%

                    REM Delete old container if exists
                    az container delete --resource-group %RESOURCE_GROUP% --name %CONTAINER_NAME% --yes --no-wait

                    REM Create new container
                    az container create ^
                        --resource-group %RESOURCE_GROUP% ^
                        --name %CONTAINER_NAME% ^
                        --image %IMAGE_NAME%:%IMAGE_TAG% ^
                        --dns-name-label node%RANDOM% ^
                        --ports %PORT% ^
                        --registry-username %DOCKER_USER% ^
                        --registry-password %DOCKER_PASS%
                """
            }
        }

        stage('Get App URL') {
            steps {
                bat """
                    az container show ^
                        --resource-group %RESOURCE_GROUP% ^
                        --name %CONTAINER_NAME% ^
                        --query ipAddress.fqdn -o tsv
                """
            }
        }
    }
}
