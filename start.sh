#!/bin/sh
set -e

echo "Starting SupplyChainIQ Python ML Forecasting Microservice on port 8000..."
python -m uvicorn python_service.forecast_service:app --host 127.0.0.1 --port 8000 &

echo "Waiting for Python microservice to initialize..."
sleep 2

echo "Starting SupplyChainIQ Node.js Express Platform on port ${PORT:-5000}..."
exec node server/src/index.js
