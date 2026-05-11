# Azure Deployment Fix — Actualizar API en Producción

**Fecha:** 7 de Mayo, 2026  
**Problema:** https://capeco-app.azurewebsites.net no muestra datos  
**Causa:** API en Azure no tiene el código actualizado  
**Solución:** Actualizar deployment en Azure (10 minutos)

---

## 🔴 El Problema

Cuando accedes a: `https://capeco-app.azurewebsites.net`
- ❌ El dashboard está vacío
- ❌ O muestra datos viejos (3,289 filas)
- ❌ Los KPI cards no muestran números

**Causa:** El código en Azure no tiene la actualización con el nuevo dataset (9,319 filas)

---

## 🟢 La Solución (3 Opciones)

### OPCIÓN 1: Re-deploy desde GitHub (MÁS RÁPIDO)

Si usas GitHub Actions o integración CI/CD:

```bash
# 1. En tu máquina local
git add api_server.py
git commit -m "Fix: Update API with new data source mapping"
git push origin main

# 2. Azure automáticamente hace re-deploy
# Espera 3-5 minutos

# 3. Verifica que funciona
curl https://capeco-app.azurewebsites.net/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "rows_available": 9319
}
```

✅ Si ves `9319` → Deployment exitoso

### OPCIÓN 2: Actualizar directamente en Azure Portal

1. **Abre Azure Portal:**
   - Vai a: https://portal.azure.com
   - Busca: `capeco-app`
   - Selecciona: App Service

2. **Sube el código actualizado:**
   - En el menú izquierdo: `Deployment > Deployment Center`
   - Selecciona tu repositorio (GitHub/DevOps)
   - Haz clic en: `Redeploy`

3. **Espera a que termine**
   - El despliegue toma 3-5 minutos
   - Verás un checkmark verde cuando esté listo

4. **Verifica:**
   ```bash
   curl https://capeco-app.azurewebsites.net/health
   ```

### OPCIÓN 3: Deploy manual con Azure CLI

```bash
# 1. Instala Azure CLI si no lo tienes
# https://learn.microsoft.com/en-us/cli/azure/install-azure-cli

# 2. Login a Azure
az login

# 3. Deploy el código
az webapp up \
  --resource-group <tu-resource-group> \
  --name capeco-app \
  --runtime "PYTHON:3.10"

# 4. Espera a que termine
# 5. Verifica
curl https://capeco-app.azurewebsites.net/health
```

---

## 📋 PRE-VERIFICACIÓN: ¿Qué necesitas antes?

### Verificación 1: ¿El código local está actualizado?

```bash
# Abre api_server.py línea ~236
# Deberías ver:
df = DataLoader.load_latest_parquet('gold_data', 'fact_capeco_certified')

# NO debería ser:
df = DataLoader.load_latest_parquet('gold_data', 'fact_projects')
```

### Verificación 2: ¿El archivo parquet existe en Azure Storage?

En Azure Portal:
1. Ve a: `Storage Accounts` > Tu cuenta
2. Navega a: `/gold_data/`
3. Deberías ver: `fact_capeco_certified.parquet` (247 KB)

Si no está:
```bash
# Sube manualmente
az storage blob upload \
  --file gold_data/fact_capeco_certified.parquet \
  --container-name capeco \
  --name fact_capeco_certified.parquet
```

### Verificación 3: ¿Las variables de ambiente están correctas?

En Azure Portal > App Service > Configuration:

Deberías tener:
```
Name: DATA_PATH
Value: /home/site/wwwroot/gold_data

Name: REDIS_HOST
Value: (vacío o tu Redis)
```

---

## 🔍 DIAGNÓSTICO PASO A PASO

### Paso 1: Verifica que el servidor está corriendo

```bash
curl -I https://capeco-app.azurewebsites.net/health
```

Deberías ver:
```
HTTP/1.1 200 OK
```

Si ves `502 Bad Gateway` o `503 Service Unavailable`:
→ El servidor no está corriendo, necesitas hacer deploy

### Paso 2: Verifica que retorna los datos nuevos

```bash
curl https://capeco-app.azurewebsites.net/api/v1/gold/projects?limit=1 | jq '.pagination.total'
```

Deberías ver:
```
9319
```

Si ves `3289` → El servidor tiene el código viejo, necesitas actualizar

### Paso 3: Verifica que el mapeo funciona

```bash
curl https://capeco-app.azurewebsites.net/api/v1/gold/projects?limit=1 | jq '.data[0].price_per_m2'
```

Deberías ver un número como:
```
8762.53
```

Si ves error o null → El mapeo no está implementado, necesitas actualizar el código

---

## ⚡ QUICK FIX (Si solo necesitas 5 minutos)

### Lo más rápido:

```bash
# 1. Asegúrate que api_server.py está actualizado localmente
cat api_server.py | grep -A2 "load_latest_parquet"

# Deberías ver: 'fact_capeco_certified'

# 2. Si está correcto, push a GitHub
git add api_server.py
git commit -m "Update API - fix dashboard data"
git push origin main

# 3. Ve a Azure Portal y haz click en "Redeploy"

# 4. Espera 5 minutos

# 5. Prueba
curl https://capeco-app.azurewebsites.net/health
```

---

## 🚨 PROBLEMAS COMUNES

### Problema: "404 Not Found"

El archivo parquet no está en Azure Storage.

**Solución:**
```bash
# Copia el archivo a Azure Storage
az storage blob upload \
  --file gold_data/fact_capeco_certified.parquet \
  --container-name capeco \
  --name fact_capeco_certified.parquet \
  --account-name tu-storage-account
```

### Problema: "502 Bad Gateway"

El servidor no está corriendo.

**Solución:**
1. En Azure Portal > App Service > Logs
2. Busca errores de Python
3. Verifica que las dependencias están instaladas
4. Re-deploy el código

### Problema: "Data not found"

El código está buscando en la ubicación equivocada.

**Solución:**
```bash
# Edita api_server.py línea 236
# Asegúrate que dice:
DataLoader.load_latest_parquet('gold_data', 'fact_capeco_certified')

# NO fact_projects o fact_capeco_raw
```

### Problema: "Connection timeout"

Azure está tardando en responder.

**Solución:**
```bash
# Aumenta el timeout
curl --max-time 30 https://capeco-app.azurewebsites.net/health

# Si sigue sin funcionar, reinicia el App Service
az webapp restart --resource-group <tu-rg> --name capeco-app
```

---

## 📊 CHECKLIST DE DEPLOYMENT

```
□ api_server.py tiene 'fact_capeco_certified'
□ gold_data/fact_capeco_certified.parquet existe en Azure
□ Código está en GitHub/Azure DevOps
□ Hice push o redeploy en Azure Portal
□ Esperé 5-10 minutos al deployment
□ curl https://capeco-app.azurewebsites.net/health retorna 9319
□ KPI cards en dashboard muestran números
□ Los números son: 9319 | 39 | 6549.73 | 116.0%

Si TODO está ✅ → Deployment es exitoso
Si alguno está ❌ → Revisa la sección de problemas comunes
```

---

## 🎯 PASOS ESPECÍFICOS PARA TU PROYECTO

### Si usas GitHub:

```bash
# 1. Navega a tu repo
cd /ruta/a/capeco

# 2. Asegúrate que estás en la rama main
git checkout main

# 3. Verifica el estado
git status

# 4. Actualiza si es necesario
git add api_server.py
git commit -m "Update: new data source with 9,319 rows mapping"

# 5. Push
git push origin main

# 6. Ve a Azure Portal
# 7. Busca tu App Service > Deployment Center
# 8. Haz click en "Sync" o "Redeploy"
```

### Si usas Azure DevOps:

```bash
# 1. Push a tu rama
git push origin feature/update-data-source

# 2. Crea un Pull Request
# 3. Apruébalo
# 4. Azure automáticamente hace merge y deploy
```

---

## ✅ VERIFICACIÓN FINAL

Cuando todo esté correcto, verás:

**En terminal:**
```bash
$ curl https://capeco-app.azurewebsites.net/health
{
  "status": "healthy",
  "gold_data_available": true,
  "rows_available": 9319
}

$ curl https://capeco-app.azurewebsites.net/api/v1/gold/metrics
{
  "metrics": {
    "total_projects": 9319,
    "avg_price_per_m2": 6549.73,
    "avg_absorption_rate": 1.16,
    "unique_districts": 39
  }
}
```

**En navegador:**
Abre: https://capeco-app.azurewebsites.net

Deberías ver:
```
KPI Cards:
├─ Total Projects: 9,319
├─ Unique Districts: 39
├─ Avg Price/m²: S/. 6,549.73
└─ Avg Progress: 116.0%

Charts:
├─ Mostrando gráficos con datos
├─ Tabla mostrando 9,319 filas
└─ Filtros por distrito funcionando
```

✅ Si ves esto → **Dashboard en producción está operativo**

---

## 📞 TIMELINE

- **Ahora:** Haz el deployment (5-10 minutos)
- **En 5-10 min:** Azure re-deploya
- **Luego:** Abre https://capeco-app.azurewebsites.net
- **Verifica:** Los KPI cards muestren 9,319

---

## 🚀 COMANDO RÁPIDO (COPIAR Y PEGAR)

```bash
# Asume que el código está actualizado localmente
cd /ruta/a/capeco

# 1. Actualiza Git
git add api_server.py
git commit -m "Update API - new data source"
git push origin main

# 2. En Azure Portal:
# - Busca "capeco-app"
# - Haz click en "Deployment Center"
# - Haz click en "Redeploy"
# - Espera 5 minutos

# 3. Verifica
curl https://capeco-app.azurewebsites.net/health

# 4. Abre en navegador
open https://capeco-app.azurewebsites.net
```

---

**Una vez que hayas hecho esto, el dashboard debería mostrar los datos nuevos (9,319 filas) en Azure.**

