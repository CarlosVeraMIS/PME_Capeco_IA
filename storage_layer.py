"""
STORAGE LAYER — CAPECO
======================
Abstracción de almacenamiento para soportar local filesystem y Azure Data Lake Gen2

Propósito:
  - Proporciona interfaz unificada para lectura/escritura de archivos
  - Soporta múltiples backends: local filesystem (desarrollo) y Azure ADLS Gen2 (producción)
  - Permite cambiar backends sin modificar el código del pipeline
"""

import os
from pathlib import Path
from typing import Optional, Union
import pandas as pd
import pyarrow.parquet as pq
from datetime import datetime


class StorageBackend:
    """Interfaz base para backends de almacenamiento"""

    def read_parquet(self, path: str) -> pd.DataFrame:
        raise NotImplementedError

    def write_parquet(self, df: pd.DataFrame, path: str) -> bool:
        raise NotImplementedError

    def exists(self, path: str) -> bool:
        raise NotImplementedError

    def list_files(self, directory: str, pattern: str = "*") -> list:
        raise NotImplementedError


class LocalStorageBackend(StorageBackend):
    """Backend para almacenamiento local (desarrollo)"""

    def read_parquet(self, path: str) -> pd.DataFrame:
        """Lee archivo Parquet local"""
        try:
            return pq.read_table(path).to_pandas()
        except Exception as e:
            raise Exception(f"Error leyendo Parquet local {path}: {e}")

    def write_parquet(self, df: pd.DataFrame, path: str) -> bool:
        """Escribe archivo Parquet local"""
        try:
            # Crear directorio si no existe
            Path(path).parent.mkdir(parents=True, exist_ok=True)

            # Escribir con PyArrow
            table = pq.Table.from_pandas(df)
            pq.write_table(table, path)
            return True
        except Exception as e:
            raise Exception(f"Error escribiendo Parquet local {path}: {e}")

    def exists(self, path: str) -> bool:
        """Verifica si archivo existe"""
        return Path(path).exists()

    def list_files(self, directory: str, pattern: str = "*") -> list:
        """Lista archivos en directorio"""
        try:
            path = Path(directory)
            if not path.exists():
                return []
            files = sorted(
                path.glob(f"{pattern}.parquet"),
                key=lambda x: x.stat().st_mtime,
                reverse=True
            )
            return [str(f) for f in files]
        except Exception as e:
            raise Exception(f"Error listando archivos en {directory}: {e}")


class AzureStorageBackend(StorageBackend):
    """Backend para Azure Data Lake Storage Gen2 (producción)"""

    def __init__(self, storage_account: str, file_system: str, credential=None):
        """
        Inicializa conexión con Azure Data Lake Gen2

        Args:
            storage_account: Nombre de la storage account (ej: capecovalencia)
            file_system: Nombre del container (ej: gold-layer)
            credential: Objeto de credencial Azure (DefaultAzureCredential o similar)
        """
        self.storage_account = storage_account
        self.file_system = file_system
        self.credential = credential

        try:
            from azure.storage.filedatalake import DataLakeServiceClient
            from azure.identity import DefaultAzureCredential

            if not credential:
                credential = DefaultAzureCredential()

            account_url = f"https://{storage_account}.dfs.core.windows.net"
            self.client = DataLakeServiceClient(account_url=account_url, credential=credential)
            self.fs_client = self.client.get_file_system_client(file_system)

        except ImportError:
            raise Exception("Azure SDK no instalado. Ejecuta: pip install azure-storage-file-datalake azure-identity")
        except Exception as e:
            raise Exception(f"Error conectando a Azure: {e}")

    def read_parquet(self, path: str) -> pd.DataFrame:
        """Lee archivo Parquet de Azure"""
        try:
            import io

            # path es relativo al container
            file_client = self.fs_client.get_file_client(path)
            download = file_client.download_file()
            buffer = io.BytesIO()

            for chunk in download.chunks():
                buffer.write(chunk)

            buffer.seek(0)
            return pq.read_table(buffer).to_pandas()

        except Exception as e:
            raise Exception(f"Error leyendo Parquet de Azure {path}: {e}")

    def write_parquet(self, df: pd.DataFrame, path: str) -> bool:
        """Escribe archivo Parquet a Azure"""
        try:
            import io

            # Convertir DataFrame a bytes
            buffer = io.BytesIO()
            table = pq.Table.from_pandas(df)
            pq.write_table(table, buffer)
            buffer.seek(0)

            # Subir a Azure
            file_client = self.fs_client.get_file_client(path)
            file_client.upload_file(buffer.getvalue(), overwrite=True)
            return True

        except Exception as e:
            raise Exception(f"Error escribiendo Parquet a Azure {path}: {e}")

    def exists(self, path: str) -> bool:
        """Verifica si archivo existe en Azure"""
        try:
            file_client = self.fs_client.get_file_client(path)
            return file_client.exists()
        except Exception as e:
            return False

    def list_files(self, directory: str, pattern: str = "*") -> list:
        """Lista archivos en directorio de Azure"""
        try:
            paths = self.fs_client.get_paths(recursive=True, path_prefix=directory)
            files = [p.name for p in paths if pattern in p.name and p.name.endswith(".parquet")]
            return sorted(files, reverse=True)
        except Exception as e:
            raise Exception(f"Error listando archivos en Azure {directory}: {e}")


class StorageManager:
    """Gestor centralizado de almacenamiento"""

    def __init__(self, mode: str = "local", **kwargs):
        """
        Inicializa Storage Manager

        Args:
            mode: "local" o "azure"
            **kwargs: Argumentos específicos del backend
                - Para local: ninguno requerido
                - Para azure: storage_account, file_system, credential (opcional)
        """
        self.mode = mode

        if mode == "local":
            self.backend = LocalStorageBackend()

        elif mode == "azure":
            required = ["storage_account", "file_system"]
            for req in required:
                if req not in kwargs:
                    raise ValueError(f"Parámetro requerido para Azure: {req}")

            credential = kwargs.get("credential", None)
            self.backend = AzureStorageBackend(
                storage_account=kwargs["storage_account"],
                file_system=kwargs["file_system"],
                credential=credential
            )

        else:
            raise ValueError(f"Modo de almacenamiento desconocido: {mode}")

    def read_parquet(self, path: str) -> pd.DataFrame:
        """Lee archivo Parquet"""
        return self.backend.read_parquet(path)

    def write_parquet(self, df: pd.DataFrame, path: str) -> bool:
        """Escribe archivo Parquet"""
        return self.backend.write_parquet(df, path)

    def exists(self, path: str) -> bool:
        """Verifica si archivo existe"""
        return self.backend.exists(path)

    def list_files(self, directory: str, pattern: str = "*") -> list:
        """Lista archivos en directorio"""
        return self.backend.list_files(directory, pattern)


# ── Factory functions para crear managers ────────────────────────────────
def create_local_storage() -> StorageManager:
    """Crea Storage Manager para almacenamiento local"""
    return StorageManager(mode="local")


def create_azure_storage(
    storage_account: str,
    file_system: str,
    credential=None
) -> StorageManager:
    """Crea Storage Manager para Azure Data Lake Gen2"""
    return StorageManager(
        mode="azure",
        storage_account=storage_account,
        file_system=file_system,
        credential=credential
    )
