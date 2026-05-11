"""
CAPECO DATA LAKE — REST API SERVER
===================================
FastAPI server que expone los datos del Gold Layer

Endpoints:
  GET /health                    — Health check
  GET /api/v1/gold/projects      — Lista de proyectos
  GET /api/v1/gold/metrics       — KPIs y métricas
  GET /api/v1/gold/districts     — Análisis por distrito
  GET /api/v1/gold/market-tiers  — Análisis por tier de mercado

Características:
  - Redis caching para performance
  - Documentación OpenAPI automática
  - CORS habilitado
  - Rate limiting
  - Logging estructurado
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import pandas as pd
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import pyarrow.parquet as pq
import redis

# ── Configuración ────────────────────────────────────────────────────────
app = FastAPI(
    title="CAPECO Data Lake API",
    description="REST API para acceso a datos certificados del Gold Layer",
    version="1.0.0-2026-05-07",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# ── CORS Configuration ────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Logging Configuration ────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | API | %(message)s'
)
logger = logging.getLogger(__name__)

# ── Redis Cache Configuration ────────────────────────────────────────────
try:
    # Intentar conectar a Redis (puede estar en localhost:6379)
    redis_client = redis.Redis(
        host=os.getenv('REDIS_HOST', 'localhost'),
        port=int(os.getenv('REDIS_PORT', 6379)),
        db=0,
        decode_responses=True,
        socket_connect_timeout=5
    )
    redis_client.ping()
    REDIS_ENABLED = True
    logger.info("✓ Redis conectado")
except Exception as e:
    REDIS_ENABLED = False
    logger.warning(f"⚠ Redis no disponible: {e} (usando caché en memoria)")
    # Fallback a caché en memoria
    memory_cache = {}
    memory_cache_time = {}


# ── Cache Manager ────────────────────────────────────────────────────────
class CacheManager:
    """Gestor de caché con soporte para Redis y memoria"""

    def __init__(self, ttl_seconds: int = 3600):
        self.ttl = ttl_seconds

    def get(self, key: str) -> Optional[str]:
        """Obtiene valor del caché"""
        try:
            if REDIS_ENABLED:
                return redis_client.get(key)
            else:
                if key in memory_cache:
                    # Verificar si ha expirado
                    if datetime.utcnow() < memory_cache_time.get(key, datetime.utcnow()):
                        return memory_cache[key]
                    else:
                        del memory_cache[key]
                return None
        except Exception as e:
            logger.warning(f"Error leyendo caché: {e}")
            return None

    def set(self, key: str, value: str, ttl: Optional[int] = None) -> bool:
        """Establece valor en caché"""
        try:
            ttl = ttl or self.ttl
            if REDIS_ENABLED:
                redis_client.setex(key, ttl, value)
            else:
                memory_cache[key] = value
                memory_cache_time[key] = datetime.utcnow() + timedelta(seconds=ttl)
            return True
        except Exception as e:
            logger.warning(f"Error escribiendo caché: {e}")
            return False

    def invalidate(self, pattern: str = "*") -> None:
        """Invalida caché"""
        try:
            if REDIS_ENABLED:
                for key in redis_client.scan_iter(f"*{pattern}*"):
                    redis_client.delete(key)
            else:
                for key in list(memory_cache.keys()):
                    if pattern in key or pattern == "*":
                        del memory_cache[key]
                        if key in memory_cache_time:
                            del memory_cache_time[key]
        except Exception as e:
            logger.warning(f"Error invalidando caché: {e}")


cache = CacheManager(ttl_seconds=3600)  # 1 hora


# ── Data Loading Functions ───────────────────────────────────────────────
class DataLoader:
    """Cargador de datos desde Parquet"""

    @staticmethod
    def load_latest_parquet(directory: str, pattern: str) -> Optional[pd.DataFrame]:
        """Carga el archivo Parquet más reciente"""
        try:
            data_dir = Path(directory)
            if not data_dir.exists():
                return None

            files = sorted(
                data_dir.glob(f"{pattern}*.parquet"),
                key=lambda x: x.stat().st_mtime,
                reverse=True
            )

            if not files:
                return None

            logger.info(f"Cargando: {files[0].name}")
            return pq.read_table(str(files[0])).to_pandas()

        except Exception as e:
            logger.error(f"Error cargando Parquet de {directory}: {e}")
            return None

    @staticmethod
    def load_gold_data() -> Dict[str, pd.DataFrame]:
        """Carga todos los datos del Gold Layer"""
        data = {}

        data['projects'] = DataLoader.load_latest_parquet('gold_data', 'fact_capeco_certified')
        data['districts'] = DataLoader.load_latest_parquet('gold_data', 'dim_distrito')
        data['market_tiers'] = DataLoader.load_latest_parquet('gold_data', 'dim_market_tier')

        return data


# ── Health Check Endpoint ────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint

    Returns:
        dict: Status de la API
    """
    try:
        # Verificar que los datos están disponibles
        test_df = DataLoader.load_latest_parquet('gold_data', 'fact_capeco_certified')

        if test_df is None:
            raise Exception("No Gold data available")

        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "gold_data_available": True,
            "cache_enabled": REDIS_ENABLED,
            "rows_available": len(test_df) if test_df is not None else 0
        }

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Service unavailable: {e}")


# ── Gold Layer: Projects Endpoint ────────────────────────────────────────
@app.get("/api/v1/gold/projects", tags=["Gold Layer"])
async def get_projects(
    limit: int = Query(100, ge=1, le=10000),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("price_per_m2", regex="^[a-zA-Z_]+$"),
    order: str = Query("desc", regex="^(asc|desc)$")
):
    """
    Obtiene lista de proyectos del Gold Layer

    Parámetros:
        limit: Número máximo de registros (default: 100)
        offset: Saltar N registros (default: 0)
        sort_by: Columna para ordenar (default: price_per_m2)
        order: Orden ascendente o descendente (default: desc)

    Returns:
        dict: Proyectos con metadatos
    """
    cache_key = f"projects:{limit}:{offset}:{sort_by}:{order}"

    # Intentar obtener del caché
    cached = cache.get(cache_key)
    if cached:
        logger.info(f"Cache hit: {cache_key}")
        return json.loads(cached)

    try:
        df = DataLoader.load_latest_parquet('gold_data', 'fact_capeco_certified')

        if df is None or len(df) == 0:
            raise HTTPException(status_code=404, detail="No projects found")

        # Mapear columnas del nuevo dataset al formato esperado
        df = df.copy()

        # Mapear todas las columnas necesarias
        df['price_per_m2'] = df['PRECIO_X_M2'].fillna(0)
        df['price_amount'] = df['PRECIO_SOLES'].fillna(0)  # NUEVO: Mapear PRECIO_SOLES
        df['absorption_rate_pct'] = df['PCT_AVANCE'].fillna(0)
        df['title'] = df['NOMBRE DEL PROYECTO']
        df['project_id'] = df['COD_PROYECTO']
        df['district'] = df['DISTRITO']
        df['market_tier'] = 'Standard'
        df['area_m2'] = df['AREA_CONSTRUCCION'].fillna(0)
        df['currency'] = 'PEN'
        df['construction_phase'] = df['ETAPA_DE_PROYECTO']

        # Seleccionar solo las columnas necesarias para el frontend
        output_columns = [
            'project_id', 'title', 'district', 'price_amount', 'price_per_m2',
            'area_m2', 'absorption_rate_pct', 'market_tier', 'currency',
            'construction_phase', 'NRO_UNIDADES', 'NRO_DORMITORIOS',
            'NOMBRE DEL CONSTRUCTOR', 'TIPO_DE_OBRA'
        ]

        # Filtrar solo columnas que existen
        output_columns = [c for c in output_columns if c in df.columns]
        df = df[output_columns]

        # Ordenar - usar columna mapeada
        sort_col = 'price_per_m2' if sort_by == 'price_per_m2' else 'absorption_rate_pct' if sort_by == 'absorption_rate_pct' else 'price_per_m2'
        df = df.sort_values(by=sort_col, ascending=(order == "asc"))

        # Paginar
        total = len(df)
        df_paginated = df.iloc[offset:offset + limit]

        # Convertir a diccionario
        records = df_paginated.to_dict(orient='records')

        # Reemplazar NaN con None y asegurar tipos de datos
        for record in records:
            for key, value in record.items():
                if pd.isna(value):
                    record[key] = None
                # Asegurar que los precios sean números válidos
                elif key in ['price_amount', 'price_per_m2']:
                    record[key] = float(value) if value else 0.0

        result = {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "pagination": {
                "total": int(total),
                "limit": limit,
                "offset": offset,
                "returned": len(records)
            },
            "data": records
        }

        # Guardar en caché
        cache.set(cache_key, json.dumps(result, default=str))

        logger.info(f"Proyectos retornados: {len(records)}/{total}")
        return result

    except Exception as e:
        logger.error(f"Error en /api/v1/gold/projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Gold Layer: Metrics Endpoint ────────────────────────────────────────
@app.get("/api/v1/gold/metrics", tags=["Gold Layer"])
async def get_metrics():
    """
    Obtiene KPIs y métricas agregadas del Gold Layer

    Returns:
        dict: Métricas y estadísticas
    """
    cache_key = "metrics:aggregated"

    # Intentar obtener del caché
    cached = cache.get(cache_key)
    if cached:
        logger.info("Cache hit: metrics")
        return json.loads(cached)

    try:
        data = DataLoader.load_gold_data()

        if data['projects'] is None or len(data['projects']) == 0:
            raise HTTPException(status_code=404, detail="No metrics available")

        projects_df = data['projects']

        # Calcular métricas
        total_value = float(projects_df['PRECIO_SOLES'].sum()) if 'PRECIO_SOLES' in projects_df.columns else 0
        avg_price_m2 = float(projects_df['PRECIO_X_M2'].mean()) if 'PRECIO_X_M2' in projects_df.columns else 0
        avg_absorption = float(projects_df['PCT_AVANCE'].mean()) if 'PCT_AVANCE' in projects_df.columns else 0

        # Calcular min/max excluyendo ceros
        prices_nonzero = projects_df[projects_df['PRECIO_X_M2'] > 0]['PRECIO_X_M2']
        min_price = float(prices_nonzero.min()) if len(prices_nonzero) > 0 else 0
        max_price = float(projects_df['PRECIO_X_M2'].max()) if len(projects_df) > 0 else 0

        metrics = {
            "total_projects": int(len(projects_df)),
            "total_value": total_value,
            "avg_price_per_m2": avg_price_m2,
            "avg_absorption_rate": avg_absorption,
            "price_range": {
                "min": min_price,
                "max": max_price
            }
        }

        # Por distrito (si está disponible)
        if data['districts'] is not None:
            districts_df = data['districts']
            metrics['by_district'] = districts_df.to_dict(orient='records')[:5]

        # Por market tier (si está disponible)
        if data['market_tiers'] is not None:
            tiers_df = data['market_tiers']
            metrics['by_market_tier'] = tiers_df.to_dict(orient='records')

        result = {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": metrics
        }

        # Guardar en caché
        cache.set(cache_key, json.dumps(result, default=str), ttl=1800)  # 30 min

        logger.info("Métricas calculadas")
        return result

    except Exception as e:
        logger.error(f"Error en /api/v1/gold/metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Gold Layer: Districts Endpoint ───────────────────────────────────────
@app.get("/api/v1/gold/districts", tags=["Gold Layer"])
async def get_districts(limit: int = Query(50, ge=1, le=1000)):
    """
    Obtiene análisis por distrito

    Parámetros:
        limit: Máximo número de distritos (default: 50)

    Returns:
        dict: Análisis por distrito
    """
    cache_key = f"districts:{limit}"

    cached = cache.get(cache_key)
    if cached:
        logger.info("Cache hit: districts")
        return json.loads(cached)

    try:
        df = DataLoader.load_latest_parquet('gold_data', 'dim_distrito')

        if df is None or len(df) == 0:
            raise HTTPException(status_code=404, detail="No districts found")

        # Tomar top N
        districts = df.head(limit).to_dict(orient='records')

        result = {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "total": int(len(df)),
            "returned": len(districts),
            "data": districts
        }

        cache.set(cache_key, json.dumps(result, default=str))

        logger.info(f"Distritos retornados: {len(districts)}")
        return result

    except Exception as e:
        logger.error(f"Error en /api/v1/gold/districts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Gold Layer: Market Tiers Endpoint ────────────────────────────────────
@app.get("/api/v1/gold/market-tiers", tags=["Gold Layer"])
async def get_market_tiers():
    """
    Obtiene análisis por tier de mercado

    Returns:
        dict: Análisis por market tier
    """
    cache_key = "market_tiers:aggregated"

    cached = cache.get(cache_key)
    if cached:
        logger.info("Cache hit: market_tiers")
        return json.loads(cached)

    try:
        df = DataLoader.load_latest_parquet('gold_data', 'dim_market_tier')

        if df is None or len(df) == 0:
            raise HTTPException(status_code=404, detail="No market tiers found")

        tiers = df.to_dict(orient='records')

        result = {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "total": int(len(df)),
            "data": tiers
        }

        cache.set(cache_key, json.dumps(result, default=str))

        logger.info(f"Market tiers retornados: {len(tiers)}")
        return result

    except Exception as e:
        logger.error(f"Error en /api/v1/gold/market-tiers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Admin Endpoints ──────────────────────────────────────────────────────
@app.post("/admin/cache/clear", tags=["Admin"])
async def clear_cache():
    """
    Limpia el caché (admin only)

    Returns:
        dict: Status de la operación
    """
    try:
        cache.invalidate()
        logger.info("Caché limpiado")
        return {
            "status": "success",
            "message": "Cache cleared successfully"
        }
    except Exception as e:
        logger.error(f"Error limpiando caché: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/admin/stats", tags=["Admin"])
async def get_stats():
    """
    Obtiene estadísticas de la API

    Returns:
        dict: Estadísticas de uso
    """
    try:
        projects = DataLoader.load_latest_parquet('gold_data', 'fact_capeco_certified')
        districts = DataLoader.load_latest_parquet('gold_data', 'dim_distrito')
        tiers = DataLoader.load_latest_parquet('gold_data', 'dim_market_tier')

        return {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "data_loaded": {
                "projects": len(projects) if projects is not None else 0,
                "districts": len(districts) if districts is not None else 0,
                "market_tiers": len(tiers) if tiers is not None else 0
            },
            "cache": {
                "enabled": REDIS_ENABLED,
                "type": "redis" if REDIS_ENABLED else "memory"
            }
        }
    except Exception as e:
        logger.error(f"Error obteniendo stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Root Endpoint ────────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def serve_dashboard():
    """Sirve el dashboard HTML"""
    dashboard_path = Path(__file__).parent / "dashboard.html"
    if dashboard_path.exists():
        return FileResponse(str(dashboard_path), media_type="text/html")
    # Fallback a JSON si dashboard no existe
    return {
        "service": "CAPECO Data Lake API",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "endpoints": {
            "health": "/health",
            "projects": "/api/v1/gold/projects",
            "metrics": "/api/v1/gold/metrics",
            "districts": "/api/v1/gold/districts",
            "market_tiers": "/api/v1/gold/market-tiers"
        }
    }


# ── Startup Event ────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Evento al iniciar la API"""
    logger.info("=" * 80)
    logger.info("CAPECO DATA LAKE API — INICIANDO")
    logger.info("=" * 80)
    logger.info(f"Redis: {'ENABLED' if REDIS_ENABLED else 'DISABLED (using memory)'}")
    logger.info("Endpoints disponibles en /docs")
    logger.info("=" * 80)


# ── Shutdown Event ───────────────────────────────────────────────────────
@app.on_event("shutdown")
async def shutdown_event():
    """Evento al detener la API"""
    logger.info("API cerrando...")
    if REDIS_ENABLED:
        try:
            redis_client.close()
        except:
            pass


# ── Main ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv('API_PORT', 8000))
    host = os.getenv('API_HOST', '0.0.0.0')

    logger.info(f"Iniciando servidor en {host}:{port}")

    uvicorn.run(
        "api_server:app",
        host=host,
        port=port,
        reload=os.getenv('API_RELOAD', 'false').lower() == 'true',
        log_level='info'
    )
