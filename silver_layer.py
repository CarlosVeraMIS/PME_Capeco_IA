"""
SILVER LAYER — Data Lake CAPECO
================================
Normalización, deduplicación y enriquecimiento de datos Bronze.

Responsabilidades:
  1. Leer Parquet desde Bronze
  2. Limpiar datos: tipado, valores nulos, duplicados
  3. Normalizar nombres y categorías
  4. Enriquecer con cálculos (precio/m², absorción, etc.)
  5. Guardar en ADLS Gen2 (silver/) con SCD Type 2 para auditoría

Agentes:
  - CleansingAgent: tipado y valores nulos
  - NormalizationAgent: nombres y categorías estándar
  - EnrichmentAgent: cálculos y derivadas
"""

import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional
import logging
import json
import re
from unicodedata import normalize

logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(levelname)-8s | %(message)s')
logger = logging.getLogger("SilverLayer")


# ── Config ───────────────────────────────────────────────────────────────
class SilverConfig:
    BRONZE_DIR = Path("bronze_data")
    SILVER_DIR = Path("silver_data")
    METADATA_DIR = Path("silver_metadata")

    @classmethod
    def ensure_dirs(cls):
        cls.SILVER_DIR.mkdir(exist_ok=True)
        cls.METADATA_DIR.mkdir(exist_ok=True)


# ── Normalizadores ──────────────────────────────────────────────────────
class Normalizer:
    """Funciones de normalización de texto y datos"""

    @staticmethod
    def normalize_text(text: str) -> str:
        """Normaliza texto: elimina acentos, espacios, mayúsculas"""
        if not isinstance(text, str) or pd.isna(text):
            return ""
        # Eliminar acentos
        text = normalize('NFKD', text).encode('ASCII', 'ignore').decode('utf-8')
        # Eliminar caracteres especiales
        text = re.sub(r'[^A-Z0-9\s]', '', text.upper()).strip()
        return text

    @staticmethod
    def normalize_district(distrito: str) -> str:
        """Normaliza nombre de distrito a estándar oficial"""
        if not isinstance(distrito, str):
            return "LIMA"

        distrito_norm = Normalizer.normalize_text(distrito)

        # Mapa de variaciones a nombre oficial
        district_map = {
            "ALC": "ALCANTARILLA",
            "ANCON": "ANCON",
            "ATE": "ATE",
            "BARRANCO": "BARRANCO",
            "CAJARMARQUILLA": "CAJAMARQUILLA",
            "CALLAO": "CALLAO",
            "CHACLACAYO": "CHACLACAYO",
            "CHORRILLOS": "CHORRILLOS",
            "COMAS": "COMAS",
            "INDEPENDENCIA": "INDEPENDENCIA",
            "JESUS MARIA": "JESUS MARIA",
            "LA MOLINA": "LA MOLINA",
            "LA VICTORIA": "LA VICTORIA",
            "LINCE": "LINCE",
            "LOS OLIVOS": "LOS OLIVOS",
            "MAGDALENA": "MAGDALENA",
            "MIRAFLORES": "MIRAFLORES",
            "MIRAFLORES": "MIRAFLORES",
            "PACHACAMAC": "PACHACAMAC",
            "PUCUSANA": "PUCUSANA",
            "PUENTE PIEDRA": "PUENTE PIEDRA",
            "PUNTA HERMOSA": "PUNTA HERMOSA",
            "PUNTA NEGRA": "PUNTA NEGRA",
            "RIMAC": "RIMAC",
            "SAN BARTOLO": "SAN BARTOLO",
            "SAN ISIDRO": "SAN ISIDRO",
            "SAN JUAN DEMIRAFLORES": "SAN JUAN DE MIRAFLORES",
            "SAN LUIS": "SAN LUIS",
            "SANTA ANITA": "SANTA ANITA",
            "SANTA MARIA": "SANTA MARIA",
            "SANTA ROSA": "SANTA ROSA",
            "SANTIAGO DE SURCO": "SANTIAGO DE SURCO",
            "SURCO": "SANTIAGO DE SURCO",
            "SURQUILLO": "SURQUILLO",
            "VENTANILLA": "VENTANILLA",
            "VILLA EL SALVADOR": "VILLA EL SALVADOR",
            "VILLA MARIA": "VILLA MARIA",
        }

        return district_map.get(distrito_norm, "LIMA")

    @staticmethod
    def infer_construction_phase(description: str) -> str:
        """Infiere fase de construcción de descripción"""
        if not isinstance(description, str) or pd.isna(description):
            return "NO_ESPECIFICADO"

        desc = description.lower()

        if any(x in desc for x in ["pre venta", "preventa", "lanzamiento"]):
            return "PRE_VENTA"
        elif any(x in desc for x in ["en construcción", "construyéndose", "avance de obra"]):
            return "EN_CONSTRUCCION"
        elif any(x in desc for x in ["terminado", "entrega inmediata", "listo"]):
            return "TERMINADO"
        elif "planos" in desc:
            return "EN_PLANOS"
        else:
            return "NO_ESPECIFICADO"


# ── Agente de Limpieza ──────────────────────────────────────────────────
class CleansingAgent:
    """Limpia tipos, valores nulos y duplicados"""

    @staticmethod
    def cleanse_dataframe(df: pd.DataFrame) -> pd.DataFrame:
        """Aplica limpieza integral"""
        logger.info(f"Limpiando {len(df)} filas...")

        # Duplicados exactos
        df_clean = df.drop_duplicates()
        logger.info(f"  - Eliminados {len(df) - len(df_clean)} duplicados exactos")

        # Valores críticos nulos
        df_clean = df_clean.dropna(subset=['title', 'latitude', 'longitude'])
        logger.info(f"  - Eliminadas {len(df) - len(df_clean)} filas con lat/lon nulos")

        # Reiicio contadores
        df = df_clean.reset_index(drop=True)

        # Tipado
        if 'price_amount' in df.columns:
            df['price_amount'] = pd.to_numeric(df['price_amount'], errors='coerce').fillna(0)
        if 'area_m2' in df.columns:
            df['area_m2'] = pd.to_numeric(df['area_m2'], errors='coerce').fillna(0)
        if 'latitude' in df.columns:
            df['latitude'] = pd.to_numeric(df['latitude'], errors='coerce')
        if 'longitude' in df.columns:
            df['longitude'] = pd.to_numeric(df['longitude'], errors='coerce')

        logger.info(f"✓ Limpieza completada: {len(df)} filas válidas")
        return df


# ── Agente de Normalización ──────────────────────────────────────────────
class NormalizationAgent:
    """Normaliza nombres y categorías"""

    @staticmethod
    def normalize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
        """Aplica normalización a todo el dataframe"""
        logger.info("Normalizando datos...")

        # Nombres de proyecto
        if 'title' in df.columns:
            df['project_name_norm'] = df['title'].apply(Normalizer.normalize_text)

        # Distritos
        if 'distrito' in df.columns:
            df['distrito_norm'] = df['distrito'].apply(Normalizer.normalize_district)
        elif 'DISTRITO' in df.columns:
            df['distrito_norm'] = df['DISTRITO'].apply(Normalizer.normalize_district)
        else:
            df['distrito_norm'] = "LIMA"

        # Fase de construcción
        if 'description' in df.columns:
            df['construction_phase'] = df['description'].apply(Normalizer.infer_construction_phase)
        elif 'FASE' in df.columns:
            df['construction_phase'] = df['FASE'].fillna("NO_ESPECIFICADO")
        else:
            df['construction_phase'] = "NO_ESPECIFICADO"

        # Moneda
        if 'price_currency' in df.columns:
            df['currency_norm'] = df['price_currency'].fillna("SOL").apply(lambda x: "SOL" if "S" in str(x).upper() else "USD")
        else:
            df['currency_norm'] = "SOL"

        logger.info("✓ Normalización completada")
        return df


# ── Agente de Enriquecimiento ────────────────────────────────────────────
class EnrichmentAgent:
    """Crea columnas derivadas y métricas"""

    @staticmethod
    def enrich_dataframe(df: pd.DataFrame) -> pd.DataFrame:
        """Enriquece con cálculos y derivadas"""
        logger.info("Enriqueciendo datos...")

        # Precio por m²
        if 'price_amount' in df.columns and 'area_m2' in df.columns:
            df['price_per_m2'] = df.apply(
                lambda r: r['price_amount'] / r['area_m2'] if r['area_m2'] > 0 else 0,
                axis=1
            )

        # Categorización de precio (mercado)
        if 'price_per_m2' in df.columns:
            def categorize_price(price_m2):
                if price_m2 > 8000:
                    return "ELITE"
                elif price_m2 > 5000:
                    return "UPPER_MID"
                elif price_m2 > 3000:
                    return "SOCIAL"
                else:
                    return "ENTRY"
            df['market_tier'] = df['price_per_m2'].apply(categorize_price)

        # Timestamp de ingesta
        df['silver_ingestion_timestamp'] = datetime.utcnow().isoformat()

        # Hash para SCD Type 2
        hash_cols = ['title', 'distrito_norm', 'price_amount', 'area_m2']
        df['row_hash'] = df[hash_cols].apply(
            lambda r: pd.util.hash_pandas_object(r, index=True).sum(),
            axis=1
        )

        logger.info("✓ Enriquecimiento completado")
        return df


# ── Agente de Silver ─────────────────────────────────────────────────────
class SilverAgent:
    """Orquesta todo el pipeline Silver: limpiar → normalizar → enriquecer"""

    def __init__(self):
        SilverConfig.ensure_dirs()

    def process_bronze_file(self, bronze_parquet_path: str) -> Optional[str]:
        """
        Procesa un archivo Parquet de Bronze
        Retorna ruta del archivo Silver procesado
        """
        try:
            logger.info(f"\n['Leyendo Bronze: {bronze_parquet_path}")
            table = pq.read_table(bronze_parquet_path)
            df = table.to_pandas()

            logger.info(f"  Filas iniciales: {len(df)}")

            # Pipeline de transformación
            df = CleansingAgent.cleanse_dataframe(df)
            df = NormalizationAgent.normalize_dataframe(df)
            df = EnrichmentAgent.enrich_dataframe(df)

            logger.info(f"  Filas finales: {len(df)}")

            # Guardar como Parquet
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            output_filename = f"silver_{Path(bronze_parquet_path).stem}_{timestamp}.parquet"
            output_path = SilverConfig.SILVER_DIR / output_filename

            table_out = pa.Table.from_pandas(df)
            pq.write_table(table_out, str(output_path))

            logger.info(f"✓ Silver Parquet guardado: {output_path}")
            return str(output_path)

        except Exception as e:
            logger.error(f"✗ Error procesando Bronze: {e}")
            return None

    def process_all_bronze(self) -> Dict[str, str]:
        """Procesa todos los archivos Bronze disponibles"""
        logger.info("=" * 70)
        logger.info("INICIANDO PROCESAMIENTO SILVER LAYER")
        logger.info("=" * 70)

        results = {}
        bronze_files = list(SilverConfig.BRONZE_DIR.glob("*.parquet"))

        if not bronze_files:
            logger.warning("No se encontraron archivos Bronze")
            return results

        for bronze_file in bronze_files:
            source_name = bronze_file.stem.split("__")[0]
            silver_path = self.process_bronze_file(str(bronze_file))
            if silver_path:
                results[source_name] = silver_path

        logger.info("\n" + "=" * 70)
        logger.info("RESUMEN SILVER")
        logger.info("=" * 70)
        for source, path in results.items():
            logger.info(f"✓ {source}: {path}")

        return results


# ── CLI ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    agent = SilverAgent()
    results = agent.process_all_bronze()

    with open("silver_processing_results.json", "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("\n✓ Silver processing completado.")
