# CAPECO Data Lake — Phase 3 Deployment Guide
## Complete Azure Deployment & Stakeholder Demo

**Date:** 2026-05-06  
**Phase:** 3 of 3 (Final Deployment)  
**Status:** Ready for Deployment  
**Timeline:** May 27-28, 2026  

---

## Overview

Phase 3 delivers the complete CAPECO Data Lake system to Azure production, ready for stakeholder demonstration. This guide covers:

1. Docker containerization
2. Azure infrastructure setup
3. CI/CD pipeline configuration
4. Production deployment
5. Monitoring and alerts
6. Stakeholder demonstration
7. Team handoff

---

## Phase 3 Files Created

| File | Purpose | Status |
|------|---------|--------|
| `Dockerfile` | Multi-stage Docker build | ✓ Created |
| `requirements_phase3.txt` | Python dependencies for API | ✓ Created |
| `.dockerignore` | Docker build optimization | ✓ Created |
| `docker-compose.yml` | Local testing with services | ✓ Created |
| `azure-pipelines.yml` | CI/CD pipeline | ✓ Created |
| `azure-deployment.sh` | Azure resource provisioning | ✓ Created |
| `PHASE3_DEPLOYMENT_GUIDE.md` | This guide | ✓ Created |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│         CAPECO DATA LAKE - PRODUCTION STACK         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Local Development → Git → Azure DevOps → Azure    │
│                      ↓                               │
│                 CI/CD Pipeline                      │
│                      ↓                               │
│  ┌─────────────────────────────────────┐           │
│  │   Azure Container Registry          │           │
│  │   (capecoregistry.azurecr.io)       │           │
│  └────────────────┬────────────────────┘           │
│                   ↓                                 │
│  ┌─────────────────────────────────────┐           │
│  │   Azure App Service (capeco-app)    │           │
│  │   ├─ FastAPI REST API (port 8000)   │           │
│  │   ├─ Dashboard (served by nginx)    │           │
│  │   ├─ Health checks enabled          │           │
│  │   └─ Auto-scaling configured        │           │
│  └────────────────┬────────────────────┘           │
│                   ↓                                 │
│  ┌─────────────────────────────────────┐           │
│  │   Azure Storage Account (optional)  │           │
│  │   └─ Data Lake Storage Gen2         │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  Monitoring & Logging:                             │
│  ├─ Application Insights                           │
│  ├─ Azure Monitor                                  │
│  └─ Log Analytics                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Step 1: Docker Build & Testing

### 1.1 Build Docker Image Locally

```bash
cd /Users/carlosvera/Library/CloudStorage/OneDrive-MSFT/mis/IA/capeco

# Build the image
docker build -t capeco-api:latest .

# Check build success
docker images | grep capeco-api
```

**Expected Output:**
```
REPOSITORY   TAG      IMAGE ID       CREATED        SIZE
capeco-api   latest   abc123def456   X seconds ago   450MB
```

### 1.2 Test Image Locally

```bash
# Run the container
docker run -p 8000:8000 capeco-api:latest

# In another terminal, test endpoints
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/gold/projects
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-06T18:00:00Z",
  "rows_available": 3289
}
```

### 1.3 Test with Docker Compose (Optional)

```bash
# Start all services
docker-compose up -d

# Check services
docker-compose ps

# Test the stack
curl http://localhost:9000/dashboard.html    # Dashboard
curl http://localhost:8000/health              # API health
curl http://localhost:6379/                    # Redis (optional)

# View logs
docker-compose logs -f capeco-api

# Stop services
docker-compose down
```

---

## Step 2: Azure Infrastructure Setup

### 2.1 Prerequisites

Before running the deployment script, ensure:

1. Azure subscription is active
2. Azure CLI is installed: `az --version`
3. User has sufficient permissions (Contributor role minimum)
4. Logged in to Azure: `az login`

### 2.2 Automated Setup (Recommended)

```bash
# Make script executable
chmod +x azure-deployment.sh

# Run deployment script
./azure-deployment.sh

# Expected output includes:
# ✓ Resource group created
# ✓ Container registry created
# ✓ App service plan created
# ✓ Web app created
# ✓ Configuration complete
# Azure Web App URL: https://capeco-app.azurewebsites.net
```

**Script Creates:**
- Resource Group: `capeco-prod` (East US)
- Container Registry: `capecoregistry` (Basic tier)
- App Service Plan: `capeco-plan` (B1 Linux)
- Web App: `capeco-app`
- Logging and monitoring configuration

### 2.3 Manual Setup (Alternative)

If you prefer manual setup, use these Azure CLI commands:

```bash
# Set variables
RESOURCE_GROUP="capeco-prod"
LOCATION="eastus"
REGISTRY_NAME="capecoregistry"
APP_SERVICE_PLAN="capeco-plan"
APP_SERVICE_NAME="capeco-app"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create container registry
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $REGISTRY_NAME \
  --sku Basic \
  --admin-enabled true

# Create app service plan
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $APP_SERVICE_NAME \
  --deployment-container-image-name $REGISTRY_NAME.azurecr.io/capeco-api:latest
```

---

## Step 3: Build and Push Docker Image to Azure

### 3.1 Using Azure CLI (Recommended)

```bash
cd /Users/carlosvera/Library/CloudStorage/OneDrive-MSFT/mis/IA/capeco

# Build and push directly to Azure Container Registry
az acr build \
  --registry capecoregistry \
  --image capeco-api:latest \
  --image capeco-api:$(date +%Y%m%d_%H%M%S) \
  .

# Verify image in registry
az acr repository list --name capecoregistry
```

### 3.2 Using Docker (Alternative)

```bash
# Login to Azure Container Registry
az acr login --name capecoregistry

# Tag the image
docker tag capeco-api:latest capecoregistry.azurecr.io/capeco-api:latest

# Push to registry
docker push capecoregistry.azurecr.io/capeco-api:latest

# Verify
az acr repository show-tags --name capecoregistry --repository capeco-api
```

---

## Step 4: Deploy to Azure App Service

### 4.1 Configure Web App

```bash
# Set container settings
az webapp config container set \
  --resource-group capeco-prod \
  --name capeco-app \
  --docker-custom-image-name capecoregistry.azurecr.io/capeco-api:latest \
  --docker-registry-server-url https://capecoregistry.azurecr.io

# Get registry credentials
USERNAME=$(az acr credential show \
  --resource-group capeco-prod \
  --name capecoregistry \
  --query "username" -o tsv)

PASSWORD=$(az acr credential show \
  --resource-group capeco-prod \
  --name capecoregistry \
  --query "passwords[0].value" -o tsv)

# Set registry credentials in web app
az webapp config container set \
  --resource-group capeco-prod \
  --name capeco-app \
  --docker-registry-server-user $USERNAME \
  --docker-registry-server-password $PASSWORD
```

### 4.2 Configure Application Settings

```bash
az webapp config appsettings set \
  --resource-group capeco-prod \
  --name capeco-app \
  --settings \
    STORAGE_MODE="local" \
    LOG_LEVEL="info" \
    WEBSITES_PORT=8000
```

### 4.3 Restart Web App

```bash
az webapp restart \
  --resource-group capeco-prod \
  --name capeco-app

# Wait for restart (2-3 minutes)
sleep 180

# Check status
az webapp show \
  --resource-group capeco-prod \
  --name capeco-app \
  --query "state" -o tsv
```

---

## Step 5: Verify Deployment

### 5.1 Health Check

```bash
# Get web app URL
WEBAPP_URL=$(az webapp show \
  --resource-group capeco-prod \
  --name capeco-app \
  --query "defaultHostName" -o tsv)

echo "Web App URL: https://$WEBAPP_URL"

# Test health endpoint
curl -s https://$WEBAPP_URL/health | python -m json.tool

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2026-05-06T18:00:00Z",
#   "rows_available": 3289
# }
```

### 5.2 API Endpoint Tests

```bash
# List projects
curl -s https://$WEBAPP_URL/api/v1/gold/projects?limit=10 | python -m json.tool

# Get metrics
curl -s https://$WEBAPP_URL/api/v1/gold/metrics | python -m json.tool

# Access API documentation
echo "API Docs: https://$WEBAPP_URL/docs"
```

### 5.3 View Logs

```bash
# Stream logs
az webapp log tail \
  --resource-group capeco-prod \
  --name capeco-app

# Show application logs
az webapp log show \
  --resource-group capeco-prod \
  --name capeco-app
```

---

## Step 6: Monitoring & Alerts

### 6.1 Enable Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app capeco-monitoring \
  --resource-group capeco-prod \
  --application-type web \
  --location eastus

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app capeco-monitoring \
  --resource-group capeco-prod \
  --query "instrumentationKey" -o tsv)

# Add to web app
az webapp config appsettings set \
  --resource-group capeco-prod \
  --name capeco-app \
  --settings \
    APPINSIGHTS_INSTRUMENTATIONKEY=$INSTRUMENTATION_KEY \
    ApplicationInsightsAgent_EXTENSION_VERSION=~3
```

### 6.2 Create Monitoring Alerts

```bash
# Alert for 5xx errors
az monitor metrics alert create \
  --name "CAPECO-500-Errors" \
  --resource-group capeco-prod \
  --scopes /subscriptions/$(az account show --query id -o tsv)/resourceGroups/capeco-prod/providers/Microsoft.Web/sites/capeco-app \
  --condition "avg Http5xx > 5" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --description "Alert when API returns 5+ 500 errors in 5 minutes"

# Alert for high response time
az monitor metrics alert create \
  --name "CAPECO-High-Response-Time" \
  --resource-group capeco-prod \
  --scopes /subscriptions/$(az account show --query id -o tsv)/resourceGroups/capeco-prod/providers/Microsoft.Web/sites/capeco-app \
  --condition "avg ResponseTime > 5000" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --description "Alert when API response time exceeds 5 seconds"
```

---

## Step 7: Stakeholder Demo Preparation

### 7.1 Demo Environment

```bash
# Create demo script
cat > DEMO_SCRIPT.md << 'EOF'
# CAPECO Data Lake - Stakeholder Demo Script

## Introduction (2 minutes)
- Welcome stakeholders
- Project overview
- Timeline: 22 days from concept to production

## System Architecture (3 minutes)
- Show architecture diagram
- Explain medallion architecture (Bronze-Silver-Gold)
- Highlight governance agents
- Show data flow

## Live Demo (8 minutes)

### 1. Dashboard (3 minutes)
- Open dashboard at https://capeco-app.azurewebsites.net
- Show KPI cards (Total Projects, Value, Price Distribution)
- Demonstrate chart interactivity
- Show data tables
- Click refresh button

### 2. API Documentation (2 minutes)
- Open API docs at https://capeco-app.azurewebsites.net/docs
- Show available endpoints
- Demonstrate Try It Out feature
- Show response schemas

### 3. Performance (3 minutes)
- Show response times (<100ms)
- Demonstrate pagination
- Show cache effectiveness
- Explain governance validation

## Questions & Discussion (5 minutes)
- Ask for feedback
- Discuss next steps
- Address concerns
- Collect requirements for next phase

## Closing (1 minute)
- Thank stakeholders
- Provide contact information
- Set up follow-up meetings
EOF
```

### 7.2 Demo Data Verification

```bash
# Verify data is accessible
curl -s https://capeco-app.azurewebsites.net/api/v1/gold/metrics | python -m json.tool | head -20

# Check data freshness
curl -s https://capeco-app.azurewebsites.net/health | python -m json.tool

# Test all endpoints
echo "Testing all endpoints..."
for endpoint in "/health" "/api/v1/gold/projects" "/api/v1/gold/metrics" "/api/v1/gold/districts" "/api/v1/gold/market-tiers"; do
  echo "Testing: $endpoint"
  curl -s "https://capeco-app.azurewebsites.net$endpoint" > /dev/null && echo "✓ OK" || echo "✗ FAILED"
done
```

---

## Step 8: Production Deployment Checklist

### Pre-Deployment
- [ ] Docker image built and tested locally
- [ ] All environment variables configured
- [ ] Database credentials secured in Key Vault
- [ ] Monitoring and alerts configured
- [ ] Demo script prepared
- [ ] Team trained on operation

### Deployment
- [ ] Azure resources created (resource group, registry, app service)
- [ ] Docker image pushed to container registry
- [ ] Web app configured with image
- [ ] Application settings configured
- [ ] Health checks passing
- [ ] API endpoints responding

### Post-Deployment
- [ ] Monitor first 24 hours of logs
- [ ] Verify all endpoints working
- [ ] Check alert configuration
- [ ] Run stakeholder demo
- [ ] Collect feedback
- [ ] Document any issues
- [ ] Prepare production documentation

### Operational
- [ ] On-call rotation established
- [ ] Incident response procedures documented
- [ ] Backup strategy verified
- [ ] Disaster recovery plan tested
- [ ] Team handoff completed

---

## Step 9: Operational Runbook

### Starting/Stopping Services

```bash
# Start the web app
az webapp start \
  --resource-group capeco-prod \
  --name capeco-app

# Stop the web app
az webapp stop \
  --resource-group capeco-prod \
  --name capeco-app

# Restart the web app
az webapp restart \
  --resource-group capeco-prod \
  --name capeco-app
```

### Updating the Application

```bash
# Update and push new image
docker build -t capeco-api:latest .
docker tag capeco-api:latest capecoregistry.azurecr.io/capeco-api:v1.0.0
docker push capecoregistry.azurecr.io/capeco-api:v1.0.0

# Deploy new version
az webapp config container set \
  --resource-group capeco-prod \
  --name capeco-app \
  --docker-custom-image-name capecoregistry.azurecr.io/capeco-api:v1.0.0

# Restart to apply changes
az webapp restart \
  --resource-group capeco-prod \
  --name capeco-app
```

### Troubleshooting

```bash
# View recent errors
az webapp log tail \
  --resource-group capeco-prod \
  --name capeco-app --provider docker

# Check web app health
az webapp show \
  --resource-group capeco-prod \
  --name capeco-app \
  --query "{state:state, healthCheckPath:siteConfig.healthCheckPath}"

# Restart if needed
az webapp restart \
  --resource-group capeco-prod \
  --name capeco-app
```

---

## Step 10: Team Handoff & Documentation

### Documentation Created
- Architecture documentation
- Deployment procedures
- Operational runbook
- Troubleshooting guide
- API documentation
- Dashboard user guide

### Team Training
- [ ] DevOps team trained on Azure resources
- [ ] Support team trained on troubleshooting
- [ ] Product team trained on demo
- [ ] Engineering team trained on updates
- [ ] All teams have access to documentation

### Knowledge Transfer
- [ ] Runbook reviewed with on-call team
- [ ] Alert configuration understood
- [ ] Escalation procedures documented
- [ ] Contact information shared
- [ ] Follow-up meeting scheduled

---

## Success Criteria

✓ **Deployment Success**
- API server responding with <200ms latency
- Dashboard loading in <3 seconds
- All governance agents operational
- Health checks passing
- Monitoring alerts functional

✓ **Demo Success**
- Stakeholders understand the system
- Dashboard features demonstrated
- API capabilities shown
- Questions answered
- Positive feedback received

✓ **Operational Readiness**
- Monitoring active and alerting
- Logs accessible and structured
- Backup strategy verified
- Team trained and ready
- On-call rotation established

---

## Timeline

| Date | Activity | Duration |
|------|----------|----------|
| May 27 | Docker build & test | 2 hours |
| May 27 | Azure setup | 1.5 hours |
| May 27 | Image push to registry | 30 minutes |
| May 27 | Deployment to App Service | 1 hour |
| May 27 | Testing & verification | 1 hour |
| May 28 | Demo preparation | 1 hour |
| May 28 | Stakeholder demo | 1.5 hours |
| May 28 | Documentation & handoff | 2 hours |

**Total: ~11 hours across 2 days**

---

## Success Metrics

| Metric | Target | Owner |
|--------|--------|-------|
| API availability | 99.5% | DevOps |
| Response time (p95) | <200ms | Backend |
| Dashboard load time | <3s | Frontend |
| Stakeholder satisfaction | >8/10 | Product |
| Demo completion | 100% | Product |
| Team readiness | 100% | Engineering |

---

## Contact & Support

**Project Manager:** Carlos Vera  
**Email:** carlos.j.vera.d@gmail.com  
**Slack:** #capeco-datalake  

**For Questions:**
- Technical: Review PHASE3_DEPLOYMENT_GUIDE.md (this file)
- Operations: See production runbook section above
- Demo: Reference DEMO_SCRIPT.md

---

## Sign-Off

Phase 3 Deployment Guide is complete and ready for execution.

**Status:** ✓ READY FOR DEPLOYMENT  
**Date Created:** 2026-05-06  
**Target Completion:** 2026-05-28  
**Overall Project:** 73% → 100% upon Phase 3 completion  

---

🎉 **CAPECO DATA LAKE - PHASE 3 DEPLOYMENT READY** 🎉
