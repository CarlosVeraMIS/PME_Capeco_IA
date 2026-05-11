# 🚀 Pasos para Desplegar la Corrección del API

## ✅ Lo que se ha completado

1. ✓ Identificado el problema en `api_server.py`
2. ✓ Corregidas las líneas problemáticas
3. ✓ Commit local realizado: `f5f569a`
4. ✓ Archivo de diagnóstico generado: `DIAGNOSTICO_PRECIOS_CERO.md`

---

## 📋 Próximos pasos (en tu máquina)

### Paso 1: Sincronizar los cambios

Desde tu máquina local (donde tienes acceso SSH a GitHub):

```bash
cd ~/ruta/a/capeco
git pull origin main
```

Deberías ver el commit:
```
commit f5f569a
Author: Claude
Date:   [fecha]

    fix: Mapeo completo de columnas PRECIO_SOLES en API response
```

### Paso 2: Push a GitHub

```bash
git push origin main
```

### Paso 3: Azure deployment automático

Una vez el código está en `main`, Azure App Service automáticamente:
1. Detecta el push en GitHub
2. Trigger el CI/CD pipeline
3. Redeploy el API con los cambios

**Tiempo estimado**: 3-5 minutos

### Paso 4: Validar el despliegue

Una vez completado, verifica que funciona:

```bash
# Health check
curl https://capeco-app.azurewebsites.net/health

# Obtener proyectos de San Isidro con precios
curl "https://capeco-app.azurewebsites.net/api/v1/gold/projects?limit=5&offset=0" | jq '.data[0]'

# Deberías ver:
# {
#   "project_id": "...",
#   "price_amount": 2044110.0,  ← Ahora con valor real
#   "price_per_m2": 8773.00,
#   ...
# }
```

### Paso 5: Verificar en el Dashboard

1. Abre https://monitor-real-estate-ia.vercel.app/
2. Navega a "Búsqueda" → "San Isidro"
3. Los precios ahora deberían mostrar valores reales como:
   - S/. 2,044,110
   - S/. 911,250
   - S/. 1,229,040
   
   (En lugar de S/. 0)

---

## 📊 Qué cambió en el código

**Archivo**: `api_server.py`

### Antes ❌
```python
# Línea 243-249: Mapeo incompleto
df['price_per_m2'] = df['PRECIO_X_M2']
# Falta PRECIO_SOLES

# Línea 320: Campo inexistente
"total_value": float(projects_df['price_amount'].sum())
```

### Después ✅
```python
# Línea 243-254: Mapeo completo
df['price_amount'] = df['PRECIO_SOLES'].fillna(0)  # ← NUEVO
df['price_per_m2'] = df['PRECIO_X_M2'].fillna(0)

# Línea 318-331: Cálculo robusto
total_value = float(projects_df['PRECIO_SOLES'].sum())
```

---

## 🔍 Validación de Datos

Si quieres verificar que los datos están correctos ANTES de hacer el deploy:

```bash
python3 << 'EOF'
import pandas as pd
import pyarrow.parquet as pq

# Cargar datos
table = pq.read_table("gold_data/fact_capeco_certified.parquet")
df = table.to_pandas()

# Filtrar San Isidro
df_si = df[df['DISTRITO'] == 'SAN ISIDRO']

print(f"✓ Total proyectos: {len(df_si)}")
print(f"✓ Con precios: {len(df_si[df_si['PRECIO_SOLES'] > 0])}")
print(f"✓ Precio mínimo: S/. {df_si[df_si['PRECIO_SOLES'] > 0]['PRECIO_SOLES'].min():,.0f}")
print(f"✓ Precio máximo: S/. {df_si['PRECIO_SOLES'].max():,.0f}")
EOF
```

---

## ❓ Preguntas Frecuentes

**P: ¿Cómo sé cuándo el deploy está listo?**
R: Verifica en Azure Portal → CAPECO App Service → Activity Log. O simplemente espera 5 minutos y prueba el endpoint `/health`.

**P: ¿Qué pasa si hay error durante el deploy?**
R: Azure automáticamente rollback a la versión anterior. Revisa los logs en Azure Portal.

**P: ¿Necesito hacer algo más?**
R: Una vez que el API esté actualizado, el dashboard se actualizará automáticamente en la siguiente carga de página (caché se expira en 1 hora).

---

## 📁 Archivos de Referencia Generados

```
capeco/
├── api_server.py                      ← MODIFICADO (commit f5f569a)
├── DIAGNOSTICO_PRECIOS_CERO.md        ← Análisis técnico
├── san_isidro_proyectos_detallado.csv ← 697 proyectos en CSV
└── san_isidro_proyectos_tabla.html    ← Tabla interactiva
```

---

## ✨ Resumen

**Problema**: Dashboard mostraba precios en cero aunque datalake tenía datos válidos.

**Causa**: API no mapeaba columna `PRECIO_SOLES`.

**Solución**: Mapeo explícito + selección limpia de columnas.

**Validación**: 94.8% de proyectos (661/697) tienen precios válidos.

**Acción siguiente**: Push a GitHub → Azure redeploy automático.
