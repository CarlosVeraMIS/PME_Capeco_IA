# GUÍA DE DEPLOYMENT MANUAL — Paso a Paso

**Status:** ✅ Código listo, necesita último paso para ir a Azure  
**Fecha:** 7 de Mayo, 2026

---

## ⚠️ SITUACIÓN ACTUAL

El código api_server.py está **100% listo** con:
- ✅ Todas las referencias a `fact_capeco_certified.parquet` (9,319 filas)
- ✅ Mapeo de columnas correcto
- ✅ Métricas calculadas correctamente
- ✅ Gold layer datos validados

**Qué falta:** Subir el código a Azure. Aquí están todas las opciones:

---

## 🚀 OPCIÓN A: Via GitHub (MÁS RÁPIDO — 2 minutos)

### Paso 1: En tu Terminal

```bash
# Navega al repositorio
cd ~/Documents/PME_Capeco_IA
# O donde tengas clonado el repo
```

### Paso 2: Copia los archivos actualizados

Los archivos están en `/Users/carlosvera/Library/CloudStorage/OneDrive-MSFT/mis/IA/capeco/`:

```bash
# Copia el API
cp /Users/carlosvera/Library/CloudStorage/OneDrive-MSFT/mis/IA/capeco/api_server.py .

# Copia los datos
cp -r /Users/carlosvera/Library/CloudStorage/OneDrive-MSFT/mis/IA/capeco/gold_data .
```

### Paso 3: Commit y Push

```bash
# Verifica el status
git status
# Deberías ver api_server.py y gold_data/ como cambios

# Agrega al staging
git add api_server.py gold_data/

# Haz commit
git commit -m "feat: update API with new data source (9,319 rows Q1 2026)"

# Push a GitHub
git push origin main
```

### Paso 4: Espera el Auto-Deployment

Azure está configurado con webhook de GitHub. Automáticamente:
1. Detectará el push
2. Descargará el código
3. Hará build y deploy
4. Tardará 3-5 minutos

**Verifica el progreso:**
1. Abre https://portal.azure.com
2. Busca "capeco-app"
3. Abre App Service
4. En el menú: "Deployment center"
5. Verás el histórico de deploys

---

## 🌐 OPCIÓN B: Azure Portal Direct Upload (5 minutos)

### Paso 1: Abre Azure Portal

Ve a https://portal.azure.com

Inicia sesión con tu cuenta de Azure.

### Paso 2: Busca la App

1. En la barra de búsqueda (arriba), escribe: `capeco-app`
2. Haz click en "capeco-app — App Service"

### Paso 3: Abre el Deployment Center

En el menú izquierdo, busca:
```
Deployment > Deployment Center
```

Haz click.

### Paso 4: Opción A - Si tienes GitHub conectado

Si ves "GitHub" como fuente:
1. Haz click en "Redeploy"
2. Selecciona el commit más reciente
3. Haz click en "Redeploy"

Espera 3-5 minutos.

### Paso 4B: Opción B - Upload Manual

Si no está conectado a GitHub:

1. En Azure Portal, abre la consola (CLI o Cloud Shell)
   - Haz click en `>_` arriba a la derecha
   
2. Sube los archivos:

```bash
# En la Cloud Shell
az storage blob upload \
  --file api_server.py \
  --container-name capeco \
  --name api_server.py

az storage blob upload-batch \
  --destination capeco \
  --source gold_data/
```

---

## 🖥️ OPCIÓN C: Visual Studio Code Deploy (si tienes extensión Azure)

1. Abre VS Code
2. Instala extensión "Azure App Service"
3. En la sidebar de Azure, busca "capeco-app"
4. Click derecho > "Deploy to Web App"
5. Selecciona la carpeta del proyecto
6. Confirma el deployment

Espera 3-5 minutos.

---

## ✅ VERIFICACIÓN — Cómo saber que funcionó

Después de hacer el deployment, abre una terminal y ejecuta:

### Verificación 1: Health Check

```bash
curl https://capeco-app.azurewebsites.net/health
```

**Resultado esperado:**
```json
{
  "status": "healthy",
  "gold_data_available": true,
  "rows_available": 9319
}
```

Si ves `9319` → ✅ El deployment fue exitoso

### Verificación 2: Endpoint de Proyectos

```bash
curl "https://capeco-app.azurewebsites.net/api/v1/gold/projects?limit=1"
```

Deberías ver datos con estas columnas:
- `price_per_m2`
- `absorption_rate_pct`
- `title`
- `district`
- `project_id`
- `area_m2`

### Verificación 3: Métricas

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

### Verificación 4: Dashboard Visual

1. Abre en navegador: https://capeco-app.azurewebsites.net
2. Presiona Ctrl+Shift+Delete (limpiar cache del navegador)
3. Presiona F5 o Cmd+R (recargar página)
4. Espera 5-10 segundos

**Deberías ver:**
- 4 KPI Cards arriba mostrando: 9,319 | 39 | 6,549.73 | 116.0%
- Gráficos con datos
- Tabla con 9,319 filas

---

## 🔍 TROUBLESHOOTING

### Problema: "curl: (60) SSL certificate problem"

**Solución:**
```bash
# Agrega flag de insecuro (solo para testing)
curl -k https://capeco-app.azurewebsites.net/health
```

### Problema: "502 Bad Gateway"

**Causa:** El server todavía está iniciando después del deploy

**Solución:** Espera 2-3 minutos y vuelve a intentar

### Problema: "404 Not Found"

**Causa:** El archivo parquet no está en la ubicación correcta

**Solución:**
1. Verifica que `gold_data/fact_capeco_certified.parquet` fue uploadado
2. Verifica en Storage que existe

### Problema: "Dashboard vacío pero /health retorna datos"

**Causa:** Browser cache viejo

**Solución:**
1. Presiona Ctrl+Shift+Delete (limpiar cache)
2. Cierra el navegador completamente
3. Abre una nueva ventana privada/incógnita
4. Abre https://capeco-app.azurewebsites.net
5. Presiona Ctrl+Shift+R (hard refresh)

### Problema: "Dashboard muestra 3,289 filas (viejo)"

**Causa:** El código viejo está todavía en Azure

**Solución:**
1. Verifica que hiciste `git push origin main`
2. En Azure Portal, verifica el histórico de Deployment Center
3. Verifica que el último deploy tiene el timestamp más reciente
4. Si no, haz manualmente "Redeploy"

---

## 📋 CHECKLIST FINAL

```
ANTES:
□ Bajé/copié api_server.py del OneDrive
□ Bajé/copié la carpeta gold_data/ del OneDrive
□ Verifico que fact_capeco_certified.parquet existe (247 KB)

DURANTE:
□ Usé git push (Opción A) O Azure Portal (Opción B) O VS Code (Opción C)
□ Esperé 3-5 minutos para que complete el deployment

DESPUÉS:
□ Ejecuté curl https://capeco-app.azurewebsites.net/health
□ Vi "rows_available": 9319 ← ESTO ES CRÍTICO
□ Ejecuté curl https://capeco-app.azurewebsites.net/api/v1/gold/projects?limit=1
□ Vi datos con price_per_m2, title, district, etc.
□ Abrí https://capeco-app.azurewebsites.net en navegador
□ Vi KPI cards con números: 9,319 | 39 | 6,549.73 | 116.0%

SI TODO ESTÁ ✅ → DEPLOYMENT 100% EXITOSO
```

---

## ⏰ TIMELINE

| Paso | Duración | Acción |
|------|----------|--------|
| 1 | 1 min | Copia archivos desde OneDrive |
| 2 | 1 min | `git add` + `git commit` |
| 3 | 30 seg | `git push origin main` |
| 4 | 3-5 min | Azure auto-deploya (automático) |
| 5 | 2 min | Verifica health check y endpoints |
| 6 | 2 min | Abre dashboard y verifica datos |
| **TOTAL** | **10 minutos** | |

---

## 📞 RESUMEN RÁPIDO

**Si usas Opción A (Git):**
```bash
cp /Users/carlosvera/Library/CloudStorage/OneDrive-MSFT/mis/IA/capeco/{api_server.py,gold_data} .
git add api_server.py gold_data/
git commit -m "Update API with new data source"
git push origin main
# Espera 5 minutos
curl https://capeco-app.azurewebsites.net/health
```

**Si usas Opción B (Azure Portal):**
1. https://portal.azure.com
2. Busca "capeco-app"
3. "Deployment Center" → "Redeploy"
4. Espera 5 minutos
5. curl https://capeco-app.azurewebsites.net/health

---

## 🎯 RESULTADO

Cuando termines y todo funcione:

```
✅ Dashboard en https://capeco-app.azurewebsites.net muestra:
   • 9,319 proyectos
   • 39 distritos
   • S/. 6,549.73 precio promedio
   • 116.0% progreso promedio

✅ API endpoints activos y retornando datos

✅ Listo para demo del 28 de Mayo
```

---

**Documentado por:** CAPECO Data Lake Engineering  
**Fecha:** 7 de Mayo, 2026  
**Status:** Código 100% listo, esperando deployment manual
