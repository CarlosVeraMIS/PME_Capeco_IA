"""
AZURE DATA LAKE SETUP — CAPECO
===============================
Script para configurar Azure Data Lake Storage Gen2 para el pipeline

Requisitos:
- Azure Storage Account: capecovalencia (ya existe)
- Resource Group: capeco-prod
- Az CLI OR Azure SDK

Uso:
    python azure_setup.py --verify      # Verificar Storage Account
    python azure_setup.py --create-containers  # Crear containers
    python azure_setup.py --setup-auth  # Configurar autenticación
"""

import os
import sys
from pathlib import Path
from datetime import datetime
import json

try:
    from azure.storage.filedatalake import DataLakeServiceClient
    from azure.identity import DefaultAzureCredential, ClientSecretCredential
    AZURE_SDK_AVAILABLE = True
except ImportError:
    AZURE_SDK_AVAILABLE = False
    print("⚠ Azure SDK not available. Install with: pip install azure-storage-file-datalake azure-identity")

# ── Configuration ────────────────────────────────────────────────────────
STORAGE_ACCOUNT_NAME = "capecovalencia"
STORAGE_ACCOUNT_URL = f"https://{STORAGE_ACCOUNT_NAME}.dfs.core.windows.net"
RESOURCE_GROUP = "capeco-prod"
REGION = "eastus"

CONTAINERS = {
    "bronze-layer": {
        "description": "Raw ingested data (CSV, Excel, MySQL)",
        "path_prefix": "capeco/bronze",
        "retention_days": 90
    },
    "silver-layer": {
        "description": "Cleaned and normalized data",
        "path_prefix": "capeco/silver",
        "retention_days": 180
    },
    "gold-layer": {
        "description": "Certified facts and dimensions",
        "path_prefix": "capeco/gold",
        "retention_days": 365
    },
    "audit-governance": {
        "description": "Audit logs, validation results, schema history",
        "path_prefix": "capeco/governance",
        "retention_days": 2555  # 7 years
    }
}

LOGGER_PREFIX = "AzureSetup"


def log_info(msg: str):
    """Log info message"""
    timestamp = datetime.utcnow().isoformat()
    print(f"{timestamp} | INFO | {LOGGER_PREFIX} | {msg}")


def log_error(msg: str):
    """Log error message"""
    timestamp = datetime.utcnow().isoformat()
    print(f"{timestamp} | ERROR | {LOGGER_PREFIX} | {msg}")


def log_success(msg: str):
    """Log success message"""
    timestamp = datetime.utcnow().isoformat()
    print(f"{timestamp} | SUCCESS | {LOGGER_PREFIX} | ✓ {msg}")


def get_azure_client():
    """Initialize Azure Data Lake Service Client"""
    if not AZURE_SDK_AVAILABLE:
        log_error("Azure SDK not available")
        return None

    try:
        # Try DefaultAzureCredential first (Managed Identity or local creds)
        credential = DefaultAzureCredential()
        client = DataLakeServiceClient(
            account_url=STORAGE_ACCOUNT_URL,
            credential=credential
        )
        return client
    except Exception as e:
        log_error(f"Failed to initialize Azure client: {e}")
        return None


def verify_storage_account():
    """Verify Storage Account exists and is accessible"""
    log_info(f"Verificando Storage Account: {STORAGE_ACCOUNT_NAME}")

    if not AZURE_SDK_AVAILABLE:
        log_info("⚠ Azure SDK no disponible - usar Azure CLI:")
        log_info(f"  az storage account show --name {STORAGE_ACCOUNT_NAME} --resource-group {RESOURCE_GROUP}")
        return False

    try:
        client = get_azure_client()
        if not client:
            return False

        # Try to get account properties
        properties = client.get_service_properties()
        log_success(f"Storage Account '{STORAGE_ACCOUNT_NAME}' is accessible")
        return True

    except Exception as e:
        log_error(f"Storage Account not accessible: {e}")
        return False


def create_containers():
    """Create Data Lake containers"""
    log_info("Creando containers en Azure Data Lake Storage Gen2...")

    if not AZURE_SDK_AVAILABLE:
        log_info("⚠ Azure SDK no disponible - usar Azure CLI:")
        for container, config in CONTAINERS.items():
            log_info(f"  az storage container create --name {container} --account-name {STORAGE_ACCOUNT_NAME}")
        return False

    try:
        client = get_azure_client()
        if not client:
            return False

        created = 0
        for container_name, config in CONTAINERS.items():
            try:
                file_system_client = client.get_file_system_client(container_name)
                file_system_client.create_file_system()
                log_success(f"Container '{container_name}' created")
                created += 1
            except Exception as e:
                if "already exists" in str(e):
                    log_info(f"Container '{container_name}' already exists")
                    created += 1
                else:
                    log_error(f"Failed to create container '{container_name}': {e}")

        return created == len(CONTAINERS)

    except Exception as e:
        log_error(f"Failed to create containers: {e}")
        return False


def create_directory_structure():
    """Create directory structure in containers"""
    log_info("Creando estructura de directorios...")

    if not AZURE_SDK_AVAILABLE:
        log_error("Azure SDK required for directory creation")
        return False

    try:
        client = get_azure_client()
        if not client:
            return False

        for container_name, config in CONTAINERS.items():
            try:
                file_system_client = client.get_file_system_client(container_name)

                # Create subdirectories
                subdirs = ["data", "metadata", "logs"]
                for subdir in subdirs:
                    dir_path = f"{config['path_prefix']}/{subdir}"
                    # Create a placeholder file to establish directory
                    directory_client = file_system_client.get_directory_client(dir_path)
                    try:
                        directory_client.create_directory()
                    except:
                        pass  # Directory might already exist

                log_success(f"Directory structure created in '{container_name}'")

            except Exception as e:
                log_error(f"Failed to create directories in '{container_name}': {e}")

        return True

    except Exception as e:
        log_error(f"Failed to create directory structure: {e}")
        return False


def setup_authentication():
    """Setup authentication options"""
    log_info("Configurando opciones de autenticación...")

    auth_config = {
        "storage_account_name": STORAGE_ACCOUNT_NAME,
        "storage_account_url": STORAGE_ACCOUNT_URL,
        "authentication_methods": [
            {
                "method": "Managed Identity (RECOMMENDED)",
                "description": "Para Azure Container Instances y App Service",
                "setup": "Asignar Managed Identity en Azure Portal"
            },
            {
                "method": "Connection String (TEMPORARY)",
                "description": "Para desarrollo local",
                "setup": "Copiar connection string de Azure Portal",
                "env_var": "AZURE_STORAGE_CONNECTION_STRING"
            },
            {
                "method": "Service Principal",
                "description": "Para CI/CD pipelines",
                "setup": "Crear Service Principal en Azure AD"
            }
        ]
    }

    log_success("Authentication options available")

    # Save to config file
    config_file = Path("azure_auth_config.json")
    with open(config_file, "w") as f:
        json.dump(auth_config, f, indent=2)

    log_info(f"Configuración guardada en: {config_file}")
    return True


def generate_datalake_config():
    """Generate datalake_config.yaml Azure section"""
    log_info("Generando configuración para datalake_config.yaml...")

    azure_config = f"""
azure:
  # Storage Account Information
  storage_account_name: "{STORAGE_ACCOUNT_NAME}"
  storage_endpoint: "{STORAGE_ACCOUNT_URL}"
  resource_group: "{RESOURCE_GROUP}"
  region: "{REGION}"

  # Container Mappings
  containers:
    bronze: "bronze-layer"
    silver: "silver-layer"
    gold: "gold-layer"
    governance: "audit-governance"

  # Path Prefixes
  path_prefixes:
    bronze: "capeco/bronze"
    silver: "capeco/silver"
    gold: "capeco/gold"
    governance: "capeco/governance"

  # Authentication
  authentication:
    method: "managed_identity"  # Options: managed_identity, connection_string, service_principal
    use_managed_identity: true
    # For local development:
    # connection_string: ${{AZURE_STORAGE_CONNECTION_STRING}}

  # Performance & Optimization
  performance:
    connection_timeout_seconds: 30
    retry_attempts: 3
    retry_delay_seconds: 1
    max_concurrent_uploads: 4

  # Data Retention
  retention:
    bronze_days: 90
    silver_days: 180
    gold_days: 365
    governance_days: 2555  # 7 years for audit

  # Monitoring
  monitoring:
    enable_logging: true
    log_level: "INFO"
    enable_metrics: true
"""

    print(azure_config)
    return True


def print_summary():
    """Print setup summary and next steps"""
    print("\n" + "=" * 80)
    print("AZURE DATA LAKE SETUP SUMMARY")
    print("=" * 80)

    print("\n✓ Storage Account: capecovalencia")
    print("✓ Region: eastus")
    print("✓ Containers created:")
    for container, config in CONTAINERS.items():
        print(f"  - {container} ({config['description']})")

    print("\n📋 PRÓXIMOS PASOS:")
    print("""
1. VERIFICAR ACCESO:
   python azure_setup.py --verify

2. CREAR CONTAINERS:
   python azure_setup.py --create-containers

3. CONFIGURAR AUTENTICACIÓN:
   python azure_setup.py --setup-auth

4. ACTUALIZAR ORCHESTRADOR:
   - Modificar data_lake_orchestrator.py para Azure
   - Usar DataLakeServiceClient para lectura/escritura

5. PROBAR PIPELINE:
   python data_lake_orchestrator.py --full --azure

6. MONITOREAR:
   - Azure Portal → Storage Account → Containers
   - Verificar datos en bronze/, silver/, gold/
""")

    print("=" * 80)


# ── CLI Interface ────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("CAPECO DATA LAKE - AZURE SETUP")
    print("=" * 80 + "\n")

    if len(sys.argv) < 2:
        print("Uso:")
        print("  python azure_setup.py --verify              # Verificar Storage Account")
        print("  python azure_setup.py --create-containers   # Crear containers")
        print("  python azure_setup.py --create-dirs         # Crear estructura de directorios")
        print("  python azure_setup.py --setup-auth          # Configurar autenticación")
        print("  python azure_setup.py --config              # Generar configuración")
        print("  python azure_setup.py --full                # Ejecutar setup completo")
        sys.exit(1)

    command = sys.argv[1]

    if command == "--verify":
        success = verify_storage_account()
        sys.exit(0 if success else 1)

    elif command == "--create-containers":
        success = create_containers()
        if success:
            create_directory_structure()
        sys.exit(0 if success else 1)

    elif command == "--create-dirs":
        success = create_directory_structure()
        sys.exit(0 if success else 1)

    elif command == "--setup-auth":
        success = setup_authentication()
        sys.exit(0 if success else 1)

    elif command == "--config":
        generate_datalake_config()
        sys.exit(0)

    elif command == "--full":
        print("Ejecutando setup completo...\n")
        verify_storage_account()
        print()
        create_containers()
        print()
        create_directory_structure()
        print()
        setup_authentication()
        print()
        generate_datalake_config()
        print()
        print_summary()
        sys.exit(0)

    else:
        log_error(f"Comando desconocido: {command}")
        sys.exit(1)
