# Dashboard Check — Próximos Pasos

**Fecha:** 7 de Mayo, 2026  
**Responsable:** Verificación Manual del Dashboard  

---

## 🎯 LO QUE HEMOS COMPLETADO

✅ **Migración de Datos**
- CSV NEXO (3,289 filas) → tb_capeco_2026Q1_06052026.csv (9,319 filas)
- Procesamiento: Bronze → Silver → Gold Layer
- Certificación completada

✅ **API Configuration**
- Mapeo de columnas implementado en api_server.py
- Endpoints probados y validados
- Datos listos para consumo

✅ **Documentación**
- DASHBOARD_FIX.md — Análisis del problema
- DATA_MIGRATION_COMPLETE.md — Detalles técnicos
- API_VERIFICATION_COMPLETE.md — Pruebas realizadas

---

## 🔍 AHORA: VERIFICA EL DASHBOARD

### PASO 1: Verificar que el API está en Producción

El API debe estar deployado en Azure. Si no está corriendo todavía:

```bash
# En tu máquina local, abre terminal en la carpeta del proyecto
cd /ruta/a/capeco

# Inicia el API (si usas desarrollo local)
python -m uvicorn api_server:app --host 0.0.0.0 --port 8000
```

### PASO 2: Prueba el Health Check

Abre en el navegador o terminal:
```
http://localhost:8000/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "gold_data_available": true,
  "rows_available": 9319
}
```

Si ves **9319 rows** → ✅ Los datos nuevos están cargados

---

### PASO 3: Prueba los Endpoints

**Endpoint 1: Projects**
```
http://localhost:8000/api/v1/gold/projects?limit=10
```

Verifica que la respuesta tenga estos campos:
```json
{
  "status": "success",
  "data": [
    {
      "price_per_m2": 8762.53,
      "absorption_rate_pct": 0.5,
      "title": "BRICK",
      "project_id": "PRY02043",
      "district": "MIRAFLORES",
      "area_m2": 6550,
      "market_tier": "Standard"
    }
  ]
}
```

✅ Si ves estos campos → El mapeo está funcionando

**Endpoint 2: Metrics**
```
http://localhost:8000/api/v1/gold/metrics
```

Verifica:
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

✅ Si ves estos números → Las métricas están correctas

---

### PASO 4: Recarga el Dashboard

1. Abre el dashboard: `http://localhost:8000/` (o tu URL en Azure)

2. **Limpia la cache** del navegador:
   - **Windows/Linux:** Ctrl + Shift + Delete
   - **Mac:** Cmd + Shift + Delete

3. **Recarga la página:** F5 o Cmd + R

4. **Espera a que cargue** (puede tomar 5-10 segundos con 9,319 filas)

---

### PASO 5: Verifica que el Dashboard Muestre Datos

**KPI Cards (Arriba del dashboard):**
```
┌──────────────────────────┬──────────────────────────┐
│ Total Projects           │ Unique Districts         │
│ 9,319                    │ 39                       │
├──────────────────────────┼──────────────────────────┤
│ Avg Price/m²             │ Avg Absorption Rate      │
│ S/. 6,549.73             │ 116.0%                   │
└──────────────────────────┴──────────────────────────┘
```

✅ Si ves estos números → **Dashboard está funcionando**

**Gráficos:**
- Chart.js debería mostrar gráficos con datos
- El gráfico de distritos debería mostrar 39 opciones
- El rango de precios debería ir de 0 a 50,485

**Tabla de Datos:**
- Debería mostrar una tabla con 9,319 filas disponibles
- Las columnas: title, project_id, district, price_per_m2, absorption_rate_pct, area_m2
- Los filtros por distrito deberían funcionar

---

## ⚠️ SI EL DASHBOARD NO MUESTRA DATOS

### Problema 1: "Dashboard vacío, sin datos en KPI Cards"

**Causa posible:** El API no está retornando datos

**Solución:**
1. Verifica la consola del navegador (F12)
2. Busca errores en la sección "Network"
3. Verifica que `/api/v1/gold/projects` retorna datos (paso 3)
4. Verifica que el archivo parquet existe:
   ```bash
   ls -lh /gold_data/fact_capeco_certified.parquet
   ```

### Problema 2: "Error 404 o 500 en el API"

**Causa posible:** El archivo parquet está en la ubicación equivocada

**Solución:**
```bash
# Verifica la ruta del archivo
find . -name "fact_capeco_certified.parquet"

# Debería estar en:
# ./gold_data/fact_capeco_certified.parquet
```

### Problema 3: "Dashboard muestra datos viejos (3,289 filas)"

**Causa posible:** El API está leyendo fact_projects.parquet (viejo) en lugar de fact_capeco_certified.parquet (nuevo)

**Solución:**
1. Verifica api_server.py línea 236
2. Debe decir: `DataLoader.load_latest_parquet('gold_data', 'fact_capeco_certified')`
3. No debe decir: `DataLoader.load_latest_parquet('gold_data', 'fact_projects')`

---

## 📊 CHECKLIST DE VERIFICACIÓN

```
VERIFICACIÓN DEL SISTEMA — 7 Mayo 2026

□ Health Check retorna 9319 rows
□ Endpoint /api/v1/gold/projects responde
□ Endpoint /api/v1/gold/metrics responde
□ KPI Cards muestran números (9,319 | 39 | 6,549.73 | 116.0%)
□ Gráficos muestran datos
□ Tabla de datos está visible
□ Filtros funcionan
□ Números coinciden con esperados

Si TODOS están ✅ → El sistema está listo para demo
Si alguno está ❌ → Revisa la sección "SI EL DASHBOARD NO MUESTRA DATOS"
```

---

## 📞 SOPORTE RÁPIDO

| Pregunta | Respuesta |
|----------|-----------|
| ¿Cuántas filas debería tener? | 9,319 |
| ¿Cuántos distritos? | 39 |
| ¿Precio promedio? | S/. 6,549.73 / m² |
| ¿Progreso promedio? | 116.0% |
| ¿Proyectos únicos? | 1,216 |

Si los números no coinciden → Revisa Problema 3 arriba

---

## 🎯 RESULTADO ESPERADO

Cuando todo funcione correctamente, el dashboard debería verse así:

```
CAPECO DATA LAKE DASHBOARD
═══════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────┐
│  📊 KPI CARDS                                           │
│  ┌─────────────────────┬──────────────────────────────┐ │
│  │ Total Projects: 9,319                              │ │
│  │ Unique Districts: 39                               │ │
│  │ Avg Price/m²: S/. 6,549.73                         │ │
│  │ Avg Progress: 116.0%                               │ │
│  └─────────────────────┴──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  📈 GRÁFICOS                                            │
│  ├─ Proyectos por Distrito (39 distritos)              │
│  ├─ Rango de Precios (S/. 0 - S/. 50,485)              │
│  └─ Distribución de Avance (0% - 116%)                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  📋 TABLA DE DATOS (9,319 filas)                       │
│  ┌─────────────────────────────────────────────────────┐
│  │ Title │ District │ Price/m² │ Progress │ Area/m²  │
│  ├─────────────────────────────────────────────────────┤
│  │ BRICK │ MIRAFLORES │ 8762.53 │ 50% │ 6550       │
│  │ ... (9,318 more rows) ...                           │
│  └─────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────┘

✅ SISTEMA OPERATIVO — Listo para Demo
```

---

## 📅 TIMELINE

- **Hoy (7 Mayo):** Verificación manual del dashboard
- **Dentro de 3 días (10 Mayo):** Pre-test con stakeholders
- **21 Mayo:** Verificación final pre-demo
- **28 Mayo:** DEMO EN VIVO CON DATOS REALES

---

**Cuando termines la verificación, confirma:**
- ✅ Dashboard muestra 9,319 filas
- ✅ KPI Cards muestran datos correctos
- ✅ Gráficos renderean datos
- ✅ Tabla es interactiva
- ✅ Filtros funcionan

**Luego:** El sistema está listo para demo.

