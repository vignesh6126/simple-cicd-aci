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
        CONTAINER_NAME       = "node-app-${BUILD_NUMBER}"
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
                    echo ------------------------------
                    echo CREATING RESOURCE GROUP
                    echo ------------------------------
                    az group create --name %RESOURCE_GROUP% --location %LOCATION%
                    
                    echo ------------------------------
                    echo DEPLOYING CONTAINER INSTANCE
                    echo ------------------------------
                    az container create ^
                        --resource-group %RESOURCE_GROUP% ^
                        --name %CONTAINER_NAME% ^
                        --image %IMAGE_NAME%:%IMAGE_TAG% ^
                        --dns-name-label node-app-%BUILD_NUMBER% ^
                        --ports %PORT% ^
                        --registry-username %DOCKER_USER% ^
                        --registry-password %DOCKER_PASS% ^
                        --environment-variables PORT=%PORT% ^
                        --restart-policy Always ^
                        --cpu 1 ^
                        --memory 1
                    
                    echo "Container deployment completed!"
                """
            }
        }

        stage('Wait for Container') {
            steps {
                bat """
                    echo "Waiting for container to be ready..."
                    ping -n 30 127.0.0.1 > nul
                    echo "Container should be ready now"
                """
            }
        }

        stage('Get App URL') {
            steps {
                script {
                    def fqdn = bat(
                        script: """
                            az container show ^
                                --resource-group %RESOURCE_GROUP% ^
                                --name %CONTAINER_NAME% ^
                                --query ipAddress.fqdn -o tsv
                        """,
                        returnStdout: true
                    ).trim()
                    
                    if (fqdn) {
                        echo "Application URL: http://${fqdn}:${PORT}"
                        env.APP_URL = "http://${fqdn}:${PORT}"
                    } else {
                        error "Failed to get application URL"
                    }
                }
            }
        }
    }

    post {
        always {
            echo "Build completed - ${currentBuild.result}"
        }
        success {
            echo "Deployment successful! App URL: ${env.APP_URL}"
        }
        failure {
            echo "Deployment failed! Checking container status..."
            bat """
                echo "Listing all containers in resource group:"
                az container list --resource-group %RESOURCE_GROUP% --output table
            """
        }
    }
}