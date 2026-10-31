/**
 * SupplyChainIQ - Dual Buy/Sell Time-Series Aggregator
 * Analyzes:
 * - Buy Stream (Procurement spend, arrival dates, supplier lead times)
 * - Sell Stream (Units sold, stockouts, revenue, margin spread)
 */

import { db } from '../db/dataStore.js';
import { imputeStockouts, runModelTournament, computeInventoryPlan } from './forecastingService.js';

export async function getProductTimeSeriesAndForecast(skuCode) {
  const product = await db.getProductBySku(skuCode);
  if (!product) {
    throw new Error(`Product with SKU '${skuCode}' not found.`);
  }

  // Fetch all transactions for this SKU
  const transactions = await db.getAllTransactions({ skuCode });
  const incomingPOs = (await db.getAllPurchaseOrders()).filter(
    po => po.skuCode === skuCode && (po.status === 'ORDERED' || po.status === 'DRAFT')
  );

  // Group transactions by date into unified timeline
  const dateMap = new Map();

  for (const tx of transactions) {
    const d = tx.date;
    if (!dateMap.has(d)) {
      dateMap.set(d, {
        date: d,
        buyQty: 0,
        buyCostTotal: 0,
        sellQty: 0,
        sellRevenueTotal: 0,
        leadTimeDays: tx.leadTimeDays || null,
        wasStockoutDay: Boolean(tx.wasStockoutDay)
      });
    }

    const entry = dateMap.get(d);
    if (tx.type === 'BUY') {
      entry.buyQty += tx.quantity;
      entry.buyCostTotal += tx.quantity * tx.unitPrice;
      if (tx.leadTimeDays) entry.leadTimeDays = tx.leadTimeDays;
    } else if (tx.type === 'SELL') {
      entry.sellQty += tx.quantity;
      entry.sellRevenueTotal += tx.quantity * tx.unitPrice;
      if (tx.wasStockoutDay) entry.wasStockoutDay = true;
    }
  }

  // Sort chronologically
  const sortedDates = Array.from(dateMap.keys()).sort();
  const rawDailySeries = [];

  let runningStock = Math.max(10, product.currentStock - 40); // Approximate historical starting stock
  for (const d of sortedDates) {
    const entry = dateMap.get(d);
    runningStock = Math.max(0, runningStock + entry.buyQty - entry.sellQty);
    const avgBuyPrice = entry.buyQty > 0 ? entry.buyCostTotal / entry.buyQty : product.avgBuyCost;
    const avgSellPrice = entry.sellQty > 0 ? entry.sellRevenueTotal / entry.sellQty : product.sellingPrice;

    rawDailySeries.push({
      date: d,
      buyQty: entry.buyQty,
      sales: entry.sellQty,
      closingStock: runningStock,
      wasStockoutDay: entry.wasStockoutDay || (entry.sellQty === 0 && runningStock === 0),
      avgBuyPrice: Number(avgBuyPrice.toFixed(2)),
      avgSellPrice: Number(avgSellPrice.toFixed(2)),
      marginSpread: Number((avgSellPrice - avgBuyPrice).toFixed(2)),
      leadTimeDays: entry.leadTimeDays
    });
  }

  // 1. Run Stockout Imputation on the daily sales series
  const imputedSeries = imputeStockouts(rawDailySeries);

  // 2. Run Forecasting Model Tournament (Try Python ML FastAPI first, with graceful JavaScript fallback)
  let tournament = null;
  let isPythonEngine = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const pyResponse = await fetch(`http://127.0.0.1:8000/api/forecast/sku/${encodeURIComponent(skuCode)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (pyResponse.ok) {
      const pyData = await pyResponse.json();
      tournament = {
        bestModel: pyData.bestModel,
        bestModelId: pyData.bestModelId,
        bestModelType: pyData.bestModelType,
        bestModelFamily: pyData.bestModelFamily,
        mape: pyData.mape,
        accuracy: pyData.accuracy,
        mae: pyData.mae,
        rmse: pyData.rmse,
        diagnostics: pyData.diagnostics,
        executiveInsights: pyData.executiveInsights,
        allModels: pyData.allModels,
        forecast30: pyData.forecast30,
        dailyForecastArray: pyData.dailyForecastArray,
        imputedDaysCount: pyData.imputedDaysCount,
        rescuedDemandUnits: pyData.rescuedDemandUnits,
        engine: pyData.engine || 'Python ML (FastAPI + SARIMA + ARIMA + XGBoost)'
      };
      isPythonEngine = true;
    }
  } catch (err) {
    // Python service offline or timed out; proceed with pure JS fallback
    isPythonEngine = false;
  }

  // Fallback to pure JavaScript tournament if Python wasn't available
  if (!tournament) {
    tournament = runModelTournament(imputedSeries, 14);
    tournament.engine = 'Pure JavaScript (Holt-Winters / WMA / Croston)';
  }

  // 3. Extract lead times from BUY transactions
  const buyLeadTimes = transactions
    .filter(t => t.type === 'BUY' && t.leadTimeDays)
    .map(t => t.leadTimeDays);

  const dailySalesHistory = imputedSeries.map(p => p.effectiveSales);

  // 4. Compute Automated Inventory Plan (Safety Stock, ROP, DoI, Sawtooth Curve)
  const inventoryPlan = computeInventoryPlan({
    currentStock: product.currentStock,
    dailySalesHistory,
    leadTimes: buyLeadTimes.length > 0 ? buyLeadTimes : [product.avgLeadTimeDays || 7],
    forecast30: tournament.forecast30,
    incomingPOs
  });

  // Combine historical timeline + future 30-day forecast cone into single chart-friendly array
  const combinedForecastChart = [];

  // Historical portion (show last 30 recorded days for optimal visualization density)
  const historySlice = imputedSeries.slice(-30);
  for (const item of historySlice) {
    combinedForecastChart.push({
      date: item.date,
      actualSales: item.sales,
      effectiveSales: item.effectiveSales,
      forecast: null,
      lowerBound: null,
      upperBound: null,
      isHistorical: true,
      wasStockoutDay: item.wasStockoutDay,
      stockoutImputed: item.stockoutImputed
    });
  }

  // Future portion (30 days from today)
  for (let i = 0; i < inventoryPlan.sawtoothTimeline.length; i++) {
    const futurePoint = inventoryPlan.sawtoothTimeline[i];
    const pyDay = (tournament.dailyForecastArray && tournament.dailyForecastArray[i]) || {};

    combinedForecastChart.push({
      date: futurePoint.date,
      actualSales: null,
      effectiveSales: null,
      forecast: futurePoint.predictedDemand,
      sarimaForecast: pyDay.sarimaForecast || futurePoint.predictedDemand,
      arimaForecast: pyDay.arimaForecast || futurePoint.predictedDemand,
      holtWintersForecast: pyDay.holtWintersForecast || futurePoint.predictedDemand,
      xgboostForecast: pyDay.xgboostForecast || futurePoint.predictedDemand,
      randomForestForecast: pyDay.randomForestForecast || futurePoint.predictedDemand,
      lowerBound: pyDay.lowerBound || futurePoint.lowerBound,
      upperBound: pyDay.upperBound || futurePoint.upperBound,
      lowerBound80: pyDay.lowerBound80 || Math.round(futurePoint.predictedDemand * 0.9),
      upperBound80: pyDay.upperBound80 || Math.round(futurePoint.predictedDemand * 1.1),
      lowerBound99: pyDay.lowerBound99 || Math.max(0, Math.round(futurePoint.predictedDemand * 0.75)),
      upperBound99: pyDay.upperBound99 || Math.round(futurePoint.predictedDemand * 1.25),
      isHistorical: false,
      wasStockoutDay: false,
      stockoutImputed: false
    });
  }

  return {
    product,
    tournament,
    inventoryPlan,
    historicalDailySeries: imputedSeries,
    combinedForecastChart,
    sawtoothDepletionChart: inventoryPlan.sawtoothTimeline
  };
}

/**
 * Aggregates monthly/weekly buy vs sell cashflow across all products
 */
export async function getDashboardFinancialSummary() {
  const transactions = await db.getAllTransactions();
  const products = await db.getAllProducts();

  let totalInventoryValue = 0;
  let healthyCount = 0;
  let atRiskCount = 0;
  let reorderCount = 0;
  let overstockedCount = 0;

  // Compute 3x3 ABC Velocity Matrix counts
  // Matrix: Row = ABC (A, B, C), Col = Velocity (Fast, Steady, Slow)
  const abcMatrix = {
    'A-Fast': [],
    'A-Steady': [],
    'A-Slow': [],
    'B-Fast': [],
    'B-Steady': [],
    'B-Slow': [],
    'C-Fast': [],
    'C-Steady': [],
    'C-Slow': []
  };

  for (const p of products) {
    const val = (p.currentStock || 0) * (p.avgBuyCost || 0);
    totalInventoryValue += val;

    if (p.status === 'Stockout Risk') atRiskCount++;
    else if (p.status === 'Reorder Now') reorderCount++;
    else if (p.status === 'Overstocked') overstockedCount++;
    else healthyCount++;

    const key = `${p.abcCategory || 'B'}-${p.velocityCategory || 'Steady'}`;
    if (abcMatrix[key]) {
      abcMatrix[key].push({
        skuCode: p.skuCode,
        name: p.name,
        currentStock: p.currentStock,
        status: p.status
      });
    }
  }

  // Monthly cashflow grouping (last 6 months)
  const monthlyMap = new Map();
  for (const tx of transactions) {
    const monthKey = tx.date.substring(0, 7); // YYYY-MM
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        month: monthKey,
        procurementSpend: 0,
        salesRevenue: 0,
        grossProfit: 0,
        unitsBought: 0,
        unitsSold: 0
      });
    }

    const m = monthlyMap.get(monthKey);
    const amount = tx.quantity * tx.unitPrice;
    if (tx.type === 'BUY') {
      m.procurementSpend += amount;
      m.unitsBought += tx.quantity;
    } else if (tx.type === 'SELL') {
      m.salesRevenue += amount;
      m.unitsSold += tx.quantity;
    }
    m.grossProfit = m.salesRevenue - m.procurementSpend;
  }

  const monthlyCashflow = Array.from(monthlyMap.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);

  // 30-day projected revenue vs spend
  const recentMonthly = monthlyCashflow[monthlyCashflow.length - 1] || {
    procurementSpend: 42000,
    salesRevenue: 68500
  };
  const projectedSpend = Math.round(recentMonthly.procurementSpend * 1.05);
  const projectedRevenue = Math.round(recentMonthly.salesRevenue * 1.08);

  return {
    kpis: {
      totalInventoryValue: Math.round(totalInventoryValue),
      totalProducts: products.length,
      healthySkus: healthyCount,
      atRiskSkus: atRiskCount,
      reorderSkus: reorderCount,
      overstockedSkus: overstockedCount,
      dataQualityScore: db.getQualityScore(),
      projected30DayRevenue: projectedRevenue,
      projected30DaySpend: projectedSpend
    },
    abcMatrix,
    monthlyCashflow
  };
}
