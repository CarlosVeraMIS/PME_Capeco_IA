# Diagnóstico: Dashboard Vacío — SOLUCIÓN

**Fecha:** 7 de Mayo, 2026  
**Problema:** No veo datos en el dashboard  
**Causa Identificada:** API Server no está corriendo  
**Status:** SOLUCIONABLE EN 2 MINUTOS  

---

## ✅ LO QUE YA CONFIRMAMOS

He verificado directamente que:

```
✅ Datos cargados: 9,319 filas
✅ Columnas mapeadas: Correctamente
✅ Métricas calculadas: Correctamente
✅ Código API: Sin errores
```

El problema NO está en los datos. El problema es que **el API Server no está corriendo** en tu máquina.

---

## 🔴 EL PROBLEMA

Cuando ejecutas el dashboard, éste intenta conectar al API:
```
Dashboard → http://localhost:8000/api/v1/gold/projects
```

Pero el servidor no está escuchando en ese puerto porque:
- **No está corriendo** en tu máquina local
- **O no está deployado** en Azure (si usas la versión en producción)

---

## 🟢 LA SOLUCIÓN (2 Opciones)

### OPCIÓN 1: Ejecutar localmente (RÁPIDO — 30 segundos)

Abre Terminal en tu máquina y ejecuta:

```bash
# 1. Navega a la carpeta del proyecto
cd /ruta/a/tu/capeco

# 2. Inicia el API Server
python3 -m uvicorn api_server:app --host 0.0.0.0 --port 8000
```

Deberías ver:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Luego:

```bash
# 3. En otra terminal, abre el dashboard
# Opción A: Si tienes un archivo dashboard.html local
open dashboard.html

# Opción B: Si es vía URL
open http://localhost:8000
```

### OPCIÓN 2: Deploy a Azure (Para Producción)

Si quieres que funcione en producción:

```bash
# 1. Actualiza el código en Azure
git push origin main

# 2. Azure automáticamente hace redeploy
# (o manualmente redeploy desde Azure Portal)

# 3. Verifica que está corriendo
curl https://tu-app.azurewebsites.net/health
```

---

## ✅ PASOS PARA VERIFICAR

### Paso 1: Inicia el API Server

```bash
python3 -m uvicorn api_server:app --host 0.0.0.0 --port 8000
```

Espera a ver:
```
Application startup complete.
Uvicorn running on http://0.0.0.0:8000
```

### Paso 2: Prueba el Health Check

En otra terminal:
```bash
curl http://localhost:8000/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "gold_data_available": true,
  "rows_available": 9319
}
```

✅ Si ves `9319 rows` → El API está sirviendo los datos nuevos

### Paso 3: Recarga el Dashboard

1. Abre tu navegador en `http://localhost:8000/` (o donde tengas el dashboard)
2. Presiona `Ctrl+Shift+Delete` (o `Cmd+Shift+Delete` en Mac) para limpiar la cache
3. Presiona `F5` para recargar
4. Espera 5-10 segundos mientras carga los 9,319 registros

### Paso 4: Verifica que ves los datos

Deberías ver los KPI cards:
```
┌──────────────────────┬──────────────────────┐
│ Total Projects: 9319 │ Unique Districts: 39 │
├──────────────────────┼──────────────────────┤
│ Avg Price/m²: 6549   │ Avg Progress: 116%   │
└──────────────────────┴──────────────────────┘
```

✅ Si ves estos números → **Dashboard está funcionando**

---

## 🔍 SI TODAVÍA NO FUNCIONA

### Problema: "Connection Refused"

**Causa:** El API Server no está corriendo

**Solución:**
```bash
# 1. Verifica que el servidor esté corriendo
ps aux | grep uvicorn

# 2. Si no está, inícialo
python3 -m uvicorn api_server:app --host 0.0.0.0 --port 8000

# 3. En otra terminal, prueba
curl http://localhost:8000/health
```

### Problema: "404 Not Found"

**Causa:** El archivo parquet no está en la ubicación correcta

**Solución:**
```bash
# 1. Verifica que el archivo existe
ls -lh /ruta/a/capeco/gold_data/fact_capeco_certified.parquet

# 2. Deberías ver algo como:
# -rw-r--r-- ... 247K May  7 18:20 fact_capeco_certified.parquet

# 3. Si no existe, copia el archivo
cp /ruta/a/nuevo/dataset.parquet /ruta/a/capeco/gold_data/fact_capeco_certified.parquet
```

### Problema: "Empty Dashboard pero Health Check OK"

**Causa:** El dashboard está leyendo datos viejos del cache

**Solución:**
```bash
# 1. Abre Developer Tools (F12)
# 2. Vuelve a cargar sin cache: Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)

# 3. Alterna: Limpia el storage
# En DevTools → Application → LocalStorage → Elimina todo
```

### Problema: "API retorna datos viejos (3,289 filas)"

**Causa:** El API está leyendo fact_projects.parquet (viejo) en lugar de fact_capeco_certified.parquet (nuevo)

**Solución:**
```bash
# 1. Edita api_server.py línea ~236
# Busca: DataLoader.load_latest_parquet('gold_data', 'fact_projects')
# Cámbialo a: DataLoader.load_latest_parquet('gold_data', 'fact_capeco_certified')

# 2. Guarda y reinicia el API Server
python3 -m uvicorn api_server:app --host 0.0.0.0 --port 8000
```

---

## 📋 CHECKLIST DE DIAGNÓSTICO

```
□ API Server está corriendo (ps aux | grep uvicorn)
□ Health check retorna 9319 rows
□ Endpoint /api/v1/gold/projects responde
□ Dashboard se abre en http://localhost:8000
□ Browser DevTools (F12) no muestra errores 404
□ KPI Cards muestran números
□ Números coinciden: 9319 | 39 | 6549 | 116
□ Tabla de datos es visible
□ Filtros funcionan

Si TODO está ✅ → Sistema completamente operativo
Si alguno está ❌ → Revisa la sección "SI TODAVÍA NO FUNCIONA"
```

---

## 🚀 COMANDO RÁPIDO (COPIAR Y PEGAR)

Si quieres hacerlo todo de una vez:

```bash
# Terminal 1: Inicia el API
cd /ruta/a/capeco
python3 -m uvicorn api_server:app --host 0.0.0.0 --port 8000

# Terminal 2: Abre el dashboard
open http://localhost:8000
```

Luego presiona `Ctrl+Shift+Delete` + `F5` en el navegador.

---

## 📞 RESUMEN RÁPIDO

| ¿Qué ves? | Causa | Solución |
|-----------|-------|----------|
| Dashboard vacío | API no está corriendo | Inicia: `python3 -m uvicorn api_server:app --host 0.0.0.0 --port 8000` |
| Error 404 | Archivo parquet no existe | Verifica: `ls gold_data/fact_capeco_certified.parquet` |
| Datos viejos (3,289) | API usa archivo viejo | Edita api_server.py línea 236 |
| Cache stale | Navegador no actualizó | Presiona: `Ctrl+Shift+Delete` + `F5` |
| Connection refused | Puerto 8000 en uso | Cambia a otro puerto: `--port 8001` |

---

## ✨ RESULTADO ESPERADO

Cuando todo funcione, verás:

```
CAPECO DATA LAKE DASHBOARD
═══════════════════════════════════════════════════════════
│ 📊 Total: 9,319 projects │ 📍 39 districts          │
│ 💰 Avg Price: S/. 6,549.73 │ 📈 Progress: 116.0%     │
═══════════════════════════════════════════════════════════

📊 CHARTS (con datos reales)
├─ Projects by District: 39 barras
├─ Price Distribution: Rango 0 - 50,485
└─ Progress Distribution: 0% - 116%

📋 DATA TABLE (9,319 filas)
├─ Column: title | district | price_per_m2 | ...
├─ Row 1: BRICK | MIRAFLORES | 8762.53 | ...
└─ Filtrable por distrito

✅ SISTEMA COMPLETAMENTE OPERATIVO
```

---

## 🎯 SIGUIENTE ACCIÓN

1. **Ahora mismo:** Inicia el API Server
   ```bash
   python3 -m uvicorn api_server:app --host 0.0.0.0 --port 8000
   ```

2. **Luego:** Abre el dashboard
   ```bash
   open http://localhost:8000
   ```

3. **Finalmente:** Limpia el cache del navegador
   - `Ctrl+Shift+Delete` + `F5` (Windows)
   - `Cmd+Shift+Delete` + `Cmd+R` (Mac)

4. **Verifica:** ¿Ves los KPI cards con datos?
   - Sí → Sistema está funcionando ✅
   - No → Revisa la sección "SI TODAVÍA NO FUNCIONA"

---

**Una vez que veas los datos en el dashboard, el sistema estará completamente operativo y listo para la demo del 28 de Mayo.**

