# CAPECO Data Lake — Sprint 3 Phase 1 Implementation Guide
## Azure Data Lake Storage Gen2 Integration

**Date:** 2026-05-06  
**Status:** PHASE 1 READY FOR DEPLOYMENT  
**Phase:** D19-D23 (Azure Integration Foundation)

---

## Executive Summary

Se ha completado la arquitectura de abstracción de almacenamiento que permite que el pipeline de CAPECO funcione con:

- **Local Storage** (desarrollo/testing)
- **Azure Data Lake Storage Gen2** (producción)

Sin cambios en la lógica del pipeline. El código es agnóstico al backend de almacenamiento.

---

## What Was Created

### 1. Storage Layer Abstraction (`storage_layer.py`)

Interfaz unificada para operaciones de almacenamiento:

```python
class StorageBackend:
    def read_parquet(path) -> DataFrame
    def write_parquet(df, path) -> bool
    def exists(path) -> bool
    def list_files(directory, pattern) -> list
```

**Backends:**
- `LocalStorageBackend` — Filesystem local (desarrollo)
- `AzureStorageBackend` — Azure ADLS Gen2 (producción)

**Factory Functions:**
```python
storage = create_local_storage()
# O
storage = create_azure_storage(
    storage_account="capecovalencia",
    file_system="gold-layer"
)

df = storage.read_parquet("projects/2024.parquet")
storage.write_parquet(df, "projects/2024_updated.parquet")
```

### 2. Enhanced Configuration (`datalake_config_sprint3.yaml`)

Configuración centralizada con soporte para múltiples backends:

```yaml
storage:
  mode: "local"  # o "azure"
  
  local:
    bronze_directory: "bronze_data"
    silver_directory: "silver_data"
    gold_directory: "gold_data"
  
  # Descomenta para Azure:
  # azure:
  #   storage_account_name: "capecovalencia"
  #   containers:
  #     bronze: "bronze-layer"
  #     silver: "silver-layer"
  #     gold: "gold-layer"
  #   authentication:
  #     method: "managed_identity"
```

### 3. Sprint 3 Orchestrator (`data_lake_orchestrator_sprint3.py`)

Orquestador mejorado que:

- Carga configuración automáticamente
- Inicializa el backend correcto (local o Azure)
- Ejecuta el mismo pipeline sin cambios de código
- Reporta estadísticas específicas del storage mode

**Cambios principales:**
- Agregó `ConfigurationManager` para cargar YAML
- Agregó `_initialize_storage()` para crear backend dinámicamente
- Modificó `load_latest_parquet()` para trabajar con ambos backends
- Todo integrado con governance y SLA monitoring existente

---

## Deployment Options

### Option A: Local Development (Actual)

```bash
cd /Users/carlosvera/Library/CloudStorage/OneDrive-MSFT/mis/IA/capeco

# Instalar dependencias (si no existen)
pip install pyyaml --break-system-packages

# Ejecutar pipeline
python data_lake_orchestrator_sprint3.py --full
```

**Output:**
```
Storage Mode: local
✓ BRONZE: ...
✓ SILVER: ...
✓ GOLD: ...
✓ Reporte guardado: pipeline_execution_report_sprint3.json
```

### Option B: Azure Production (Próximo)

#### Step 1: Azure CLI Setup

```bash
# Instalar Azure CLI (si no existe)
brew install azure-cli

# Autenticar
az login
az account set --subscription <SUBSCRIPTION_ID>
```

#### Step 2: Create Storage Account (si no existe)

```bash
az storage account create \
  --name capecovalencia \
  --resource-group capeco-prod \
  --location eastus \
  --sku Standard_LRS
```

#### Step 3: Run azure_setup.py

```bash
cd /Users/carlosvera/Library/CloudStorage/OneDrive-MSFT/mis/IA/capeco

# Verificar acceso
python azure_setup.py --verify

# Crear containers
python azure_setup.py --create-containers

# Verificar que todo está OK
python azure_setup.py --config
```

#### Step 4: Enable in Orchestrator

```bash
# Option 1: Usar variable de ambiente
STORAGE_MODE=azure python data_lake_orchestrator_sprint3.py --full

# Option 2: Editar datalake_config_sprint3.yaml
# Cambiar: storage.mode = "azure"
# Descomentar: storage.azure.*
python data_lake_orchestrator_sprint3.py --full
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│         Data Lake Pipeline (Bronze-Silver-Gold)    │
├─────────────────────────────────────────────────────┤
│  - governance_layer.py (validación)                 │
│  - data_lake_orchestrator_sprint3.py (orquesta)     │
│  - bronze_layer.py, silver_layer.py, gold_layer.py │
└────────────┬──────────────────────────────────────┘
             │
             ▼
      ┌──────────────────┐
      │ StorageManager   │
      │ (abstracción)    │
      └────┬────────┬────┘
           │        │
    ┌──────▼──┐  ┌──▼──────────┐
    │ Local   │  │ Azure ADLS   │
    │ Storage │  │ Gen2         │
    └─────────┘  └──────────────┘
    
    Filesystem   |  Azure Storage Account
    bronze_data/ | bronze-layer/
    silver_data/ | silver-layer/
    gold_data/   | gold-layer/
```

---

## Testing the Implementation

### Test 1: Local Storage (Development)

```bash
# Debe usar archivos locales
STORAGE_MODE=local python data_lake_orchestrator_sprint3.py --full

# Verificar
ls -lah bronze_data/
ls -lah silver_data/
ls -lah gold_data/
```

**Expected Output:**
```
✓ Bronze completado en 0.55s
✓ Silver completado en 2.0s
✓ Gold completado en 0.6s
✓ Reporte guardado: pipeline_execution_report_sprint3.json
```

### Test 2: Configuration Loading

```bash
python -c "
from datalake_config_sprint3_loader import ConfigurationManager
cm = ConfigurationManager()
print('Storage Mode:', cm.get_storage_mode())
print('Storage Config:', cm.get_storage_config())
"
```

### Test 3: Storage Abstraction

```python
from storage_layer import create_local_storage
import pandas as pd

storage = create_local_storage()

# Crear un test DataFrame
df = pd.DataFrame({
    'id': [1, 2, 3],
    'name': ['Project A', 'Project B', 'Project C'],
    'value': [100.5, 200.3, 150.8]
})

# Escribir
storage.write_parquet(df, 'test_output.parquet')

# Verificar que existe
print("File exists:", storage.exists('test_output.parquet'))

# Leer
df_loaded = storage.read_parquet('test_output.parquet')
print(df_loaded)
```

---

## Files Created in Phase 1

| File | Lines | Purpose |
|------|-------|---------|
| `storage_layer.py` | 280 | Storage abstraction with local & Azure backends |
| `datalake_config_sprint3.yaml` | 160 | Unified configuration for all modes |
| `data_lake_orchestrator_sprint3.py` | 450 | Updated orchestrator with storage manager |
| `SPRINT3_PHASE1_GUIDE.md` | This | Implementation guide |

---

## Key Features

### 1. Zero Code Changes to Pipeline Logic

El mismo código que procesaba datos localmente ahora puede procesar desde Azure sin cambios:

```python
# Mismo código, diferentes backends
df = self.storage.read_parquet(path)
self.storage.write_parquet(df, output_path)
```

### 2. Seamless Backend Switching

```bash
# Local: automático
python orchestrator_sprint3.py --full

# Azure: una línea
STORAGE_MODE=azure python orchestrator_sprint3.py --full
```

### 3. Environment Variable Support

Permite override de configuración sin editar archivos:

```bash
STORAGE_MODE=azure python orchestrator_sprint3.py --full
```

### 4. Error Handling & Fallback

Si Azure no está disponible, automáticamente fallback a local storage:

```python
try:
    return create_azure_storage(...)
except Exception as e:
    self.logger.warning("Azure falló, usando local")
    return create_local_storage()
```

---

## Next Steps (Phase 1 → Phase 2)

### Phase 1 (D19-D23): ✓ COMPLETE
- ✓ Storage abstraction layer
- ✓ Configuration management
- ✓ Updated orchestrator
- ✓ Local testing capability
- → **Ready to deploy to Azure**

### Phase 2 (D24-D26): REST API Development
1. Create `api_server.py` with FastAPI
2. Implement endpoints:
   - `/health` — health check
   - `/api/v1/gold/projects` — list projects
   - `/api/v1/gold/metrics` — calculate metrics
3. Add Redis caching
4. Write integration tests

### Phase 3 (D27-D28): Dashboard Integration
1. Create HTML dashboard with Chart.js
2. Connect to API endpoints
3. Deploy to Azure App Service
4. Demo para stakeholders

---

## Troubleshooting

### Issue 1: "Azure SDK not available"

```bash
pip install azure-storage-file-datalake azure-identity --break-system-packages
```

### Issue 2: "DefaultAzureCredential couldn't authenticate"

```bash
# Asegúrate de estar autenticado con Azure CLI
az login

# Si estás en una aplicación Azure (App Service, Container Instances)
# Asegúrate de que Managed Identity esté habilitada
```

### Issue 3: "Storage account not accessible"

```bash
# Verificar que el storage account existe
az storage account show --name capecovalencia --resource-group capeco-prod

# Verificar que tienes permisos
az role assignment list --scope /subscriptions/<sub-id>
```

---

## Performance Expectations

| Scenario | Duration | Notes |
|----------|----------|-------|
| Local Bronze → Gold | ~3.3s | Filesystem I/O |
| Azure Bronze → Gold | ~5-8s | Network + Azure latency |
| Azure + Redis Cache | ~1-2s | Subsequent requests |

---

## Security Best Practices

### For Azure Deployment

1. **Use Managed Identity** (recommended)
   - No need to store credentials
   - Secure by default
   - Works in Azure VMs, App Service, Container Instances

2. **Connection String** (development only)
   - Store in environment variable
   - Never commit to git
   - Use local .env file

3. **Service Principal** (CI/CD)
   - For GitHub Actions, Azure DevOps
   - Credentials in secrets
   - Limited permissions via RBAC

---

## Sign-Off

Sprint 3 Phase 1 está completo. El data lake ahora:

✓ Puede funcionar con almacenamiento local (desarrollo)  
✓ Está preparado para Azure ADLS Gen2 (producción)  
✓ Usa storage abstraction (fácil de extender)  
✓ Mantiene toda la governance y SLA monitoring  
✓ Soporta configuration management centralizado  

**Estado:** READY FOR AZURE DEPLOYMENT

**Próximo paso:** Ejecutar `STORAGE_MODE=azure python data_lake_orchestrator_sprint3.py --full` una vez que Azure credentials estén configuradas.

---

**Last Updated:** 2026-05-06  
**Phase:** 1 of 3 (Azure Integration)  
**Next Phase:** Phase 2 — REST APIs with FastAPI
