# SupplyChainIQ 📦⚡
### Intelligent Supply Chain Data Standardization, Validation, Time-Series Buy/Sell Analytics, and Machine Learning Demand Forecasting Web Platform

[![MERN Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20FastAPI-0071E3?style=for-the-badge&logo=react&logoColor=white)](https://github.com/Pratham-91/supplychainiq)
[![Python ML](https://img.shields.io/badge/Python%20ML-SARIMA%20%7C%20ARIMA%20%7C%20XGBoost%20%7C%20Statsmodels-30D158?style=for-the-badge&logo=python&logoColor=white)](https://github.com/Pratham-91/supplychainiq)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20v7.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://github.com/Pratham-91/supplychainiq)
[![Design](https://img.shields.io/badge/Design-Apple%20Obsidian%20Bento-BF5AF2?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/Pratham-91/supplychainiq)
[![Pure JS](https://img.shields.io/badge/Constraint-100%25%20Pure%20JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://github.com/Pratham-91/supplychainiq)

> **Profile:** B.Tech Capstone & Enterprise-Grade Web Platform  
> **Frontend:** Pure JavaScript React 18, Vite, Tailwind CSS, Framer Motion, Recharts, TanStack Data Grid, PapaParse  
> **Backend:** Node.js Express ESM + Local MongoDB (`mongodb://127.0.0.1:27017/supplychainiq`) with 5,620 seeded transactions across 30 SKUs  
> **ML Engine:** Python FastAPI Microservice (Port 8000) running **SARIMA**, **ARIMA(1,1,1)**, **Holt-Winters**, **XGBoost Regressor**, and **Random Forest** with out-of-sample holdout cross-validation

---

## 🌟 Key Product Architecture & Differentiators

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      SupplyChainIQ Web Client                          │
 │         React 18 + Vite + Tailwind CSS + Framer Motion (Port 5173/5000)│
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      Node.js Express Server (Port 5000)                │
 │       • High-speed REST API                                            │
 │       • Dual Buy/Sell Aggregator & Inventory Formulas                  │
 │       • Resilient Python Microservice Bridge (with JS Fallback)        │
 └───────────────────┬────────────────────────────────┬───────────────────┘
                     │                                │
                     │ Queries & Caches               │ HTTP Proxy (:8000)
                     ▼                                ▼
 ┌──────────────────────────────────────┐    ┌────────────────────────────┐
 │           MongoDB Server             │    │  Python FastAPI Service    │
 │       (127.0.0.1:27017/supplychainiq)│◄───┤        (Port 8000)         │
 │  • products (30 catalog items)       │    │ • SARIMA (SARIMAX s=7)     │
 │  • transactions (5,620 Buy/Sell rows)│    │ • ARIMA(1,1,1) (Statsmodels│
 │  • forecasts (cached ML predictions) │    │ • Holt-Winters Smoothing   │
 │  • quarantine_logs & purchase_orders │    │ • XGBoost Regressor (ML)   │
 └──────────────────────────────────────┘    └────────────────────────────┘
```

### Module 1: Smart CSV Standardization & Quarantine Studio
* **In-Browser CSV Parsing:** Powered by **PapaParse** for instant file previews.
* **Column Mapping Stepper:** Maps non-standard supplier headers (`Item_No`, `Qty_Sold`, `Trans_Date`) to standard platform fields.
* **Unit of Measure (UoM) Converter:** Converts wholesale packs/boxes to individual pieces via conversion multipliers.
* **Zod 3-Rule Validation Engine:**
  * *Rule 1 (Schema & Types):* Detects blank SKU codes, missing dates, and unparseable prices.
  * *Rule 2 (Logical Bounds):* Identifies negative inventory quantities and selling prices below purchase costs.
  * *Rule 3 (Outlier Spike Detection):* Identifies accidental extra-zero typos (>5x baseline volume).
* **Quarantine Drawer & Inline Fix:** Invalid rows are isolated with red explanation badges. Users can fix rows inline or click **"Auto-Fix All"**.

### Module 2: Dual Buy-Side vs. Sell-Side Time-Series Analytics
* **Unified Ledger:** Tracks both procurement streams (PO date, arrival date, actual vendor lead time, buy cost) and customer demand streams (sales, promo tags, revenue).
* **Stockout-Corrected Demand Imputation (Pandas & Node.js):** When sales drop to `0` due to `currentStock == 0`, the engine replaces artificial zeros with trailing 14-day rolling demand.

### Module 3: Multi-Model Machine Learning & Statistical Engine
* **SARIMA (Seasonal ARIMA):** $\text{SARIMAX}(1, 1, 1) \times (1, 0, 1, s=7)$ capturing weekly recurring retail demand patterns.
* **ARIMA(1, 1, 1):** Classical non-seasonal autoregressive integrated moving average for stationary baselines.
* **Holt-Winters Triple Exponential Smoothing:** Estimates continuous Level ($\alpha$), Additive Trend ($\beta$), and Weekly Seasonality ($\gamma$).
* **XGBoost Regressor:** 14-day autoregressive sliding lag features ($t-1, t-2, t-3, t-7, t-14$), rolling mean, rolling standard deviation, and day-of-week encoding.
* **Random Forest Regressor:** Ensemble of 40 trees capturing non-linear demand variance.
* **Time-Series Diagnostics:** Augmented Dickey-Fuller (ADF) stationarity test, $p$-values, peak velocity days, and trend drift.
* **Holdout Tournament:** All models compete on a 14-day holdout validation split evaluating **MAPE**, **RMSE**, and **MAE**.
* **Automated Inventory Math:**
  $$\text{Safety Buffer} = (\text{Max Daily Demand} \times \text{Max Lead Time}) - (\text{Avg Daily Demand} \times \text{Avg Lead Time})$$
  $$\text{Reorder Point (ROP)} = (\text{Forecasted Daily Demand} \times \text{Avg Lead Time}) + \text{Safety Buffer}$$
  $$\text{Days of Inventory (DoI)} = \frac{\text{Current Stock}}{\text{Forecasted Daily Demand}}$$

### Module 4 & 5: Apple-Grade Website UI/UX & What-If Simulator
* **Executive Control Tower:** 4 animated count-up KPI cards, 3x3 interactive ABC Velocity Matrix, and monthly Buy vs Sell cashflow chart.
* **Predictive Analysis Studio:** Model switcher pills (SARIMA, ARIMA, Holt-Winters, XGBoost, Multi-Model Consensus), confidence level toggles (80%, 95%, 99%), and statistical diagnostic bento cards.
* **Synchronized Dual Charts:** Top Sell-side demand forecast cone + Bottom Buy-side sawtooth stock depletion step curve.
* **Inventory Workbench:** Filterable data grid with color-coded replenishment badges (`Stockout Risk`, `Reorder Now`, `Healthy`, `Overstocked`).
* **What-If Simulator Drawer:** Real-time sliders (*Demand Surge %*, *Supplier Delay Days*, *Service Level %*) updating stockout dates at 60 FPS.
* **Purchase Orders:** Generates formal PO vouchers with 1-click CSV export.

---

## 📊 30-SKU Model Tournament Benchmark Results

Executed across **all 30 enterprise SKUs** and **5,620 historical transactions** in MongoDB:
* **Total SKUs Evaluated:** 30
* **Evaluation Time:** 28.32 seconds
* **Average Forecast Accuracy:** **89.82%**
* **Average Holdout MAPE:** **10.18%**

### Model Leaderboard & Win Rates:
| Rank | Algorithm Model | Architecture Family | Wins / 30 SKUs | Win Rate | Primary Strength |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **1** | **Random Forest** | Supervised ML Ensemble | **13** | **43.3%** | Non-linear variance & weekend surges |
| **2** | **XGBoost Regressor** | Gradient Boosted Trees | **12** | **40.0%** | Autoregressive lag trend extrapolation |
| **3** | **Holt-Winters** | Exponential Smoothing | **4** | **13.3%** | Strict weekly seasonal oscillations |
| **4** | **SARIMA / ARIMA** | Statespace Time-Series | **1** | **3.3%** | Stationary baseline mean-reversion |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js:** v18+ (tested on Node v22)
- **Python:** v3.10+ (tested on Python 3.12)
- **MongoDB:** Running locally on `127.0.0.1:27017` (e.g. Windows service `MongoDB` or MongoDB Community)

### 2. Install Dependencies
```bash
# Install root, server, and client Node dependencies
npm run install:all

# Install Python ML dependencies
pip install -r python_service/requirements.txt
```

### 3. Seed Database
```bash
# Seeds 30 products, 5,620 transactions, and quarantine logs into local MongoDB
npm run seed
```

### 4. Run the Platform
You can run all three services concurrently in separate terminals:

```bash
# Terminal 1: Node.js Express Backend (Port 5000)
npm run server

# Terminal 2: Python FastAPI ML Microservice (Port 8000)
npm run python:service

# Terminal 3: React Vite Client (Port 5173)
npm run client
```

### 5. Access the Application
* **Frontend Web App:** [http://localhost:5173](http://localhost:5173) (or served via backend at [http://localhost:5000](http://localhost:5000))
* **FastAPI Microservice Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **Backend Health Check:** [http://127.0.0.1:5000/health](http://127.0.0.1:5000/health)

---

## 🧪 CLI Benchmark Tool

To re-run the statistical model tournament across all 30 SKUs anytime:
```bash
npm run python:benchmark
```
This prints the ASCII evaluation leaderboard in your terminal and generates `python_service/forecast_benchmark_report.json`.

---

## 📁 Repository Structure

```text
├── client/                     # React 18 + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── screens/        # ControlTower, DataStudio, ForecastExplorer, Workbench
│   │   │   ├── layout/         # Navbar, Sidebar, CommandPalette
│   │   │   └── common/         # StatCard, Badge, AnimatedCounter
│   │   └── services/api.js     # Resilient API communication layer
│   └── package.json
├── server/                     # Node.js Express REST API
│   ├── src/
│   │   ├── db/                 # MongoDB schemas & data seeder
│   │   ├── routes/api.js       # 6 core blueprint endpoints + Python status
│   │   └── services/           # Buy/Sell aggregator & forecasting bridge
│   └── package.json
├── python_service/             # Python Time-Series & ML Microservice
│   ├── forecast_engine.py      # SARIMA, ARIMA, Holt-Winters, XGBoost, ADF test
│   ├── forecast_service.py     # FastAPI server on port 8000
│   ├── train_and_evaluate.py   # 30-SKU CLI benchmarking tool
│   └── requirements.txt
├── package.json                # Unified workspace lifecycle scripts
└── README.md
```

---

## 📜 License
MIT License. Built for B.Tech Capstone Presentation and enterprise supply chain evaluation.
