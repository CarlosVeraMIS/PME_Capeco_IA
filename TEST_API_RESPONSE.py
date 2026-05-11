#!/usr/bin/env python3
"""
Script para probar la respuesta del API localmente
Muestra exactamente qué campos están siendo retornados
"""

import pandas as pd
import pyarrow.parquet as pq
from pathlib import Path
import json

# Cargar datos directamente desde Parquet
data_dir = Path('gold_data')
parquet_files = sorted(
    data_dir.glob('fact_capeco_certified*.parquet'),
    key=lambda x: x.stat().st_mtime,
    reverse=True
)

if not parquet_files:
    print("❌ No se encontró archivo Parquet")
    exit(1)

print(f"📂 Cargando: {parquet_files[0].name}")
df = pq.read_table(str(parquet_files[0])).to_pandas()

print(f"\n📊 Total de proyectos: {len(df)}")
print(f"📋 Columnas disponibles: {df.columns.tolist()}")

# Filtrar San Isidro como hace el frontend
san_isidro = df[df['DISTRITO'] == 'SAN ISIDRO'].copy()
print(f"\n🏢 San Isidro: {len(san_isidro)} proyectos")

# Aplicar el mismo mapeo que hace el API
san_isidro['price_per_m2'] = san_isidro['PRECIO_X_M2'].fillna(0)
san_isidro['price_amount'] = san_isidro['PRECIO_SOLES'].fillna(0)
san_isidro['absorption_rate_pct'] = san_isidro['PCT_AVANCE'].fillna(0)
san_isidro['title'] = san_isidro['NOMBRE DEL PROYECTO']
san_isidro['project_id'] = san_isidro['COD_PROYECTO']
san_isidro['district'] = san_isidro['DISTRITO']
san_isidro['area_m2'] = san_isidro['AREA_CONSTRUCCION'].fillna(0)
san_isidro['currency'] = 'PEN'

# Seleccionar columnas como hace el API
output_columns = [
    'project_id', 'title', 'district', 'price_amount', 'price_per_m2',
    'area_m2', 'absorption_rate_pct', 'market_tier', 'currency',
    'construction_phase', 'NRO_UNIDADES', 'NRO_DORMITORIOS',
    'NOMBRE DEL CONSTRUCTOR', 'TIPO_DE_OBRA'
]

output_columns = [c for c in output_columns if c in san_isidro.columns]
san_isidro_filtered = san_isidro[output_columns]

# Ordenar por precio descendente
san_isidro_filtered = san_isidro_filtered.sort_values(by='price_per_m2', ascending=False)

# Obtener primeros 5
top_5 = san_isidro_filtered.head(5)

print("\n" + "="*80)
print("📋 PRIMEROS 5 PROYECTOS CON MAPEO DE API")
print("="*80)

for idx, (_, row) in enumerate(top_5.iterrows(), 1):
    print(f"\n[{idx}] {row['title']}")
    print(f"    ID: {row['project_id']}")
    print(f"    Distrito: {row['district']}")
    print(f"    Precio Total: S/. {row['price_amount']:,.0f}")
    print(f"    Precio/m²: S/. {row['price_per_m2']:,.2f}")
    print(f"    Área: {row['area_m2']:,.0f} m²")
    print(f"    Absorción: {row['absorption_rate_pct']:.1f}%")
    print(f"    Unidades: {row['NRO_UNIDADES']}")
    print(f"    Dormitorios: {row['NRO_DORMITORIOS']}")

# Estadísticas
print("\n" + "="*80)
print("📊 ESTADÍSTICAS DE CAMPOS")
print("="*80)

print(f"\n✓ price_amount (PRECIO_SOLES):")
print(f"  - Con valores: {len(san_isidro_filtered[san_isidro_filtered['price_amount'] > 0])}")
print(f"  - En cero: {len(san_isidro_filtered[san_isidro_filtered['price_amount'] == 0])}")
print(f"  - Promedio: S/. {san_isidro_filtered['price_amount'].mean():,.0f}")
print(f"  - Rango: S/. {san_isidro_filtered[san_isidro_filtered['price_amount'] > 0]['price_amount'].min():,.0f} — S/. {san_isidro_filtered['price_amount'].max():,.0f}")

print(f"\n✓ price_per_m2 (PRECIO_X_M2):")
print(f"  - Con valores: {len(san_isidro_filtered[san_isidro_filtered['price_per_m2'] > 0])}")
print(f"  - En cero: {len(san_isidro_filtered[san_isidro_filtered['price_per_m2'] == 0])}")
print(f"  - Promedio: S/. {san_isidro_filtered['price_per_m2'].mean():,.2f}")

print(f"\n✓ area_m2 (AREA_CONSTRUCCION):")
print(f"  - Con valores: {len(san_isidro_filtered[san_isidro_filtered['area_m2'] > 0])}")
print(f"  - En cero: {len(san_isidro_filtered[san_isidro_filtered['area_m2'] == 0])}")

print(f"\n✓ NRO_UNIDADES:")
print(f"  - Con valores: {len(san_isidro_filtered[san_isidro_filtered['NRO_UNIDADES'].notna()])}")
print(f"  - En cero: {len(san_isidro_filtered[san_isidro_filtered['NRO_UNIDADES'] == 0])}")
print(f"  - Vacías: {san_isidro_filtered['NRO_UNIDADES'].isna().sum()}")

# JSON de ejemplo
print("\n" + "="*80)
print("📌 JSON DE RESPUESTA DEL API (Ejemplo)")
print("="*80)
example_record = san_isidro_filtered.iloc[0].to_dict()

# Limpiar NaN
for key, value in example_record.items():
    if pd.isna(value):
        example_record[key] = None
    elif key in ['price_amount', 'price_per_m2']:
        example_record[key] = float(value) if value else 0.0

print(json.dumps(example_record, indent=2, ensure_ascii=False, default=str))

print("\n" + "="*80)
print("✅ VALIDACIÓN COMPLETADA")
print("="*80)
