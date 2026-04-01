import pandas as pd
import re

def norm(t):
    return re.sub(r'[^A-Z0-9]', '', str(t).upper())

try:
    df_csv = pd.read_csv('Material datos/data-proyectos-immobiliarios.csv')
    csv_names = set(df_csv['title'].dropna().unique())
    norm_csv = {norm(x): x for x in csv_names if norm(x)}
except Exception as e:
    print(f"Error csv: {e}")
    exit(1)

try:
    df_xl = pd.read_excel('Material datos/data2025Q4.xlsx', sheet_name='data2025Q4')
    xl_names = set(df_xl['NOMBRE_PROYECTO'].dropna().unique())
    norm_xl = {norm(x): x for x in xl_names if norm(x)}
except Exception as e:
    print(f"Error xl: {e}")
    exit(1)

only_csv_keys = set(norm_csv.keys()) - set(norm_xl.keys())
only_xl_keys = set(norm_xl.keys()) - set(norm_csv.keys())
common_keys = set(norm_csv.keys()) & set(norm_xl.keys())

only_csv = sorted([norm_csv[k] for k in only_csv_keys])
only_xl = sorted([norm_xl[k] for k in only_xl_keys])

with open("reporte_correlacion.md", "w") as f:
    f.write("# Correlación de Proyectos Inmobiliarios\n\n")
    f.write(f"- Proyectos únicos en **CSV (Scraping)**: {len(norm_csv)}\n")
    f.write(f"- Proyectos únicos en **Excel (Q4 2025)**: {len(norm_xl)}\n")
    f.write(f"- Proyectos en **Común**: {len(common_keys)}\n\n")
    
    f.write("## Proyectos SOLO en CSV (Faltan en Excel)\n")
    f.write(f"Total: {len(only_csv)}\n\n")
    for p in only_csv:
        f.write(f"- {p}\n")
        
    f.write("\n## Proyectos SOLO en Excel (Faltan en CSV)\n")
    f.write(f"Total: {len(only_xl)}\n\n")
    for p in only_xl:
        f.write(f"- {p}\n")

print("Reporte generado en reporte_correlacion.md")
