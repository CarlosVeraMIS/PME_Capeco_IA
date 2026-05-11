#!/bin/bash

# Script para completar el despliegue de CAPECO API en Azure
# Ejecuta este script en tu máquina local donde tienes Azure CLI configurado

set -e

echo "=================================="
echo "CAPECO API - Completar Despliegue"
echo "=================================="
echo ""

# Variables
RESOURCE_GROUP="cvera_rg_7166"
APP_NAME="pme-capeco-api"
RUNTIME="PYTHON:3.11"

echo "Verificando credenciales de Azure..."
az account show > /dev/null 2>&1 || { echo "Error: No estás autenticado en Azure. Ejecuta: az login"; exit 1; }

echo "✓ Autenticación verificada"
echo ""

# Paso 1: Configurar startup file
echo "Paso 1/4: Configurando startup file..."
az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --startup-file "bash startup.sh" \
  --output none
echo "✓ Startup file configurado"
echo ""

# Paso 2: Configurar variables de entorno
echo "Paso 2/4: Configurando variables de entorno..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
  REDIS_HOST="localhost" \
  REDIS_PORT="6379" \
  SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
  --output none
echo "✓ Variables de entorno configuradas"
echo ""

# Paso 3: Desplegar código
echo "Paso 3/4: Desplegando código desde GitHub..."
az webapp up \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --runtime $RUNTIME \
  --startup-file "bash startup.sh" \
  --output none
echo "✓ Código desplegado"
echo ""

# Paso 4: Esperar y verificar
echo "Paso 4/4: Esperando que el servicio inicie (esto puede tomar 1-2 minutos)..."
sleep 10

echo "Verificando health endpoint..."
HEALTH_URL="https://${APP_NAME}.azurewebsites.net/health"

for i in {1..12}; do
  if curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL | grep -q "200"; then
    echo "✓ API está respondiendo correctamente"
    echo ""
    echo "=================================="
    echo "¡DESPLIEGUE COMPLETADO!"
    echo "=================================="
    echo ""
    echo "Tu API está disponible en:"
    echo "  https://${APP_NAME}.azurewebsites.net"
    echo ""
    echo "Endpoints disponibles:"
    echo "  • Health: https://${APP_NAME}.azurewebsites.net/health"
    echo "  • Docs: https://${APP_NAME}.azurewebsites.net/docs"
    echo "  • Proyectos: https://${APP_NAME}.azurewebsites.net/api/v1/gold/projects"
    echo "  • Métricas: https://${APP_NAME}.azurewebsites.net/api/v1/gold/metrics"
    echo "  • Distritos: https://${APP_NAME}.azurewebsites.net/api/v1/gold/districts"
    echo ""
    echo "El dashboard en Vercel debería cargar datos en vivo ahora:"
    echo "  https://monitor-capeco.vercel.app/"
    echo ""
    exit 0
  fi

  echo "  Intento $i/12... (esperando ${i}0 segundos)"
  sleep 10
done

echo ""
echo "⚠️  El API no ha respondido después de 2 minutos"
echo "Revisa los logs con:"
echo "  az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME"
exit 1
