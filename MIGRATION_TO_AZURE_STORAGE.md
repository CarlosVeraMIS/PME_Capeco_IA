# 🚀 Migración a Azure Storage - CAPECO Data Lake

**Fecha:** 11 de Mayo, 2026  
**Objetivo:** Mover archivos parquet de local filesystem a Azure Blob Storage  
**Estado:** En progreso

---

## 📋 Resumen

El API `capeco-app` está corriendo en Azure, pero los archivos parquet están solo en local filesystem. Necesitamos:

1. Crear Storage Account en Azure
2. Subir archivos parquet a Blob Storage
3. Actualizar API para leer desde Azure
4. Re-deploying en Azure App Service

---

## ✅ Prerequisitos

Tienes acceso a:
- ✅ Azure Portal (capeco-prod resource group)
- ✅ Archivos parquet locales en `/sessions/compassionate-stoic-volta/mnt/capeco/gold_data/`
- ✅ Git repo de capeco
- ✅ App Service `capeco-app` corriendo

Necesitas instalar:
- Azure CLI
- Python 3.9+
- pip (gestor de paquetes Python)

---

## 🔧 Paso 1: Preparar Máquina Local

### 1.1 Instalar Azure CLI

**En macOS:**
```bash
brew install azure-cli
```

**O descarga desde:**
https://learn.microsoft.com/en-us/cli/azure/install-azure-cli

### 1.2 Verificar instalación
```bash
az --version
az login
```

Esto abre tu navegador para autenticación.

---

## 📦 Paso 2: Ejecutar Migración a Azure Storage

### 2.1 Descarga el script de migración

El script está en:
```
/Users/carlosvera/Library/Application Support/Claude/local-agent-mode-sessions/.../outputs/migrate_to_azure_storage.py
```

O copia el código desde `api_server_azure_update.py`

### 2.2 Ejecuta la migración

**OPCIÓN A: Script automático (recomendado)**
```bash
bash /Users/carlosvera/Library/Application\ Support/Claude/local-agent-mode-sessions/.../outputs/run_migration.sh
```

**OPCIÓN B: Paso a paso**
```bash
# 1. Instalar dependencias
pip install --break-system-packages \
    azure-storage-blob \
    azure-mgmt-storage \
    azure-mgmt-resource \
    azure-identity

# 2. Ejecutar migración
python3 /Users/carlosvera/Library/Application\ Support/Claude/local-agent-mode-sessions/.../outputs/migrate_to_azure_storage.py
```

### 2.3 Resultado esperado

Deberías ver:
```
======================================================================
🚀 MIGRACIÓN A AZURE BLOB STORAGE
======================================================================

📦 Creando Storage Account: capecodatalake
✅ Storage Account creado

📁 Creando container: gold_data
✅ Container creado

📤 Subiendo archivos a Azure Storage
  ✅ Subido: fact_capeco_certified.parquet
  ✅ Subido: fact_projects.parquet
  ✅ Subido: dim_market_tier.parquet
  ✅ Subido: dim_distrito.parquet

🔑 Obteniendo connection string

======================================================================
✅ MIGRACIÓN COMPLETADA
======================================================================

Storage Account: capecodatalake
Container: gold_data

URL de acceso:
https://capecodatalake.blob.core.windows.net/gold_data/

Guarda esta connection string en .env:
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=capecodatalake;AccountKey=...
```

**Copia la connection string**, la necesitarás en el siguiente paso.

---

## 🔐 Paso 3: Actualizar API Server

### 3.1 Actualizar .env

En la raíz del proyecto capeco, abre `.env` o `.env.azure`:

Agrega:
```bash
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=capecodatalake;AccountKey=...
```

(Pega la connection string que obtuviste en el paso anterior)

### 3.2 Actualizar requirements.txt

En la raíz del proyecto, abre `requirements.txt`:

Asegúrate que tiene:
```
azure-storage-blob>=12.19.0
azure-identity>=1.14.0
```

Si no están, agrega estas líneas.

### 3.3 Actualizar api_server.py

1. Abre: `/ruta/a/capeco/api_server.py`
2. Busca la clase `DataLoader`
3. Reemplaza con el código en `api_server_azure_update.py`

**Cambios principales:**
- El DataLoader ahora intenta leer desde Azure Storage primero
- Si Azure Storage no está disponible, fallback a local filesystem
- Agrega logging para ver de dónde está leyendo

### 3.4 Verificar cambios

```bash
# Verifica que los imports están correctos
grep -n "from azure.storage" /ruta/a/capeco/api_server.py
grep -n "BlobServiceClient" /ruta/a/capeco/api_server.py
```

---

## 🚀 Paso 4: Deploy en Azure

### 4.1 Commit y push a GitHub

```bash
cd /ruta/a/capeco

# Verifica cambios
git status

# Añade cambios
git add api_server.py requirements.txt .env.azure

# Commit
git commit -m "feat: API reads from Azure Blob Storage"

# Push
git push origin main
```

### 4.2 Azure redeploya automáticamente

Una vez que haces push:
1. GitHub Actions se activa
2. Azure re-deploya la aplicación
3. Espera 3-5 minutos

Para verificar en Azure Portal:
1. Ve a App Service `capeco-app`
2. En el menú izquierdo: `Deployment Center`
3. Deberías ver la actividad de deployment

---

## ✅ Paso 5: Verificar que funciona

### 5.1 Verificar health endpoint

```bash
curl https://capeco-app.azurewebsites.net/health | jq '.'
```

Espera ver:
```json
{
  "status": "healthy",
  "gold_data_available": true,
  "rows_available": 9319
}
```

### 5.2 Verificar que retorna datos

```bash
curl https://capeco-app.azurewebsites.net/api/v1/gold/projects?limit=1 | jq '.pagination.total'
```

Deberías ver:
```
9319
```

### 5.3 Verificar métricas

```bash
curl https://capeco-app.azurewebsites.net/api/v1/gold/metrics | jq '.metrics'
```

Deberías ver:
```json
{
  "total_projects": 9319,
  "avg_price_per_m2": 6549.73,
  "avg_absorption_rate": 1.16,
  "unique_districts": 39
}
```

### 5.4 Verificar en navegador

Abre: https://capeco-app.azurewebsites.net

Deberías ver:
- KPI Cards con números reales (9,319 proyectos)
- Gráficos con datos
- Tabla con proyectos

---

## 🎯 Checklist Final

```
□ Azure CLI instalado y autenticado
□ Migración a Azure Storage completada
□ Connection string guardada en .env.azure
□ requirements.txt actualizado
□ api_server.py actualizado con DataLoader nuevo
□ Cambios commiteados en GitHub
□ Deploy en Azure completado (esperar 3-5 min)
□ curl /health retorna 9319 filas
□ Dashboard en https://capeco-app.azurewebsites.net funciona
□ KPI Cards muestran 9,319 proyectos
```

Si TODO está ✅ → **Migración a Azure Storage completada exitosamente**

---

## 🔍 Troubleshooting

### Problema: "AuthorizationPermissionMismatch"

**Causa:** No tienes permisos en Azure

**Solución:**
```bash
az login
```

Asegúrate que estás usando la cuenta correcta.

---

### Problema: "BlobNotFound"

**Causa:** Los archivos no se subieron correctamente

**Solución:**
1. Verifica en Azure Portal > Storage Accounts > capecodatalake > Containers > gold_data
2. Deberías ver 4 archivos parquet
3. Si faltan, ejecuta de nuevo: `python3 migrate_to_azure_storage.py`

---

### Problema: "ConnectionStringInvalid"

**Causa:** La connection string está mal en .env

**Solución:**
1. Obtén la connection string de nuevo:
   ```bash
   az storage account show-connection-string --name capecodatalake --resource-group capeco-prod
   ```
2. Actualiza .env.azure con la nueva string

---

### Problema: Dashboard muestra 312 proyectos (local realData.ts)

**Causa:** Monitor no está llamando al API en Azure

**Solución:**
1. Verifica que el API está respondiendo:
   ```bash
   curl https://capeco-app.azurewebsites.net/health
   ```
2. Si no responde, espera a que termine el deploy (3-5 min)
3. Verifica el archivo Monitor en GitHub:
   - La URL debe ser: `https://capeco-app.azurewebsites.net/api/v1/gold/`
   - NO debe usar `localhost`

---

## 📊 Arquitetura Final

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPECO Data Lake - Final                      │
└─────────────────────────────────────────────────────────────────┘

LOCAL FILESYSTEM (durante desarrollo)
│
├─ /capeco/gold_data/fact_capeco_certified.parquet
├─ /capeco/gold_data/fact_projects.parquet
├─ /capeco/gold_data/dim_market_tier.parquet
└─ /capeco/gold_data/dim_distrito.parquet
    │
    └─→ [Migración por una sola vez]

AZURE BLOB STORAGE (Producción)
│
├─ capecodatalake (Storage Account)
│  └─ gold_data (Container)
│     ├─ fact_capeco_certified.parquet ✅
│     ├─ fact_projects.parquet ✅
│     ├─ dim_market_tier.parquet ✅
│     └─ dim_distrito.parquet ✅
    │
    └─→ [API lee desde aquí]

AZURE APP SERVICE
│
├─ capeco-app (Web App)
│  ├─ api_server.py (actualizado)
│  ├─ requirements.txt (actualizado)
│  └─ .env.azure (connection string)
    │
    └─→ [Expone endpoints REST]

MONITOR DASHBOARD
│
└─ https://capeco-app.azurewebsites.net/api/v1/gold/
   ├─ /projects → 9,319 filas
   ├─ /metrics → KPI cards
   └─ /districts → 39 distritos

RESULTADO
│
└─ ✅ Dashboard muestra datos reales desde Azure
```

---

## 📞 Resumen de Comandos

```bash
# 1. Instalar Azure CLI
brew install azure-cli

# 2. Login a Azure
az login

# 3. Ejecutar migración
python3 migrate_to_azure_storage.py

# 4. Actualizar .env con connection string

# 5. Commit y push
cd /ruta/a/capeco
git add api_server.py requirements.txt .env.azure
git commit -m "feat: API reads from Azure Blob Storage"
git push origin main

# 6. Esperar 3-5 minutos a deployment

# 7. Verificar
curl https://capeco-app.azurewebsites.net/health | jq '.'
curl https://capeco-app.azurewebsites.net/api/v1/gold/metrics | jq '.'
open https://capeco-app.azurewebsites.net
```

---

## 📝 Notas

- La migración es de una sola vez
- Después, todos los datos vienen de Azure Storage
- Local filesystem es solo fallback si Azure no está disponible
- Los 9,319 proyectos ahora están en Azure y disponibles globalmente
- Monitor Dashboard puede acceder desde cualquier lugar

**Fecha completada:** 11 de Mayo, 2026  
**Estado:** Migración iniciada
