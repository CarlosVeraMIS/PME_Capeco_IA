# Pasos Finales para Completar Despliegue CAPECO API en Azure

## Estado Actual
Tu deployment anterior creó exitosamente:
- Resource Group: `cvera_rg_7166`
- App Service Plan: `cvera_asp_6624`
- App Service: `pme-capeco-api`

## Próximos Pasos en tu Terminal

### Paso 1: Configurar el Startup Command

Ejecuta esto en tu máquina local (donde tienes `az` configurado):

```bash
az webapp config set \
  --resource-group cvera_rg_7166 \
  --name pme-capeco-api \
  --startup-file "bash startup.sh"
```

### Paso 2: Configurar Variables de Entorno

```bash
az webapp config appsettings set \
  --resource-group cvera_rg_7166 \
  --name pme-capeco-api \
  --settings \
  REDIS_HOST="localhost" \
  REDIS_PORT="6379" \
  SCM_DO_BUILD_DURING_DEPLOYMENT="true"
```

### Paso 3: Desplegar el Código desde GitHub

Opción A - Desplegar directamente desde el repositorio (RECOMENDADO):

```bash
az webapp up \
  --name pme-capeco-api \
  --resource-group cvera_rg_7166 \
  --runtime "PYTHON:3.11" \
  --startup-file "bash startup.sh"
```

Opción B - Si tienes el código en un archivo zip local:

```bash
# Desde la carpeta con tu código
zip -r capeco-api.zip . -x "*.git*" "__pycache__/*" "*.pyc"

az webapp deployment source config-zip \
  --resource-group cvera_rg_7166 \
  --name pme-capeco-api \
  --src capeco-api.zip
```

### Paso 4: Verificar el Despliegue

```bash
# Ver logs en tiempo real
az webapp log tail \
  --resource-group cvera_rg_7166 \
  --name pme-capeco-api

# En otra terminal, probar el endpoint
curl https://pme-capeco-api.azurewebsites.net/health
```

Deberías ver una respuesta tipo:
```json
{"status": "ok", "version": "1.0.0"}
```

### Paso 5: Verificar que el Dashboard Carga Datos

1. Abre https://monitor-capeco.vercel.app/ en tu navegador
2. Deberías ver más de 9,319 proyectos cargados en vivo (no los 312 estáticos)
3. Las métricas y distritos también deberían cargarse desde el API

## Solucionar Problemas Comunes

### Error: "Connection refused"
El API está subiendo pero aún no está listo. Espera 2-3 minutos y vuelve a intentar.

### Error: "503 Service Unavailable"
Ver logs del deployment:
```bash
az webapp log tail --resource-group cvera_rg_7166 --name pme-capeco-api
```

### El Dashboard sigue mostrando datos estáticos
Verifica en el navegador (F12 → Network → filter by "gold"):
- Si ves 403/404 → El API no está respondiendo
- Si ves 200 → El API funciona, pero tal vez hay un problema de CORS

## Confirmar que Todo Funciona

Una vez completados todos los pasos, verifica:

1. Health check: `curl https://pme-capeco-api.azurewebsites.net/health`
2. Lista de proyectos: `curl https://pme-capeco-api.azurewebsites.net/api/v1/gold/projects?limit=1`
3. Métricas: `curl https://pme-capeco-api.azurewebsites.net/api/v1/gold/metrics`
4. Distritos: `curl https://pme-capeco-api.azurewebsites.net/api/v1/gold/districts`

Todos deberían responder con código 200 y datos JSON.

## Costo Azure

Con la configuración actual:
- App Service Plan B2: ~$52/mes
- Data Transfer: Primeros 1GB gratis
- Sin Storage adicional

Puedes monitorear el costo en Azure Portal → Cost Management + Billing.

## Próximos Pasos Opcionales

1. **Configurar GitHub Actions** para CI/CD automático
2. **Agregar Application Insights** para monitoreo
3. **Configurar alertas** para uptime
4. **Implementar caching** si es necesario para mejor performance
