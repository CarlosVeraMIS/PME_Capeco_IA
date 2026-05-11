# CAPECO API - Próximos Pasos para Completar Despliegue

## Estado Actual ✓

Todos los archivos necesarios están listos en tu repositorio:

- ✓ `api_server.py` — FastAPI server con todos los endpoints
- ✓ `requirements_api.txt` — Dependencias Python para el API
- ✓ `startup.sh` — Script de inicio para Azure App Service
- ✓ Azure App Service `pme-capeco-api` — Creado en tu suscripción

El estado es: **90% completado. Falta únicamente configurar el startup command en Azure.**

---

## ¿Qué Hacer Ahora?

### Opción 1: Script Automático (RECOMENDADO)

En tu máquina local, ejecuta:

```bash
# Navega a la carpeta del proyecto
cd ~/path/to/capeco

# Dale permisos de ejecución al script
chmod +x complete-deployment.sh

# Ejecuta el script
./complete-deployment.sh
```

El script hará:
1. Configurar el startup command
2. Establecer variables de entorno
3. Desplegar el código
4. Verificar que el API responda
5. Mostrar los endpoints disponibles

---

### Opción 2: Comandos Manuales

Si prefieres ejecutar los comandos uno por uno:

```bash
# 1. Configurar startup file
az webapp config set \
  --resource-group cvera_rg_7166 \
  --name pme-capeco-api \
  --startup-file "bash startup.sh"

# 2. Configurar variables de entorno
az webapp config appsettings set \
  --resource-group cvera_rg_7166 \
  --name pme-capeco-api \
  --settings \
  REDIS_HOST="localhost" \
  REDIS_PORT="6379" \
  SCM_DO_BUILD_DURING_DEPLOYMENT="true"

# 3. Desplegar código
az webapp up \
  --name pme-capeco-api \
  --resource-group cvera_rg_7166 \
  --runtime "PYTHON:3.11" \
  --startup-file "bash startup.sh"

# 4. Esperar 2-3 minutos y verificar
curl https://pme-capeco-api.azurewebsites.net/health
```

---

## Verificación Rápida

Una vez completado el despliegue, verifica que todo funciona:

```bash
# 1. Health endpoint (debe retornar 200)
curl https://pme-capeco-api.azurewebsites.net/health

# 2. Documentación interactiva
# Abre en tu navegador: https://pme-capeco-api.azurewebsites.net/docs

# 3. Verificar datos
curl "https://pme-capeco-api.azurewebsites.net/api/v1/gold/projects?limit=1"
```

---

## Confirmar en el Dashboard

1. Abre https://monitor-capeco.vercel.app/
2. Verifica que vea:
   - Total Proyectos: **9,319** (no 312)
   - Valor Total: **S/ 1,066.8B**
   - Área Total: **1,086,627 m²**

Si ves estos números en vivo, el despliegue está completado.

---

## Si Algo Falla

### Ver logs del servicio

```bash
az webapp log tail --name pme-capeco-api --resource-group cvera_rg_7166
```

### Restart del servicio

```bash
az webapp restart --name pme-capeco-api --resource-group cvera_rg_7166
```

### Verificar estado

```bash
az webapp show --name pme-capeco-api --resource-group cvera_rg_7166 --query "state" -o tsv
# Debería mostrar: Running
```

---

## Estimado de Tiempo

- **Opción 1 (Script):** 5-10 minutos
- **Opción 2 (Manual):** 10-15 minutos
- **Espera para que Azure inicie el servicio:** 2-3 minutos

**Tiempo total:** ~15 minutos

---

## Próximos Pasos Opcionales (Después de Verificar)

1. **Configurar CI/CD con GitHub Actions**
   - Ver: `DEPLOY_AZURE.md` (sección "Alternativa: GitHub Actions")

2. **Agregar monitoreo**
   - Application Insights en Azure Portal
   - Alertas para downtime

3. **Optimizar performance**
   - Implementar caching más agresivo
   - Considerar cambiar a un App Service Plan más potente si es necesario

---

## Resumen de URLs Finales

Una vez completado:

| Recurso | URL |
|---------|-----|
| Dashboard | https://monitor-capeco.vercel.app/ |
| API Health | https://pme-capeco-api.azurewebsites.net/health |
| API Docs | https://pme-capeco-api.azurewebsites.net/docs |
| Proyectos | https://pme-capeco-api.azurewebsites.net/api/v1/gold/projects |
| Métricas | https://pme-capeco-api.azurewebsites.net/api/v1/gold/metrics |
| Distritos | https://pme-capeco-api.azurewebsites.net/api/v1/gold/districts |

---

## ¿Preguntas o Problemas?

Revisa estos documentos para más detalles:
- `VERIFICACION_DEPLOYMENT.md` — Checklist de verificación detallado
- `DEPLOY_AZURE.md` — Guía técnica completa
- `DEPLOY_STEPS_FINAL.md` — Pasos finales paso a paso

¡Adelante con el despliegue! 🚀
