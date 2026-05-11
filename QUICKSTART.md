# CAPECO Data Lake — Quick Start Guide

## Inicio Rápido en 5 Minutos

### Requisitos Previos
```bash
# Python 3.9+
python --version

# Instalar dependencias
pip install pandas pyarrow openpyxl mysql-connector-python pyyaml
```

### 1. Ejecutar el Pipeline Completo

```bash
cd /Users/carlosvera/Library/CloudStorage/OneDrive-MSFT/mis/IA/capeco

# Opción A: Pipeline completo (Bronze → Silver → Gold → QA → Publish)
python data_lake_orchestrator.py --full

# Salida esperada:
# ════════════════════════════════════════════════════════════════════════════
# DATA LAKE PIPELINE — CAPECO
# ════════════════════════════════════════════════════════════════════════════
# 
# ════════════════════════════════════════════════════════════════════════════
# STAGE 1: BRONZE LAYER (Ingesta Cruda)
# ════════════════════════════════════════════════════════════════════════════
# ✓ Bronze completado en 3.2s
# ...
# ✓ Reporte guardado: pipeline_execution_report.json
```

### 2. Ejecutar Etapas Individuales

```bash
# Solo Bronze (ingesta cruda)
python data_lake_orchestrator.py --bronze

# Solo Silver (limpieza & normalización)
python data_lake_orchestrator.py --silver

# Solo Gold (agregaciones certificadas)
python data_lake_orchestrator.py --gold
```

### 3. Verificar Archivos Generados

```bash
# Listar archivos Parquet generados
ls -lh bronze_data/       # Archivos crudos
ls -lh silver_data/       # Datos normalizados
ls -lh gold_data/         # Datos certificados

# Ver reporte de ejecución
cat pipeline_execution_report.json | python -m json.tool
```

---

## Estructura de Directorios Después de Ejecutar

```
capeco/
├── bronze_data/
│   ├── csv_nexo__20250506_120000.parquet        (Parquet crudo del CSV)
│   └── excel_q4__20250506_120000.parquet        (Parquet crudo del Excel)
│
├── silver_data/
│   ├── silver_csv_nexo__20250506_120100.parquet (CSV normalizado)
│   └── silver_excel_q4__20250506_120200.parquet (Excel normalizado)
│
├── gold_data/
│   ├── fact_projects.parquet                     (Hechos principales)
│   ├── dim_distrito.parquet                      (Dimensión distritos)
│   ├── dim_market_tier.parquet                   (Dimensión mercado)
│   └── metrics_by_distrito.parquet               (Métricas KPI)
│
├── bronze_metadata/
│   ├── csv_nexo_*.json                           (Metadatos ingesta)
│   └── excel_q4_*.json                           (Metadatos ingesta)
│
└── pipeline_execution_report.json                 (Reporte final)
```

---

## Ver Resultados en Python

```python
import pandas as pd
import pyarrow.parquet as pq

# Leer tabla Parquet directamente
table = pq.read_table("gold_data/fact_projects.parquet")
df = table.to_pandas()

print(f"Proyectos: {len(df)}")
print(f"Columnas: {list(df.columns)}")
print(df.head())

# Ver métricas por distrito
metrics = pd.read_parquet("gold_data/metrics_by_distrito.parquet")
print("\n=== Métricas por Distrito ===")
print(metrics.to_string())

# Ver dimensión de distritos
districts = pd.read_parquet("gold_data/dim_distrito.parquet")
print("\n=== Distritos ===")
print(districts[['distrito', 'project_count', 'price_per_m2_avg']].head(10))
```

---

## Verificar Integridad de Datos

```python
import json

# Leer reporte de ejecución
with open("pipeline_execution_report.json") as f:
    report = json.load(f)

print("Pipeline Status:")
for stage, result in report["stages"].items():
    status = "✓" if result["status"] == "success" else "✗"
    print(f"  {status} {stage}: {result['status']}")

print(f"\nTotal duration: {report['total_duration_seconds']:.1f} seconds")
```

---

## Troubleshooting

### Error: "No module named 'pandas'"
```bash
pip install pandas pyarrow openpyxl
```

### Error: "FileNotFoundError: Material datos/..."
Asegurate de estar en el directorio correcto:
```bash
cd /Users/carlosvera/Library/CloudStorage/OneDrive-MSFT/mis/IA/capeco
pwd  # Verifica la ruta actual
```

### Error: "Connection failed to MySQL"
```python
# Verificar credenciales en pme_db.py
python -c "from Material_datos.pme_db import test_connection; test_connection()"
```

### Limpiar archivos generados (para reejecutar)
```bash
# CUIDADO: Borra todos los archivos generados
rm -rf bronze_data/*.parquet bronze_metadata/*.json
rm -rf silver_data/*.parquet silver_metadata/*.json
rm -rf gold_data/*.parquet gold_metadata/*.json
rm pipeline_execution_report.json bronze_ingest_results.json silver_processing_results.json gold_processing_results.json
```

---

## Próximas Integraciones

### Conectar a Azure Data Lake Storage Gen2
```python
# (Próxima fase - Sprint 2)
from azure.storage.filedatalake import DataLakeServiceClient

service_client = DataLakeServiceClient.from_connection_string(
    os.getenv("AZURE_STORAGE_CONNECTION_STRING")
)

# Subir archivos Parquet a ADLS Gen2
file_system_client = service_client.get_file_system_client("capeco-lake")
```

### Crear API REST
```python
# (Próxima fase - Sprint 3)
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/api/v1/gold/projects")
def get_projects():
    df = pd.read_parquet("gold_data/fact_projects.parquet")
    return df.to_dict(orient="records")
```

---

## Monitoreo de Ejecución

Mientras se ejecuta el pipeline, se generan logs en tiempo real:

```
2025-05-06 12:00:00 | INFO     | BronzeLayer   | Cargando bases...
2025-05-06 12:00:01 | INFO     | BronzeLayer   | ✓ CSV: 1250 filas, 15 columnas
2025-05-06 12:00:02 | INFO     | BronzeLayer   | ✓ Excel: 980 filas, 10 columnas
2025-05-06 12:00:03 | INFO     | SilverLayer   | Limpiando 1250 filas...
2025-05-06 12:00:04 | INFO     | SilverLayer   | ✓ Limpieza completada: 1180 filas válidas
...
```

---

## Documentación Completa

Para más detalles, ver:
- `SPRINT1_IMPLEMENTATION.md` — Arquitectura y features
- `datalake_config.yaml` — Configuración centralizada
- `data_lake_orchestrator.py --help` — Opciones CLI

---

**Ejecuta ahora:**
```bash
python data_lake_orchestrator.py --full
```

Estará listo en ~5 minutos. ✓
