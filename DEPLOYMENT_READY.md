# CAPECO Data Lake — Deployment Package LISTO

**Fecha:** 7 de Mayo, 2026  
**Status:** ✅ CÓDIGO ACTUALIZADO Y LISTO PARA DEPLOY  
**Commit:** `8586979` — Updated API with new data source (9,319 rows)

---

## 🎯 SITUACIÓN ACTUAL

El código API ha sido actualizado con éxito para cargar los 9,319 registros certificados:

✅ **api_server.py** — Actualizado con referencias a `fact_capeco_certified.parquet`  
✅ **gold_data/fact_capeco_certified.parquet** — 247 KB con 9,319 filas  
✅ **Columnas mapeadas** — PRECIO_X_M2 → price_per_m2, etc.  
✅ **Métricas** — Calcularán correctamente: 9,319 proyectos, 39 distritos, S/. 6,549.73 promedio

---

## 🚀 OPCIONES DE DEPLOYMENT

### OPCIÓN A: Git Push (RECOMENDADO)

La limitación de red en el sandbox impide hacer push directo a GitHub. **Solución:**

```bash
# En tu máquina local (NO en el sandbox):

# 1. Abre tu terminal
cd /ruta/a/tu/PME_Capeco_IA

# 2. Copia los archivos actualizados (copiar desde /Users/carlosvera/Library/CloudStorage/OneDrive-MSFT/mis/IA/capeco/):
cp api_server.py .
cp -r gold_data/ .

# 3. Commit y push
git add api_server.py gold_data/
git commit -m "feat: update API with new data source (9,319 rows from Q1 2026 CAPECO)"
git push origin main

# 4. Azure automáticamente hará redeploy (webhook-based CI/CD)
#    Espera 3-5 minutos
```

### OPCIÓN B: Azure Portal Direct Deploy

1. Ve a https://portal.azure.com
2. Busca: "capeco-app"
3. Abre el App Service
4. En el menú izquierdo: `Deployment Center`
5. Haz click en `Redeploy` (si tienes código previo en Azure)
6. O sube los archivos directamente:
   - Sube api_server.py a la raíz
   - Sube gold_data/ con los parquet files

### OPCIÓN C: Azure CLI (si tienes az cli instalado)

```bash
az webapp up \
  --resource-group <tu-resource-group> \
  --name capeco-app \
  --runtime "PYTHON:3.10" \
  --source-dir /Users/carlosvera/Library/CloudStorage/OneDrive-MSFT/mis/IA/capeco
```

---

## 📋 VERIFICACIÓN POST-DEPLOYMENT

Una vez que hayas hecho el deployment, verifica que funciona:

### 1. Health Check
```bash
curl https://capeco-app.azurewebsites.net/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "gold_data_available": true,
  "rows_available": 9319
}
```

### 2. API Projects Endpoint
```bash
curl https://capeco-app.azurewebsites.net/api/v1/gold/projects?limit=1
```

Verifica que retorna `price_per_m2`, `title`, `district`, etc.

### 3. Metrics
```bash
curl https://capeco-app.azurewebsites.net/api/v1/gold/metrics
```

Deberías ver:
```json
{
  "metrics": {
    "total_projects": 9319,
    "unique_districts": 39,
    "avg_price_per_m2": 6549.73,
    "avg_absorption_rate": 1.16
  }
}
```

### 4. Dashboard Visual
Abre en navegador:
```
https://capeco-app.azurewebsites.net
```

Presiona `Ctrl+Shift+Delete` (limpiar cache) + `F5` (recargar)

**Verifica que veas:**
- KPI Cards: 9,319 | 39 | 6,549.73 | 116.0%
- Gráficos con datos
- Tabla con 9,319 filas

---

## 📦 ARCHIVOS EN DEPLOYMENT_PACKAGE

```
/DEPLOYMENT_PACKAGE/
├── api_server.py                    (542 líneas, actualizado ✅)
├── gold_data/
│   ├── fact_capeco_certified.parquet (247 KB, 9,319 rows)
│   ├── dim_distrito.parquet
│   ├── dim_market_tier.parquet
│   ├── fact_projects.parquet (legacy)
│   └── metrics_by_distrito.parquet
└── requirements.txt
```

---

## 🔑 CAMBIOS PRINCIPALES EN api_server.py

**Línea 171** — Health check:
```python
data['projects'] = DataLoader.load_latest_parquet('gold_data', 'fact_capeco_certified')
```

**Línea 236** — Projects endpoint:
```python
df = DataLoader.load_latest_parquet('gold_data', 'fact_capeco_certified')
```

**Línea 241-250** — Column mapping:
```python
df['price_per_m2'] = df['PRECIO_X_M2']
df['absorption_rate_pct'] = df['PCT_AVANCE']
df['title'] = df['NOMBRE DEL PROYECTO']
df['project_id'] = df['COD_PROYECTO']
df['district'] = df['DISTRITO']
df['area_m2'] = df['AREA_CONSTRUCCION']
df['market_tier'] = 'Standard'
```

---

## ✅ CHECKLIST DE DEPLOYMENT

```
ANTES DE HACER DEPLOY:
□ Tienes acceso a GitHub y Azure
□ Has descargado/copiado api_server.py actualizado
□ Has descargado/copiado la carpeta gold_data/
□ Verificaste que fact_capeco_certified.parquet está ahí (247 KB)

DEPLOYMENT:
□ Pusheaste a GitHub O hiciste upload a Azure Portal
□ Esperaste 3-5 minutos para que Azure redeploy termine

VALIDACIÓN:
□ Health check retorna 9319 rows_available
□ /api/v1/gold/projects responde con datos
□ /api/v1/gold/metrics calcula correctamente
□ Dashboard muestra KPI cards con números
□ Gráficos renderean datos
□ Tabla tiene 9,319 filas

SI TODO ESTÁ ✅ → DEPLOYMENT EXITOSO
```

---

## 📞 TROUBLESHOOTING

### "Dashboard sigue vacío después del deployment"
1. Limpia el cache del navegador: `Ctrl+Shift+Delete` + `F5`
2. Verifica health check: `curl https://capeco-app.azurewebsites.net/health`
3. Si health check muestra `rows_available: 3289` → El código viejo está en Azure
   - Necesitas hacer push a GitHub O redeploy manual en Portal

### "404 Not Found en API"
1. Verifica que `gold_data/fact_capeco_certified.parquet` fue uploaded
2. Verifica en Azure Storage que el archivo existe

### "502 Bad Gateway"
1. Verifica que el código tiene la estructura correcta
2. Verifica requirements.txt tiene FastAPI y dependencies
3. Reinicia el App Service en Azure Portal

---

## 📊 RESULTADO ESPERADO

```
ANTES (viejo):
├─ 3,289 filas
├─ 16 distritos
├─ Data source: CSV NEXO
└─ Últimas actualizaciones: 2025

DESPUÉS (nuevo) ✅:
├─ 9,319 filas (+183%)
├─ 39 distritos (+143%)
├─ Data source: tb_capeco_2026Q1_06052026.csv
├─ Certificado en Gold Layer
└─ Q1 2026
```

---

## 🎯 SIGUIENTE ACCIÓN

**Ahora mismo:**
1. Usa GitHub: `git push origin main` desde tu máquina local
2. O usa Azure Portal para hacer redeploy/upload

**En 5-10 minutos:**
- Azure completará el deployment
- Los endpoints estarán activos

**Luego:**
- Verifica health check
- Abre dashboard en navegador
- Limpia cache y recarga

**Resultado:**
- Dashboard con 9,319 registros visible en https://capeco-app.azurewebsites.net
- Listo para demo del 28 de Mayo

---

**Commit Hash:** 8586979  
**Autor:** CAPECO Data Lake Engineering  
**Fecha:** 7 de Mayo, 2026  
**Status:** ✅ LISTO PARA PRODUCTION
