"""
SupplyChainIQ - Python FastAPI Forecasting Microservice
Port: 8000
Connects to MongoDB (supplychainiq) to run Holt-Winters, ARIMA, XGBoost & Random Forest time-series forecasting.
"""

import os
import sys
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pymongo
from pymongo import MongoClient

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from forecast_engine import run_tournament, impute_stockouts, evaluate_models_for_benchmark

app = FastAPI(
    title="SupplyChainIQ Python ML Forecasting Microservice",
    description="Statistical & Machine Learning Demand Forecasting for SupplyChainIQ (FastAPI, Statsmodels, XGBoost)",
    version="2.0.0"
)

# Enable CORS for React frontend (port 5173) and Node Express backend (port 5000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI") or "mongodb+srv://prathamg08384_db_user:kIubmRzlUDutKX0U@cluster0.buaho3n.mongodb.net/supplychainiq?retryWrites=true&w=majority"
mongo_client = None
db = None

try:
    mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    # Check connection
    mongo_client.admin.command('ping')
    db_name = MONGO_URI.split('/')[-1].split('?')[0] or "supplychainiq"
    db = mongo_client[db_name]
    print(f"[Python Service] Connected to MongoDB database '{db_name}' at {MONGO_URI}")
except Exception as e:
    print(f"[Python Service Warning] Could not connect to MongoDB: {e}")
    db = None


class DailyRecord(BaseModel):
    date: str
    sales: Optional[float] = 0.0
    quantity: Optional[float] = 0.0
    wasStockoutDay: Optional[bool] = False
    closingStock: Optional[float] = 50.0


class PredictRequest(BaseModel):
    skuCode: Optional[str] = "CUSTOM-SKU"
    records: List[DailyRecord]
    testWindow: Optional[int] = 14
    horizon: Optional[int] = 30


@app.get("/")
@app.get("/health")
def health_check():
    """
    Health check returning system status, active ML libraries, and MongoDB status.
    """
    db_connected = False
    products_count = 0
    transactions_count = 0

    if db is not None:
        try:
            db.command('ping')
            db_connected = True
            products_count = db["products"].count_documents({})
            transactions_count = db["transactions"].count_documents({})
        except Exception:
            db_connected = False

    return {
        "status": "healthy",
        "service": "SupplyChainIQ Python ML Forecasting Service",
        "version": "2.0.0",
        "algorithms": [
            "SARIMA (Seasonal ARIMA Statespace SARIMAX) (statsmodels)",
            "ARIMA(1,1,1) Autoregressive Moving Average (statsmodels)",
            "Holt-Winters Triple Exponential Smoothing (statsmodels)",
            "XGBoost Multi-Step Lag Regressor (xgboost)",
            "Random Forest Ensemble (scikit-learn)",
            "Augmented Dickey-Fuller (ADF) Stationarity & Seasonality Suite",
            "Stockout-Corrected Demand Imputer (pandas)"
        ],
        "database": {
            "connected": db_connected,
            "target": MONGO_URI,
            "productsCount": products_count,
            "transactionsCount": transactions_count
        },
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/forecast/predict")
def predict_forecast(payload: PredictRequest):
    """
    Accepts arbitrary daily sales time-series records and runs the multi-model tournament.
    """
    records_dict = [r.dict() for r in payload.records]
    if len(records_dict) < 14:
        raise HTTPException(status_code=400, detail="Minimum 14 historical daily records required for forecasting")

    try:
        tournament_result = run_tournament(
            records_dict,
            test_window=payload.testWindow or 14,
            horizon=payload.horizon or 30
        )
        tournament_result["skuCode"] = payload.skuCode
        return tournament_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")


@app.get("/api/forecast/sku/{sku_code}")
def get_sku_forecast(
    sku_code: str,
    test_window: int = Query(14, ge=7, le=30),
    horizon: int = Query(30, ge=7, le=90)
):
    """
    Queries 180-day transactions from MongoDB for this SKU, runs the Python ML tournament,
    caches the forecast in MongoDB, and returns the result.
    """
    if db is None:
        raise HTTPException(status_code=503, detail="MongoDB not connected in Python microservice")

    sku_code = sku_code.upper().strip()

    # Query product master
    product = db["products"].find_one({"skuCode": sku_code})
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with SKU '{sku_code}' not found in MongoDB")

    # Query sell transactions for this SKU
    txs_cursor = db["transactions"].find(
        {"skuCode": sku_code, "type": "SELL"}
    ).sort("date", pymongo.ASCENDING)

    records = []
    for tx in txs_cursor:
        date_val = tx.get("date")
        if isinstance(date_val, datetime):
            date_str = date_val.strftime("%Y-%m-%d")
        else:
            date_str = str(date_val)[:10]

        records.append({
            "date": date_str,
            "sales": float(tx.get("quantity", 0)),
            "wasStockoutDay": bool(tx.get("wasStockoutDay", False)),
            "closingStock": 50.0  # Heuristic baseline
        })

    if len(records) < 14:
        raise HTTPException(status_code=400, detail=f"Insufficient transactions ({len(records)}) for SKU {sku_code}")

    # Run tournament
    result = run_tournament(records, test_window=test_window, horizon=horizon)
    result["skuCode"] = sku_code
    result["productName"] = product.get("name")
    result["category"] = product.get("category")
    result["currentStock"] = product.get("currentStock", 0)

    # Compute inventory math
    avg_daily_demand = max(1.0, float(sum(result["forecast30"][:7]) / 7.0))
    lead_time = float(product.get("avgLeadTimeDays", 7))
    safety_stock = int(round(avg_daily_demand * (lead_time * 0.5) + 10))
    reorder_point = int(round((avg_daily_demand * lead_time) + safety_stock))
    days_of_inventory = round(float(product.get("currentStock", 0)) / avg_daily_demand, 1)

    result["inventoryMetrics"] = {
        "safetyStock": safety_stock,
        "reorderPoint": reorder_point,
        "daysOfInventory": days_of_inventory,
        "forecastedDailyDemand": round(avg_daily_demand, 1)
    }

    # Upsert forecast cache into MongoDB forecasts collection
    try:
        db["forecasts"].update_one(
            {"skuCode": sku_code},
            {
                "$set": {
                    "skuCode": sku_code,
                    "generatedAt": datetime.utcnow(),
                    "bestModelUsed": result["bestModel"],
                    "mapeAccuracy": result["accuracy"],
                    "dailyForecastArray": result["dailyForecastArray"],
                    "safetyStock": safety_stock,
                    "reorderPoint": reorder_point,
                    "engine": result["engine"]
                }
            },
            upsert=True
        )
    except Exception as e:
        print(f"[Python Service] Warning: Forecast MongoDB caching failed: {e}")

    return result


_cached_benchmark = None
_cached_benchmark_time = None

@app.get("/api/forecast/tournament/benchmark-all")
def benchmark_all_skus(refresh: bool = False):
    """
    Evaluates all products in MongoDB across Holt-Winters, ARIMA, XGBoost, Random Forest, and SARIMA.
    Returns tournament leaderboards and algorithm win rates. Cached for fast response.
    """
    global _cached_benchmark, _cached_benchmark_time

    # Return in-memory cache if fresh (within 30 mins) and not force-refreshed
    now = datetime.utcnow()
    if not refresh and _cached_benchmark is not None and _cached_benchmark_time is not None:
        if (now - _cached_benchmark_time).total_seconds() < 1800:
            return _cached_benchmark

    if db is None:
        if _cached_benchmark is not None:
            return _cached_benchmark
        raise HTTPException(status_code=503, detail="MongoDB not connected")

    # Check MongoDB collection cache if not force-refresh
    if not refresh:
        try:
            stored = db["benchmarks"].find_one({"type": "all_skus_tournament"})
            if stored and stored.get("benchmarks"):
                stored.pop("_id", None)
                stored.pop("type", None)
                _cached_benchmark = stored
                _cached_benchmark_time = now
                return stored
        except Exception:
            pass

    products = list(db["products"].find({}, {"skuCode": 1, "name": 1, "category": 1}))
    if not products:
        raise HTTPException(status_code=404, detail="No products found in MongoDB")

    benchmarks = []
    win_counts = {
        "SARIMA (Seasonal ARIMA)": 0,
        "ARIMA(1,1,1) (Statsmodels)": 0,
        "Holt-Winters (Statsmodels)": 0,
        "XGBoost Regressor (ML)": 0,
        "Random Forest (Ensemble)": 0
    }

    for prod in products:
        sku = prod["skuCode"]
        txs = list(db["transactions"].find(
            {"skuCode": sku, "type": "SELL"}
        ).sort("date", pymongo.ASCENDING))

        if len(txs) < 14:
            continue

        records = []
        for tx in txs:
            d_val = tx.get("date")
            d_str = d_val.strftime("%Y-%m-%d") if isinstance(d_val, datetime) else str(d_val)[:10]
            records.append({
                "date": d_str,
                "sales": float(tx.get("quantity", 0)),
                "wasStockoutDay": bool(tx.get("wasStockoutDay", False)),
                "closingStock": 50.0
            })

        try:
            res = evaluate_models_for_benchmark(records, test_window=14)
            winner = res["bestModel"]
            win_counts[winner] = win_counts.get(winner, 0) + 1

            benchmarks.append({
                "skuCode": sku,
                "name": prod.get("name"),
                "category": prod.get("category"),
                "bestModel": winner,
                "accuracy": res["accuracy"],
                "mape": res["mape"],
                "rmse": res["rmse"],
                "models": res["allModels"]
            })
        except Exception as e:
            continue

    total_evaluated = len(benchmarks)
    win_rates = [
        {
            "algorithm": algo,
            "wins": count,
            "winRate": f"{round((count / total_evaluated) * 100, 1)}%" if total_evaluated > 0 else "0%"
        }
        for algo, count in win_counts.items()
    ]
    win_rates.sort(key=lambda x: x["wins"], reverse=True)

    avg_accuracy = round(sum(b["accuracy"] for b in benchmarks) / total_evaluated, 1) if total_evaluated > 0 else 0

    result = {
        "totalEvaluatedSKUs": total_evaluated,
        "averageAccuracy": avg_accuracy,
        "winRates": win_rates,
        "benchmarks": benchmarks
    }

    _cached_benchmark = result
    _cached_benchmark_time = now

    # Upsert into MongoDB for cross-process and persistent caching
    try:
        db["benchmarks"].update_one(
            {"type": "all_skus_tournament"},
            {"$set": {**result, "type": "all_skus_tournament", "updatedAt": now}},
            upsert=True
        )
    except Exception:
        pass

    return result


if __name__ == "__main__":
    import uvicorn
    print("[SupplyChainIQ] Starting Python ML Forecasting Microservice on http://127.0.0.1:8000 ...")
    uvicorn.run("forecast_service:app", host="127.0.0.1", port=8000, reload=False, log_level="info")
