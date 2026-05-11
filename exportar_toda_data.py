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
        return "Terminado"
    elif "en planos" in d or "planos" in d:
        return "En Planos"
    else:
        return "No especificado"

print("Cargando bases...")
df_csv = pd.read_csv('Material datos/data-proyectos-immobiliarios.csv')
df_csv_clean = df_csv[df_csv['title'].notna()].copy()

df_xl = pd.read_excel('Material datos/data2025Q4.xlsx', sheet_name='data2025Q4')
df_xl_clean = df_xl[df_xl['NOMBRE_PROYECTO'].notna()].copy()
xl_names = set(df_xl_clean['NOMBRE_PROYECTO'].unique())
norm_xl = {norm(x): x for x in xl_names if norm(x)}
remaining_xl_keys = list(norm_xl.keys())

# Determinar qué proyectos de CSV faltan en Q4
csv_projects_status = {}  # original_title -> is_missing (bool)

for title in df_csv_clean['title'].unique():
    k = norm(title)
    if not k: continue
    
    # Exact Match
    if k in norm_xl:
        csv_projects_status[title] = False
        continue
    
    # Fuzzy Match
    best_match = process.extractOne(k, remaining_xl_keys, scorer=fuzz.token_set_ratio)
    if best_match and best_match[1] >= 85:
        csv_projects_status[title] = False
    else:
        csv_projects_status[title] = True

# Preparar la extraccion final de la data
project_models = {}
for idx, row in df_csv_clean.iterrows():
    t = row['title']
    if pd.isna(t): continue
    if t not in project_models:
        project_models[t] = {'total_units': 0, 'models': []}
    
    payload_str = row['payload_jsonb'] if 'payload_jsonb' in row and pd.notna(row['payload_jsonb']) else "{}"
    try:
        payload = json.loads(payload_str)
    except:
        payload = {}
        
    modelo = payload.get('modelo', payload.get('tipo_modelo_label', 'Unidad'))
    area = payload.get('area_m2', row['area_m2'] if 'area_m2' in row and pd.notna(row['area_m2']) else 0)
    precio_num = payload.get('precio_amount', row['price_amount'] if 'price_amount' in row and pd.notna(row['price_amount']) else 0)
    moneda = payload.get('precio_currency', 'S/')
    unidades = payload.get('unidades_disponibles', row['units_available'] if 'units_available' in row and pd.notna(row['units_available']) else 0)
    
    # Manejar nulos en unidades
    if pd.isna(unidades) or unidades == 'null': unidades = 0
    else:
        try: unidades = int(unidades)
        except: unidades = 0

    # Evitar duplicados exactos en modelos
    model_str = f"{modelo}-{area}-{precio_num}"
    if not any(f"{m['modelo']}-{m['area_m2']}-{m['raw_price']}" == model_str for m in project_models[t]['models']):
        project_models[t]['total_units'] += unidades
        project_models[t]['models'].append({
            'modelo': modelo,
            'area_m2': area,
            'precio_string': f"{moneda} {precio_num:,.0f}" if precio_num > 0 else "Consultar",
            'unidades_disponibles': unidades,
            'raw_price': precio_num
        })

df_csv_clean.drop_duplicates(subset=['title'], inplace=True)
export_data = []

for idx, row in df_csv_clean.iterrows():
    lat = row['latitude']
    lon = row['longitude']
    
    # Manejar nulos en lat/lon
    if pd.isna(lat) or pd.isna(lon) or math.isnan(lat) or math.isnan(lon):
        continue

    t = row['title']
    desc = row['description'] if 'description' in row and pd.notna(row['description']) else ""
    features = row['features'] if 'features' in row and pd.notna(row['features']) else ""
    
    precio = float(row['price_amount']) if 'price_amount' in row and pd.notna(row['price_amount']) else 0
    moneda = row['price_currency'] if 'price_currency' in row and pd.notna(row['price_currency']) else "S/"
    
    area = float(row['area_m2']) if 'area_m2' in row and pd.notna(row['area_m2']) else 0
    rooms = int(row['num_rooms']) if 'num_rooms' in row and pd.notna(row['num_rooms']) else 0
    
    distrito = row['distrito'] if 'distrito' in row and pd.notna(row['distrito']) else "Lima"
    url = row['url'] if 'url' in row and pd.notna(row['url']) else "#"

    is_missing = csv_projects_status.get(t, True)
    
    # Obtener modelos y unidades agrupadas
    pm = project_models.get(t, {'total_units': 0, 'models': []})

    export_data.append({
        "title": t,
        "distrito": distrito,
        "latitude": float(lat),
        "longitude": float(lon),
        "status": infer_status(desc),
        "features": features,
        "price_value": precio,
        "price_string": f"{moneda} {precio:,.0f}" if precio > 0 else "Consultar",
        "area_m2": area,
        "rooms": rooms,
        "description": desc[:200] + "..." if len(desc) > 200 else desc,
        "url": url,
        "is_missing": is_missing,
        "total_units": pm['total_units'],
        "models": pm['models']
    })

out_path = "Dashboard Faltantes/all_projects.json"
with open(out_path, "w", encoding='utf-8') as f:
    json.dump(export_data, f, ensure_ascii=False, indent=4)

print(f"Éxito! Exportados {len(export_data)} proyectos a {out_path}.")
