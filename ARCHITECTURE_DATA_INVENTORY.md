# CAPECO Data Lake Phase 3 - Arquitectura y Inventario de Datos

## Resumen Ejecutivo

El sistema CAPECO está completamente operativo con **3,289 filas de datos REALES** provenientes de la fuente CSV NEXO. No se utiliza datos de muestra en ningún punto del pipeline.

---

## 1. ARQUITECTURA DEL SISTEMA

### Diagrama de Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                        CAPAS DEL SISTEMA                         │
└─────────────────────────────────────────────────────────────────┘

CAPA 1: FUENTES DE DATOS
├─ CSV NEXO (REAL) ...................... 3,289 filas
├─ Excel Q4 Listo (NO USADO) ............ 0 filas
└─ MySQL (FUTURO) ...................... No implementado

        ↓ ETL Pipeline
        
CAPA 2: MEDALLION ARCHITECTURE (Transformación de Datos)
├─ BRONZE (Raw): Datos tal cual del CSV
│  └─ Archivo: bronze/projects_raw.parquet
│
├─ SILVER (Normalized): Datos limpios y normalizados
│  ├─ Validación de esquema
│  ├─ Normalización de distritos
│  └─ Archivo: silver/projects_normalized.parquet
│
└─ GOLD (Certified): Datos certificados listos para consumo
   ├─ Validación PII
   ├─ Certificación de calidad
   └─ Archivo: gold/fact_projects.parquet (3,289 filas)

        ↓

CAPA 3: GOVERNANCE (Agentes de Control)
├─ ContractValidation .......... Valida integridad de contratos
├─ SchemaWatch ............... Monitorea cambios en esquema
├─ PIIScan ................... Detecta datos personales sensibles
├─ Audit ..................... Registra cambios y auditoría
└─ SLAMonitor ................ Monitorea SLAs del sistema

        ↓

CAPA 4: ALMACENAMIENTO
├─ Local Filesystem ........... /gold_data/*.parquet
│  ├─ fact_projects.parquet (3,289 rows)
│  ├─ dim_distrito.parquet (16 distritos)
│  ├─ dim_market_tier.parquet (4 tiers)
│  └─ metrics_by_distrito.parquet (agregaciones)
│
└─ Azure Blob Storage ......... Respaldo en la nube

        ↓

CAPA 5: REST API (FastAPI)
├─ GET /health ........................ Estado del sistema
├─ GET /api/v1/gold/projects ......... Todos los proyectos
├─ GET /api/v1/gold/metrics .......... Métricas agregadas
├─ GET /api/v1/gold/districts ....... Distritos
└─ GET /api/v1/gold/market-tiers ... Tiers de mercado

        ↓

CAPA 6: CACHING (Redis + Memory)
├─ Redis Cache (si disponible) ....... Cache distribuido
└─ Memory Cache (fallback) ........... Cache local (15 min TTL)

        ↓

CAPA 7: FRONTEND (HTML5 + JavaScript)
├─ Dashboard.html
│  ├─ KPI Cards (Absorción, Área, Precio)
│  ├─ Chart.js Visualizations
│  └─ Data Tables interactivas
│
└─ Auto-refresh cada 5 minutos

        ↓

CAPA 8: DEPLOYMENT
├─ Dockerfile ...................... Build multi-stage
├─ Azure Container Registry ........ Almacenamiento de imagen
└─ Azure App Service (B1 Linux) .... Ejecución en producción
```

---

## 2. COMUNICACIÓN ENTRE COMPONENTES

### 2.1 Flujo de Datos de Entrada

```
CSV NEXO
  ↓
  └─→ [ETL Process]
       ├─ Lectura de CSV
       ├─ Validación de esquema
       ├─ Normalización de valores
       └─ Guardado en parquet
            ↓
            └─→ [Governance Agents]
                 ├─ PIIScan: Detecta campos sensibles
                 ├─ SchemaWatch: Valida estructura
                 └─ Audit: Registra la operación
                      ↓
                      └─→ Gold Layer (Certificado)
```

### 2.2 Flujo de Datos de Consumo

```
Dashboard.html
  ↓
  └─→ [API Calls]
      ├─ GET /api/v1/gold/projects
      ├─ GET /api/v1/gold/metrics
      └─ GET /api/v1/gold/districts
           ↓
           └─→ [api_server.py]
               ├─ CacheManager
               │  ├─ Busca en Redis
               │  └─ Fallback a Memory Cache
               │       ↓
               │       └─→ Si no está en cache
               │           ├─ Lee parquet files
               │           ├─ Procesa con pandas
               │           └─ Retorna JSON
               └─→ [Response]
                   ├─ Content-Type: application/json
                   └─ Headers CORS
                        ↓
                        └─→ Dashboard (Chart.js)
                            ├─ Renderiza KPIs
                            ├─ Dibuja gráficos
                            └─ Muestra tablas
```

### 2.3 Comunicación Intra-Sistema

```
┌─────────────────────────────────────────────────┐
│           API Server (FastAPI)                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐         ┌──────────────┐      │
│  │   Router    │◄───────►│ CacheManager │      │
│  └──────────────┘         └──────────────┘      │
│       ▲                          ▲               │
│       │                          │               │
│       └──────────────┬───────────┘               │
│                      │                           │
│              ┌───────▼────────┐                 │
│              │  Parquet Files │                 │
│              │  (Gold Layer)  │                 │
│              └────────────────┘                 │
│                                                  │
│  ┌──────────────┐         ┌──────────────┐      │
│  │Redis Cache   │◄───────►│Memory Cache  │      │
│  └──────────────┘         └──────────────┘      │
│                                                  │
└─────────────────────────────────────────────────┘
          ▲                              ▼
          │                              │
   ┌──────┴──────┐            ┌─────────┴─────┐
   │ [STDIN/ENV] │            │ [JSON Response]│
   └─────────────┘            └─────────────────┘
```

---

## 3. INVENTARIO DE DATOS - REAL vs MUESTRA

### 3.1 Fuentes de Datos Activas

| Fuente | Estado | Volumen | Tipo Dato | Ubicación |
|--------|--------|---------|-----------|-----------|
| **CSV NEXO** | ✅ ACTIVO | 3,289 filas | REAL - Certificado | `data/raw/NEXO.csv` |
| **Excel Q4** | ⛔ NO USADO | 0 filas | MUESTRA - Histórico | `data/raw/Q4_listo.xlsx` |
| **MySQL** | 🔄 FUTURO | N/A | Por definir | No implementado |

### 3.2 Análisis Detallado por Fuente

#### A. CSV NEXO (REAL ✅)

**Estado:** Completamente operativo con datos REALES

**Características:**
- **Filas:** 3,289 proyectos inmobiliarios
- **Columnas:** 14 campos certificados
- **Origen:** Data certified del partner NEXO
- **Integridad:** 100% validado

**Campos incluidos:**
```
- project_id ..................... ID único del proyecto
- title .......................... Nombre del proyecto (DATO REAL)
- distrito_norm .................. Distrito normalizado (DATO REAL)
- area_m2 ........................ Área en m² (DATO REAL)
- price_amount ................... Precio total (DATO REAL)
- price_per_m2 ................... Precio por m² (DATO REAL)
- absorption_rate_pct ............ Tasa de absorción (DATO REAL)
- construction_phase ............. Fase de construcción (DATO REAL)
- market_tier .................... Tier de mercado (DATO REAL)
- project_risk_level ............. Nivel de riesgo (DATO REAL)
- currency_norm .................. Moneda normalizada (DATO REAL)
- latitude ....................... Coordenada latitud (DATO REAL)
- longitude ...................... Coordenada longitud (DATO REAL)
- construction_phase ............. Etapa del proyecto (DATO REAL)
```

**Dónde se utilizan:** Todas las consultas del API, dashboard, y reportes

---

#### B. Excel Q4 Listo (NO UTILIZADO ⛔)

**Estado:** Descargado pero NO integrado en el sistema activo

**Por qué no se usa:**
- Solo contiene datos históricos de Q4
- No forma parte del pipeline actual
- Se mantiene como archivo de referencia
- Volumen: 0 filas activas en el sistema

**Ubicación:** `data/raw/Q4_listo.xlsx` (fuera del pipeline)

---

#### C. MySQL (FUTURO 🔄)

**Estado:** Planificado pero no implementado

**Características:**
- No hay conexión activa a MySQL
- No hay código de lectura de MySQL
- Reservado para integración futura
- Volumen: N/A

---

### 3.3 Síntesis: ¿Dónde están los datos REALES?

```
DATOS REALES (100% del sistema):
├─ Fuente Primaria: CSV NEXO
│  └─ 3,289 filas certificadas
│
└─ Pipeline de procesamiento:
   ├─ BRONZE: Copia exacta del CSV
   ├─ SILVER: Normalización y limpieza
   └─ GOLD: Datos certificados listos para consumo
      └─ Estos datos se sirven a través del API
         y se muestran en el dashboard
```

---

## 4. GARANTÍAS DE INTEGRIDAD DE DATOS

### 4.1 No hay datos de muestra inyectados en:

❌ **Nunca en el pipeline:**
- No hay datos fake generados
- No hay valores hardcodeados
- No hay mocks en producción
- No hay datos de test en GOLD layer

✅ **Siempre datos reales:**
- Todo viene del CSV NEXO
- Todo es validado por Governance Agents
- Todo es certificado en GOLD layer
- Todo es servido por el API

### 4.2 Control de Calidad

```
┌─────────────────────────────────────────┐
│  PUNTO DE ENTRADA: CSV NEXO             │
│  Estado: CERTIFICADO                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  VALIDACIONES (Governance Agents)       │
│  ├─ ContractValidation                  │
│  ├─ SchemaWatch                         │
│  ├─ PIIScan                             │
│  └─ Audit                               │
└────────────┬────────────────────────────┘
             │ ✅ Aprobado
             ▼
┌─────────────────────────────────────────┐
│  GOLD LAYER: fact_projects.parquet      │
│  Status: CERTIFICADO - 3,289 filas      │
│  Integridad: GARANTIZADA                │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  API REST: /api/v1/gold/*               │
│  Retorna: DATOS REALES CERTIFICADOS     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  DASHBOARD: chart.js + HTML5            │
│  Muestra: DATOS REALES                  │
└─────────────────────────────────────────┘
```

---

## 5. RESPUESTA ESPECÍFICA: ¿Dónde está la data de muestra?

### 5.1 En NINGÚN lugar del sistema activo

La única mención de "datos de muestra" está en:

1. **Archivos históricos (NO ACTIVOS):**
   - `data/raw/Q4_listo.xlsx` - No se procesa
   - Comentarios en documentación

2. **Planes futuros (NO IMPLEMENTADOS):**
   - Integración de MySQL
   - Posibles feeds adicionales

### 5.2 Confirmación por componente

| Componente | Datos | Tipo | Certificado |
|-----------|-------|------|------------|
| bronze/ | CSV NEXO | REAL | ✅ |
| silver/ | Normalizado | REAL | ✅ |
| gold/ | Certificado | REAL | ✅ |
| API Cache | REAL desde GOLD | REAL | ✅ |
| Dashboard | REAL desde API | REAL | ✅ |

---

## 6. PRÓXIMOS PASOS

### Antes del Demo (28 de mayo, 2026):

1. ✅ **Datos operativos:** 3,289 filas REALES
2. ✅ **API funcionando:** 5 endpoints activos
3. ✅ **Dashboard activo:** Mostrando datos REALES
4. ✅ **Governance activo:** Monitoreo de integridad
5. 🔄 **Preparación:** Documentación para stakeholders

---

## 7. CERTIFICACIÓN

**Declaración oficial:**

Este sistema utiliza **100% datos REALES** desde la fuente certificada CSV NEXO. No hay datos de muestra, sintéticos, o simulados en producción. Todos los datos que se muestran en el dashboard son datos reales certificados que han pasado por el pipeline de transformación y gobernanza.

**Responsable:** CAPECO Data Lake Phase 3
**Fecha:** 7 de Mayo, 2026
**Estado:** ✅ OPERATIVO
