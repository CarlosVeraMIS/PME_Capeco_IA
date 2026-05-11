# Fix: Frontend Field Mapping Issue

## Problema Identificado
El dashboard estaba mostrando precios en 0 aunque el API retornaba valores correctos. La culpa NO era del API, sino de cómo el frontend procesaba los datos.

## Root Cause
El archivo `src/services/capecoApi.ts` tenía una función `normalizeProject()` que convertía la respuesta del API al formato esperado por el frontend.

**Mapeador Incorrecto:**
```javascript
precio: toNumber(rawData.precio || rawData.price || rawData.total_price || 0)
```

El API retorna `price_amount`, pero el mapeo buscaba:
- rawData.precio ❌
- rawData.price ❌
- rawData.total_price ❌

Por eso siempre caía a 0.

## Solución Implementada
Actualicé la función `normalizeProject()` en `src/services/capecoApi.ts` (línea 50):

**Antes:**
```javascript
precio: toNumber(rawData.precio || rawData.price || rawData.total_price || 0),
```

**Después:**
```javascript
precio: toNumber(rawData.precio || rawData.price || rawData.price_amount || rawData.total_price || 0),
```

También se agregó soporte para otros campos del API:
- `rawData.project_id` → mapeado a `id`
- `rawData.distrito_norm` → mapeado a `distrito`
- `rawData.NRO_DORMITORIOS` → mapeado a `dormitorios`

## Flujo Ahora Correcto
```
API Response: { price_amount: 986785, price_per_m2: 14728.13 }
                      ↓
normalizeProject()
                      ↓
CapecoProject: { precio: 986785, precioM2: 14728.13 }
                      ↓
PropCard Component
                      ↓
Dashboard: Muestra "S/. 986,785"
```

## Qué Hacer Ahora

### Si el Monitor está en Vercel (deployed):
```bash
cd ~/ruta/a/capeco/Monitor
git add src/services/capecoApi.ts
git commit -m "Fix: Map price_amount from API response"
git push origin main
```

Vercel redeploy automático en 2-3 minutos.

### Si corre localmente:
```bash
npm run dev
# O rebuild si necesario:
npm run build
```

## Validación
Después del deploy, visita el dashboard y:
1. Navega a "Búsqueda" → "SAN ISIDRO"
2. Deberías ver precios reales en las tarjetas
3. Ejemplos: S/. 986,785 | S/. 1,436,454 | etc.

## Archivos Modificados
- `src/services/capecoApi.ts` → Función `normalizeProject()`
