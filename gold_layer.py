"""
GOLD LAYER — Data Lake CAPECO
==============================
Datos certificados, agregados y listos para consumo de negocio.

Responsabilidades:
  1. Leer Silver normalizado
  2. Agregar por dimensiones de negocio (proyecto, distrito, desarrollador)
  3. Calcular KPIs: absorción, precio/m², velocidad venta
  4. Crear tablas de dimensión (dim_proyecto, dim_distrito)
  5. Guardar en ADLS Gen2 (gold/) como tablas de acceso rápido

Entidades Gold:
  - fact_proyectos: hechos principales por proyecto
  - dim_distrito: dimensión de distritos
  - dim_desarrollador: desarrolladores únicos
  - metrics_absorption: métricas de absorción por tiempo
"""

import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from datetime import datetime
from pathlib import Path
from typing import Dict, Tuple
import logging
import json

logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(levelname)-8s | %(message)s')
logger = logging.getLogger("GoldLayer")


# ── Config ───────────────────────────────────────────────────────────────
class GoldConfig:
    SILVER_DIR = Path("silver_data")
    GOLD_DIR = Path("gold_data")
    METADATA_DIR = Path("gold_metadata")

    @classmethod
    def ensure_dirs(cls):
        cls.GOLD_DIR.mkdir(exist_ok=True)
        cls.METADATA_DIR.mkdir(exist_ok=True)


# ── Agregaciones de Negocio ──────────────────────────────────────────────
class BusinessAggregations:
    """Cálculos de métricas de negocio"""

    @staticmethod
    def calculate_absorption_rate(units_available: int, units_sold: int) -> float:
        """
        Tasa de absorción: % de unidades vendidas
        Formula: (unidades_vendidas / unidades_disponibles) * 100
        """
        if units_available == 0:
            return 0.0
        return (units_sold / units_available) * 100

    @staticmethod
    def calculate_market_velocity(units_sold: int, months_on_market: int) -> float:
        """
        Velocidad de mercado: unidades vendidas por mes
        """
        if months_on_market == 0:
            return 0.0
        return units_sold / months_on_market

    @staticmethod
    def calculate_price_index(price_per_m2: float, base_price: float = 5500.0) -> float:
        """
        Índice de precio relativo a baseline de mercado
        Base: S/ 5,500 / m²
        """
        if base_price == 0:
            return 0.0
        return (price_per_m2 / base_price) * 100

    @staticmethod
    def categorize_project_risk(construction_phase: str, absorption_rate: float) -> str:
        """
        Matriz de riesgo: fase x absorción
        """
        phase_risk = {
            "PRE_VENTA": "HIGH",
            "EN_PLANOS": "HIGH",
            "EN_CONSTRUCCION": "MEDIUM",
            "TERMINADO": "LOW",
            "NO_ESPECIFICADO": "UNKNOWN"
        }

        phase_component = phase_risk.get(construction_phase, "UNKNOWN")

        # Ajuste por absorción
        if absorption_rate > 80:
            return "LOW"
        elif absorption_rate > 50:
            return "MEDIUM"
        elif absorption_rate > 20:
            return "HIGH"
        else:
            return "CRITICAL"

        return f"{phase_component}"


# ── Generador de Dimensiones ────────────────────────────────────────────
class DimensionGenerator:
    """Genera tablas de dimensión"""

    @staticmethod
    def generate_dim_distrito(df_silver: pd.DataFrame) -> pd.DataFrame:
        """
        Dimensión de distritos con agregaciones
        """
        logger.info("Generando dimensión distrito...")

        dim_distrito = df_silver.groupby('distrito_norm').agg({
            'title': 'count',
            'price_per_m2': ['mean', 'min', 'max'],
            'area_m2': 'mean',
            'price_amount': 'sum',
            'latitude': 'mean',
            'longitude': 'mean'
        }).reset_index()

        # Aplanar columnas
        dim_distrito.columns = ['distrito', 'project_count', 'price_per_m2_avg',
                               'price_per_m2_min', 'price_per_m2_max',
                               'area_m2_avg', 'total_market_value',
                               'lat_center', 'lon_center']

        dim_distrito['distrito_id'] = range(1, len(dim_distrito) + 1)
        dim_distrito['last_update'] = datetime.utcnow().isoformat()

        return dim_distrito[['distrito_id', 'distrito', 'project_count',
                            'price_per_m2_avg', 'price_per_m2_min', 'price_per_m2_max',
                            'area_m2_avg', 'total_market_value', 'lat_center',
                            'lon_center', 'last_update']]

    @staticmethod
    def generate_dim_market_tier(df_silver: pd.DataFrame) -> pd.DataFrame:
        """
        Dimensión de segmento de mercado
        """
        logger.info("Generando dimensión market tier...")

        dim_tier = df_silver.groupby('market_tier').agg({
            'title': 'count',
            'price_per_m2': 'mean',
            'price_amount': 'sum',
            'area_m2': 'mean'
        }).reset_index()

        dim_tier.columns = ['market_tier', 'project_count', 'avg_price_per_m2',
                           'total_value', 'avg_area_m2']
        dim_tier['tier_id'] = range(1, len(dim_tier) + 1)

        return dim_tier[['tier_id', 'market_tier', 'project_count',
                        'avg_price_per_m2', 'total_value', 'avg_area_m2']]


# ── Generador de Hechos ──────────────────────────────────────────────────
class FactGenerator:
    """Genera tablas de hechos"""

    @staticmethod
    def generate_fact_projects(df_silver: pd.DataFrame) -> pd.DataFrame:
        """
        Tabla de hechos: proyectos con métricas clave
        """
        logger.info("Generando fact_projects...")

        df_fact = df_silver.copy()

        # IDs
        df_fact['project_id'] = range(1, len(df_fact) + 1)

        # Cálculos de riesgo (simulados)
        df_fact['absorption_rate_pct'] = 50.0  # Simulado
        df_fact['project_risk_level'] = df_fact.apply(
            lambda r: BusinessAggregations.categorize_project_risk(
                r['construction_phase'],
                r['absorption_rate_pct']
            ),
            axis=1
        )

        # Índice de precio
        df_fact['price_index'] = df_fact['price_per_m2'].apply(
            BusinessAggregations.calculate_price_index
        )

        # Timestamp
        df_fact['fact_load_timestamp'] = datetime.utcnow().isoformat()

        # Seleccionar columnas relevantes
        columns = [
            'project_id', 'title', 'distrito_norm',
            'price_amount', 'currency_norm', 'price_per_m2',
            'market_tier', 'area_m2', 'construction_phase',
            'absorption_rate_pct', 'project_risk_level',
            'price_index', 'latitude', 'longitude',
            'fact_load_timestamp'
        ]

        return df_fact[[c for c in columns if c in df_fact.columns]]

    @staticmethod
    def generate_metrics_by_distrito(df_fact: pd.DataFrame) -> pd.DataFrame:
        """
        Tabla de métricas agregadas por distrito
        """
        logger.info("Generando metrics_by_distrito...")

        metrics = df_fact.groupby('distrito_norm').agg({
            'project_id': 'count',
            'price_per_m2': ['mean', 'std'],
            'price_amount': 'sum',
            'price_index': 'mean',
            'absorption_rate_pct': 'mean'
        }).reset_index()

        metrics.columns = ['distrito', 'project_count', 'price_per_m2_avg',
                         'price_per_m2_std', 'total_value',
                         'price_index_avg', 'absorption_avg']

        # Llenar NaN
        metrics = metrics.fillna(0)

        metrics['metric_date'] = datetime.utcnow().strftime("%Y-%m-%d")

        return metrics


# ── Agente de Gold Layer ─────────────────────────────────────────────────
class GoldAgent:
    """Orquesta generación de dimensiones y hechos"""

    def __init__(self):
        GoldConfig.ensure_dirs()

    def process_silver_to_gold(self, silver_parquet_path: str) -> Dict[str, str]:
        """
        Procesa Silver → Gold
        Genera dimensiones, hechos y métricas
        """
        try:
            logger.info(f"\nLeyendo Silver: {silver_parquet_path}")
            table = pq.read_table(silver_parquet_path)
            df_silver = table.to_pandas()

            logger.info(f"  Filas: {len(df_silver)}")

            results = {}

            # Dimensiones
            dim_distrito = DimensionGenerator.generate_dim_distrito(df_silver)
            dim_path = GoldConfig.GOLD_DIR / "dim_distrito.parquet"
            pq.write_table(pa.Table.from_pandas(dim_distrito), str(dim_path))
            results['dim_distrito'] = str(dim_path)
            logger.info(f"  ✓ dim_distrito: {len(dim_distrito)} registros")

            dim_tier = DimensionGenerator.generate_dim_market_tier(df_silver)
            tier_path = GoldConfig.GOLD_DIR / "dim_market_tier.parquet"
            pq.write_table(pa.Table.from_pandas(dim_tier), str(tier_path))
            results['dim_market_tier'] = str(tier_path)
            logger.info(f"  ✓ dim_market_tier: {len(dim_tier)} registros")

            # Hechos
            fact_projects = FactGenerator.generate_fact_projects(df_silver)
            fact_path = GoldConfig.GOLD_DIR / "fact_projects.parquet"
            pq.write_table(pa.Table.from_pandas(fact_projects), str(fact_path))
            results['fact_projects'] = str(fact_path)
            logger.info(f"  ✓ fact_projects: {len(fact_projects)} registros")

            # Métricas
            metrics = FactGenerator.generate_metrics_by_distrito(fact_projects)
            metrics_path = GoldConfig.GOLD_DIR / "metrics_by_distrito.parquet"
            pq.write_table(pa.Table.from_pandas(metrics), str(metrics_path))
            results['metrics_by_distrito'] = str(metrics_path)
            logger.info(f"  ✓ metrics_by_distrito: {len(metrics)} registros")

            return results

        except Exception as e:
            logger.error(f"✗ Error en Gold processing: {e}")
            return {}

    def process_all_silver(self) -> Dict[str, Dict[str, str]]:
        """Procesa todos los archivos Silver"""
        logger.info("=" * 70)
        logger.info("INICIANDO PROCESAMIENTO GOLD LAYER")
        logger.info("=" * 70)

        all_results = {}
        silver_files = list(GoldConfig.SILVER_DIR.glob("*.parquet"))

        if not silver_files:
            logger.warning("No se encontraron archivos Silver")
            return all_results

        for silver_file in silver_files:
            source_name = silver_file.stem.split("_")[1]
            results = self.process_silver_to_gold(str(silver_file))
            if results:
                all_results[source_name] = results

        logger.info("\n" + "=" * 70)
        logger.info("RESUMEN GOLD")
        logger.info("=" * 70)
        for source, tables in all_results.items():
            for table_name, path in tables.items():
                logger.info(f"  ✓ {table_name}: {path}")

        return all_results


# ── CLI ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    agent = GoldAgent()
    results = agent.process_all_silver()

    with open("gold_processing_results.json", "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("\n✓ Gold processing completado.")
