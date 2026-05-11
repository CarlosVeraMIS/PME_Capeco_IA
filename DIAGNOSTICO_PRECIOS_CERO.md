# 📋 DIAGNÓSTICO: Problema de Precios en Cero

## Problema Reportado
El dashboard CAPECO Monitor mostraba todos los proyectos con precios en `S/. 0` a pesar de que los datos en la datalake contenían valores válidos.

---

## 🔍 Investigación Realizada

### 1. Estado de la Datalake
**Archivo**: `gold_data/fact_capeco_certified.parquet`

```
Total de proyectos: 9,319
Proyectos en SAN ISIDRO: 697

Análisis de precios:
✓ Con precios válidos: 661 (94.8%)
⚠ Con precio S/. 0: 36 (5.2%) — Datos legítimamente faltantes

Estadísticas de precios:
• Precio mínimo (sin ceros): S/. 7,800
• Precio máximo: S/. 8,206,480
• Precio promedio: S/. 926,586
• Precio promedio por m²: S/. 8,117
```

**Conclusión**: Los datos en la datalake están correctos. El problema NO está en los datos origen.

---

## 🔧 Causa Raíz Identificada

### Problema en el API Server (`api_server.py`)

**Línea 243-249 (Mapeo incompleto de columnas)**:
```python
# ❌ ANTES (INCORRECTO)
df['price_per_m2'] = df['PRECIO_X_M2']
df['absorption_rate_pct'] = df['PCT_AVANCE']
df['title'] = df['NOMBRE DEL PROYECTO']
# ... pero falta mapear PRECIO_SOLES a price_amount
```

**Línea 320 (Métrica fallida)**:
```python
# ❌ ANTES (ERROR)
"total_value": float(projects_df['price_amount'].sum()) 
# → 'price_amount' no existe en el dataframe
```

**Impacto**:
1. El API retornaba `undefined` o `0` para el campo `price_amount`
2. El frontend no podía acceder a `PRECIO_SOLES` porque no estaba mapeado
3. Las métricas fallaban en el cálculo de valores totales

---

## ✅ Soluciones Aplicadas

### 1. Mapeo Completo de Columnas (Línea 241-262)

```python
# ✅ DESPUÉS (CORRECTO)
df['price_amount'] = df['PRECIO_SOLES'].fillna(0)  # ← NUEVO
df['price_per_m2'] = df['PRECIO_X_M2'].fillna(0)
df['absorption_rate_pct'] = df['PCT_AVANCE'].fillna(0)
df['title'] = df['NOMBRE DEL PROYECTO']
df['project_id'] = df['COD_PROYECTO']
df['district'] = df['DISTRITO']
df['construction_phase'] = df['ETAPA_DE_PROYECTO']
# ... más campos
```

**Cambios clave**:
- ✅ Mapeo explícito de `PRECIO_SOLES` → `price_amount`
- ✅ Manejo de valores NaN con `.fillna(0)`
- ✅ Selección de columnas de salida (no retornar todo)

### 2. Selección Limpia de Columnas (Línea 263-269)

```python
output_columns = [
    'project_id', 'title', 'district', 'price_amount', 'price_per_m2',
    'area_m2', 'absorption_rate_pct', 'market_tier', 'currency',
    'construction_phase', 'NRO_UNIDADES', 'NRO_DORMITORIOS',
    'NOMBRE DEL CONSTRUCTOR', 'TIPO_DE_OBRA'
]
df = df[output_columns]  # Solo estas columnas en la respuesta
```

**Beneficio**: El JSON de respuesta es limpio y contiene solo lo necesario.

### 3. Cálculo Robusto de Métricas (Línea 318-332)

```python
# ✅ CORRECTO
total_value = float(projects_df['PRECIO_SOLES'].sum())
prices_nonzero = projects_df[projects_df['PRECIO_X_M2'] > 0]['PRECIO_X_M2']
min_price = float(prices_nonzero.min()) if len(prices_nonzero) > 0 else 0
```

**Mejoras**:
- ✅ Usa la columna correcta (`PRECIO_SOLES`)
- ✅ Maneja precios cero inteligentemente (excluye del min/max)
- ✅ Protegido contra división por cero

### 4. Conversión de Tipos (Línea 280-282)

```python
elif key in ['price_amount', 'price_per_m2']:
    record[key] = float(value) if value else 0.0
```

**Propósito**: Garantizar que los precios sean siempre números válidos en JSON.

---

## 📊 Resultados Esperados

**Antes de la corrección**:
```json
{
  "project_id": "PRJ001",
  "title": "ACOSTA 131",
  "price_amount": null,     ❌ null o undefined
  "price_per_m2": 8773.00
}
```

**Después de la corrección**:
```json
{
  "project_id": "PRJ001",
  "title": "ACOSTA 131",
  "price_amount": 2044110.0,  ✅ Valor correcto
  "price_per_m2": 8773.00
}
```

---

## 🚀 Próximos Pasos

1. **Reiniciar el API**:
   ```bash
   pkill -f "python.*api_server.py"
   cd /path/to/capeco
   python api_server.py
   ```

2. **Probar el endpoint**:
   ```bash
   curl "http://localhost:8000/api/v1/gold/projects?limit=5&offset=0" | jq '.'
   ```

3. **Verificar en el dashboard**:
   - Abrir Monitor Real Estate
   - Navegar a San Isidro
   - Verificar que los precios ahora muestren valores reales (no ceros)

4. **Validar métricas**:
   ```bash
   curl "http://localhost:8000/api/v1/gold/metrics" | jq '.metrics'
   ```

---

## 📁 Archivos Generados para Referencia

- `san_isidro_proyectos_detallado.csv` — 697 proyectos con todos los datos
- `san_isidro_proyectos_tabla.html` — Tabla interactiva para visualizar

---

## ✨ Conclusión

**Raíz del problema**: Mapeo incompleto de columnas en el API que no exponía `PRECIO_SOLES` como `price_amount`.

**Solución**: Mapeo explícito y selección limpia de columnas de salida.

**Validación**: Los datos en la datalake son correctos (94.8% tienen precios válidos).
