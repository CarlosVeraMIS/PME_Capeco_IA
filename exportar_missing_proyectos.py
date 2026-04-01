import pandas as pd
import re
import json
import math
from thefuzz import fuzz
from thefuzz import process

def norm(t):
    return re.sub(r'[^A-Z0-9\s]', '', str(t).upper()).strip()

def infer_status(desc):
    if pd.isna(desc): return "Sin Información"
    d = str(desc).lower()
    if "pre venta" in d or "preventa" in d or "en lanzamiento" in d:
        return "Pre Venta"
    elif "en construcción" in d or "en construccion" in d or "construyéndose" in d or "avance de obra" in d:
        return "En Construcción"
    elif "terminado" in d or "entrega inmediata" in d or "listo para entregar" in d:
        return "Terminado / Entrega Inmediata"
    elif "en planos" in d or "planos" in d:
        return "En Planos"
    else:
        return "Estado no especificado"

print("Cargando datos para extracción...")
df_csv = pd.read_csv('Material datos/data-proyectos-immobiliarios.csv')
df_csv_clean = df_csv[df_csv['title'].notna()].copy()
csv_names = set(df_csv_clean['title'].unique())
norm_csv = {norm(x): x for x in csv_names if norm(x)}

df_xl = pd.read_excel('Material datos/data2025Q4.xlsx', sheet_name='data2025Q4')
df_xl_clean = df_xl[df_xl['NOMBRE_PROYECTO'].notna()].copy()
xl_names = set(df_xl_clean['NOMBRE_PROYECTO'].unique())
norm_xl = {norm(x): x for x in xl_names if norm(x)}

exact_matches = set(norm_csv.keys()) & set(norm_xl.keys())
remaining_csv = {k: v for k, v in norm_csv.items() if k not in xl_names and k not in exact_matches}
remaining_xl = {k: v for k, v in norm_xl.items() if k not in exact_matches}
remaining_xl_keys = list(remaining_xl.keys())

# Lógica Difusa
fuzzy_matches = []
for k, v in remaining_csv.items():
    best_match = process.extractOne(k, remaining_xl_keys, scorer=fuzz.token_set_ratio)
    if best_match and best_match[1] >= 85:
        fuzzy_matches.append((v, remaining_xl[best_match[0]], best_match[1]))

matched_csv_fuzzy = {x[0] for x in fuzzy_matches}

# Missing in Excel (Solo en CSV)
missing_in_xl = []
for k, v in norm_csv.items():
    if k not in exact_matches and v not in matched_csv_fuzzy:
        missing_in_xl.append(v)

print(f"Total de proyectos faltantes a extraer: {len(missing_in_xl)}")

# Extracción de Data Rica de esos proyectos
filtered_df = df_csv_clean[df_csv_clean['title'].isin(missing_in_xl)].copy()

# Eliminar duplicados si los hubiera (basándonos en título y lat/lon para consolidar)
filtered_df.drop_duplicates(subset=['title'], inplace=True)

export_data = []

for idx, row in filtered_df.iterrows():
    lat = row['latitude']
    lon = row['longitude']
    
    # Manejar nulos en lat/lon si existieran
    if pd.isna(lat) or pd.isna(lon) or math.isnan(lat) or math.isnan(lon):
        # Fallback a Centro de Lima u omitir
        continue

    desc = row['description'] if 'description' in row and pd.notna(row['description']) else ""
    features = row['features'] if 'features' in row and pd.notna(row['features']) else "No features listed"
    
    precio = row['price_amount'] if 'price_amount' in row and pd.notna(row['price_amount']) else None
    moneda = row['price_currency'] if 'price_currency' in row and pd.notna(row['price_currency']) else "S/"
    
    status = infer_status(desc)
    
    distrito = row['distrito'] if 'distrito' in row and pd.notna(row['distrito']) else "Lima"
    url = row['url'] if 'url' in row and pd.notna(row['url']) else "#"

    export_data.append({
        "title": row['title'],
        "distrito": distrito,
        "latitude": lat,
        "longitude": lon,
        "status": status,
        "features": features,
        "price": f"{moneda} {precio:,.0f}" if precio else "Consultar Precio",
        "description": desc[:300] + "..." if len(desc) > 300 else desc,
        "url": url
    })

# Guardar en archivo
out_path = "Dashboard Faltantes/missing_projects.json"
with open(out_path, "w", encoding='utf-8') as f:
    json.dump(export_data, f, ensure_ascii=False, indent=4)

print(f"Exportados {len(export_data)} proyectos a {out_path} para el dashboard.")
