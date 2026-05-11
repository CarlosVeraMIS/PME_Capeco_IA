"""
BRONZE LAYER — Data Lake CAPECO
================================
Ingesta cruda de datos desde múltiples fuentes en ADLS Gen2.

Responsabilidades:
  1. Leer datos de MySQL, CSV, Excel
  2. Convertir a Parquet con schema versionado
  3. Guardar en Azure Data Lake Storage Gen2 (bronze/)
  4. Registrar metadatos de ingest (timestamp, row count, hash)

Agentes disponibles:
  - IngestAgent: coordina la lectura de todas las fuentes
  - SchemaAgent: valida schema y tipos
  - LineageAgent: registra linaje de datos
"""

import os
import json
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from datetime import datetime
from hashlib import md5
import logging
from pathlib import Path
from typing import Dict, List, Optional

# ── Logging ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s'
)
logger = logging.getLogger("BronzeLayer")


# ── Config ───────────────────────────────────────────────────────────────
class BronzeConfig:
    """Configuración centralizada para Bronze Layer"""

    # Rutas locales de datos fuente
    SOURCES_BASE = Path("Material datos")
    CSV_SOURCE = SOURCES_BASE / "data-proyectos-immobiliarios.csv"
    EXCEL_SOURCE = SOURCES_BASE / "data2025Q4.xlsx"

    # Azure ADLS Gen2
    ADLS_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
    ADLS_CONTAINER = "bronze"
    ADLS_PATH_PREFIX = "capeco"

    # Metadatos de control
    METADATA_DIR = Path("bronze_metadata")

    @classmethod
    def ensure_dirs(cls):
        """Asegura que directorios locales existan"""
        cls.METADATA_DIR.mkdir(exist_ok=True)


# ── Data Schemas ─────────────────────────────────────────────────────────
class BronzeSchemas:
    """Esquemas PyArrow para validación de ingesta"""

    CSV_SCHEMA = pa.schema([
        ("title", pa.string()),
        ("distrito", pa.string()),
        ("latitude", pa.float64()),
        ("longitude", pa.float64()),
        ("price_amount", pa.float64()),
        ("price_currency", pa.string()),
        ("area_m2", pa.float64()),
        ("num_rooms", pa.int64()),
        ("num_bathrooms", pa.int64()),
        ("units_available", pa.int64()),
        ("model_name", pa.string()),
        ("model_type", pa.string()),
        ("description", pa.string()),
        ("features", pa.string()),
        ("url", pa.string()),
    ])

    EXCEL_SCHEMA = pa.schema([
        ("NOMBRE_PROYECTO", pa.string()),
        ("DISTRITO", pa.string()),
        ("LATITUD", pa.float64()),
        ("LONGITUD", pa.float64()),
        ("PRECIO_SOLES", pa.float64()),
        ("NRO_UNIDADES", pa.int64()),
        ("AREA_M2", pa.float64()),
        ("FASE", pa.string()),
        ("ANIO", pa.int64()),
        ("TRIM", pa.int64()),
    ])


# ── Metadatos de Ingest ──────────────────────────────────────────────────
class IngestMetadata:
    """Registro de metadatos para cada ingesta"""

    def __init__(self, source_name: str, file_path: str):
        self.source_name = source_name
        self.file_path = file_path
        self.timestamp = datetime.utcnow().isoformat()
        self.row_count = 0
        self.column_count = 0
        self.file_size_bytes = 0
        self.schema_version = "v1.0"
        self.hash_md5 = ""
        self.status = "pending"
        self.errors = []
        self.warnings = []

    def to_dict(self) -> Dict:
        return {
            "source": self.source_name,
            "file_path": self.file_path,
            "timestamp": self.timestamp,
            "row_count": self.row_count,
            "column_count": self.column_count,
            "file_size_bytes": self.file_size_bytes,
            "schema_version": self.schema_version,
            "hash_md5": self.hash_md5,
            "status": self.status,
            "errors": self.errors,
            "warnings": self.warnings,
        }

    def save(self, output_dir: Path = None):
        """Guarda metadatos en JSON"""
        if output_dir is None:
            output_dir = BronzeConfig.METADATA_DIR

        filename = f"{self.source_name}_{self.timestamp.replace(':', '-')}.json"
        filepath = output_dir / filename

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, indent=2, ensure_ascii=False)

        logger.info(f"Metadatos guardados: {filepath}")


# ── Funciones de Ingest ──────────────────────────────────────────────────
def compute_file_hash(file_path: str) -> str:
    """Calcula MD5 del archivo para detectar cambios"""
    hash_md5 = md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def ingest_csv_source(metadata: IngestMetadata) -> Optional[pd.DataFrame]:
    """
    Ingesta fuente CSV: data-proyectos-immobiliarios.csv
    Retorna DataFrame normalizado o None si falla
    """
    try:
        logger.info(f"Leyendo CSV: {BronzeConfig.CSV_SOURCE}")

        df = pd.read_csv(BronzeConfig.CSV_SOURCE)

        # Limpieza básica
        df = df.dropna(subset=['title', 'latitude', 'longitude'])
        df = df[df['latitude'].notna() & df['longitude'].notna()]

        # Tipos de datos
        df['price_amount'] = pd.to_numeric(df.get('price_amount', 0), errors='coerce').fillna(0)
        df['area_m2'] = pd.to_numeric(df.get('area_m2', 0), errors='coerce').fillna(0)
        df['num_rooms'] = pd.to_numeric(df.get('num_rooms', 0), errors='coerce').fillna(0).astype(int)
        df['num_bathrooms'] = pd.to_numeric(df.get('num_bathrooms', 0), errors='coerce').fillna(0).astype(int)
        df['units_available'] = pd.to_numeric(df.get('units_available', 0), errors='coerce').fillna(0).astype(int)

        # Metadatos
        metadata.row_count = len(df)
        metadata.column_count = len(df.columns)
        metadata.file_size_bytes = os.path.getsize(BronzeConfig.CSV_SOURCE)
        metadata.hash_md5 = compute_file_hash(str(BronzeConfig.CSV_SOURCE))
        metadata.status = "success"

        logger.info(f"✓ CSV: {metadata.row_count} filas, {metadata.column_count} columnas")
        return df

    except Exception as e:
        metadata.status = "failed"
        metadata.errors.append(str(e))
        logger.error(f"✗ Error ingesta CSV: {e}")
        return None


def ingest_excel_source(metadata: IngestMetadata) -> Optional[pd.DataFrame]:
    """
    Ingesta fuente Excel: data2025Q4.xlsx
    Retorna DataFrame normalizado o None si falla
    """
    try:
        logger.info(f"Leyendo Excel: {BronzeConfig.EXCEL_SOURCE}")

        df = pd.read_excel(BronzeConfig.EXCEL_SOURCE, sheet_name='data2025Q4')

        # Limpieza
        df = df.dropna(subset=['NOMBRE_PROYECTO'])

        # Tipos
        if 'PRECIO_SOLES' in df.columns:
            df['PRECIO_SOLES'] = pd.to_numeric(df['PRECIO_SOLES'], errors='coerce').fillna(0)
        if 'AREA_M2' in df.columns:
            df['AREA_M2'] = pd.to_numeric(df['AREA_M2'], errors='coerce').fillna(0)
        if 'NRO_UNIDADES' in df.columns:
            df['NRO_UNIDADES'] = pd.to_numeric(df['NRO_UNIDADES'], errors='coerce').fillna(0).astype(int)
        else:
            df['NRO_UNIDADES'] = 0
        if 'ANIO' in df.columns:
            df['ANIO'] = pd.to_numeric(df['ANIO'], errors='coerce').fillna(2025).astype(int)
        else:
            df['ANIO'] = 2025
        if 'TRIM' in df.columns:
            df['TRIM'] = pd.to_numeric(df['TRIM'], errors='coerce').fillna(4).astype(int)
        else:
            df['TRIM'] = 4

        # Metadatos
        metadata.row_count = len(df)
        metadata.column_count = len(df.columns)
        metadata.file_size_bytes = os.path.getsize(BronzeConfig.EXCEL_SOURCE)
        metadata.hash_md5 = compute_file_hash(str(BronzeConfig.EXCEL_SOURCE))
        metadata.status = "success"

        logger.info(f"✓ Excel: {metadata.row_count} filas, {metadata.column_count} columnas")
        return df

    except Exception as e:
        metadata.status = "failed"
        metadata.errors.append(str(e))
        logger.error(f"✗ Error ingesta Excel: {e}")
        return None


def save_to_parquet(df: pd.DataFrame, source_name: str, metadata: IngestMetadata) -> str:
    """
    Convierte DataFrame a Parquet y lo guarda localmente
    (En producción, esto iría a ADLS Gen2)
    """
    try:
        # Crear directorio bronze si no existe
        bronze_dir = Path("bronze_data")
        bronze_dir.mkdir(exist_ok=True)

        # Nombre de archivo con timestamp
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{source_name}__{timestamp}.parquet"
        filepath = bronze_dir / filename

        # Guardar como Parquet
        table = pa.Table.from_pandas(df)
        pq.write_table(table, str(filepath))

        logger.info(f"✓ Parquet guardado: {filepath}")
        return str(filepath)

    except Exception as e:
        metadata.errors.append(f"Parquet save failed: {e}")
        logger.error(f"✗ Error guardando Parquet: {e}")
        return ""


# ── Agente de Ingest ─────────────────────────────────────────────────────
class IngestAgent:
    """
    Agente que coordina la ingesta de todas las fuentes
    Orquesta: lectura → normalización → conversión → almacenamiento
    """

    def __init__(self):
        BronzeConfig.ensure_dirs()
        self.results = {}

    def ingest_all_sources(self) -> Dict[str, Dict]:
        """
        Ejecuta ingesta completa de todas las fuentes
        Retorna diccionario con status y rutas de archivos generados
        """
        logger.info("=" * 70)
        logger.info("INICIANDO INGESTA BRONZE LAYER")
        logger.info("=" * 70)

        # CSV Source
        logger.info("\n[1/2] Procesando CSV...")
        csv_metadata = IngestMetadata("csv_nexo", str(BronzeConfig.CSV_SOURCE))
        df_csv = ingest_csv_source(csv_metadata)
        if df_csv is not None:
            parquet_path = save_to_parquet(df_csv, "csv_nexo", csv_metadata)
            self.results["csv"] = {
                "status": "success",
                "parquet_path": parquet_path,
                "metadata": csv_metadata.to_dict()
            }
        else:
            self.results["csv"] = {
                "status": "failed",
                "metadata": csv_metadata.to_dict()
            }
        csv_metadata.save()

        # Excel Source
        logger.info("\n[2/2] Procesando Excel...")
        excel_metadata = IngestMetadata("excel_q4", str(BronzeConfig.EXCEL_SOURCE))
        df_excel = ingest_excel_source(excel_metadata)
        if df_excel is not None:
            parquet_path = save_to_parquet(df_excel, "excel_q4", excel_metadata)
            self.results["excel"] = {
                "status": "success",
                "parquet_path": parquet_path,
                "metadata": excel_metadata.to_dict()
            }
        else:
            self.results["excel"] = {
                "status": "failed",
                "metadata": excel_metadata.to_dict()
            }
        excel_metadata.save()

        # Summary
        logger.info("\n" + "=" * 70)
        logger.info("RESUMEN DE INGEST")
        logger.info("=" * 70)
        for source, result in self.results.items():
            status_icon = "✓" if result["status"] == "success" else "✗"
            if "parquet_path" in result:
                logger.info(f"{status_icon} {source.upper()}: {result['parquet_path']}")
            else:
                logger.info(f"{status_icon} {source.upper()}: FALLIDO")

        return self.results


# ── CLI ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    agent = IngestAgent()
    results = agent.ingest_all_sources()

    # Exportar resultados
    with open("bronze_ingest_results.json", "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False, default=str)

    print("\n✓ Ingest completado. Resultados en: bronze_ingest_results.json")
