"""
pme_db_windows.py
Conexion segura a Azure MySQL desde Windows
Sin necesidad de descargar el certificado DigiCert manualmente.

Ejecutar:
    python pme_db_windows.py --test
    python pme_db_windows.py --query
    python pme_db_windows.py --export
    python pme_db_windows.py --all
"""

import mysql.connector
import json
import sys
from decimal import Decimal
from datetime import datetime, date

# ── Conexion — SSL habilitado usando CA del sistema Windows ──────────────────
DB_CONFIG = {
    "host":               "millennialprod.mysql.database.azure.com",
    "port":               3306,
    "user":               "azuremillennial",
    "password":           "x1_72TCSipc=",
    "database":           "db_capeco",
    "ssl_disabled":       False,   # cifrado activo
    "ssl_verify_cert":    False,   # no exige cert local en disco
    "ssl_verify_identity":False,   # compatible con Windows sin bundle
    "connect_timeout":    20,
    "autocommit":         True,
}

# ── Serializer JSON ──────────────────────────────────────────────────────────
def serial(obj):
    if isinstance(obj, Decimal): return float(obj)
    if isinstance(obj, (datetime, date)): return obj.isoformat()
    if obj is None: return None
    raise TypeError(type(obj))

# ── Conexion ─────────────────────────────────────────────────────────────────
def conn():
    return mysql.connector.connect(**DB_CONFIG)

# ── TEST ─────────────────────────────────────────────────────────────────────
def test_connection():
    c = conn()
    cur = c.cursor()

    cur.execute("SELECT VERSION()")
    print(f"✓ MySQL version: {cur.fetchone()[0]}")

    cur.execute("SHOW STATUS LIKE 'Ssl_cipher'")
    r = cur.fetchone()
    print(f"✓ SSL cipher: {r[1] if r and r[1] else 'none (revisar)'}")

    cur.execute("SHOW TABLES")
    tables = [r[0] for r in cur.fetchall()]
    print(f"\n✓ Tablas ({len(tables)}):")
    for t in tables:
        cur.execute(f"SELECT COUNT(*) FROM `{t}`")
        n = cur.fetchone()[0]
        print(f"   {t:<35} {n:>10,} filas")

    cur.execute("DESCRIBE data_capeco_full")
    cols = cur.fetchall()
    print(f"\n✓ Columnas en data_capeco_full: {len(cols)}")
    for col in cols:
        print(f"   {col[0]:<40} {col[1]}")

    cur.close(); c.close()

# ── VALIDATION QUERIES ────────────────────────────────────────────────────────
def run_queries():
    c = conn()
    cur = c.cursor(dictionary=True)

    # 1. Overview general
    cur.execute("""
        SELECT
            COUNT(*)                                AS total_registros,
            MIN(ANIO)                               AS anio_min,
            MAX(ANIO)                               AS anio_max,
            COUNT(DISTINCT ANIO)                    AS total_anios,
            COUNT(DISTINCT DISTRITO)                AS total_distritos,
            COUNT(DISTINCT `NOMBRE PROPIETARIO`)    AS total_propietarios
        FROM data_capeco_full
    """)
    o = cur.fetchone()
    print("\n=== OVERVIEW GENERAL ===")
    print(f"  Total registros:      {o['total_registros']:>12,}")
    print(f"  Años cubiertos:       {o['anio_min']} – {o['anio_max']}  ({o['total_anios']} años)")
    print(f"  Distritos únicos:     {o['total_distritos']}")
    print(f"  Propietarios únicos:  {o['total_propietarios']:,}")

    # 2. Por año
    cur.execute("""
        SELECT ANIO,
               COUNT(*)                                                   AS registros,
               COUNT(DISTINCT DISTRITO)                                   AS distritos,
               ROUND(AVG(PRECIO_X_M2), 0)                               AS precio_m2_avg,
               ROUND(AVG((UNIDADES_A/NULLIF(NRO_UNIDADES,0))*100), 1)  AS absorcion_pct
        FROM data_capeco_full
        GROUP BY ANIO ORDER BY ANIO DESC LIMIT 10
    """)
    print("\n=== POR AÑO ===")
    print(f"  {'AÑO':<6} {'REGISTROS':>10} {'DISTRITOS':>10} {'PRECIO M2':>12} {'ABSORCIÓN':>10}")
    for r in cur.fetchall():
        print(f"  {r['ANIO']:<6} {r['registros']:>10,} {r['distritos']:>10} "
              f"  S/{r['precio_m2_avg']:>8,.0f} {r['absorcion_pct']:>9.1f}%")

    # 3. Distritos 2025
    cur.execute("""
        SELECT DISTRITO, COUNT(*) AS registros,
               ROUND(AVG(PRECIO_X_M2),0) AS precio_m2_avg
        FROM data_capeco_full
        WHERE ANIO = 2025
        GROUP BY DISTRITO ORDER BY registros DESC
    """)
    rows = cur.fetchall()
    print(f"\n=== DISTRITOS 2025 ({len(rows)} únicos) ===")
    for i, r in enumerate(rows, 1):
        print(f"  {i:>2}. {r['DISTRITO']:<35} {r['registros']:>6,} reg   S/{r['precio_m2_avg']:>7,.0f}/m²")

    # 4. Constructoras 2025
    cur.execute("""
        SELECT COUNT(DISTINCT `NOMBRE PROPIETARIO`) AS total
        FROM data_capeco_full
        WHERE ANIO=2025 AND `NOMBRE PROPIETARIO`<>''
    """)
    r = cur.fetchone()
    print(f"\n=== CONSTRUCTORAS ÚNICAS 2025 ===")
    print(f"  {r['total']:,} propietarios/constructoras distintos")

    # 5. Top 20 constructoras por valor
    cur.execute("""
        SELECT `NOMBRE PROPIETARIO` AS propietario,
               COUNT(*) AS registros,
               SUM(PRECIO_SOLES * NRO_UNIDADES) AS valor_total,
               ROUND(AVG(PRECIO_X_M2),0) AS precio_m2_avg
        FROM data_capeco_full
        WHERE ANIO=2025 AND `NOMBRE PROPIETARIO`<>''
        GROUP BY `NOMBRE PROPIETARIO`
        ORDER BY valor_total DESC LIMIT 20
    """)
    print("\n=== TOP 20 CONSTRUCTORAS POR VALOR (2025) ===")
    for r in cur.fetchall():
        v = r['valor_total'] or 0
        print(f"  {r['propietario'][:42]:<44} S/{v/1e9:>5.2f}B  {r['registros']:>5} reg")

    # 6. Absorción trimestral
    cur.execute("""
        SELECT ANIO, TRIM,
               ROUND(AVG((UNIDADES_A/NULLIF(NRO_UNIDADES,0))*100),2) AS absorcion,
               COUNT(*) AS n
        FROM data_capeco_full
        WHERE ANIO >= 2023
        GROUP BY ANIO, TRIM ORDER BY ANIO, TRIM
    """)
    print("\n=== ABSORCIÓN TRIMESTRAL ===")
    for r in cur.fetchall():
        print(f"  {r['ANIO']} Q{r['TRIM']}: {r['absorcion']:>5.1f}%  ({r['n']:,} reg)")

    # 7. Precio m2 por distrito 2025
    cur.execute("""
        SELECT DISTRITO,
               ROUND(AVG(PRECIO_X_M2),0) AS precio_avg,
               ROUND(MIN(PRECIO_X_M2),0) AS precio_min,
               ROUND(MAX(PRECIO_X_M2),0) AS precio_max,
               COUNT(*) AS registros
        FROM data_capeco_full
        WHERE ANIO=2025 AND PRECIO_X_M2>0
        GROUP BY DISTRITO ORDER BY precio_avg DESC
    """)
    print("\n=== PRECIO M2 POR DISTRITO 2025 ===")
    print(f"  {'DISTRITO':<35} {'AVG':>8} {'MIN':>8} {'MAX':>9} {'REG':>6}")
    for r in cur.fetchall():
        print(f"  {r['DISTRITO']:<35} "
              f"S/{r['precio_avg']:>6,.0f} "
              f"S/{r['precio_min']:>6,.0f} "
              f"S/{r['precio_max']:>7,.0f} "
              f"{r['registros']:>6,}")

    cur.close(); c.close()

# ── EXPORT dashboard_data.json ────────────────────────────────────────────────
def export_dashboard(output="dashboard_data_live.json"):
    c = conn()
    cur = c.cursor(dictionary=True)
    data = {}

    cur.execute("""
        SELECT SUM(PRECIO_SOLES*NRO_UNIDADES) AS total_market_value,
               AVG((UNIDADES_A/NULLIF(NRO_UNIDADES,0))*100) AS avg_absorption,
               COUNT(*) AS total_active_projects
        FROM data_capeco_full WHERE ANIO=2025
    """)
    data["summary"] = cur.fetchone()

    cur.execute("""
        SELECT CASE
            WHEN FASE IN ('Preventa','Excavacion','Cimentacion') THEN 'High Risk'
            WHEN FASE IN ('Estructura','Obra en casco','En construccion') THEN 'Medium Risk'
            WHEN FASE IN ('Acabados','Terminadas','Totalmente ocupada') THEN 'Low Risk'
            ELSE 'Under Review' END AS risk_level,
            SUM(PRECIO_SOLES*NRO_UNIDADES) AS value
        FROM data_capeco_full WHERE ANIO=2025 GROUP BY risk_level
    """)
    data["risk_by_phase"] = cur.fetchall()

    cur.execute("""
        SELECT `NOMBRE PROPIETARIO` AS developer, COUNT(*) AS projects,
               SUM(PRECIO_SOLES*NRO_UNIDADES) AS total_exposure_value
        FROM data_capeco_full
        WHERE ANIO=2025 AND `NOMBRE PROPIETARIO`<>''
        GROUP BY developer ORDER BY total_exposure_value DESC LIMIT 20
    """)
    data["top_developers"] = cur.fetchall()

    cur.execute("""
        SELECT ANIO, TRIM,
               AVG((UNIDADES_A/NULLIF(NRO_UNIDADES,0))*100) AS absorption
        FROM data_capeco_full WHERE ANIO>=2023
        GROUP BY ANIO, TRIM ORDER BY ANIO, TRIM
    """)
    data["liquidity_trend"] = cur.fetchall()

    cur.execute("""
        SELECT DISTRITO,
               ROUND(AVG(PRECIO_X_M2),2) AS precio_m2_avg,
               COUNT(*) AS registros
        FROM data_capeco_full
        WHERE ANIO=2025 AND PRECIO_X_M2>0
        GROUP BY DISTRITO ORDER BY precio_m2_avg DESC
    """)
    data["district_summary"] = cur.fetchall()

    cur.close(); c.close()

    with open(output, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False, default=serial)
    print(f"\n✓ Exportado: {output}")

# ── CLI ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "--test"

    if mode == "--test":
        test_connection()
    elif mode == "--query":
        run_queries()
    elif mode == "--export":
        out = sys.argv[2] if len(sys.argv) > 2 else "dashboard_data_live.json"
        export_dashboard(out)
    elif mode == "--all":
        print("── TEST ─────────────────────────────────────────────")
        test_connection()
        print("\n── QUERIES ──────────────────────────────────────────")
        run_queries()
        print("\n── EXPORTANDO ───────────────────────────────────────")
        export_dashboard()
    else:
        print("Uso: python pme_db_windows.py [--test | --query | --export | --all]")
