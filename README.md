# SupplyChainIQ 📦⚡

Intelligent supply chain data standardization, validation, time-series buy/sell analytics, and machine learning demand forecasting for modern operations teams.

[![MERN Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20FastAPI-0071E3?style=for-the-badge&logo=react&logoColor=white)](https://github.com/Pratham-91/SupplyChainIQ)
[![Python ML](https://img.shields.io/badge/Python%20ML-SARIMA%20%7C%20ARIMA%20%7C%20XGBoost%20%7C%20Statsmodels-30D158?style=for-the-badge&logo=python&logoColor=white)](https://github.com/Pratham-91/SupplyChainIQ)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20v7.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://github.com/Pratham-91/SupplyChainIQ)

> Profile: B.Tech Capstone & enterprise-grade web platform  
> Frontend: React 18 + Vite + Tailwind CSS + Framer Motion + Recharts + TanStack Data Grid + PapaParse  
> Backend: Node.js Express + MongoDB (`mongodb://127.0.0.1:27017/supplychainiq`) with 5,620 seeded transactions across 30 SKUs  
> ML Engine: Python FastAPI service on port `8000` using SARIMA, ARIMA(1,1,1), Holt-Winters, XGBoost, and Random Forest

---

## Overview

SupplyChainIQ is a full-stack decision-support platform designed to help businesses standardize messy supplier data, validate operational records, forecast demand, and manage inventory risk with a modern analytics dashboard.

It combines:

- CSV import and validation workflow
- inventory and buy/sell analytics
- time-series forecasting
- operational what-if simulation
- executive-facing business dashboards

---

## Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                  SupplyChainIQ Web Client                    │
│     React 18 + Vite + Tailwind CSS + Framer Motion         │
│                     Port 5173 / 5000                        │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│                Node.js Express Backend (Port 5000)           │
│  • REST API                                                  │
│  • Buy/Sell aggregation                                      │
│  • inventory formulas                                         │
│  • Python microservice bridge                                 │
└───────────────┬─────────────────────────────┬────────────────┘
                │                             │
                │ Queries & cache             │ HTTP proxy
                ▼                             ▼
┌──────────────────────┐     ┌────────────────────────────────┐
│   MongoDB Local DB    │     │   Python FastAPI ML Service    │
│  • products           │◄────┤  • SARIMA (SARIMAX s=7)        │
│  • transactions       │     │  • ARIMA(1,1,1)                │
│  • forecasts          │     │  • Holt-Winters                │
│  • quarantine logs    │     │  • XGBoost Regressor           │
│  • purchase orders    │     │  • Random Forest               │
└──────────────────────┘     └────────────────────────────────┘
```

---

## Core Modules

### 1) Smart CSV Standardization & Quarantine Studio

- In-browser CSV parsing using PapaParse
- Supplier header mapping for non-standard formats such as `Item_No`, `Qty_Sold`, and `Trans_Date`
- Unit-of-measure conversion from packs and boxes to individual units
- Zod-based validation with 3 rule layers:
  - schema and type checks
  - logical bounds verification
  - outlier spike detection
- Quarantine drawer and inline repair workflow
- Auto-fix support for invalid rows

### 2) Dual Buy-Side vs. Sell-Side Time-Series Analytics

- Unified ledger for procurement and demand streams
- Buy-side tracking of PO dates, arrival dates, vendor lead times, and costs
- Sell-side tracking of sales, promo activity, and revenue
- Stockout-corrected demand imputation using 14-day trailing demand patterns

### 3) Multi-Model Machine Learning & Statistical Forecasting

- SARIMA / SARIMAX for recurring weekly patterns
- ARIMA(1,1,1) as a classical baseline
- Holt-Winters exponential smoothing
- XGBoost regressor with autoregressive lags, rolling stats, and weekday encoding
- Random Forest ensemble for non-linear demand variance
- Time-series diagnostics including ADF stationarity tests and drift analysis
- Holdout validation using MAPE, RMSE, and MAE

### 4) Inventory Optimization & Decision Support

- Safety buffer calculation
- Reorder point planning
- Days of inventory (DoI) estimation
- Inventory health classification:
  - Stockout Risk
  - Reorder Now
  - Healthy
  - Overstocked

### 5) Executive UI & What-If Simulator

- KPI cards with animated counters
- ABC velocity matrix
- dual-panel forecasting dashboards
- synchronized charts for demand and stock depletion
- real-time scenario testing for demand surges, supplier delays, and service levels
- purchase order generation with CSV export

---

## Benchmark Results

Executed across all 30 SKUs and 5,620 historical transactions in MongoDB.

| Metric | Value |
| --- | ---: |
| Total SKUs Evaluated | 30 |
| Evaluation Time | 28.32 seconds |
| Average Forecast Accuracy | 89.82% |
| Average Holdout MAPE | 10.18% |

### Model Leaderboard

| Rank | Algorithm | Family | Wins / 30 | Win Rate | Strength |
| :---: | :--- | :--- | :---: | :---: | :--- |
| 1 | Random Forest | Supervised ML Ensemble | 13 | 43.3% | Non-linear variance & weekend surges |
| 2 | XGBoost Regressor | Gradient Boosted Trees | 12 | 40.0% | Autoregressive lag trend extrapolation |
| 3 | Holt-Winters | Exponential Smoothing | 4 | 13.3% | Weekly seasonal oscillations |
| 4 | SARIMA / ARIMA | State-Space Time Series | 1 | 3.3% | Stationary baseline mean reversion |

---

## Quick Start

### Prerequisites

- Node.js v18+
- Python v3.10+
- MongoDB running locally at `127.0.0.1:27017`

### 1) Install dependencies

```bash
npm run install:all
pip install -r python_service/requirements.txt
```

### 2) Seed the database

```bash
npm run seed
```

This creates the sample dataset with 30 products, 5,620 transactions, and quarantine records.

### 3) Run the services

Open separate terminals and run:

```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Python ML service
npm run python:service

# Terminal 3: Frontend
npm run client
```

### 4) Open the application

Visit:

https://supplychainiq-un5h.onrender.com/

---

## CLI Benchmark Tool

Re-run the forecasting benchmark across all 30 SKUs:

```bash
npm run python:benchmark
```

This prints the leaderboard in the terminal and generates:

`python_service/forecast_benchmark_report.json`

---

## Repository Structure

```text
├── client/                          # React 18 + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── screens/             # ControlTower, DataStudio, ForecastExplorer, Workbench
│   │   │   ├── layout/              # Navbar, Sidebar, CommandPalette
│   │   │   └── common/              # StatCard, Badge, AnimatedCounter
│   │   └── services/api.js         # Resilient API communication layer
│   └── package.json
├── server/                          # Node.js Express REST API
│   ├── src/
│   │   ├── db/                      # MongoDB schemas and seeder
│   │   ├── routes/api.js            # Core API endpoints and Python health checks
│   │   └── services/                # Buy/sell aggregator and forecasting bridge
│   └── package.json
├── python_service/                  # Python time-series + ML microservice
│   ├── forecast_engine.py           # SARIMA, ARIMA, Holt-Winters, XGBoost, ADF tests
│   ├── forecast_service.py          # FastAPI app on port 8000
│   ├── train_and_evaluate.py        # 30-SKU benchmark runner
│   └── requirements.txt
├── package.json                     # Workspace lifecycle scripts
├── README.md
└── LICENSE
```

---

## License

MIT License. Built for a B.Tech capstone presentation and enterprise supply chain evaluation use case.

---

If you want, I can also create a more polished version with a hero section, screenshots, and a premium GitHub landing-page style layout.