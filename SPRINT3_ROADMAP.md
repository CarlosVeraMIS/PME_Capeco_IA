# CAPECO Data Lake — Sprint 3 Roadmap
## Azure Integration + REST APIs + Dashboard

**Prepared by:** Claude (AI)  
**Date:** 2026-05-06  
**Project:** CAPECO Data Lake  
**Timeline:** Days 19-28 (10 days)  
**Status:** PLANNING PHASE

---

## Sprint 3 Vision

Transformar el data lake local en un sistema cloud-native en Azure con APIs REST públicas y un dashboard interactivo que permita a stakeholders acceder a datos certificados en tiempo real.

### Success Criteria

- [ ] Todos los datos (Bronze, Silver, Gold) en Azure Data Lake Storage Gen2
- [ ] 3 endpoints REST funcionando y documentados
- [ ] Dashboard mostrando KPIs en vivo
- [ ] Autenticación segura (Managed Identity)
- [ ] Demo ejecutado para stakeholders
- [ ] Sistema listo para producción

---

## Phase 1: Azure Data Lake Storage Gen2 Migration (D19-D23)

### Objective
Migrar pipeline de archivos locales a Azure ADLS Gen2, manteniendo estructura de capas.

### Tasks

#### D19: Azure Infrastructure Setup

**Task 1: Verify Storage Account**
```bash
# El Storage Account ya existe - verificar
az storage account show --name capecovalencia --resource-group capeco-prod
```

**Expected Output:**
- Storage Account: capecovalencia
- Resource Group: capeco-prod
- Tier: Standard (local redundancy)
- HTTPS enabled

**Task 2: Create ADLS Gen2 Containers**
```bash
# Crear containers para cada capa
az storage container create --name bronze-layer --account-name capecovalencia
az storage container create --name silver-layer --account-name capecovalencia
az storage container create --name gold-layer --account-name capecovalencia
az storage container create --name audit-governance --account-name capecovalencia
```

**Hierarchy:**
```
capecovalencia (Storage Account)
├── bronze-layer/
│   ├── csv_nexo/
│   ├── excel_q4/
│   └── metadata/
├── silver-layer/
│   ├── csv_nexo/
│   ├── excel_q4/
│   └── metadata/
├── gold-layer/
│   ├── fact_projects/
│   ├── dim_distrito/
│   ├── dim_market_tier/
│   └── metadata/
└── audit-governance/
    ├── audit_logs/
    ├── validation_results/
    └── schema_history/
```

#### D19-D20: Implement Azure Authentication

**Option A: Managed Identity (RECOMMENDED)**
- Deploy orchestrator to Azure Container Instance
- Azure Container Instance has built-in Managed Identity
- No credentials to manage

```python
# Código en orchestrator
from azure.storage.filedatalake import DataLakeServiceClient
from azure.identity import DefaultAzureCredential

credential = DefaultAzureCredential()
service_client = DataLakeServiceClient(
    account_url="https://capecovalencia.dfs.core.windows.net",
    credential=credential
)
```

**Option B: Connection String (TEMPORARY)**
```python
service_client = DataLakeServiceClient.from_connection_string(
    os.getenv("AZURE_STORAGE_CONNECTION_STRING")
)
```

**Task: Update datalake_config.yaml**
```yaml
azure:
  storage_account_name: "capecovalencia"
  storage_endpoint: "https://capecovalencia.dfs.core.windows.net"
  containers:
    bronze: "bronze-layer"
    silver: "silver-layer"
    gold: "gold-layer"
    governance: "audit-governance"
  use_managed_identity: true
  connection_string: ${AZURE_STORAGE_CONNECTION_STRING}
```

#### D20-D21: Modify Orchestrator for Azure

**Changes Needed:**

1. **bronze_layer.py** - Add Azure Write
```python
def save_to_azure_parquet(df, source_name, container, service_client):
    file_path = f"{source_name}/{source_name}__{datetime.utcnow().isoformat()}.parquet"
    
    # Convert to Parquet bytes
    table = pa.Table.from_pandas(df)
    buffer = io.BytesIO()
    pq.write_table(table, buffer)
    
    # Upload to Azure
    file_client = service_client.get_file_client(container, file_path)
    file_client.upload_data(buffer.getvalue(), overwrite=True)
    
    return f"abfss://{container}@capecovalencia.dfs.core.windows.net/{file_path}"
```

2. **data_lake_orchestrator.py** - Add Azure Client
```python
from azure.storage.filedatalake import DataLakeServiceClient
from azure.identity import DefaultAzureCredential

class AzureDataLakeOrchestrator(DataLakeOrchestrator):
    def __init__(self, use_azure=True):
        super().__init__()
        if use_azure:
            self.azure_client = self._init_azure_client()
        
    def _init_azure_client(self):
        credential = DefaultAzureCredential()
        service_client = DataLakeServiceClient(
            account_url="https://capecovalencia.dfs.core.windows.net",
            credential=credential
        )
        return service_client
```

3. **governance_layer.py** - Read from Azure
```python
def load_from_azure(self, container, file_path):
    file_client = self.azure_client.get_file_client(container, file_path)
    data = file_client.download_file().readall()
    return pq.read_table(io.BytesIO(data)).to_pandas()
```

#### D21-D23: Test Azure Integration

**Test 1: Upload to Bronze Container**
```bash
# Run full pipeline writing to Azure
python data_lake_orchestrator.py --full --azure
# Verify files in Azure Portal
```

**Test 2: Read from Azure & Process**
```bash
# Run pipeline reading Bronze from Azure, writing Silver to Azure
python data_lake_orchestrator.py --silver --azure
```

**Test 3: End-to-End**
```bash
# Full pipeline: Local CSV → Azure Bronze → Azure Silver → Azure Gold
python data_lake_orchestrator.py --full --azure
```

**Success Criteria:**
- [ ] Bronze files visible in Azure Storage Explorer
- [ ] All 3 containers populated with data
- [ ] Governance logs in audit-governance container
- [ ] Performance acceptable (< 10s overhead for network)
- [ ] No data loss or corruption

---

## Phase 2: REST APIs with FastAPI (D24-D26)

### Objective
Exponer datos Gold certificados a través de APIs REST con autenticación y caching.

### Architecture

```
┌─────────────────────┐
│   FastAPI Server    │
│   (Azure Container) │
└──────────┬──────────┘
           │
      ┌────┴─────┐
      │           │
┌─────▼──┐  ┌────▼──┐
│  Redis │  │ Azure │
│ Cache  │  │ ADLS  │
└────────┘  └───────┘
      │           │
      └─────┬─────┘
            │
       ┌────▼────┐
       │Dashboard│
       └─────────┘
```

### Tasks

#### D24: Project Setup & Base Endpoints

**Create new file: api_server.py**

```python
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import io
from azure.storage.filedatalake import DataLakeServiceClient
from azure.identity import DefaultAzureCredential

app = FastAPI(
    title="CAPECO Data Lake API",
    version="1.0.0",
    description="Production APIs for certified real estate data"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Azure client
credential = DefaultAzureCredential()
azure_client = DataLakeServiceClient(
    account_url="https://capecovalencia.dfs.core.windows.net",
    credential=credential
)

# Models
class ProjectResponse(BaseModel):
    project_id: str
    titulo: str
    distrito: str
    price_per_m2: float
    market_tier: str
    absorption_rate_pct: float
    project_risk_level: str
    
class MetricResponse(BaseModel):
    distrito: str
    project_count: int
    price_per_m2_avg: float
    price_per_m2_min: float
    price_per_m2_max: float

# Endpoints
@app.get("/health", tags=["Status"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "capeco-data-lake-api",
        "version": "1.0.0"
    }

@app.get("/api/v1/gold/projects", response_model=List[ProjectResponse], tags=["Gold Layer"])
async def get_projects(
    district: Optional[str] = None,
    market_tier: Optional[str] = None,
    limit: int = 100
) -> List[ProjectResponse]:
    """
    Obtener lista de proyectos certificados
    
    Query Parameters:
    - district: Filtrar por distrito (ej: "MIRAFLORES")
    - market_tier: Filtrar por segmento (ej: "ELITE")
    - limit: Máximo de resultados (default: 100, max: 10000)
    """
    try:
        # Load from Azure or cache
        df = load_fact_projects()  # TODO: implement caching
        
        # Apply filters
        if district:
            df = df[df['distrito'] == district]
        if market_tier:
            df = df[df['market_tier'] == market_tier]
        
        # Limit results
        df = df.head(limit)
        
        # Convert to response model
        projects = [ProjectResponse(**row) for _, row in df.iterrows()]
        return projects
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/gold/metrics", response_model=List[MetricResponse], tags=["Gold Layer"])
async def get_metrics_by_district() -> List[MetricResponse]:
    """
    Obtener métricas agregadas por distrito
    """
    try:
        df = load_metrics_by_distrito()  # Load from Azure
        
        metrics = [MetricResponse(**row) for _, row in df.iterrows()]
        return metrics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/dashboard/summary", tags=["Dashboard"])
async def get_dashboard_summary():
    """
    Resumen ejecutivo para dashboard
    """
    return {
        "total_projects": 3289,
        "total_districts": 16,
        "market_segments": 4,
        "total_market_value_soles": 1160000000000,
        "avg_absorption_rate": 0.45,
        "high_risk_projects": 234,
        "last_update": datetime.utcnow().isoformat()
    }

# Helper functions
def load_fact_projects() -> pd.DataFrame:
    """Load fact_projects from Azure ADLS"""
    file_client = azure_client.get_file_client(
        "gold-layer",
        "fact_projects/fact_projects.parquet"
    )
    data = file_client.download_file().readall()
    return pd.read_parquet(io.BytesIO(data))

def load_metrics_by_distrito() -> pd.DataFrame:
    """Load metrics from Azure ADLS"""
    file_client = azure_client.get_file_client(
        "gold-layer",
        "metrics_by_distrito/metrics_by_distrito.parquet"
    )
    data = file_client.download_file().readall()
    return pd.read_parquet(io.BytesIO(data))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Requirements: api_requirements.txt**
```
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.4.2
redis==5.0.1
azure-storage-file-datalake==12.12.0
azure-identity==1.14.0
pandas==2.1.3
pyarrow==14.0.0
```

**Test:**
```bash
pip install -r api_requirements.txt
python api_server.py
# Visit: http://localhost:8000/docs (Swagger UI)
```

#### D25: Add Caching & Performance

**Install Redis:**
```bash
# Local development
docker run -d -p 6379:6379 redis:latest

# Azure: Deploy Redis Enterprise or Azure Cache for Redis
```

**Implement Caching:**
```python
import redis
from functools import wraps
import pickle
import time

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def cache_result(ttl_seconds=3600):
    """Decorator to cache API results"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            cached = redis_client.get(cache_key)
            if cached:
                return pickle.loads(cached)
            
            # Call function and cache result
            result = await func(*args, **kwargs)
            redis_client.setex(
                cache_key,
                ttl_seconds,
                pickle.dumps(result)
            )
            return result
        return wrapper
    return decorator

# Usage
@app.get("/api/v1/gold/projects")
@cache_result(ttl_seconds=1800)  # Cache for 30 minutes
async def get_projects(...):
    ...
```

**Performance Targets:**
- First request: < 2 seconds
- Cached request: < 100 milliseconds
- Peak load: 1000 requests/min

#### D26: Documentation & Testing

**OpenAPI Documentation:**
- Auto-generated via FastAPI
- Available at: `/docs` (Swagger UI)
- Available at: `/redoc` (ReDoc)

**Integration Tests:**
```python
# test_api.py
import pytest
from fastapi.testclient import TestClient
from api_server import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200

def test_get_projects():
    response = client.get("/api/v1/gold/projects")
    assert response.status_code == 200
    assert len(response.json()) > 0

def test_filter_by_district():
    response = client.get("/api/v1/gold/projects?district=MIRAFLORES")
    assert response.status_code == 200
    for project in response.json():
        assert project["distrito"] == "MIRAFLORES"

def test_metrics():
    response = client.get("/api/v1/gold/metrics")
    assert response.status_code == 200
    assert len(response.json()) == 16  # 16 districts
```

---

## Phase 3: Dashboard Integration (D27-D28)

### Objective
Crear dashboard web que consume las APIs y muestra KPIs en vivo.

### Components

**Dashboard App: dashboard/index.html**
```html
<!DOCTYPE html>
<html>
<head>
    <title>CAPECO Data Lake Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>CAPECO Real Estate Data Lake</h1>
        
        <!-- KPI Cards -->
        <div class="kpi-grid">
            <div class="card">
                <h3>Total Projects</h3>
                <p id="total-projects" class="metric">3,289</p>
            </div>
            <div class="card">
                <h3>Avg Price/m²</h3>
                <p id="avg-price" class="metric">S/ 5,280</p>
            </div>
            <div class="card">
                <h3>Market Value</h3>
                <p id="market-value" class="metric">S/ 1.16T</p>
            </div>
            <div class="card">
                <h3>High Risk</h3>
                <p id="high-risk" class="metric">234</p>
            </div>
        </div>
        
        <!-- Charts -->
        <div class="charts-grid">
            <div class="chart-container">
                <h3>Projects by District</h3>
                <canvas id="district-chart"></canvas>
            </div>
            <div class="chart-container">
                <h3>Market Tier Distribution</h3>
                <canvas id="tier-chart"></canvas>
            </div>
            <div class="chart-container">
                <h3>Price Range Distribution</h3>
                <canvas id="price-chart"></canvas>
            </div>
        </div>
    </div>
    
    <script src="dashboard.js"></script>
</body>
</html>
```

**API Integration: dashboard/dashboard.js**
```javascript
const API_BASE = "http://api.capecovalencia.com/api/v1";

async function loadDashboard() {
    // Load metrics
    const metrics = await fetch(`${API_BASE}/gold/metrics`).then(r => r.json());
    
    // Load projects
    const projects = await fetch(`${API_BASE}/gold/projects?limit=10000`).then(r => r.json());
    
    // Render KPIs
    document.getElementById('total-projects').textContent = projects.length.toLocaleString();
    
    // Render charts
    renderDistrictChart(metrics);
    renderTierChart(projects);
    renderPriceChart(projects);
}

function renderDistrictChart(metrics) {
    const ctx = document.getElementById('district-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: metrics.map(m => m.distrito),
            datasets: [{
                label: 'Projects',
                data: metrics.map(m => m.project_count),
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }]
        }
    });
}

// Load on page load
document.addEventListener('DOMContentLoaded', loadDashboard);
```

### Deployment Options

**Option A: Azure App Service**
```bash
# Create App Service
az appservice plan create --name capeco-api --resource-group capeco-prod --sku B1 --is-linux
az webapp create --resource-group capeco-prod --plan capeco-api --name capeco-api --runtime "python|3.11"

# Deploy
az webapp deployment source config-zip --resource-group capeco-prod --name capeco-api --src deploy.zip
```

**Option B: Azure Container Instances**
```dockerfile
FROM python:3.11
WORKDIR /app
COPY api_requirements.txt .
RUN pip install -r api_requirements.txt
COPY api_server.py .
EXPOSE 8000
CMD ["python", "api_server.py"]
```

---

## Success Criteria - Sprint 3

### Azure Integration ✓
- [ ] Data migrated to ADLS Gen2
- [ ] Managed Identity configured
- [ ] Pipeline reads/writes from Azure
- [ ] Performance acceptable (< 5s overhead)

### REST APIs ✓
- [ ] /health endpoint working
- [ ] /api/v1/gold/projects endpoint working with filters
- [ ] /api/v1/gold/metrics endpoint working
- [ ] OpenAPI documentation complete
- [ ] Tests passing (100% coverage for critical paths)

### Dashboard ✓
- [ ] Dashboard loads data from APIs
- [ ] KPI cards displaying correct values
- [ ] Charts rendering correctly
- [ ] Responsive design (mobile/desktop)
- [ ] < 3 second load time

### Production Ready ✓
- [ ] Monitoring setup (Application Insights)
- [ ] Logging configured (Log Analytics)
- [ ] Scaling policies defined
- [ ] Disaster recovery plan documented
- [ ] Demo executed successfully

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Azure API rate limits | Low | Medium | Implement caching, request throttling |
| Network latency | Medium | Medium | Deploy APIs in same region as ADLS |
| Data consistency | Low | High | Use blob versioning, immutable blobs |
| Authentication failures | Low | High | Test Managed Identity early, have fallback |
| Dashboard performance | Medium | Medium | Optimize queries, add pagination |

---

## Budget & Resources

**Estimated Azure Costs (Monthly):**
- Storage Account (500GB): ~$10
- App Service (B1): ~$30
- Redis Cache: ~$20
- Log Analytics: ~$10
- Total: ~$70/month

**Development Resources:**
- API Development: 2 days (D24-D25)
- Dashboard Development: 1.5 days (D25-D26)
- Testing & Deployment: 1.5 days (D26-D28)
- Total: 5 days (from 10 day sprint)
- Buffer: 5 days for fixes and optimizations

---

## Timeline Summary

```
D19 │ Azure Setup + Containers + Auth
D20 │ Orchestrator Azure Integration (Part 1)
D21 │ Orchestrator Azure Integration (Part 2)
D22 │ Testing Azure Pipeline
D23 │ Azure Migration Complete
    │
D24 │ FastAPI Setup + Base Endpoints
D25 │ Redis Caching + Performance Tuning
D26 │ Tests + Documentation
    │
D27 │ Dashboard Development + Integration
D28 │ Demo + Final Testing + Sign-off

Total: 10 days
Parallel work possible: Minimize waiting
```

---

## Acceptance Criteria

**Definition of Done:**

1. **Code Complete**
   - All code checked in
   - Code reviewed and approved
   - Tests passing

2. **Documented**
   - API documented in OpenAPI/Swagger
   - Dashboard usage guide available
   - Deployment guide available

3. **Tested**
   - Unit tests passing
   - Integration tests passing
   - Load testing passing (100 req/s)
   - Demo executed successfully

4. **Deployed**
   - API running in Azure
   - Dashboard accessible
   - Monitoring active
   - Backups configured

---

**Status:** READY FOR SPRINT 3  
**Next Step:** Request Azure resource approval & begin D19 work  
**Estimated Completion:** May 28, 2026

---

*Sprint 2 Complete - Sprint 3 Ready to Launch*
