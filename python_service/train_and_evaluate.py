"""
SupplyChainIQ - Python Machine Learning Model Benchmark & Evaluation CLI
Run this script to benchmark all 30 SKUs from MongoDB across:
1. Holt-Winters Triple Exponential Smoothing (statsmodels)
2. ARIMA(1, 1, 1) Autoregressive (statsmodels)
3. XGBoost Lag Regressor (xgboost)
4. Random Forest Ensemble (scikit-learn)
"""

import os
import sys
import json
import time
from datetime import datetime
import pymongo
from pymongo import MongoClient

# Add directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
from forecast_engine import run_tournament

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/supplychainiq")


def print_banner():
    print("=" * 88)
    print("   SUPPLYCHAINIQ | PYTHON TIME-SERIES & MACHINE LEARNING BENCHMARK SUITE   ")
    print("=" * 88)
    print(f"MongoDB Target : {MONGO_URI}")
    print(f"Timestamp      : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("Models Tested  : Holt-Winters, ARIMA(1,1,1), XGBoost Regressor, Random Forest")
    print("Evaluation Metric: Holdout 14-Day MAPE & Accuracy (100 - MAPE)")
    print("-" * 88)


def run_benchmark():
    start_time = time.time()
    print_banner()

    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
        client.admin.command('ping')
        db = client["supplychainiq"]
    except Exception as e:
        print(f"\n[ERROR] Could not connect to MongoDB at {MONGO_URI}: {e}")
        print("Please ensure MongoDB service is running (net start MongoDB).")
        return

    products = list(db["products"].find({}, {"skuCode": 1, "name": 1, "category": 1}).sort("skuCode", 1))
    total_products = len(products)
    print(f"Loaded {total_products} products from MongoDB.\n")

    if total_products == 0:
        print("[WARNING] No products found in 'products' collection. Please run: npm run seed in /server")
        return

    results = []
    win_counts = {
        "Holt-Winters (Statsmodels)": 0,
        "ARIMA(1,1,1) (Statsmodels)": 0,
        "XGBoost Regressor (ML)": 0,
        "Random Forest (Ensemble)": 0
    }

    print(f"{'SKU CODE':<15} | {'CATEGORY':<14} | {'BEST MODEL':<24} | {'ACCURACY':<9} | {'MAPE':<8} | {'RMSE':<7}")
    print("-" * 88)

    for prod in products:
        sku = prod["skuCode"]
        cat = prod.get("category", "General")[:13]

        # Fetch sell transactions for this SKU
        txs = list(db["transactions"].find(
            {"skuCode": sku, "type": "SELL"}
        ).sort("date", pymongo.ASCENDING))

        if len(txs) < 14:
            print(f"{sku:<15} | {cat:<14} | {'SKIPPED (Insufficient Data)':<24} | {'N/A':<9} | {'N/A':<8} | {'N/A':<7}")
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
            res = run_tournament(records, test_window=14, horizon=30)
            winner = res["bestModel"]
            win_counts[winner] = win_counts.get(winner, 0) + 1

            # Shorten name for table display
            short_winner = winner.replace(" (Statsmodels)", "").replace(" (ML)", "").replace(" (Ensemble)", "")

            print(f"{sku:<15} | {cat:<14} | {short_winner:<24} | {res['accuracy']:>6.1f}%   | {res['mape']:>6.1f}% | {res['rmse']:>5.2f}")

            results.append({
                "skuCode": sku,
                "name": prod.get("name"),
                "category": prod.get("category"),
                "bestModel": winner,
                "accuracy": res["accuracy"],
                "mape": res["mape"],
                "rmse": res["rmse"],
                "allModels": res["allModels"]
            })

            # Also update MongoDB forecast cache
            db["forecasts"].update_one(
                {"skuCode": sku},
                {
                    "$set": {
                        "skuCode": sku,
                        "generatedAt": datetime.utcnow(),
                        "bestModelUsed": winner,
                        "mapeAccuracy": res["accuracy"],
                        "dailyForecastArray": res["dailyForecastArray"],
                        "engine": res["engine"]
                    }
                },
                upsert=True
            )

        except Exception as err:
            print(f"{sku:<15} | {cat:<14} | ERROR: {str(err)[:30]:<24} | {'--':<9} | {'--':<8} | {'--':<7}")

    print("=" * 88)
    elapsed = time.time() - start_time
    total_eval = len(results)

    if total_eval > 0:
        avg_acc = sum(r["accuracy"] for r in results) / total_eval
        avg_mape = sum(r["mape"] for r in results) / total_eval

        print(f"\nBENCHMARK TOURNAMENT SUMMARY ({total_eval} SKUs Evaluated in {elapsed:.2f}s):")
        print(f"  * Average Forecast Accuracy : {avg_acc:.2f}%")
        print(f"  * Average Holdout MAPE      : {avg_mape:.2f}%")
        print("\nMODEL WINNER BREAKDOWN & LEADERBOARD:")
        for algo, count in sorted(win_counts.items(), key=lambda x: x[1], reverse=True):
            pct = (count / total_eval) * 100 if total_eval > 0 else 0
            bar = "#" * int(pct / 5)
            print(f"  * {algo:<28} : {count:>2} wins ({pct:>5.1f}%)  [{bar}]")

        # Save summary report to JSON
        output_file = os.path.join(os.path.dirname(__file__), "forecast_benchmark_report.json")
        with open(output_file, "w") as f:
            json.dump({
                "evaluatedAt": datetime.utcnow().isoformat(),
                "totalSKUs": total_eval,
                "averageAccuracy": round(avg_acc, 2),
                "averageMAPE": round(avg_mape, 2),
                "elapsedSeconds": round(elapsed, 2),
                "winLeaderboard": win_counts,
                "skuDetails": results
            }, f, indent=2)
        print(f"\nSaved detailed benchmark report to: {output_file}")
    print("=" * 88)


if __name__ == "__main__":
    run_benchmark()
