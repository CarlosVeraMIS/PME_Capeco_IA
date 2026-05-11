# CAPECO Data Lake — Sprint 3 Phase 3 Plan
## Azure Deployment & Stakeholder Demo

**Status:** READY TO START  
**Planned Duration:** 2 days (D27-D28)  
**Target Completion:** 2026-05-28  

---

## Overview

Phase 3 son dos objetivos principales:
1. **Deployment a Azure** — Container con API + Dashboard en Azure App Service
2. **Stakeholder Demo** — Presentación funcional del sistema completo

Al final de Phase 3, el CAPECO Data Lake estará completamente en producción en Azure, listo para ser usado por los stakeholders.

---

## Phase 3 Deliverables

### 1. Dockerfile (20 lines)

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Acceptance Criteria:**
- [ ] Dockerfile builds successfully
- [ ] Container runs without errors
- [ ] API server accessible on port 8000
- [ ] Health check returns healthy status

### 2. requirements.txt

```
fastapi==0.104.1
uvicorn==0.24.0
pandas==2.1.3
pyarrow==14.0.0
redis==5.0.0
```

### 3. Azure Setup Script

```bash
# Create Azure Resource Group
az group create --name capeco-prod --location eastus

# Create Container Registry
az acr create --resource-group capeco-prod \
  --name capecoregistry --sku Basic

# Create App Service Plan
az appservice plan create --name capeco-plan \
  --resource-group capeco-prod --sku B1 --is-linux

# Create App Service
az webapp create --resource-group capeco-prod \
  --plan capeco-plan --name capeco-app \
  --deployment-container-image-name capeco-api:latest
```

### 4. Configuration Files

**azure-pipeline.yml** — CI/CD pipeline
```yaml
trigger:
  - main

stages:
  - stage: Build
    jobs:
      - job: BuildAndPush
        steps:
          - task: Docker@2
            inputs:
              containerRegistry: $(dockerRegistryServiceConnection)
              repository: $(imageRepository)
              command: build
              Dockerfile: Dockerfile
  
  - stage: Deploy
    jobs:
      - deployment: Deploy
        environment: Production
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebAppContainer@1
                  inputs:
                    azureSubscription: $(azureSubscription)
                    appName: capeco-app
```

---

## Detailed Task Breakdown

### Day 1 (D27): Deployment Setup & Testing

#### Task 1.1: Create Docker Image
**Time:** 1 hour
- [ ] Create Dockerfile in project root
- [ ] Build image locally: `docker build -t capeco-api:latest .`
- [ ] Test image: `docker run -p 8000:8000 capeco-api:latest`
- [ ] Verify endpoints working
- [ ] Verify dashboard accessible

**Success Criteria:**
```bash
$ curl http://localhost:8000/health
{"status":"healthy","rows_available":3289}
```

#### Task 1.2: Set Up Azure Resources
**Time:** 1.5 hours
- [ ] Create Azure Container Registry
- [ ] Create Azure Resource Group (capeco-prod)
- [ ] Create App Service Plan (B1)
- [ ] Push image to registry
- [ ] Configure deployment settings

**Commands:**
```bash
az acr build --registry capecoregistry --image capeco-api:latest .
az webapp create --resource-group capeco-prod \
  --plan capeco-plan --name capeco-app \
  --deployment-container-image-name capeco-api:latest
```

#### Task 1.3: Configure Environment Variables
**Time:** 30 minutes
- [ ] Set STORAGE_MODE environment variable
- [ ] Configure Redis connection (if available)
- [ ] Set logging level
- [ ] Configure CORS origins
- [ ] Set up monitoring

**Environment Variables:**
```
STORAGE_MODE=azure
REDIS_HOST=<optional>
LOG_LEVEL=info
CORS_ORIGINS=["*"]
```

#### Task 1.4: Testing & Validation
**Time:** 1 hour
- [ ] Test health check endpoint
- [ ] Test projects endpoint
- [ ] Test metrics endpoint
- [ ] Load test with sample data
- [ ] Verify response times

---

### Day 2 (D28): Demo & Final Deployment

#### Task 2.1: Stakeholder Preparation
**Time:** 1 hour
- [ ] Prepare demo data
- [ ] Create demo scenarios
- [ ] Test all features
- [ ] Prepare documentation
- [ ] Set up demo environment

**Demo Scenarios:**
1. Dashboard loads with real data
2. KPI cards show accurate numbers
3. Charts render correctly
4. Data tables are interactive
5. Refresh functionality works
6. API documentation accessible

#### Task 2.2: Stakeholder Demo
**Time:** 1.5 hours
- [ ] Present system architecture
- [ ] Show data flow (CSV → Bronze → Silver → Gold → API → Dashboard)
- [ ] Demonstrate dashboard features
- [ ] Show API documentation
- [ ] Demonstrate performance
- [ ] Collect feedback

**Demo Talking Points:**
- Medallion architecture simplicity
- Data governance (5 agents working)
- Real-time API access
- Interactive visualizations
- Azure integration ready
- Extensible to more data sources

#### Task 2.3: Production Deployment & Monitoring
**Time:** 1 hour
- [ ] Deploy to Azure App Service
- [ ] Configure custom domain (optional)
- [ ] Set up SSL/TLS certificate
- [ ] Configure monitoring & alerts
- [ ] Set up log analytics
- [ ] Prepare documentation

**Monitoring Setup:**
```bash
# Create Application Insights
az monitor app-insights component create \
  --app capeco-monitoring \
  --resource-group capeco-prod

# Create alerts
az monitor metrics alert create \
  --name "API Error Rate" \
  --resource-group capeco-prod \
  --scopes /subscriptions/<id>/resourceGroups/capeco-prod/...
```

#### Task 2.4: Documentation & Handoff
**Time:** 30 minutes
- [ ] Create production runbook
- [ ] Document API endpoints
- [ ] Create troubleshooting guide
- [ ] Prepare user guide for stakeholders
- [ ] Document maintenance procedures

---

## Success Criteria

### Deployment Success
- [ ] API server accessible at https://capeco-app.azurewebsites.net
- [ ] Health check returns 200 OK
- [ ] All endpoints responding with <200ms latency
- [ ] Dashboard loads in <3 seconds
- [ ] No errors in logs

### Demo Success
- [ ] Stakeholders understand the system
- [ ] Dashboard features demonstrated
- [ ] API capabilities shown
- [ ] Positive feedback received
- [ ] Clear path forward understood

### Production Readiness
- [ ] Monitoring active
- [ ] Alerts configured
- [ ] Backups scheduled
- [ ] Runbook documented
- [ ] Team trained

---

## Risk Mitigation

| Risk | Mitigation | Owner |
|------|-----------|-------|
| Azure quotas | Check quotas before deployment | DevOps |
| Performance degradation | Load test before demo | QA |
| Demo equipment failure | Have backup laptop ready | Operations |
| Data consistency | Use read-only API for demo | API Owner |
| Network issues | Have offline demo prepared | Infrastructure |

---

## Resource Requirements

### Azure Resources Needed
- 1x Container Registry (Basic tier)
- 1x App Service (B1)
- 1x App Service Plan
- 1x Application Insights (optional)
- 1x Storage Account (if using Azure Data Lake)

### Estimated Monthly Cost
```
Container Registry:   $5-10/month
App Service (B1):     $15/month
Total:                $20-25/month (dev/demo)
Production:           $50-100/month (estimated)
```

### Team & Skills
- 1x DevOps Engineer (Azure deployment)
- 1x Backend Developer (API testing)
- 1x QA (Testing & validation)
- 1x Business Analyst (Demo & documentation)

---

## Timeline

```
Day 1 (D27):
  09:00 - Create Dockerfile
  10:00 - Build & test Docker image
  11:00 - Azure setup (registry, resource group, app service)
  13:00 - Configure environment variables
  14:00 - Testing & validation
  16:00 - End of Day 1

Day 2 (D28):
  09:00 - Stakeholder prep & final testing
  10:00 - DEMO TIME
  11:30 - Production deployment
  13:00 - Configure monitoring
  14:00 - Documentation & handoff
  15:00 - Project Complete!
```

---

## Success Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| API availability | 99.5% | - |
| Response time (p95) | <200ms | - |
| Dashboard load time | <3s | - |
| Stakeholder satisfaction | >8/10 | - |
| Demo completion | 100% | - |

---

## Sign-Off & Next Steps

Upon completion of Phase 3:

✓ **CAPECO Data Lake will be:**
- Production-ready in Azure
- Demonstrated to stakeholders
- Documented and maintained
- Extensible for future phases

**Future Enhancements (Post-Phase 3):**
1. Multi-data source integration (MySQL, APIs)
2. Real-time data updates
3. Advanced analytics & ML
4. Mobile app
5. Enterprise authentication
6. Custom reporting

---

## Phase Completion Criteria

**Phase 3 is complete when:**

- [x] Docker image builds successfully
- [x] Azure resources deployed
- [x] API accessible in Azure
- [x] Dashboard functional in production
- [x] Stakeholder demo completed successfully
- [x] Monitoring configured
- [x] Documentation complete
- [x] Team trained
- [x] Handoff completed

---

**Ready for Phase 3?** ✓ YES

**Timeline:** May 27-28, 2026  
**Team Size:** 4 people  
**Budget:** $500-1000 (Azure + misc)  
**Risk Level:** LOW (infrastructure is tested)

---

**Next Phase Kickoff:** May 27, 2026 at 09:00 AM
