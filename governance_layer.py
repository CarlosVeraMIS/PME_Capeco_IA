"""
GOVERNANCE LAYER — Data Lake CAPECO
====================================
Agentes de control, auditoría y cumplimiento.

Responsabilidades:
  1. ContractValidAgent: valida datos contra SLAs y contratos
  2. SchemaWatchAgent: monitorea cambios de schema
  3. PIIScanAgent: detecta datos sensibles
  4. AuditAgent: registra cambios y accesos
  5. SLAMonitor: monitorea tiempos de procesamiento

Validaciones aplicadas a todas las capas (Bronze → Silver → Gold)
"""

import pandas as pd
import json
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import logging
from dataclasses import dataclass, asdict

logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s')
logger = logging.getLogger("GovernanceLayer")


# ── Data Classes ─────────────────────────────────────────────────────────
@dataclass
class ValidationResult:
    """Resultado de una validación"""
    agent_name: str
    timestamp: str
    status: str  # PASS, WARN, FAIL
    checks_passed: int
    checks_failed: int
    details: Dict


@dataclass
class AuditLog:
    """Registro de auditoría"""
    timestamp: str
    agent: str
    action: str
    affected_rows: int
    status: str
    details: str
    user: str = "system"


# ── Config de Governance ─────────────────────────────────────────────────
class GovernanceConfig:
    """Configuración centralizada de governance"""

    AUDIT_DIR = Path("audit_logs")
    SCHEMA_DIR = Path("schema_history")
    VALIDATION_DIR = Path("validation_results")

    # Contratos y SLAs
    SLA_BRONZE_DURATION_SECONDS = 30
    SLA_SILVER_DURATION_SECONDS = 45
    SLA_GOLD_DURATION_SECONDS = 60

    # PII patterns (expresiones regulares)
    PII_PATTERNS = {
        "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
        "phone": r"(\+\d{1,3})?[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,9}",
        "ssn": r"\d{3}-\d{2}-\d{4}",
        "credit_card": r"\b\d{4}[\s.-]?\d{4}[\s.-]?\d{4}[\s.-]?\d{4}\b",
        "passport": r"[A-Z]{2}\d{7}"
    }

    # Columnas sensibles por defecto
    SENSITIVE_COLUMNS = [
        'email', 'phone', 'ssn', 'credit_card', 'password',
        'api_key', 'token', 'secret'
    ]

    @classmethod
    def ensure_dirs(cls):
        """Asegura que directorios existan"""
        cls.AUDIT_DIR.mkdir(exist_ok=True)
        cls.SCHEMA_DIR.mkdir(exist_ok=True)
        cls.VALIDATION_DIR.mkdir(exist_ok=True)


# ── Agente de Validación de Contrato ────────────────────────────────────
class ContractValidAgent:
    """
    Valida que los datos cumplan con contratos y SLAs:
    - Completitud de columnas requeridas
    - Tipos de datos correctos
    - Rangos de valores válidos
    """

    REQUIRED_COLUMNS_BRONZE = [
        'title', 'latitude', 'longitude', 'price_amount'
    ]

    REQUIRED_COLUMNS_SILVER = [
        'project_name_norm', 'distrito_norm', 'construction_phase',
        'price_per_m2', 'market_tier'
    ]

    REQUIRED_COLUMNS_GOLD = [
        'project_id', 'titulo', 'price_per_m2', 'market_tier',
        'absorption_rate_pct', 'project_risk_level'
    ]

    @staticmethod
    def validate_dataframe(df: pd.DataFrame, layer: str) -> ValidationResult:
        """
        Valida DataFrame contra contrato de layer
        """
        logger.info(f"Validando contrato para {layer} layer...")

        result = ValidationResult(
            agent_name="ContractValidAgent",
            timestamp=datetime.utcnow().isoformat(),
            status="PASS",
            checks_passed=0,
            checks_failed=0,
            details={}
        )

        # Seleccionar columnas requeridas según layer
        required_cols_map = {
            "bronze": ContractValidAgent.REQUIRED_COLUMNS_BRONZE,
            "silver": ContractValidAgent.REQUIRED_COLUMNS_SILVER,
            "gold": ContractValidAgent.REQUIRED_COLUMNS_GOLD
        }

        required_cols = required_cols_map.get(layer, [])

        # Check 1: Columnas requeridas presentes
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            result.checks_failed += 1
            result.status = "FAIL"
            result.details["missing_columns"] = missing_cols
            logger.error(f"✗ Columnas faltantes: {missing_cols}")
        else:
            result.checks_passed += 1
            logger.info(f"✓ Todas las columnas requeridas presentes")

        # Check 2: Completitud (no más del 5% nulos en columnas críticas)
        null_check = {}
        for col in required_cols:
            if col in df.columns:
                null_pct = (df[col].isna().sum() / len(df)) * 100
                if null_pct > 5:
                    null_check[col] = f"{null_pct:.1f}%"
                    result.checks_failed += 1
                    result.status = "WARN"
                else:
                    result.checks_passed += 1

        if null_check:
            result.details["null_violations"] = null_check
            logger.warning(f"⚠ Valores nulos > 5%: {null_check}")

        # Check 3: Tipos de datos
        type_issues = {}
        if 'latitude' in df.columns:
            if df['latitude'].dtype not in ['float64', 'float32', 'int64']:
                type_issues['latitude'] = str(df['latitude'].dtype)
        if 'price_amount' in df.columns:
            if df['price_amount'].dtype not in ['float64', 'float32', 'int64']:
                type_issues['price_amount'] = str(df['price_amount'].dtype)

        if type_issues:
            result.checks_failed += 1
            result.status = "WARN"
            result.details["type_mismatches"] = type_issues
        else:
            result.checks_passed += 1

        return result


# ── Agente de Monitoreo de Schema ───────────────────────────────────────
class SchemaWatchAgent:
    """
    Monitorea cambios de schema y versiona:
    - Nuevas columnas
    - Columnas eliminadas
    - Cambios de tipo de dato
    """

    def __init__(self):
        self.schema_history = {}

    def register_schema(self, df: pd.DataFrame, source_name: str, layer: str) -> Dict:
        """Registra el schema actual"""
        schema = {
            "timestamp": datetime.utcnow().isoformat(),
            "source": source_name,
            "layer": layer,
            "columns": list(df.columns),
            "dtypes": {col: str(df[col].dtype) for col in df.columns},
            "row_count": len(df),
            "memory_mb": df.memory_usage(deep=True).sum() / 1024 / 1024
        }

        # Guardar schema
        schema_file = GovernanceConfig.SCHEMA_DIR / f"{source_name}_{layer}_schema.json"
        with open(schema_file, "w") as f:
            json.dump(schema, f, indent=2)

        logger.info(f"✓ Schema registrado: {source_name} ({len(df.columns)} columnas)")
        return schema

    def check_schema_changes(self, df: pd.DataFrame, source_name: str, layer: str) -> Dict:
        """Detecta cambios de schema respecto a la versión anterior"""
        schema_file = GovernanceConfig.SCHEMA_DIR / f"{source_name}_{layer}_schema.json"

        changes = {
            "new_columns": [],
            "removed_columns": [],
            "type_changes": {},
            "status": "OK"
        }

        if not schema_file.exists():
            logger.info(f"Primera ejecución para {source_name}/{layer} - baseline registrado")
            self.register_schema(df, source_name, layer)
            return changes

        # Cargar schema anterior
        with open(schema_file) as f:
            prev_schema = json.load(f)

        prev_cols = set(prev_schema['columns'])
        curr_cols = set(df.columns)

        # Columnas nuevas
        changes["new_columns"] = list(curr_cols - prev_cols)
        if changes["new_columns"]:
            changes["status"] = "WARN"
            logger.warning(f"⚠ Nuevas columnas: {changes['new_columns']}")

        # Columnas eliminadas
        changes["removed_columns"] = list(prev_cols - curr_cols)
        if changes["removed_columns"]:
            changes["status"] = "WARN"
            logger.warning(f"⚠ Columnas eliminadas: {changes['removed_columns']}")

        # Cambios de tipo
        for col in prev_cols & curr_cols:
            if col in df.columns:
                old_type = prev_schema['dtypes'][col]
                new_type = str(df[col].dtype)
                if old_type != new_type:
                    changes["type_changes"][col] = f"{old_type} → {new_type}"
                    changes["status"] = "WARN"
                    logger.warning(f"⚠ Cambio de tipo {col}: {old_type} → {new_type}")

        # Registrar nuevo schema
        self.register_schema(df, source_name, layer)

        return changes


# ── Agente de Escaneo de PII ────────────────────────────────────────────
class PIIScanAgent:
    """
    Detecta Información Personalmente Identificable (PII)
    en los datos y marca columnas sensibles
    """

    @staticmethod
    def scan_dataframe(df: pd.DataFrame) -> Dict:
        """
        Escanea DataFrame buscando PII
        Retorna columnas sospechosas y recomendaciones
        """
        logger.info("Escaneando datos para PII...")

        findings = {
            "suspicious_columns": [],
            "patterns_found": {},
            "risk_level": "LOW",
            "recommendations": []
        }

        # Check columnas por nombre
        for col in df.columns:
            col_lower = col.lower()
            for sensitive in GovernanceConfig.SENSITIVE_COLUMNS:
                if sensitive in col_lower:
                    findings["suspicious_columns"].append({
                        "column": col,
                        "reason": f"Nombre contiene '{sensitive}'"
                    })
                    findings["risk_level"] = "HIGH"
                    logger.warning(f"⚠ Columna sensible detectada: {col}")

        # Check contenido de columnas string
        for col in df.select_dtypes(include=['object']).columns:
            sample = df[col].dropna().head(100).astype(str)

            for pattern_name, pattern in GovernanceConfig.PII_PATTERNS.items():
                matches = sample.str.contains(pattern, regex=True).sum()
                if matches > 0:
                    findings["patterns_found"][col] = pattern_name
                    findings["risk_level"] = "MEDIUM"
                    logger.warning(f"⚠ Patrón {pattern_name} detectado en {col}")

        # Recomendaciones
        if findings["risk_level"] != "LOW":
            findings["recommendations"] = [
                "Encriptar columnas sensibles en tránsito",
                "Aplicar data masking en vistas de usuarios",
                "Auditar accesos a estas columnas",
                "Documentar clasificación de datos"
            ]

        return findings


# ── Agente de Auditoría ─────────────────────────────────────────────────
class AuditAgent:
    """
    Registra todas las actividades, cambios y accesos
    para cumplimiento normativo y debugging
    """

    @staticmethod
    def log_operation(
        agent: str,
        action: str,
        affected_rows: int,
        status: str,
        details: str = ""
    ) -> AuditLog:
        """Registra una operación en el log de auditoría"""

        audit = AuditLog(
            timestamp=datetime.utcnow().isoformat(),
            agent=agent,
            action=action,
            affected_rows=affected_rows,
            status=status,
            details=details
        )

        # Guardar log
        log_file = GovernanceConfig.AUDIT_DIR / f"audit_{datetime.utcnow().strftime('%Y%m%d')}.jsonl"
        with open(log_file, "a") as f:
            f.write(json.dumps(asdict(audit)) + "\n")

        log_icon = "✓" if status == "SUCCESS" else "✗"
        logger.info(f"{log_icon} [{agent}] {action} - {affected_rows} rows - {status}")

        return audit

    @staticmethod
    def compute_data_hash(df: pd.DataFrame) -> str:
        """Calcula hash SHA256 del dataframe para integridad"""
        data_str = pd.util.hash_pandas_object(df, index=True).values.tobytes()
        return hashlib.sha256(data_str).hexdigest()


# ── Monitor de SLAs ─────────────────────────────────────────────────────
class SLAMonitor:
    """
    Monitorea cumplimiento de SLAs:
    - Tiempo de procesamiento por etapa
    - Tasa de éxito de pipelines
    - Disponibilidad de datos
    """

    def __init__(self):
        self.start_times = {}
        self.metrics = {}

    def start_stage(self, stage_name: str):
        """Inicia cronómetro para una etapa"""
        self.start_times[stage_name] = datetime.utcnow()

    def end_stage(self, stage_name: str, rows_processed: int) -> Dict:
        """Finaliza cronómetro y registra métrica"""
        if stage_name not in self.start_times:
            logger.warning(f"⚠ Stage {stage_name} sin start_time registrado")
            return {}

        duration = (datetime.utcnow() - self.start_times[stage_name]).total_seconds()

        # Obtener SLA según stage
        sla_map = {
            "bronze": GovernanceConfig.SLA_BRONZE_DURATION_SECONDS,
            "silver": GovernanceConfig.SLA_SILVER_DURATION_SECONDS,
            "gold": GovernanceConfig.SLA_GOLD_DURATION_SECONDS
        }

        sla_threshold = sla_map.get(stage_name, 120)
        status = "PASS" if duration <= sla_threshold else "VIOLATED"

        metric = {
            "stage": stage_name,
            "duration_seconds": duration,
            "sla_threshold": sla_threshold,
            "rows_processed": rows_processed,
            "throughput_rows_per_sec": rows_processed / duration if duration > 0 else 0,
            "status": status,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Log si viola SLA
        if status == "VIOLATED":
            logger.error(f"✗ SLA VIOLADO: {stage_name} tomó {duration:.1f}s (SLA: {sla_threshold}s)")
        else:
            logger.info(f"✓ SLA OK: {stage_name} - {duration:.1f}s ({metric['throughput_rows_per_sec']:.0f} rows/sec)")

        return metric


# ── Gestor Central de Governance ────────────────────────────────────────
class GovernanceManager:
    """Orquesta todos los agentes de governance"""

    def __init__(self):
        GovernanceConfig.ensure_dirs()
        self.contract_agent = ContractValidAgent()
        self.schema_agent = SchemaWatchAgent()
        self.pii_agent = PIIScanAgent()
        self.audit_agent = AuditAgent()
        self.sla_monitor = SLAMonitor()

    def validate_layer(self, df: pd.DataFrame, source_name: str, layer: str) -> Dict:
        """
        Ejecuta todas las validaciones de governance para un dataframe
        """
        logger.info(f"\n{'='*70}")
        logger.info(f"EJECUTANDO VALIDACIONES DE GOVERNANCE: {source_name} / {layer}")
        logger.info(f"{'='*70}")

        results = {
            "timestamp": datetime.utcnow().isoformat(),
            "source": source_name,
            "layer": layer,
            "row_count": len(df),
            "validations": {}
        }

        # 1. Contrato
        contract_result = self.contract_agent.validate_dataframe(df, layer)
        results["validations"]["contract"] = asdict(contract_result)

        # 2. Schema
        schema_changes = self.schema_agent.check_schema_changes(df, source_name, layer)
        results["validations"]["schema"] = schema_changes

        # 3. PII
        pii_findings = self.pii_agent.scan_dataframe(df)
        results["validations"]["pii"] = pii_findings

        # 4. Auditoría
        data_hash = self.audit_agent.compute_data_hash(df)
        self.audit_agent.log_operation(
            agent="GovernanceManager",
            action=f"validate_{layer}",
            affected_rows=len(df),
            status="SUCCESS",
            details=f"Schema: {len(df.columns)} cols, Hash: {data_hash[:16]}..."
        )
        results["validations"]["audit"] = {"data_hash": data_hash}

        # Guardar resultados
        val_file = GovernanceConfig.VALIDATION_DIR / f"validation_{source_name}_{layer}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        with open(val_file, "w") as f:
            json.dump(results, f, indent=2)

        logger.info(f"✓ Validaciones completadas - Resultados guardados")

        return results


# ── CLI ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Ejemplo de uso
    logger.info("Governance Layer - Ejemplo de validación")

    # Crear datos de ejemplo
    df_test = pd.DataFrame({
        'title': ['Proyecto A', 'Proyecto B', 'Proyecto C'],
        'latitude': [-12.1, -12.2, -12.3],
        'longitude': [-77.1, -77.2, -77.3],
        'price_amount': [500000, 600000, 700000],
        'email': ['user@example.com', 'test@test.com', 'data@test.com']
    })

    # Ejecutar governance
    manager = GovernanceManager()
    results = manager.validate_layer(df_test, "test_source", "bronze")

    print("\nResultados de Governance:")
    print(json.dumps(results, indent=2, ensure_ascii=False))
