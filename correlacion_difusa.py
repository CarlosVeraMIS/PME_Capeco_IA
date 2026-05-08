import pandas as pd
import re
import json
from thefuzz import fuzz
from thefuzz import process

def norm(t):
    return re.sub(r'[^A-Z0-9\s]', '', str(t).upper()).strip()

print("Cargando datos...")
try:
    df_csv = pd.read_csv('Material datos/data-proyectos-immobiliarios.csv')
    # Filter empty or nan
    df_csv = df_csv[df_csv['title'].notna()]
    csv_names = set(df_csv['title'].unique())
    # Dictionary mapping normalized name -> original name
    norm_csv = {norm(x): x for x in csv_names if norm(x)}
except Exception as e:
    print(f"Error csv: {e}")
    exit(1)

try:
    df_xl = pd.read_excel('Material datos/data2025Q4.xlsx', sheet_name='data2025Q4')
    df_xl = df_xl[df_xl['NOMBRE_PROYECTO'].notna()]
    xl_names = set(df_xl['NOMBRE_PROYECTO'].unique())
    norm_xl = {norm(x): x for x in xl_names if norm(x)}
except Exception as e:
    print(f"Error xl: {e}")
    exit(1)

print(f"Bases cargadas: CSV={len(norm_csv)} únicos, Excel={len(norm_xl)} únicos")

# Fuzzy Matching
THRESHOLD = 85

# Exact matches
exact_matches = set(norm_csv.keys()) & set(norm_xl.keys())
print(f"Coincidencias exactas: {len(exact_matches)}")

# Remove exact matches to process the rest
remaining_csv = {k: v for k, v in norm_csv.items() if k not in xl_names and k not in exact_matches}
remaining_xl = {k: v for k, v in norm_xl.items() if k not in exact_matches}
remaining_xl_keys = list(remaining_xl.keys())

fuzzy_matches = []

num_to_process = len(remaining_csv)
print(f"Procesando {num_to_process} proyectos del CSV mediante lógica difusa...")

for i, (csv_key, csv_orig) in enumerate(remaining_csv.items()):
    if i % 50 == 0 and i > 0:
         print(f"Procesados {i}/{num_to_process}...")
    
    # Use token_set_ratio which handles missing words ("Albamar | Arenales" vs "Arenales") well
    best_match = process.extractOne(
        csv_key, 
        remaining_xl_keys, 
        scorer=fuzz.token_set_ratio
    )
    
    if best_match and best_match[1] >= THRESHOLD:
        xl_key = best_match[0]
        score = best_match[1]
        xl_orig = remaining_xl[xl_key]
        fuzzy_matches.append((csv_orig, xl_orig, score))
        # Remove from remaining_xl so we don't match it again (optional, depending on 1-to-N relationships)
        # We will allow multiple CSVs to map to same XL just in case, or vice versa, but we'll flag it.
        # remaining_xl_keys.remove(xl_key)

print(f"Coincidencias difusas encontradas: {len(fuzzy_matches)}")

# Calculates final sets
# CSV missing = All csv MINUS exact MINUS fuzzy
matched_csv_fuzzy = {x[0] for x in fuzzy_matches}
matched_xl_fuzzy = {x[1] for x in fuzzy_matches}

missing_csv = []
for k, v in norm_csv.items():
    if k not in exact_matches and v not in matched_csv_fuzzy:
        missing_csv.append(v)
        
missing_xl = []
for k, v in norm_xl.items():
    if k not in exact_matches and v not in matched_xl_fuzzy:
        missing_xl.append(v)

missing_csv.sort()
missing_xl.sort()

# Escribir reporte
print("Generando reporte...")
with open("reporte_correlacion_difusa.md", "w") as f:
    f.write("# Correlación de Proyectos (Lógica Difusa)\n\n")
    f.write(f"- Proyectos únicos en **CSV (Scraping)**: {len(norm_csv)}\n")
    f.write(f"- Proyectos únicos en **Excel (Q4 2025)**: {len(norm_xl)}\n")
    f.write(f"- Coincidencias Exactas: {len(exact_matches)}\n")
    f.write(f"- Coincidencias Difusas (score >= {THRESHOLD}): {len(fuzzy_matches)}\n")
    f.write(f"- Total Coincidencias: {len(exact_matches) + len(fuzzy_matches)}\n\n")
    
    f.write(f"## Proyectos SOLO en CSV (Faltan en Excel)\n")
    f.write(f"Total: {len(missing_csv)}\n\n")
    for p in missing_csv:
        f.write(f"- {p}\n")
        
    f.write(f"\n## Proyectos SOLO en Excel (Faltan en CSV)\n")
    f.write(f"Total: {len(missing_xl)}\n\n")
    for p in missing_xl:
        f.write(f"- {p}\n")

    f.write(f"\n## Anexo: Coincidencias Difusas Encontradas\n\n| CSV Original | Excel Original | Similitud |\n|---|---|---|\n")
    # sort by descending score
    fuzzy_matches.sort(key=lambda x: x[2], reverse=True)
    for fm in fuzzy_matches:
        f.write(f"| {fm[0]} | {fm[1]} | {fm[2]}% |\n")

print("Reporte generado con exito en reporte_correlacion_difusa.md")
