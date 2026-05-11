#!/bin/bash

# Startup script para Azure App Service
# Ejecuta el servidor FastAPI CAPECO

# Instalar dependencias
pip install -r requirements_api.txt

# Iniciar Uvicorn en el puerto asignado por Azure (por defecto 8000)
# Azure inyecta el puerto en la variable PORT
uvicorn api_server:app --host 0.0.0.0 --port ${PORT:-8000} --reload
