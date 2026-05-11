import json
import pandas as pd

with open('Dashboard Faltantes/all_projects.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

df = pd.read_csv('Material datos/data-proyectos-immobiliarios.csv')

project_models = {}
for idx, row in df.iterrows():
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
    moneda = payload.get('precio_currency')
    if not moneda:
        raw_text = payload.get('raw', '')
        if '$' in raw_text or 'US$' in raw_text:
            moneda = '$'
        else:
            moneda = 'S/'

    unidades = payload.get('unidades_disponibles', row['units_available'] if 'units_available' in row and pd.notna(row['units_available']) else 0)
    
    if pd.isna(unidades) or unidades == 'null': unidades = 0
    else:
        try: unidades = int(float(unidades))
        except: unidades = 0

    model_str = f"{modelo}-{area}-{precio_num}"
    if not any(f"{m['modelo']}-{m['area_m2']}-{m['raw_price']}" == model_str for m in project_models[t]['models']):
        project_models[t]['total_units'] += unidades
        project_models[t]['models'].append({
            'modelo': modelo,
            'area_m2': area,
            'precio_string': f"{moneda} {precio_num:,.0f}" if precio_num > 0 else "Consultar",
            'unidades_disponibles': unidades,
            'raw_price': float(precio_num) if pd.notna(precio_num) else 0,
            'moneda': moneda
        })

for proj in data:
    t = proj['title']
    pm = project_models.get(t, {'total_units': 0, 'models': []})
    proj['total_units'] = pm['total_units']
    proj['models'] = pm['models']
    
    # Update project-level currency using the first model if price_string is 'Consultar'
    if proj.get('price_string') == 'Consultar' and len(pm['models']) > 0:
        first_mon = pm['models'][0]['moneda']
        # Instead of replacing "Consultar" entirely, let's keep it but store property
        proj['project_currency'] = first_mon
    elif proj.get('price_string') and proj.get('price_string') != 'Consultar':
        proj['project_currency'] = '$' if '$' in proj['price_string'] else 'S/'
    else:
        proj['project_currency'] = 'S/'

with open('Dashboard Faltantes/all_projects.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)
print("Updated all_projects.json with models and total_units")
