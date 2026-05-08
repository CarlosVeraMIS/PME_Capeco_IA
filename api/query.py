import os
import json
import pandas as pd
from http.server import BaseHTTPRequestHandler
from dotenv import load_dotenv

load_dotenv()

# ==========================================
# Cache global para lambdas "warm"
# ==========================================
_df_csv = None
_df_xl  = None

def get_dataframes():
    global _df_csv, _df_xl
    if _df_csv is None:
        base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        _df_csv = pd.read_csv(os.path.join(base, 'Material datos', 'data-proyectos-immobiliarios.csv'))
        _df_xl  = pd.read_excel(
            os.path.join(base, 'Material datos', 'data2025Q4.xlsx'),
            sheet_name='data2025Q4'
        )
    return _df_csv, _df_xl



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
            df_csv, _ = get_dataframes()
        except Exception as e:
            self._send_json(500, {"error": f"Error cargando datos: {e}"})
            return

        try:
            agent = get_agent(df_csv, use_local)
        except Exception as e:
            self._send_json(500, {"error": str(e)})
            return


        # get_agent ahora lanza excepción si falla — nunca retorna None


        # MODO REAL
        try:
            prompt = f"""
Eres un analista experto en el mercado inmobiliario peruano.
Tienes la herramienta `python_repl_ast` y DEBES usarla para ejecutar código Pandas sobre `df`.

COLUMNAS EXACTAS DE `df` (scraping Nexo Inmobiliario):
- 'title'            → nombre del proyecto
- 'distrito'         → distrito de Lima
- 'price_amount'     → precio numérico del modelo (float)
- 'price_currency'   → moneda ('S/' o '$')
- 'area_m2'          → área del modelo en m² (float)
- 'num_rooms'        → dormitorios del modelo (int)
- 'num_bathrooms'    → baños del modelo (int)
- 'units_available'  → unidades disponibles por modelo (int)
- 'model_name'       → nombre del tipo de departamento
- 'model_type'       → tipo (FLAT, DÚPLEX, etc.)

NOTA: Cada fila es un MODELO de departamento, no un proyecto completo.
Para datos por proyecto: agrupa con df.groupby('title').

⚠️ REGLAS DE PRECIO:
1. Para precio/m²: calcula price_amount / area_m2 por modelo, luego promedia por proyecto.
2. Para precio base del proyecto: usa el mínimo de price_amount por proyecto (df.groupby('title')['price_amount'].min()).
3. Muestra siempre la moneda de price_currency junto al precio.
4. Filtra filas donde price_amount > 0 antes de calcular promedios.

Responde en español con tablas markdown bien formateadas.
Pregunta del usuario: {question}
"""
            response = agent.invoke(prompt)
            self._send_json(200, {"answer": response.get("output", "Sin respuesta")})
        except Exception as e:
            self._send_json(500, {"error": str(e)})
