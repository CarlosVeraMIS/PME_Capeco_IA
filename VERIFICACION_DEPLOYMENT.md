# Verificación del Despliegue CAPECO API

## Checklist de Verificación

Sigue estos pasos para confirmar que todo está funcionando correctamente.

### 1. Verificar que el App Service Existe

```bash
az webapp show --name pme-capeco-api --resource-group cvera_rg_7166 --query "{Name:name, State:state, RuntimeVersion:runtimeVersion}" -o table
```

**Esperado:**
```
Name               State    RuntimeVersion
-----------------  -------  ----------------
pme-capeco-api     Running  PYTHON|3.11
```

### 2. Verificar Variables de Entorno

```bash
az webapp config appsettings list --name pme-capeco-api --resource-group cvera_rg_7166 -o table
```

**Deberías ver:**
- `REDIS_HOST` = localhost
- `REDIS_PORT` = 6379
- `SCM_DO_BUILD_DURING_DEPLOYMENT` = true

### 3. Verificar Startup Command

```bash
az webapp config show --name pme-capeco-api --resource-group cvera_rg_7166 --query "startupCommand" -o tsv
```

**Esperado:** `bash startup.sh`

### 4. Ver Logs del Deployment

```bash
az webapp log tail --name pme-capeco-api --resource-group cvera_rg_7166
```

Esto muestra los logs en tiempo real. Busca errores como:
- `ModuleNotFoundError` - Significa que falta instalar dependencias
- `Connection refused` - Significa que Redis no está disponible (normal, el código tiene fallback)
- `ImportError` - Significa que hay un problema con los imports

### 5. Probar el Health Endpoint

**Opción A: Desde tu terminal (local)**
```bash
curl https://pme-capeco-api.azurewebsites.net/health -v
```

**Opción B: Desde un navegador**
Abre en tu navegador: `https://pme-capeco-api.azurewebsites.net/health`

**Esperado:** Respuesta JSON y código HTTP 200
```json
{"status": "ok", "version": "1.0.0"}
```

### 6. Probar Endpoints de Datos

```bash
# Proyectos
curl "https://pme-capeco-api.azurewebsites.net/api/v1/gold/projects?limit=1" | jq '.data | length'

# Métricas
curl "https://pme-capeco-api.azurewebsites.net/api/v1/gold/metrics" | jq 'keys'

# Distritos
curl "https://pme-capeco-api.azurewebsites.net/api/v1/gold/districts" | jq '.data | length'
```

Todos deberían retornar datos válidos (no errores 404 o 500).

### 7. Verificar que el Dashboard Carga Datos

1. Abre el dashboard: https://monitor-capeco.vercel.app/
2. Abre la consola del navegador (F12 → Console)
3. Busca mensajes de error que mencionen "capeco-api"
4. Verifica que se muestren números grandes en los KPIs:
   - Total de Proyectos: debe ser > 9,000 (no 312)
   - Valor Total: debe ser > S/ 1,000 millones
   - Área Total: debe ser > 1,000,000 m²

## Solucionar Problemas

### Problema: "Connection refused" al acceder al health endpoint

**Causa:** El servicio aún está iniciando

**Solución:**
1. Espera 2-3 minutos más
2. Verifica los logs: `az webapp log tail --name pme-capeco-api --resource-group cvera_rg_7166`
3. Si ves errores de ModuleNotFoundError, reinicia el servicio:
   ```bash
   az webapp restart --name pme-capeco-api --resource-group cvera_rg_7166
   ```

### Problema: "403 Forbidden" al acceder al endpoint

**Causa:** Posible problema de permisos o CORS

**Solución:**
1. Verifica los logs del servidor
2. Comprueba que la dirección es exacta: `https://pme-capeco-api.azurewebsites.net` (sin slash final)
3. Si accedes desde un dominio diferente, verifica que CORS esté configurado en api_server.py

### Problema: El endpoint responde pero retorna error 500

**Causa:** Error en el código Python o problema con los datos

**Solución:**
1. Verifica los logs: `az webapp log tail --name pme-capeco-api --resource-group cvera_rg_7166`
2. Comprueba que los archivos de datos están disponibles en la ruta correcta
3. Verifica la variable `DATA_PATH` en el código

### Problema: El dashboard sigue mostrando 312 proyectos

**Causa:** El dashboard puede estar usando datos en caché

**Solución:**
1. Limpia el caché del navegador (Ctrl+Shift+Delete o Cmd+Shift+Delete)
2. Recarga la página completamente (F5 o Cmd+R)
3. Verifica en F12 → Network que se hagan requests al API
4. Si no ve requests al API, el código del dashboard no está buscando el API

## Comandos Útiles

```bash
# Restart el servicio
az webapp restart --name pme-capeco-api --resource-group cvera_rg_7166

# Ver estado del servicio
az webapp show --name pme-capeco-api --resource-group cvera_rg_7166 --query "state" -o tsv

# Ver URL del app service
az webapp show --name pme-capeco-api --resource-group cvera_rg_7166 --query "defaultHostName" -o tsv

# Ver últimos 100 líneas de logs
az webapp log tail --name pme-capeco-api --resource-group cvera_rg_7166 --provider application -n 100

# Detener el servicio (para ahorrar costos)
az webapp stop --name pme-capeco-api --resource-group cvera_rg_7166

# Iniciar el servicio
az webapp start --name pme-capeco-api --resource-group cvera_rg_7166
```

## Siguiente Paso

Una vez que el health endpoint responda correctamente y el dashboard cargue datos en vivo, el despliegue estará completado.

Si encuentras algún problema, ejecuta:
```bash
az webapp log tail --name pme-capeco-api --resource-group cvera_rg_7166
```

Y comparte los últimos errores para diagnosticar el problema.
