import pandas as pd
import json
import ast

def clean_money(val):
    if pd.isna(val): return 0
    s = str(val).replace('S/','').replace('$','').replace(',','').replace(' ','')
    try: return float(s)
    except: return 0

def get_total_units_and_avg(models_str):
    if pd.isna(models_str) or not isinstance(models_str, str): return 0, 0, []
    
    try:
        models = json.loads(models_str)
    except:
        try:
            models = ast.literal_eval(models_str)
        except:
            return 0, 0, []
            
    total = 0
    sum_price_m2 = 0
    count_valid = 0
    
    for m in models:
        u = m.get('unidades_disponibles', 0)
        total += u
        
        area = m.get('area_m2', 0)
        val = clean_money(m.get('precio_string', ''))
        if area > 0 and val > 0:
            sum_price_m2 += (val/area)
            count_valid += 1
            
    avg = (sum_price_m2 / count_valid) if count_valid > 0 else 0
    return total, avg, models

def main():
    print("Leyendo CSV original...")
    df = pd.read_csv('Material datos/data-proyectos-immobiliarios.csv')
    
    out = []
    for _, row in df.iterrows():
        total_u, m2_avg, mods = get_total_units_and_avg(row.get('models'))
        
        # Calculate naive fallback
        fallback_m2 = 0
        area = row.get('area_m2', 0)
        p_val = clean_money(row.get('price_string', ''))
        if area > 0 and p_val > 0:
            fallback_m2 = p_val / area
            
        final_m2 = m2_avg if m2_avg > 0 else fallback_m2
        
        # Determine currency
        p_str = str(row.get('price_string', ''))
        currency = '$' if '$' in p_str else 'S/'

        dist = str(row.get('distrito', '')).strip()

        item = {
            "title": str(row.get('title', '')),
            "description": str(row.get('description', '')),
            "latitude": float(row['latitude']) if not pd.isna(row.get('latitude')) else None,
            "longitude": float(row['longitude']) if not pd.isna(row.get('longitude')) else None,
            "distrito": dist if dist.lower() != 'nan' else 'No Especificado',
            "url": str(row.get('url', '')),
            "price_string": p_str,
            "price_value": p_val,
            "project_currency": currency,
            "area_m2": area,
            "rooms": int(row['rooms']) if not pd.isna(row.get('rooms')) else 0,
            "total_units": total_u,
            "avg_price_m2": final_m2,
            "models": mods
        }
        
        # Si tiene coordenadas válidas lo metemos
        if item['latitude'] and item['longitude']:
            out.append(item)
            
    print(f"Exportando {len(out)} proyectos a pme_data.json...")
    with open('Dashboard Faltantes/pme_data.json', 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print("¡Terminado!")

if __name__ == "__main__":
    main()
