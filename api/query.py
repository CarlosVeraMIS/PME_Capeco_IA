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
_df_xl = None

def get_dataframes():
    global _df_csv, _df_xl
    if _df_csv is None:
        base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        _df_csv = pd.read_csv(os.path.join(base, 'Material datos', 'data-proyectos-immobiliarios.csv'))
        _df_xl  = pd.read_excel(os.path.join(base, 'Material datos', 'data2025Q4.xlsx'), sheet_name='data2025Q4')
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

    if azure_api_key and azure_endpoint:
        from langchain_openai import AzureChatOpenAI
        llm = AzureChatOpenAI(
            azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o-mini"),
            openai_api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
            azure_endpoint=azure_endpoint,
            api_key=azure_api_key,
            temperature=0
        )
    else:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return None
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(temperature=0, model="gpt-4o-mini", api_key=api_key)

    return create_pandas_dataframe_agent(
        llm, df_csv, verbose=True,
        agent_type="openai-tools",
        allow_dangerous_code=True
    )


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


        # Sin API key → error explícito (simulación deshabilitada)
        if not agent and not use_local:
            self._send_json(500, {"error": "No se encontró una API key válida. Configura AZURE_OPENAI_API_KEY + AZURE_OPENAI_ENDPOINT (o OPENAI_API_KEY) en las variables de entorno de Vercel."})
            return


        # MODO REAL
        try:
            prompt = f"""
Actúa como un analista de datos avanzado de mercado inmobiliario peruano.
Tienes acceso a `python_repl_ast`. DEBES usarla para ejecutar código Pandas sobre `df`.
`df` contiene scraping inmobiliario (columnas principales: 'title', 'distrito', 'price_value', 'model_name').
Responde en español con formato markdown. Pregunta: {question}
"""
            response = agent.invoke(prompt)
            self._send_json(200, {"answer": response.get("output", "Sin respuesta")})
        except Exception as e:
            self._send_json(500, {"error": str(e)})
