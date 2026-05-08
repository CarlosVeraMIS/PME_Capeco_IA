"""
pme_db.py — Conexión segura a DB CAPECO en Azure MySQL
------------------------------------------------------
Uso:
    python pme_db.py                  # test de conexión + schema
    python pme_db.py --query          # ejecuta queries de validación
    python pme_db.py --export         # exporta dashboard_data.json
"""

import mysql.connector
import json
import sys
import os
import ssl
from decimal import Decimal
from datetime import datetime, date

# ── Configuración de conexión ────────────────────────────────────────────────
DB_CONFIG = {
    "host":     "millennialprod.mysql.database.azure.com",
    "port":     3306,
    "user":     "azuremillennial",
    "password": "x1_72TCSipc=",
    "database": "db_capeco",
    # SSL: usar el cert del sistema o la ruta local si lo descargaste
    "ssl_ca":   os.environ.get(
        "AZURE_MYSQL_SSL_CA",
        "/etc/ssl/certs/DigiCertGlobalRootG2.crt.pem"   # Linux/Mac
        # "C:/certs/DigiCertGlobalRootG2.crt.pem"        # Windows
    ),
    "ssl_verify_cert": True,
    "ssl_verify_identity": True,
    "connect_timeout": 15,
    "autocommit": True,
}

# ── Serializer seguro (Decimal, datetime, None) ──────────────────────────────
def safe_serial(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if obj is None:
        return None
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


# ── Conexión ─────────────────────────────────────────────────────────────────
def get_connection():
    """Devuelve conexión SSL verificada. Lanza excepción si falla."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as e:
        print(f"[ERROR] Conexión fallida: {e}")
        raise


# ── Test de conexión + schema ─────────────────────────────────────────────────
def test_connection():
    conn = get_connection()
    cur = conn.cursor()

    # Versión del servidor
    cur.execute("SELECT VERSION()")
    version = cur.fetchone()[0]
    print(f"✓ Conectado a MySQL {version} en Azure")

    # SSL activo
    cur.execute("SHOW STATUS LIKE 'Ssl_cipher'")
    ssl_row = cur.fetchone()
    if ssl_row and ssl_row[1]:
        print(f"✓ SSL activo — cipher: {ssl_row[1]}")
    else:
        print("⚠ SSL no activo — revisar configuración")

    # Tablas disponibles
    cur.execute("SHOW TABLES")
    tables = [r[0] for r in cur.fetchall()]
    print(f"\n✓ Tablas disponibles ({len(tables)}):")
    for t in tables:
        cur.execute(f"SELECT COUNT(*) FROM `{t}`")
        n = cur.fetchone()[0]
        print(f"   {t:<35} {n:>10,} filas")

    # Schema de la tabla principal
    cur.execute("DESCRIBE data_capeco_full")
    cols = cur.fetchall()
    print(f"\n✓ data_capeco_full — {len(cols)} columnas:")
    for c in cols:
        print(f"   {c[0]:<40} {c[1]}")

    cur.close()
    conn.close()
    return True


# ── Queries de validación ────────────────────────────────────────────────────
def run_validation_queries():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)

    results = {}

    # 1. Total registros y rango de años
    cur.execute("""
        SELECT
            COUNT(*)                    AS total_registros,
            MIN(ANIO)                   AS anio_min,
            MAX(ANIO)                   AS anio_max,
            COUNT(DISTINCT ANIO)        AS total_anios,
            COUNT(DISTINCT DISTRITO)    AS total_distritos,
            COUNT(DISTINCT `NOMBRE PROPIETARIO`) AS total_propietarios
        FROM data_capeco_full
    """)
    results["overview"] = cur.fetchone()

    # 2. Registros y distritos por año
    cur.execute("""
        SELECT ANIO,
               COUNT(*)                     AS registros,
               COUNT(DISTINCT DISTRITO)     AS distritos,
               ROUND(AVG(PRECIO_X_M2), 2)  AS precio_m2_avg,
               ROUND(AVG((UNIDADES_A / NULLIF(NRO_UNIDADES,0)) * 100), 2) AS absorcion_pct
        FROM data_capeco_full
        GROUP BY ANIO
        ORDER BY ANIO DESC
        LIMIT 10
    """)
    results["por_anio"] = cur.fetchall()

    # 3. Distritos únicos en la base completa
    cur.execute("""
        SELECT DISTRITO, COUNT(*) AS registros
        FROM data_capeco_full
        WHERE ANIO = 2025
        GROUP BY DISTRITO
        ORDER BY registros DESC
    """)
    results["distritos_2025"] = cur.fetchall()

    # 4. Propietarios únicos (empresas constructoras)
    cur.execute("""
        SELECT COUNT(DISTINCT `NOMBRE PROPIETARIO`) AS total_constructoras
        FROM data_capeco_full
        WHERE ANIO = 2025 AND `NOMBRE PROPIETARIO` <> ''
    """)
    results["constructoras_2025"] = cur.fetchone()

    # 5. Top 30 propietarios por valor expuesto
    cur.execute("""
        SELECT
            `NOMBRE PROPIETARIO`                          AS propietario,
            COUNT(*)                                       AS registros,
            SUM(PRECIO_SOLES * NRO_UNIDADES)              AS valor_total,
            ROUND(AVG(PRECIO_X_M2), 2)                   AS precio_m2_avg
        FROM data_capeco_full
        WHERE ANIO = 2025 AND `NOMBRE PROPIETARIO` <> ''
        GROUP BY `NOMBRE PROPIETARIO`
        ORDER BY valor_total DESC
        LIMIT 30
    """)
    results["top_propietarios"] = cur.fetchall()

    # 6. Absorción por trimestre últimos 2 años
    cur.execute("""
        SELECT ANIO, TRIM,
               ROUND(AVG((UNIDADES_A / NULLIF(NRO_UNIDADES,0)) * 100), 4) AS absorcion,
               COUNT(*) AS n
        FROM data_capeco_full
        WHERE ANIO >= 2024
        GROUP BY ANIO, TRIM
        ORDER BY ANIO, TRIM
    """)
    results["absorcion_trend"] = cur.fetchall()

    # 7. Precio m2 por distrito 2025
    cur.execute("""
        SELECT DISTRITO,
               ROUND(AVG(PRECIO_X_M2), 2)  AS precio_m2_avg,
               COUNT(*)                     AS registros
        FROM data_capeco_full
        WHERE ANIO = 2025 AND PRECIO_X_M2 > 0
        GROUP BY DISTRITO
        ORDER BY precio_m2_avg DESC
    """)
    results["precio_x_distrito"] = cur.fetchall()

    cur.close()
    conn.close()

    # Print results
    print("\n=== OVERVIEW ===")
    o = results["overview"]
    print(f"  Total registros:      {o['total_registros']:>10,}")
    print(f"  Años cubiertos:       {o['anio_min']} – {o['anio_max']} ({o['total_anios']} años)")
    print(f"  Distritos únicos:     {o['total_distritos']}")
    print(f"  Propietarios únicos:  {o['total_propietarios']:,}")

    print("\n=== POR AÑO ===")
    for r in results["por_anio"]:
        print(f"  {r['ANIO']}  {r['registros']:>7,} reg  "
              f"{r['distritos']:>3} dist  "
              f"S/{r['precio_m2_avg']:>8,.0f}/m²  "
              f"absorc {r['absorcion_pct']:>5.1f}%")

    print(f"\n=== DISTRITOS 2025 ({len(results['distritos_2025'])} únicos) ===")
    for r in results["distritos_2025"]:
        print(f"  {r['DISTRITO']:<35} {r['registros']:>5,}")

    print(f"\n=== CONSTRUCTORAS 2025 ===")
    print(f"  {results['constructoras_2025']['total_constructoras']:,} propietarias únicas")

    print("\n=== TOP 10 CONSTRUCTORAS POR VALOR (2025) ===")
    for r in results["top_propietarios"][:10]:
        print(f"  {r['propietario'][:40]:<42} "
              f"S/{r['valor_total']/1e9:>6.2f}B  "
              f"{r['registros']:>5} reg")

    print("\n=== ABSORCIÓN TRIMESTRAL ===")
    for r in results["absorcion_trend"]:
        print(f"  {r['ANIO']} Q{r['TRIM']}: {r['absorcion']:>5.1f}%  ({r['n']} reg)")

    return results


# ── Exportar dashboard_data.json ─────────────────────────────────────────────
def export_dashboard(output_path="dashboard_data.json"):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)

    data = {}

    # Summary
    cur.execute("""
        SELECT
            SUM(PRECIO_SOLES * NRO_UNIDADES)                              AS total_market_value,
            AVG((UNIDADES_A / NULLIF(NRO_UNIDADES, 0)) * 100)            AS avg_absorption,
            COUNT(*)                                                        AS total_active_projects
        FROM data_capeco_full
        WHERE ANIO = 2025
    """)
    data["summary"] = cur.fetchone()

    # Risk by phase
    cur.execute("""
        SELECT
            CASE
                WHEN FASE IN ('Preventa','Excavacion','Cimentacion')      THEN 'High Risk (Pre-construction)'
                WHEN FASE IN ('Estructura','Obra en casco','En construccion') THEN 'Medium Risk (Construction)'
                WHEN FASE IN ('Acabados','Terminadas','Totalmente ocupada')THEN 'Low Risk (Finished)'
                ELSE 'Under Review'
            END AS risk_level,
            SUM(PRECIO_SOLES * NRO_UNIDADES) AS value
        FROM data_capeco_full WHERE ANIO = 2025
        GROUP BY risk_level
    """)
    data["risk_by_phase"] = cur.fetchall()

    # Top developers
    cur.execute("""
        SELECT
            `NOMBRE PROPIETARIO`                    AS developer,
            COUNT(*)                                 AS projects,
            SUM(PRECIO_SOLES * NRO_UNIDADES)        AS total_exposure_value
        FROM data_capeco_full
        WHERE ANIO = 2025 AND `NOMBRE PROPIETARIO` <> ''
        GROUP BY `NOMBRE PROPIETARIO`
        ORDER BY total_exposure_value DESC
        LIMIT 20
    """)
    data["top_developers"] = cur.fetchall()

    # LTV risk buckets
    cur.execute("""
        SELECT
            CASE
                WHEN PRECIO_X_M2 > 8000                 THEN 'Elite (>S/ 8000)'
                WHEN PRECIO_X_M2 BETWEEN 5000 AND 8000  THEN 'Upper Mid'
                WHEN PRECIO_X_M2 BETWEEN 3000 AND 5000  THEN 'Massive Social'
                ELSE 'Entry/TECHO PROPIO'
            END AS market_tier,
            AVG((UNIDADES_B / NULLIF(NRO_UNIDADES, 0)) * 100) AS stock_risk
        FROM data_capeco_full WHERE ANIO = 2025
        GROUP BY market_tier
    """)
    data["ltv_risk"] = cur.fetchall()

    # Liquidity trend
    cur.execute("""
        SELECT ANIO, TRIM,
               AVG((UNIDADES_A / NULLIF(NRO_UNIDADES, 0)) * 100) AS absorption
        FROM data_capeco_full WHERE ANIO >= 2023
        GROUP BY ANIO, TRIM
        ORDER BY ANIO, TRIM
    """)
    data["liquidity_trend"] = cur.fetchall()

    # District summary
    cur.execute("""
        SELECT DISTRITO,
               ROUND(AVG(PRECIO_X_M2), 2)   AS precio_m2_avg,
               ROUND(AVG(AREA_M2), 2)        AS area_avg,
               COUNT(*)                       AS registros
        FROM data_capeco_full
        WHERE ANIO = 2025 AND PRECIO_X_M2 > 0
        GROUP BY DISTRITO
        ORDER BY precio_m2_avg DESC
    """)
    data["district_summary"] = cur.fetchall()

    cur.close()
    conn.close()

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False, default=safe_serial)

    print(f"✓ {output_path} exportado correctamente")
    return data


# ── CLI ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "--test"

    if mode == "--test":
        test_connection()

    elif mode == "--query":
        run_validation_queries()

    elif mode == "--export":
        out = sys.argv[2] if len(sys.argv) > 2 else "dashboard_data.json"
        export_dashboard(out)

    elif mode == "--all":
        print("── TEST DE CONEXIÓN ────────────────────────────────")
        test_connection()
        print("\n── QUERIES DE VALIDACIÓN ───────────────────────────")
        run_validation_queries()
        print("\n── EXPORTANDO dashboard_data.json ──────────────────")
        export_dashboard()

    else:
        print(f"Uso: python pme_db.py [--test | --query | --export [archivo] | --all]")
