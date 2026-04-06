import os
import json
import pandas as pd
from http.server import BaseHTTPRequestHandler
from dotenv import load_dotenv

load_dotenv()

# ==========================================
# Cache global para lambdas "warm"
# ==========================================
_df_main  = None  # all_projects.json  → misma data que el dashboard
_df_xl    = None  # data2025Q4.xlsx   → datos oficiales Q4

def get_dataframes():
    global _df_main, _df_xl
    if _df_main is None:
        base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

        # Cargamos all_projects.json — la fuente consolidada que usa el dashboard
        json_path = os.path.join(base, 'Dashboard Faltantes', 'all_projects.json')
        with open(json_path, 'r', encoding='utf-8') as f:
            raw = json.load(f)
        _df_main = pd.json_normalize(raw)

        # Cargamos Excel Q4 como referencia adicional
        _df_xl = pd.read_excel(
            os.path.join(base, 'Material datos', 'data2025Q4.xlsx'),
            sheet_name='data2025Q4'
        )
    return _df_main, _df_xl



def get_agent(df_csv, use_local=False):
    from langchain_experimental.agents import create_pandas_dataframe_agent

    if use_local:
        from langchain_community.chat_models import ChatOllama
        llm = ChatOllama(model="llama3", temperature=0)
        return create_pandas_dataframe_agent(
            llm, df_csv, verbose=True,
            agent_type="zero-shot-react-description",
            allow_dangerous_code=True
        )

    azure_api_key = os.getenv("AZURE_OPENAI_API_KEY")
    azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    openai_api_key = os.getenv("OPENAI_API_KEY")

    if azure_api_key and azure_endpoint:
        from langchain_openai import AzureChatOpenAI
        deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o-mini")
        api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-08-01-preview")
        try:
            llm = AzureChatOpenAI(
                azure_deployment=deployment,
                openai_api_version=api_version,
                azure_endpoint=azure_endpoint,
                api_key=azure_api_key,
                temperature=0
            )
        except Exception as e:
            raise Exception(f"Error al iniciar AzureChatOpenAI (deployment={deployment}, version={api_version}): {e}")
    elif openai_api_key:
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(temperature=0, model="gpt-4o-mini", api_key=openai_api_key)
    else:
        raise Exception("No se encontró AZURE_OPENAI_API_KEY+ENDPOINT ni OPENAI_API_KEY en las variables de entorno.")

    try:
        return create_pandas_dataframe_agent(
            llm, df_csv, verbose=True,
            agent_type="openai-tools",
            allow_dangerous_code=True
        )
    except Exception as e:
        raise Exception(f"Error al crear el agente Pandas: {e}")


class handler(BaseHTTPRequestHandler):

    def _send_json(self, status: int, payload: dict):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
        except Exception:
            self._send_json(400, {"error": "Body JSON inválido"})
            return

        question   = body.get("query", "").strip()
        use_local  = body.get("use_local", False)

        if not question:
            self._send_json(400, {"error": "Pregunta vacía"})
            return

        try:
            df_main, _ = get_dataframes()
        except Exception as e:
            self._send_json(500, {"error": f"Error cargando datos: {e}"})
            return

        try:
            agent = get_agent(df_main, use_local)
        except Exception as e:
            self._send_json(500, {"error": str(e)})
            return


        # get_agent ahora lanza excepción si falla — nunca retorna None


        # MODO REAL
        try:
            prompt = f"""
Eres un analista experto en el mercado inmobiliario peruano.
Tienes la herramienta `python_repl_ast` y DEBES usarla para ejecutar código Pandas sobre `df`.

COLUMNAS EXACTAS DE `df`:
- 'title'            → nombre del proyecto (string)
- 'distrito'         → distrito de Lima (string)
- 'avg_price_m2'     → precio promedio por m² YA CALCULADO (float) — LÉELO DIRECTAMENTE, NO LO CALCULES
- 'price_value'      → precio numérico base (float) — PUEDE SER 0 si el precio es "Consultar"
- 'price_string'     → precio formateado listo para mostrar (string, ej: "S/ 856,000" o "Consultar")
- 'area_m2'          → área en m² (float)
- 'rooms'            → dormitorios (int)
- 'total_units'      → unidades disponibles (int)
- 'is_missing'       → True si NO está en la base oficial Q4 (bool)
- 'project_currency' → moneda ('S/' o '$')
- 'models'           → lista de modelos de dept. con precios detallados

⚠️ REGLAS CRÍTICAS PARA PRECIOS:
1. Para "Precio por m²": usa df['avg_price_m2'] DIRECTAMENTE. Muestra junto con df['project_currency'].
2. Para "Precio Base": usa df['price_string'] (ya formateado). NUNCA uses price_value — puede ser 0.
3. NUNCA muestres 0 en precios. Si price_value=0, muéstrate price_string que puede decir "Consultar".
4. NUNCA calcules precio/m² tú mismo. El campo avg_price_m2 ya tiene el valor correcto.

Ejemplo correcto para una tabla:
| Proyecto | Precio Base | Precio/m² |
|---|---|---|
| GARDEN HOMES | Consultar | $ 2,232 |
| Serenity | S/ 856,000 | S/ 8,258 |

Responde en español con tablas markdown bien formateadas.
Pregunta del usuario: {question}
"""
            response = agent.invoke(prompt)
            self._send_json(200, {"answer": response.get("output", "Sin respuesta")})
        except Exception as e:
            self._send_json(500, {"error": str(e)})
