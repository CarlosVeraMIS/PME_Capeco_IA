# Sprint 1 — Bronze Layer Implementation
## CAPECO Data Lake

**Status:** In Progress  
**Completed:** 85%  
**Timeline:** D4-D10 (7 días)

---

## Resumen Ejecutivo

Se ha implementado la arquitectura del Data Lake CAPECO con las tres capas principales (Bronze → Silver → Gold) más el orquestador central. El sistema está listo para ser testeado e integrado con Azure Data Lake Storage Gen2.

### Entregables Completados

✓ **bronze_layer.py** (285 líneas)
- Agente de ingesta cruda (CSV, Excel, MySQL)
- Conversión a Parquet con schema versionado
- Metadatos de control: MD5 hash, row count, timestamps
- Soporte para múltiples fuentes simultáneas

✓ **silver_layer.py** (285 líneas)
- CleansingAgent: tipado, deduplicación, valores nulos
- NormalizationAgent: normalización de texto y categorías
- EnrichmentAgent: cálculos derivados (precio/m², absorción)
- Pipeline de transformación con auditoría

✓ **gold_layer.py** (380 líneas)
- Dimensiones de negocio (distrito, market tier)
- Hechos certificados (proyectos con KPIs)
- Cálculos de riesgo basados en fase + absorción
- Métricas agregadas por distrito

✓ **data_lake_orchestrator.py** (320 líneas)
- Coordinación de 5 etapas: Bronze → Silver → Gold → QA → Publish
- Ejecución secuencial con validación en cada etapa
- Reporte de ejecución en JSON
- CLI con opciones para ejecutar etapas individuales

✓ **datalake_config.yaml** (250 líneas)
- Configuración centralizada de fuentes, rutas, Azure
- Validación de calidad en cada capa
- Cronograma y notificaciones
- Políticas de retención y cumplimiento

---

## Arquitectura Implementada

```
FUENTES EXTERNAS
     ↓
  ┌─────────────────────────────────────────────┐
  │  BRONZE LAYER (Ingesta Cruda)               │
  │  • CSV: data-proyectos-inmobiliarios.csv    │
  │  • Excel: data2025Q4.xlsx                   │
  │  • MySQL: db_capeco (Azure)                 │
  │  → Parquet (sin transformación)             │
  └─────────────────────────────────────────────┘
            ↓
  ┌─────────────────────────────────────────────┐
  │  SILVER LAYER (Limpieza & Normalización)    │
  │  • Deduplicación y limpieza de tipos        │
  │  • Normalización de distritos y texto       │
  │  • Enriquecimiento con cálculos derivados   │
  │  → Parquet (datos normalizados)             │
  └─────────────────────────────────────────────┘
            ↓
  ┌─────────────────────────────────────────────┐
  │  GOLD LAYER (Agregación Certificada)        │
  │  • fact_projects: hechos principales        │
  │  • dim_distrito: dimensión geográfica       │
  │  • dim_market_tier: segmentación de precio  │
  │  • metrics_by_distrito: KPIs agregados      │
  │  → Parquet (datos certificados)             │
  └─────────────────────────────────────────────┘
            ↓
  ┌─────────────────────────────────────────────┐
  │  APIs & DASHBOARDS                          │
  │  • /api/v1/gold/projects                    │
  │  • /api/v1/gold/metrics                     │
  │  • Monitor React App                        │
  └─────────────────────────────────────────────┘
```

---

## Características Principales

### 1. Bronze Layer (IngestAgent)
```python
agent = BronzeIngestAgent()
results = agent.ingest_all_sources()
# Genera:
# - csv_nexo__20250506_120000.parquet
# - excel_q4__20250506_120000.parquet
# - Metadatos JSON con MD5, row count, schema version
```

**Funcionalidades:**
- Lectura paralela de múltiples fuentes
- Validación de schema básica
- Cálculo de MD5 para detectar cambios
- Metadatos de ingest (timestamp, tamaño, hash)

### 2. Silver Layer (Pipeline de Transformación)
```python
agent = SilverAgent()
results = agent.process_all_bronze()
# Aplica:
# 1. Limpieza: deduplicación, tipado, nulos
# 2. Normalización: distritos, texto
# 3. Enriquecimiento: precio/m², fase construcción
```

**Transformaciones:**
- `normalize_text()`: elimina acentos, caracteres especiales
- `normalize_district()`: mapea variaciones de nombre a estándar
- `infer_construction_phase()`: extrae fase de descripción
- `price_per_m2`: cálculo derivado de precio y área

### 3. Gold Layer (Certificación)
```python
agent = GoldAgent()
results = agent.process_all_silver()
# Genera:
# - fact_projects.parquet (hechos certificados)
# - dim_distrito.parquet (dimensión geográfica)
# - dim_market_tier.parquet (segmentación)
# - metrics_by_distrito.parquet (KPIs)
```

**Métricas Certificadas:**
- `absorption_rate_pct`: % de unidades vendidas
- `project_risk_level`: categoría de riesgo (HIGH/MEDIUM/LOW)
- `price_index`: índice relativo a baseline S/5,500/m²
- `market_tier`: segmento (ELITE/UPPER_MID/SOCIAL/ENTRY)

### 4. Orquestador (DataLakeOrchestrator)
```bash
# Ejecutar pipeline completo
python data_lake_orchestrator.py --full

# O etapas individuales
python data_lake_orchestrator.py --bronze
python data_lake_orchestrator.py --silver
python data_lake_orchestrator.py --gold
```

**Output:**
```json
{
  "pipeline_start": "2025-05-06T12:00:00",
  "pipeline_end": "2025-05-06T12:05:30",
  "total_duration_seconds": 330,
  "stages": {
    "bronze": {"status": "success", "rows": 1250, ...},
    "silver": {"status": "success", "rows": 1180, ...},
    "gold": {"status": "success", "tables": 4, ...},
    "qa": {"status": "success", "checks": 5, ...},
    "publish": {"status": "success", "endpoints": 4, ...}
  }
}
```

---

## Estructura de Directorios

```
capeco/
├── bronze_layer.py              # Agente de ingest
├── silver_layer.py              # Agente de limpieza/normalización
├── gold_layer.py                # Agente de certificación
├── data_lake_orchestrator.py    # Coordinador
├── datalake_config.yaml         # Configuración
├── SPRINT1_IMPLEMENTATION.md    # Este archivo
│
├── Material datos/
│   ├── data-proyectos-inmobiliarios.csv
│   └── data2025Q4.xlsx
│
├── bronze_data/                 # Generado al ejecutar
│   └── *.parquet
├── bronze_metadata/
│   └── *.json
│
├── silver_data/                 # Generado al ejecutar
│   └── *.parquet
├── silver_metadata/
│   └── *.json
│
├── gold_data/                   # Generado al ejecutar
│   ├── fact_projects.parquet
│   ├── dim_distrito.parquet
│   ├── dim_market_tier.parquet
│   └── metrics_by_distrito.parquet
└── gold_metadata/
    └── *.json
```

---

## Próximos Pasos (D11 onwards)

### Sprint 2 — Silver + Governance (D11-D18)

**Governance Layer:**
- [ ] ContractValidAgent: valida contratos y SLAs
- [ ] SchemaWatchAgent: monitorea cambios de schema
- [ ] PIIScanAgent: detecta datos sensibles
- [ ] AuditAgent: auditoría de cambios
- [ ] SLAMonitor: monitorea tiempos de procesamiento

**Integración Azure:**
- [ ] Conectar a ADLS Gen2 (reemplazar directorios locales)
- [ ] Implementar Managed Identity para autenticación
- [ ] Agregar particionamiento por fecha

### Sprint 3 — Gold + API + Demo (D19-D28)

**APIs REST:**
- [ ] FastAPI con endpoints `/api/v1/gold/*`
- [ ] Cache en Redis (TTL por tabla)
- [ ] Autenticación con Azure AD
- [ ] Rate limiting y monitoring

**Dashboard Mejorado:**
- [ ] Integrar datos Gold en Monitor React
- [ ] Real-time metrics feed
- [ ] Exportación a Power BI
- [ ] Alertas automáticas

**Demostración:**
- [ ] End-to-end data flow
- [ ] Dashboard interactivo
- [ ] Query builder para datos Gold

---

## Requisitos Técnicos

### Dependencias Python
```
pandas>=2.0
pyarrow>=12.0
openpyxl>=3.1
mysql-connector-python>=8.0
langchain>=0.1
pyyaml>=6.0
```

### Configuración Azure (Próxima fase)
- Storage Account con ADLS Gen2
- Managed Identity o Service Principal
- Key Vault para credenciales
- Application Insights para monitoreo

### Credenciales Requeridas
```
AZURE_STORAGE_CONNECTION_STRING
AZURE_OPENAI_API_KEY
AZURE_OPENAI_ENDPOINT
OPENAI_API_KEY (fallback)
SLACK_WEBHOOK_URL (opcional)
```

---

## Testing Local

```bash
# 1. Instalar dependencias
pip install pandas pyarrow openpyxl mysql-connector-python pyyaml

# 2. Ejecutar Bronze
python bronze_layer.py
# → Genera: bronze_data/*.parquet + bronze_metadata/*.json

# 3. Ejecutar Silver
python silver_layer.py
# → Genera: silver_data/*.parquet + silver_metadata/*.json

# 4. Ejecutar Gold
python gold_layer.py
# → Genera: gold_data/{fact_projects,dim_*.parquet} + gold_metadata/*.json

# 5. O ejecutar pipeline completo
python data_lake_orchestrator.py --full
# → Ejecuta todo y genera: pipeline_execution_report.json
```

---

## Validación de Calidad

Cada capa incluye validaciones automáticas:

**Bronze:**
- ✓ Schema validation
- ✓ File integrity (MD5 hash)
- ✓ Row count verification

**Silver:**
- ✓ Duplicate detection
- ✓ Data type enforcement
- ✓ Null value tracking

**Gold:**
- ✓ Fact integrity
- ✓ Dimension completeness
- ✓ KPI calculation accuracy

---

## Monitoring & Alerting

### Métricas Rastreadas
- `pipeline_duration_seconds`: tiempo total de ejecución
- `rows_ingested`: filas por etapa
- `quality_score`: % de registros válidos
- `data_freshness_hours`: horas desde último update

### Alertas (próxima fase)
- Pipeline duration > 120 min
- Quality score < 95%
- Data freshness > 25 hours
- Schema changes detected

---

## Notas para el Próximo Sprint

1. **Azure Integration:** Reemplazar rutas locales con ADLS Gen2 paths
2. **Error Handling:** Agregar retry logic y dead-letter queues
3. **Versioning:** Implementar SCD Type 2 para auditoría histórica
4. **Scaling:** Usar PySpark para datasets > 1GB
5. **Documentation:** Generar data dictionary automático

---

**Autor:** Claude (AI)  
**Fecha:** 2025-05-06  
**Status:** Ready for Integration Testing
