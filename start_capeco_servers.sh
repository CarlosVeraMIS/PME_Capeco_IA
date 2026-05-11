#!/bin/bash
# CAPECO Data Lake - Server Startup Script
# Starts both HTTP server and FastAPI API server

cd /Users/carlosvera/Library/CloudStorage/OneDrive-MSFT/mis/IA/capeco

echo "========================================================================"
echo "CAPECO DATA LAKE — Server Startup"
echo "========================================================================"
echo ""

# Start HTTP Server on port 9000
echo "Starting HTTP server on port 9000..."
python3 -m http.server 9000 --directory . > /tmp/http_server.log 2>&1 &
HTTP_PID=$!
echo "✓ HTTP server started (PID: $HTTP_PID)"
echo "  Dashboard available at: http://127.0.0.1:9000/dashboard.html"
echo ""

# Wait for HTTP server to be ready
sleep 2

# Start API Server on port 8000
echo "Starting FastAPI server on port 8000..."
python3 -m uvicorn api_server:app --host 0.0.0.0 --port 8000 > /tmp/api_server.log 2>&1 &
API_PID=$!
echo "✓ API server started (PID: $API_PID)"
echo "  API documentation: http://127.0.0.1:8000/docs"
echo "  Health check: http://127.0.0.1:8000/health"
echo ""

# Wait for API server to be ready
sleep 8

# Test both servers
echo "========================================================================"
echo "Testing Servers"
echo "========================================================================"
echo ""

echo "1. Testing HTTP Server..."
if curl -s http://127.0.0.1:9000/dashboard.html | grep -q "<!DOCTYPE html>"; then
  echo "   ✓ HTTP server is responding"
else
  echo "   ✗ HTTP server not responding"
fi

echo ""
echo "2. Testing API Server..."
if curl -s http://127.0.0.1:8000/health | grep -q "healthy"; then
  echo "   ✓ API server is healthy"
  curl -s http://127.0.0.1:8000/health | python -m json.tool 2>/dev/null | grep -E '(status|rows_available)'
else
  echo "   ✗ API server not responding"
fi

echo ""
echo "========================================================================"
echo "CAPECO Data Lake is Ready"
echo "========================================================================"
echo ""
echo "Dashboard: http://127.0.0.1:9000/dashboard.html"
echo "API Docs:  http://127.0.0.1:8000/docs"
echo ""
echo "Server PIDs:"
echo "  HTTP:  $HTTP_PID"
echo "  API:   $API_PID"
echo ""

# Keep script running
wait
