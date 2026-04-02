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
                [df_csv, df_xl], 
                verbose=True, 
                agent_type="zero-shot-react-description",
                allow_dangerous_code=True
            )
            return agent
        except Exception as e:
            raise Exception(f"No se pudo iniciar el Agente Local o falta una dependencia. Error exacto: {e}")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    
    # Configuramos el LLM
    llm = ChatOpenAI(temperature=0, model="gpt-4o-mini", api_key=api_key)
    
    # Creamos el agente capaz de leer múltiples dataframes
    agent = create_pandas_dataframe_agent(
        llm, 
        [df_csv, df_xl], 
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
        Actúa como un experto consultor inmobiliario de Capeco.
        Tienes acceso a dos dataframes:
        - df1: Resultados de web scraping (data-proyectos-immobiliarios.csv)
        - df2: Base consolidada oficial Q4 2025 (data2025Q4.xlsx)
        
        Pregunta del usuario: {question}
        
        Responde en español, de forma clara, amigable y estructurada. Si te piden top/lista, usa formato markdown.
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
