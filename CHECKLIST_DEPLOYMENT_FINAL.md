# ✅ Checklist de Deployment Final

## 🎯 Estado Actual

| Componente | Estado | Descripción |
|---|---|---|
| **Datalake** | ✅ CORRECTO | Los datos tienen valores reales (94.8% con precios) |
| **api_server.py (Local)** | ✅ CORREGIDO | Cambios hechos: mappeo de PRECIO_SOLES, limpieza de columnas |
| **API en Azure** | ❌ DESACTUALIZADO | Aún tiene código viejo que retorna precios en 0 |
| **Commit Local** | ✅ COMPLETADO | f5f569a - cambios listos para push |
| **Git Push a GitHub** | ⏳ PENDIENTE | Bloqueador - necesita ejecutarse desde tu máquina |
| **Dashboard** | ⏳ ESPERANDO | Mostrará precios una vez Azure redepliegue |

---

## 🚀 Pasos para Completar el Deployment

### PASO 1: Sincronizar cambios desde GitHub
```bash
cd ~/ruta/a/capeco
git pull origin main
```

Deberías ver:
```
Already up to date.
```
O el commit `f5f569a` si aún no has tirado.

### PASO 2: Push a GitHub Main
```bash
git push origin main
```

**IMPORTANTE:** Este paso es CRÍTICO. Sin esto, Azure no sabe que hay cambios.

Si ves "everything up-to-date" es porque ya está en sync. Si no, verás algo como:
```
Counting objects: 3, done.
Delta compression using up to 8 threads.
Compressing objects: 100% (3/3), done.
Writing objects: 100% (3/3), 318 bytes | 318.00 KiB/s, done.
Total 3 (delta 2), reused 0 (delta 0), reused pack 0 (delta 0)
```

### PASO 3: Esperar redeploy automático en Azure
- Azure detecta el push en automático
- CI/CD pipeline se triggereaautomáticamente
- **Tiempo estimado: 3-5 minutos**

Puedes monitorear en: **Azure Portal → CAPECO App Service → Deployments**

### PASO 4: Validar que funciona

#### Opción A: Test del API directamente
```bash
# Health check
curl https://capeco-app.azurewebsites.net/health

# Obtener datos de San Isidro
curl "https://capeco-app.azurewebsites.net/api/v1/gold/projects?limit=5&offset=0" | jq '.data[0]'

# Deberías ver precios como:
# "price_amount": 3114150.0,
# "price_per_m2": 26169.3,
```

#### Opción B: Verificar en el Dashboard
1. Abre https://monitor-real-estate-ia.vercel.app/
2. Navega a "Búsqueda" → "SAN ISIDRO"
3. Verifica que los precios muestren valores reales, NO ceros
4. Ejemplos de valores esperados:
   - S/. 3,114,150
   - S/. 2,044,110
   - S/. 1,590,780

---

## 📊 Qué Esperar Después

### ✅ El API retornará:
```json
{
  "project_id": "PRY01899",
  "title": "EMPIRE",
  "price_amount": 3114150.0,       ← Ahora con valor real
  "price_per_m2": 26169.3,         ← Ahora con valor real
  "area_m2": 5670,
  "absorption_rate_pct": 1.2,      ← Ahora con valor real
  "currency": "PEN"
}
```

### 📈 El Dashboard mostrará:
- Precios totales reales en cada tarjeta de proyecto
- Precios por m² correctos
- Porcentaje de absorción para proyectos que lo tengan
- Todos los campos numéricos con datos válidos

---

## 🔍 Verificación de Datos Mapeados

| Columna Parquet | Campo en API | Estado |
|---|---|---|
| PRECIO_SOLES | price_amount | ✅ Mapeado |
| PRECIO_X_M2 | price_per_m2 | ✅ Mapeado |
| AREA_CONSTRUCCION | area_m2 | ✅ Mapeado |
| PCT_AVANCE | absorption_rate_pct | ✅ Mapeado |
| COD_PROYECTO | project_id | ✅ Mapeado |
| NOMBRE DEL PROYECTO | title | ✅ Mapeado |
| DISTRITO | district | ✅ Mapeado |
| NRO_UNIDADES | NRO_UNIDADES | ✅ Preservado |
| NRO_DORMITORIOS | NRO_DORMITORIOS | ✅ Preservado |

---

## ⚠️ Si Algo Sale Mal

### El API sigue retornando ceros después de 5 minutos:
1. Verifica Azure Portal → Deployments → ¿Se completó el último?
2. Si falló, revisa los logs en Application Insights
3. Reinicia el App Service manualmente si es necesario

### El redeploy parece estar atascado:
1. Abre Azure Portal
2. CAPECO App Service → Overview
3. Click en "Restart"
4. Espera 2 minutos y vuelve a probar

### El git push falla:
- Verifica que tengas acceso SSH a GitHub: `ssh -T git@github.com`
- Si falla, regenera SSH key: `ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa`
- Actualiza en GitHub Settings → Deploy keys

---

## ✨ Resumen

| Acción | Estado | Responsable |
|---|---|---|
| Identificar problema | ✅ HECHO | Claude |
| Corregir api_server.py | ✅ HECHO | Claude |
| Hacer commit local | ✅ HECHO | Claude |
| **Git push a GitHub** | ⏳ PENDIENTE | **TÚ** |
| Azure redeploy automático | ⏳ ESPERA | Azure |
| Validar en dashboard | ⏳ ESPERA | Tú |

**Solo necesitas ejecutar:**
```bash
cd ~/ruta/a/capeco
git push origin main
```

**Listo. Eso desata el redeploy.**
