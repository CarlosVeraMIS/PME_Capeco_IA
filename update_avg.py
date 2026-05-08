import json
import pandas as pd

with open('Dashboard Faltantes/all_projects.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for proj in data:
    total_price = 0
    total_area = 0
    
    if 'models' in proj and len(proj['models']) > 0:
        for m in proj['models']:
            raw_p = m.get('raw_price', 0)
            a_m2 = m.get('area_m2', 0)
            if raw_p > 0 and a_m2 > 0:
                total_price += raw_p
                total_area += a_m2
    else:
        raw_p = proj.get('price_value', 0)
        a_m2 = proj.get('area_m2', 0)
        if raw_p > 0 and a_m2 > 0:
            total_price += raw_p
            total_area += a_m2

    if total_area > 0:
        avg_m2 = total_price / total_area
        proj['avg_price_m2'] = avg_m2
    else:
        proj['avg_price_m2'] = 0

with open('Dashboard Faltantes/all_projects.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)
print("Updated all_projects.json with avg_price_m2")
