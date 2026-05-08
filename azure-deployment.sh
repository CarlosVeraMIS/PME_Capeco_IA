#!/bin/bash

# CAPECO Data Lake - Azure Deployment Script
# Phase 3: Complete Azure infrastructure setup and deployment

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="capeco-prod"
LOCATION="eastus"
REGISTRY_NAME="capecoregistry"
REGISTRY_SKU="Basic"
APP_SERVICE_PLAN="capeco-plan"
APP_SERVICE_NAME="capeco-app"
IMAGE_NAME="capeco-api:latest"
ENVIRONMENT="production"

echo -e "${BLUE}=========================================="
echo "CAPECO Data Lake - Azure Deployment"
echo "==========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
command -v az >/dev/null 2>&1 || { echo -e "${RED}Azure CLI is required but not installed.${NC}"; exit 1; }
echo -e "${GREEN}✓ Azure CLI found${NC}"

# Verify Azure login
if ! az account show > /dev/null 2>&1; then
  echo -e "${YELLOW}Not logged in to Azure. Please log in...${NC}"
  az login
fi

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
echo -e "${GREEN}✓ Logged in to Azure (Subscription: $SUBSCRIPTION_NAME)${NC}"
echo ""

# Step 1: Create Resource Group
echo -e "${YELLOW}Step 1: Creating Resource Group...${NC}"
if az group exists --name $RESOURCE_GROUP --query value -o tsv | grep -q "true"; then
  echo -e "${GREEN}✓ Resource group '$RESOURCE_GROUP' already exists${NC}"
else
  az group create \
    --name $RESOURCE_GROUP \
    --location $LOCATION
  echo -e "${GREEN}✓ Resource group '$RESOURCE_GROUP' created${NC}"
fi
echo ""

# Step 2: Create Container Registry
echo -e "${YELLOW}Step 2: Setting up Container Registry...${NC}"
REGISTRY_LOGIN_SERVER="${REGISTRY_NAME}.azurecr.io"

if az acr show --resource-group $RESOURCE_GROUP --name $REGISTRY_NAME > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Container Registry '$REGISTRY_NAME' already exists${NC}"
else
  az acr create \
    --resource-group $RESOURCE_GROUP \
    --name $REGISTRY_NAME \
    --sku $REGISTRY_SKU
  echo -e "${GREEN}✓ Container Registry '$REGISTRY_NAME' created${NC}"
fi

# Enable admin user for authentication
az acr update \
  --name $REGISTRY_NAME \
  --admin-enabled true

REGISTRY_USERNAME=$(az acr credential show --resource-group $RESOURCE_GROUP --name $REGISTRY_NAME --query "username" -o tsv)
REGISTRY_PASSWORD=$(az acr credential show --resource-group $RESOURCE_GROUP --name $REGISTRY_NAME --query "passwords[0].value" -o tsv)

echo -e "${GREEN}✓ Registry credentials configured${NC}"
echo ""

# Step 3: Create App Service Plan
echo -e "${YELLOW}Step 3: Creating App Service Plan...${NC}"
if az appservice plan show --resource-group $RESOURCE_GROUP --name $APP_SERVICE_PLAN > /dev/null 2>&1; then
  echo -e "${GREEN}✓ App Service Plan '$APP_SERVICE_PLAN' already exists${NC}"
else
  az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RESOURCE_GROUP \
    --sku B1 \
    --is-linux
  echo -e "${GREEN}✓ App Service Plan '$APP_SERVICE_PLAN' created${NC}"
fi
echo ""

# Step 4: Create Web App
echo -e "${YELLOW}Step 4: Creating Web App...${NC}"
if az webapp show --resource-group $RESOURCE_GROUP --name $APP_SERVICE_NAME > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Web App '$APP_SERVICE_NAME' already exists${NC}"
else
  az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --name $APP_SERVICE_NAME \
    --deployment-container-image-name $REGISTRY_LOGIN_SERVER/$IMAGE_NAME
  echo -e "${GREEN}✓ Web App '$APP_SERVICE_NAME' created${NC}"
fi
echo ""

# Step 5: Configure Web App for Container Deployment
echo -e "${YELLOW}Step 5: Configuring Web App for container deployment...${NC}"
az webapp config container set \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name $REGISTRY_LOGIN_SERVER/$IMAGE_NAME \
  --docker-registry-server-url "https://${REGISTRY_LOGIN_SERVER}" \
  --docker-registry-server-user $REGISTRY_USERNAME \
  --docker-registry-server-password $REGISTRY_PASSWORD

echo -e "${GREEN}✓ Web App configured${NC}"
echo ""

# Step 6: Configure Application Settings
echo -e "${YELLOW}Step 6: Configuring application settings...${NC}"
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --settings \
    STORAGE_MODE="local" \
    LOG_LEVEL="info" \
    REDIS_HOST="" \
    WEBSITES_PORT=8000 \
    DOCKER_REGISTRY_SERVER_URL="https://${REGISTRY_LOGIN_SERVER}" \
    DOCKER_REGISTRY_SERVER_USERNAME=$REGISTRY_USERNAME \
    DOCKER_REGISTRY_SERVER_PASSWORD=$REGISTRY_PASSWORD

echo -e "${GREEN}✓ Application settings configured${NC}"
echo ""

# Step 7: Enable continuous deployment (optional)
echo -e "${YELLOW}Step 7: Setting up monitoring and diagnostics...${NC}"
az webapp log config \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --docker-container-logging filesystem \
  --level information

echo -e "${GREEN}✓ Logging configured${NC}"
echo ""

# Step 8: Get Web App URL
WEB_APP_URL=$(az webapp show --resource-group $RESOURCE_GROUP --name $APP_SERVICE_NAME --query "defaultHostName" -o tsv)

echo -e "${BLUE}=========================================="
echo "Deployment Configuration Complete"
echo "==========================================${NC}"
echo ""
echo -e "${GREEN}Resource Group:${NC}      $RESOURCE_GROUP"
echo -e "${GREEN}Location:${NC}           $LOCATION"
echo -e "${GREEN}Container Registry:${NC} $REGISTRY_LOGIN_SERVER"
echo -e "${GREEN}App Service:${NC}        $APP_SERVICE_NAME"
echo -e "${GREEN}Web App URL:${NC}        https://$WEB_APP_URL"
echo ""

# Step 9: Build and Push Image
echo -e "${YELLOW}Step 9: Build and push Docker image...${NC}"
echo -e "${BLUE}Command to run from your machine:${NC}"
echo ""
echo "  az acr build --registry $REGISTRY_NAME --image $IMAGE_NAME ."
echo ""
echo -e "${YELLOW}Or use Docker directly:${NC}"
echo ""
echo "  docker build -t $REGISTRY_LOGIN_SERVER/$IMAGE_NAME ."
echo "  docker login $REGISTRY_LOGIN_SERVER --username $REGISTRY_USERNAME --password <password>"
echo "  docker push $REGISTRY_LOGIN_SERVER/$IMAGE_NAME"
echo ""

echo -e "${BLUE}=========================================="
echo "Next Steps"
echo "==========================================${NC}"
echo ""
echo "1. Build and push the Docker image using Azure CLI or Docker"
echo "2. The Web App will automatically pull and deploy the latest image"
echo "3. Monitor deployment progress in Azure Portal"
echo "4. Test the API at: https://$WEB_APP_URL/health"
echo "5. Access API docs at: https://$WEB_APP_URL/docs"
echo ""

# Create environment file for future reference
cat > .env.azure << EOF
AZURE_SUBSCRIPTION_ID=$SUBSCRIPTION_ID
AZURE_RESOURCE_GROUP=$RESOURCE_GROUP
AZURE_REGISTRY_NAME=$REGISTRY_NAME
AZURE_REGISTRY_LOGIN_SERVER=$REGISTRY_LOGIN_SERVER
AZURE_APP_SERVICE_PLAN=$APP_SERVICE_PLAN
AZURE_APP_SERVICE_NAME=$APP_SERVICE_NAME
AZURE_WEB_APP_URL=https://$WEB_APP_URL
REGISTRY_USERNAME=$REGISTRY_USERNAME
REGISTRY_PASSWORD=$REGISTRY_PASSWORD
EOF

echo -e "${GREEN}✓ Azure configuration saved to .env.azure${NC}"
echo ""
