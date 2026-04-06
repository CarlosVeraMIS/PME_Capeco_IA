import os
import json
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        # Muestra qué variables están presentes (sin revelar sus valores)
        vars_to_check = [
            "AZURE_OPENAI_API_KEY",
            "AZURE_OPENAI_ENDPOINT",
            "AZURE_OPENAI_DEPLOYMENT_NAME",
            "AZURE_OPENAI_API_VERSION",
            "OPENAI_API_KEY",
        ]

        result = {}
        for v in vars_to_check:
            val = os.getenv(v)
            if val:
                result[v] = f"✅ PRESENTE ({len(val)} chars)"
            else:
                result[v] = "❌ NO ENCONTRADA"

        body = json.dumps(result, ensure_ascii=False, indent=2).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)
