# Despliegue del API CAPECO en Azure

## Problema Identificado
El servidor FastAPI `api_server.py` no está desplegado en Azure. El dashboard intenta acceder a `https://pme-capeco-api.azurewebsites.net` pero el servicio no está disponible.

## Solución: Desplegar en Azure App Service

### Requisitos Previos
- Cuenta de Azure activa
- Azure CLI instalado (`az --version`)
- Git configurado
- Permiso para crear resources en Azure

### Pasos de Deployment

#### 1. Preparar el repositorio
```bash
# El repositorio debe incluir:
# - api_server.py (servidor FastAPI)
# - requirements_api.txt (dependencias)
# - startup.sh (script de inicio)
# - .env (variables de entorno - crear en Azure)

git add api_server.py requirements_api.txt startup.sh
git commit -m "feat: add Azure deployment configuration for CAPECO API"
git push origin main
```

#### 2. Crear Azure App Service
```bash
# Login en Azure
az login

# Definir variables
RESOURCE_GROUP="capeco-api-rg"
APP_NAME="pme-capeco-api"
LOCATION="eastus"
PLAN_NAME="capeco-plan"

# Crear grupo de recursos
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Crear App Service Plan
az appservice plan create \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku B2 \
  --is-linux

# Crear App Service con Python runtime
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --name $APP_NAME \
  --runtime "PYTHON:3.11"
```

#### 3. Configurar variables de entorno
```bash
# Configurar variables de entorno en Azure
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
  REDIS_HOST="localhost" \
  REDIS_PORT="6379" \
  SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
  STARTUP_COMMAND="bash startup.sh"
```

#### 4. Desplegar código desde GitHub
```bash
# Conectar repositorio de GitHub a Azure
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --src <path-to-zip-file>

# O si tienes GitHub Actions configured:
# El repositorio se desplegará automáticamente en cada push
```

#### 5. Verificar deployment
```bash
# Ver logs del deployment
az webapp log tail \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME

# Acceder al endpoint de salud
curl https://pme-capeco-api.azurewebsites.net/health

# Acceder a documentación OpenAPI
# https://pme-capeco-api.azurewebsites.net/docs
```

### Alternativa: Usar GitHub Actions para CI/CD

Crear archivo `.github/workflows/deploy-api.yml`:

```yaml
name: Deploy CAPECO API to Azure

on:
  push:
    branches: [main]
    paths:
      - 'api_server.py'
      - 'requirements_api.txt'
      - 'startup.sh'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy to Azure
        run: |
          az webapp up \
            --name pme-capeco-api \
            --location eastus \
            --runtime "PYTHON:3.11"
```

### Troubleshooting

**Error: "403 Forbidden from proxy"**
- Esto ocurre desde el sandbox - no es un problema real
- El API funcionará correctamente en producción (desde browser/Vercel)

**Error: "Connection refused to CAPECO API"**
- Verificar que Azure App Service esté ejecutándose: `az webapp show --name pme-capeco-api`
- Verificar logs: `az webapp log tail --name pme-capeco-api`
- Reiniciar servicio: `az webapp restart --name pme-capeco-api`

**Datos no se cargan**
- Verificar que las rutas parquet estén configuradas correctamente
- Ajustar la variable `DATA_PATH` en variables de entorno

## Estimado de Costo Azure

- **App Service Plan B2**: ~$52/mes
- **Storage**: Incluido en plan
- **Data Transfer**: Primeros 1GB gratis

## Monitoreo Post-Deployment

1. Configurar Application Insights para monitoreo
2. Configurar alertas para uptime
3. Revisar logs regularmente
4. Monitorear uso de CPU/memoria

## Endpoints Disponibles

Después del deployment, estarán disponibles:

- `GET /health` - Health check
- `GET /docs` - OpenAPI documentation
- `GET /api/v1/gold/projects` - Lista de proyectos
- `GET /api/v1/gold/metrics` - KPIs y métricas
- `GET /api/v1/gold/districts` - Análisis por distrito
- `GET /api/v1/gold/market-tiers` - Análisis por tier de mercado

## Próximos Pasos

1. Completar deployment en Azure
2. Verificar que dashboard pueda acceder al API
3. Monitorear performance y uptime
4. Implementar caching y optimizaciones si es necesario
