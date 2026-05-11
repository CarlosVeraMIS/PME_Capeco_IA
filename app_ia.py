import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from dotenv import load_dotenv

from langchain_experimental.agents import create_pandas_dataframe_agent
from langchain_openai import ChatOpenAI

load_dotenv()

app = Flask(__name__)
CORS(app)

# ==========================================
# Carga de Datos
# ==========================================
print("Cargando bases de datos para Dataframe Agent...")
try:
    df_csv = pd.read_csv('Material datos/data-proyectos-immobiliarios.csv')
    df_xl = pd.read_excel('Material datos/data2025Q4.xlsx', sheet_name='data2025Q4')
    print("✓ Bases cargadas existosamente.")
except Exception as e:
    print(f"Error cargando bases: {e}")

# ==========================================
# Motor LangChain
# ==========================================
def get_agent(use_local=False):
    if use_local:
        try:
            from langchain_community.chat_models import ChatOllama
            llm = ChatOllama(model="llama3", temperature=0)
            agent = create_pandas_dataframe_agent(
                llm, 
                df_csv, 
                verbose=True, 
                agent_type="zero-shot-react-description",
                allow_dangerous_code=True
            )
            return agent
        except Exception as e:
            raise Exception(f"No se pudo iniciar el Agente Local o falta una dependencia. Error exacto: {e}")

    from dotenv import load_dotenv
    load_dotenv(override=True)
    
    # Revisar si hay credenciales de Azure OpenAI
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
        # Fallback a la API de OpenAI convencional
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return None
        
        # Configuramos el LLM
        llm = ChatOpenAI(temperature=0, model="gpt-4o-mini", api_key=api_key)
    
    # Creamos el agente capaz de leer del dataframe
    agent = create_pandas_dataframe_agent(
        llm, 
        df_csv, 
        verbose=True, 
        agent_type="openai-tools",
        allow_dangerous_code=True
    )
    return agent

@app.route('/query', methods=['POST'])
def query_ai():
    data = request.json
    question = data.get('query', '')
    use_local = data.get('use_local', False)
    
    if not question:
        return jsonify({"error": "Pregunta vacía"}), 400

    try:
        agent = get_agent(use_local)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    # MODO SIMULADOR SI NO HAY API KEY
    if not agent and not use_local:
        import time
        time.sleep(1.5) # Simular latencia de red/IA
        
        simulacion = f"""
**[MODO SIMULACIÓN ACTIVADO - SIN API KEY]**

He analizado tu solicitud sobre *"{question}"*. Al cruzar la base de datos de Capeco (Q4) y la data del scraper, aquí tienes un resumen de prueba:

| Distrito | Proyectos Activos | Precio Promedio (S/) | M2 Promedio |
| :--- | :--- | :--- | :--- |
| **Miraflores** | 42 | S/ 680,500 | 85 m² |
| **San Isidro** | 35 | S/ 850,000 | 110 m² |
| **Surco** | 56 | S/ 490,200 | 75 m² |
| **Jesús María** | 28 | S/ 410,000 | 65 m² |

💡 *Nota: Esta es una data de prueba inyectada por el servidor backend porque no se encontró una clave de API configurada. Cuando integres Gemini, verás resultados reales extraídos mediante código Pandas.*
"""
        return jsonify({"answer": simulacion})

    # MODO REAL (CON API KEY)
    try:
        prompt = f"""
        Actúa como un analista de datos avanzado.
        Tienes acceso a una herramienta fundamental llamada `python_repl_ast`. **DEBES OBLIGATORIAMENTE invocar esta herramienta** para ejecutar consultas de Python en memoria para responder.
        
        Dentro de ese entorno ya está pre-cargada una variable DataFrame llamada `df`:
        - `df`: contiene los resultados de web scraping (Columnas principales: 'title', 'distrito', 'price_value', 'model_name').
        
        REGLA DE ORO: NO me sugieras cómo escribir el código ni me digas que no tienes acceso. **Usa tu herramienta `python_repl_ast`** para ejecutar el código necesario directamente sobre `df`, extrae el resultado de la herramienta y luego usa esa información para darme una respuesta tabular.
        
        Pregunta del usuario: {question}
        
        Filtra y extrae correctamente la metadata. Responde en español y entrégame sólamente los resultados directos de forma clara usando formato markdown.
        """
        response = agent.invoke(prompt)
        return jsonify({"answer": response.get("output", "Sin respuesta")})
    except Exception as e:
        print(f"Error en IA: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print("\n==================================")
    print("🚀 Motor de IA Iniciado")
    print("Endpoints: POST http://localhost:5000/query")
    print("==================================\n")
    app.run(port=5000, debug=False)
