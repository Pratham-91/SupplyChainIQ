import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Award,
  Calendar,
  Layers,
  SlidersHorizontal,
  ChevronDown,
  ShoppingCart,
  Boxes,
  RefreshCw,
  Cpu,
  BarChart3,
  CheckCircle2,
  X,
  Sparkles,
  Zap,
  Activity,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
  ShieldCheck,
  Eye,
  GitCompare,
  Database,
  HelpCircle
} from 'lucide-react';
import { StatusBadge, AbcBadge } from '../common/Badge.jsx';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import {
  fetchProductForecast,
  fetchForecastingStatus,
  fetchForecastingBenchmark
} from '../../services/api.js';

export function ForecastExplorer({
  selectedSku = 'SKU-ELEC-001',
  onSelectSku,
  products = [],
  onOpenWhatIf,
  onOpenCreatePo
}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Model View Selection
  // 'winner' | 'sarima' | 'arima' | 'holt_winters' | 'xgboost' | 'random_forest' | 'consensus'
  const [activeModelTab, setActiveModelTab] = useState('winner');

  // Horizon & Confidence Band controls
  const [forecastHorizon, setForecastHorizon] = useState(30); // 7, 14, 30, 60
  const [confidenceLevel, setConfidenceLevel] = useState('95'); // '80' | '95' | '99'

  // Python ML microservice status & benchmark modal
  const [pyStatus, setPyStatus] = useState(null);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [isLoadingBenchmark, setIsLoadingBenchmark] = useState(false);

  useEffect(() => {
    checkEngineStatus();
  }, []);

  useEffect(() => {
    if (selectedSku) {
      loadForecastData(selectedSku);
    }
  }, [selectedSku]);

  async function checkEngineStatus() {
    try {
      const res = await fetchForecastingStatus();
      setPyStatus(res);
    } catch (e) {
      setPyStatus({ available: false });
    }
  }

  async function loadForecastData(sku) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchProductForecast(sku);
      setData(res);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function openBenchmarkLeaderboard() {
    setShowBenchmarkModal(true);
    if (!benchmarkData) {
      setIsLoadingBenchmark(true);
      try {
        const res = await fetchForecastingBenchmark();
        setBenchmarkData(res);
      } catch (err) {
        console.error('Benchmark fetch failed:', err);
      } finally {
        setIsLoadingBenchmark(false);
      }
    }
  }

  const currentProduct = products.find(p => p.skuCode === selectedSku) || data?.product;
  const tournament = data?.tournament;
  const inventoryPlan = data?.inventoryPlan;
  const combinedChart = data?.combinedForecastChart || [];
  const sawtoothChart = data?.sawtoothDepletionChart || [];
  const diagnostics = tournament?.diagnostics;
  const executiveInsights = tournament?.executiveInsights || [];
  const allModels = tournament?.allModels || [];

  const isPythonEngine = tournament?.engine?.includes('Python ML') || pyStatus?.available;

  // Filter combined chart by selected forecast horizon
  const filteredCombinedChart = combinedChart.filter(point => {
    if (point.isHistorical) return true;
    const historyCount = combinedChart.filter(p => p.isHistorical).length;
    const futureIndex = combinedChart.indexOf(point) - historyCount;
    return futureIndex < forecastHorizon;
  });

  // Determine active forecast key and name for the primary forecast line
  let activeForecastKey = 'forecast';
  let activeForecastName = tournament ? `${tournament.bestModel} (Optimal Fit)` : 'Forecast';
  let activeForecastColor = '#BF5AF2';

  if (activeModelTab === 'sarima') {
    activeForecastKey = 'sarimaForecast';
    activeForecastName = 'SARIMA (Seasonal ARIMA)';
    activeForecastColor = '#30D158';
  } else if (activeModelTab === 'arima') {
    activeForecastKey = 'arimaForecast';
    activeForecastName = 'ARIMA(1,1,1) Standard';
    activeForecastColor = '#FF9F0A';
  } else if (activeModelTab === 'holt_winters') {
    activeForecastKey = 'holtWintersForecast';
    activeForecastName = 'Holt-Winters (Statsmodels)';
    activeForecastColor = '#64D2FF';
  } else if (activeModelTab === 'xgboost') {
    activeForecastKey = 'xgboostForecast';
    activeForecastName = 'XGBoost Regressor (ML)';
    activeForecastColor = '#FF375F';
  } else if (activeModelTab === 'random_forest') {
    activeForecastKey = 'randomForestForecast';
    activeForecastName = 'Random Forest (Ensemble)';
    activeForecastColor = '#5E5CE6';
  }

  // Selected Confidence Bounds Keys
  const lowerBoundKey = confidenceLevel === '80' ? 'lowerBound80' : confidenceLevel === '99' ? 'lowerBound99' : 'lowerBound';
  const upperBoundKey = confidenceLevel === '80' ? 'upperBound80' : confidenceLevel === '99' ? 'upperBound99' : 'upperBound';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* 1. Header Toolbar Strip */}
      <div className="apple-card p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={selectedSku}
                onChange={(e) => onSelectSku(e.target.value)}
                className="appearance-none rounded-full border border-white/[0.1] bg-[#0A0A0C] px-4 py-2 pr-10 text-xs font-semibold text-white outline-none focus:border-white/30"
              >
                {products.map((p) => (
                  <option key={p.skuCode} value={p.skuCode}>
                    {p.skuCode} — {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-3 h-3.5 w-3.5 text-neutral-400" />
            </div>

            {currentProduct && (
              <div className="flex items-center gap-2">
                <AbcBadge category={currentProduct.abcCategory} velocity={currentProduct.velocityCategory} />
                <StatusBadge status={inventoryPlan?.status || currentProduct.status} />
              </div>
            )}

            {/* Python ML Engine Indicator Badge */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${
                isPythonEngine
                  ? 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20'
                  : 'bg-white/[0.04] text-neutral-400 border-white/[0.08]'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isPythonEngine ? 'bg-[#30D158] animate-pulse' : 'bg-neutral-500'}`} />
                <span>{isPythonEngine ? 'Python ML Active (FastAPI :8000)' : 'JS Analytical Engine'}</span>
              </div>

              <button
                onClick={openBenchmarkLeaderboard}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white border border-white/[0.08] transition-all"
                title="View 30-SKU Tournament Leaderboard"
              >
                <BarChart3 className="h-3 w-3 text-[#2997FF]" />
                <span>30-SKU Leaderboard</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onOpenWhatIf(selectedSku)}
              className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-white/[0.08] hover:text-white transition-all active:scale-[0.98]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-400" />
              <span>Simulate Lead Time & Demand</span>
            </button>

            <button
              onClick={() => onOpenCreatePo(currentProduct)}
              className="flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-4 py-2 text-xs font-medium text-white shadow-apple-sm transition-all active:scale-[0.98]"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Authorize Order</span>
            </button>
          </div>
        </div>

        {/* 6 Bento Formula Chips */}
        {inventoryPlan && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            <div className="rounded-xl bg-white/[0.02] p-3 border border-white/[0.04]">
              <span className="text-[11px] font-medium text-neutral-500 block">Current Inventory</span>
              <span className="text-xl font-semibold tracking-tight text-white mt-1 block font-mono">
                {inventoryPlan.currentStock}
              </span>
            </div>

            <div className="rounded-xl bg-white/[0.02] p-3 border border-white/[0.04]">
              <span className="text-[11px] font-medium text-neutral-500 block">Daily Run-Rate</span>
              <span className="text-xl font-semibold tracking-tight text-[#30D158] mt-1 block font-mono">
                {inventoryPlan.forecastedDailyDemand}/d
              </span>
            </div>

            <div className="rounded-xl bg-white/[0.02] p-3 border border-white/[0.04]">
              <span className="text-[11px] font-medium text-neutral-500 block">Days of Inv (DoI)</span>
              <span className={`text-xl font-semibold tracking-tight mt-1 block font-mono ${
                inventoryPlan.daysOfInventory < 7 ? 'text-[#FF453A]' : 'text-white'
              }`}>
                {inventoryPlan.daysOfInventory}d
              </span>
            </div>

            <div className="rounded-xl bg-white/[0.02] p-3 border border-white/[0.04]">
              <span className="text-[11px] font-medium text-neutral-500 block">Safety Buffer</span>
              <span className="text-xl font-semibold tracking-tight text-neutral-200 mt-1 block font-mono">
                {inventoryPlan.safetyStock}
              </span>
            </div>

            <div className="rounded-xl bg-white/[0.02] p-3 border border-white/[0.04]">
              <span className="text-[11px] font-medium text-neutral-500 block">Reorder Point (ROP)</span>
              <span className="text-xl font-semibold tracking-tight text-[#FF9F0A] mt-1 block font-mono">
                {inventoryPlan.reorderPoint}
              </span>
            </div>

            <div className="rounded-xl bg-white/[0.02] p-3 border border-white/[0.04]">
              <span className="text-[11px] font-medium text-neutral-500 block">Depletion Runway</span>
              <span className={`text-xs font-semibold tracking-tight mt-2 block font-mono ${
                inventoryPlan.projectedStockoutDate.includes('Safe') ? 'text-[#30D158]' : 'text-[#FF453A]'
              }`}>
                {inventoryPlan.projectedStockoutDate}
              </span>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="apple-card p-16 text-center text-neutral-500 flex items-center justify-center gap-2 text-xs">
          <RefreshCw className="h-4 w-4 animate-spin text-[#0071E3]" />
          <span>Synthesizing SARIMA, ARIMA, Holt-Winters & XGBoost models...</span>
        </div>
      ) : error ? (
        <div className="apple-card p-8 text-center text-[#FF453A] border-[#FF453A]/20">
          {error}
        </div>
      ) : (
        <div className="space-y-6">

          {/* 2. Predictive Analysis Studio: Model Selector & Horizon Controls */}
          <div className="apple-card p-6 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                  <Compass className="h-4 w-4 text-[#2997FF]" />
                  <span>Predictive Analysis Studio & Model Engine Selector</span>
                </h3>
                <p className="text-[12px] text-neutral-400 mt-0.5">
                  Toggle individual algorithmic projections or inspect multi-model consensus
                </p>
              </div>

              {/* Horizon & Confidence Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Horizon Switcher */}
                <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/[0.08]">
                  <span className="text-[10px] uppercase font-semibold text-neutral-500 px-2">Horizon:</span>
                  {[7, 14, 30].map((h) => (
                    <button
                      key={h}
                      onClick={() => setForecastHorizon(h)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                        forecastHorizon === h
                          ? 'bg-white text-black font-semibold shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {h}D
                    </button>
                  ))}
                </div>

                {/* Confidence Level Switcher */}
                <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/[0.08]">
                  <span className="text-[10px] uppercase font-semibold text-neutral-500 px-2">Confidence:</span>
                  {['80', '95', '99'].map((cl) => (
                    <button
                      key={cl}
                      onClick={() => setConfidenceLevel(cl)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                        confidenceLevel === cl
                          ? 'bg-[#0071E3] text-white font-semibold shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {cl}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Model Segmented Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveModelTab('winner')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeModelTab === 'winner'
                    ? 'bg-gradient-to-r from-[#BF5AF2] to-[#9933CC] text-white shadow-apple-sm'
                    : 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                }`}
              >
                <Award className="h-3.5 w-3.5" />
                <span>★ Optimal Fit ({tournament?.bestModel || 'Winner'})</span>
              </button>

              <button
                onClick={() => setActiveModelTab('sarima')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeModelTab === 'sarima'
                    ? 'bg-[#30D158] text-black font-semibold shadow-apple-sm'
                    : 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                <span>SARIMA (Seasonal Statespace)</span>
              </button>

              <button
                onClick={() => setActiveModelTab('arima')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeModelTab === 'arima'
                    ? 'bg-[#FF9F0A] text-black font-semibold shadow-apple-sm'
                    : 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                }`}
              >
                <Gauge className="h-3.5 w-3.5" />
                <span>ARIMA(1,1,1) Standard</span>
              </button>

              <button
                onClick={() => setActiveModelTab('holt_winters')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeModelTab === 'holt_winters'
                    ? 'bg-[#64D2FF] text-black font-semibold shadow-apple-sm'
                    : 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Holt-Winters (Statsmodels)</span>
              </button>

              <button
                onClick={() => setActiveModelTab('xgboost')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeModelTab === 'xgboost'
                    ? 'bg-[#FF375F] text-white font-semibold shadow-apple-sm'
                    : 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                }`}
              >
                <Cpu className="h-3.5 w-3.5" />
                <span>XGBoost (ML Regressor)</span>
              </button>

              <button
                onClick={() => setActiveModelTab('consensus')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeModelTab === 'consensus'
                    ? 'bg-[#5E5CE6] text-white font-semibold shadow-apple-sm'
                    : 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                }`}
              >
                <GitCompare className="h-3.5 w-3.5" />
                <span>☵ Multi-Model Consensus</span>
              </button>
            </div>

            {/* Top Interactive Canvas: Demand Trajectory with Multi-Model Capabilities */}
            <div className="h-84 w-full pt-2">
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart
                  data={filteredCombinedChart}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#515154"
                    fontSize={11}
                    tickLine={false}
                    interval={forecastHorizon <= 14 ? 2 : 4}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  />
                  <YAxis
                    stroke="#515154"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141416',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '14px',
                      fontSize: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                      color: '#F5F5F7'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                  {/* Shaded Confidence Cone */}
                  <Area
                    type="monotone"
                    dataKey={upperBoundKey}
                    name={`Upper Bound (${confidenceLevel}%)`}
                    stroke="none"
                    fill={activeForecastColor}
                    fillOpacity={0.12}
                  />
                  <Area
                    type="monotone"
                    dataKey={lowerBoundKey}
                    name={`Lower Bound (${confidenceLevel}%)`}
                    stroke="none"
                    fill={activeForecastColor}
                    fillOpacity={0.0}
                  />

                  {/* Historical Realized Sales */}
                  <Line
                    type="monotone"
                    dataKey="actualSales"
                    name="Historical Sales"
                    stroke="#30D158"
                    strokeWidth={2}
                    dot={{ r: 1.5, fill: '#30D158' }}
                    activeDot={{ r: 4 }}
                  />

                  {/* Stockout-Corrected Imputed Line */}
                  <Line
                    type="monotone"
                    dataKey="effectiveSales"
                    name="Stockout-Imputed"
                    stroke="#FF9F0A"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    dot={false}
                  />

                  {/* Individual Selected Model Forecast Line OR Consensus View */}
                  {activeModelTab !== 'consensus' ? (
                    <Line
                      type="monotone"
                      dataKey={activeForecastKey}
                      name={activeForecastName}
                      stroke={activeForecastColor}
                      strokeWidth={2.5}
                      strokeDasharray="4 4"
                      dot={{ r: 2, fill: activeForecastColor }}
                    />
                  ) : (
                    <>
                      <Line
                        type="monotone"
                        dataKey="sarimaForecast"
                        name="SARIMA"
                        stroke="#30D158"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="arimaForecast"
                        name="ARIMA(1,1,1)"
                        stroke="#FF9F0A"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="holtWintersForecast"
                        name="Holt-Winters"
                        stroke="#64D2FF"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="xgboostForecast"
                        name="XGBoost"
                        stroke="#FF375F"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="randomForestForecast"
                        name="Random Forest"
                        stroke="#5E5CE6"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={false}
                      />
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Statistical Diagnostics Bento Grid (ADF, Seasonality, Drift, Imputation) */}
          {diagnostics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Stationarity & ADF */}
              <div className="apple-card p-5 space-y-2 border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-400">Stationarity (ADF Test)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    diagnostics.isStationary ? 'bg-[#30D158]/10 text-[#30D158]' : 'bg-[#FF9F0A]/10 text-[#FF9F0A]'
                  }`}>
                    {diagnostics.isStationary ? 'Stationary (d=0)' : 'Differenced (d=1)'}
                  </span>
                </div>
                <div className="text-xl font-semibold text-white tracking-tight font-mono">
                  t = {diagnostics.adfStatistic}
                </div>
                <p className="text-[11px] text-neutral-500">
                  p-value: <span className="text-neutral-300 font-mono">{diagnostics.pValStationarity}</span> (Critical: 5%)
                </p>
              </div>

              {/* Card 2: 7-Day Weekly Seasonality */}
              <div className="apple-card p-5 space-y-2 border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-400">Weekly Rhythm (SARIMA)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#2997FF]/10 text-[#2997FF]">
                    Cycle: s=7
                  </span>
                </div>
                <div className="text-xl font-semibold text-white tracking-tight font-mono">
                  Peak: {diagnostics.peakDemandDay} ({diagnostics.peakDayMultiplier}x)
                </div>
                <p className="text-[11px] text-neutral-500">
                  Seasonality index: <span className="text-neutral-300 font-mono">{diagnostics.seasonalityStrength}%</span> variance
                </p>
              </div>

              {/* Card 3: Trend Momentum & Drift */}
              <div className="apple-card p-5 space-y-2 border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-400">Trend Momentum</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    diagnostics.weeklyDriftUnits >= 0 ? 'bg-[#30D158]/10 text-[#30D158]' : 'bg-[#FF453A]/10 text-[#FF453A]'
                  }`}>
                    {diagnostics.trendDirection}
                  </span>
                </div>
                <div className="text-xl font-semibold text-white tracking-tight font-mono flex items-center gap-1.5">
                  {diagnostics.weeklyDriftUnits >= 0 ? (
                    <ArrowUpRight className="h-5 w-5 text-[#30D158]" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-[#FF453A]" />
                  )}
                  <span>{diagnostics.weeklyDriftUnits > 0 ? `+${diagnostics.weeklyDriftUnits}` : diagnostics.weeklyDriftUnits} u/wk</span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Residual σ: <span className="text-neutral-300 font-mono">{diagnostics.noiseStdDev}</span> units
                </p>
              </div>

              {/* Card 4: Data Quality & Imputed Gaps */}
              <div className="apple-card p-5 space-y-2 border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-400">Demand Imputation</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#BF5AF2]/10 text-[#BF5AF2]">
                    Cleaned
                  </span>
                </div>
                <div className="text-xl font-semibold text-white tracking-tight font-mono">
                  {tournament.imputedDaysCount || 0} Stockout Gaps
                </div>
                <p className="text-[11px] text-neutral-500">
                  Rescued Demand: <span className="text-neutral-300 font-mono">+{tournament.rescuedDemandUnits || 0} units</span>
                </p>
              </div>
            </div>
          )}

          {/* 4. Model Holdout Tournament Matrix (All 5 Models Compared) */}
          <div className="apple-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#BF5AF2]" />
                  <span>Cross-Validation Tournament Matrix (14-Day Out-of-Sample Holdout)</span>
                </h3>
                <p className="text-[12px] text-neutral-400 mt-0.5">
                  Models benchmarked simultaneously against realized customer sales on SKU: {selectedSku}
                </p>
              </div>

              <span className="text-[11px] font-mono text-neutral-400">
                Evaluation Metric: MAPE (Mean Absolute Percentage Error)
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-neutral-400 font-medium">
                    <th className="p-3">Rank</th>
                    <th className="p-3">Algorithm Model</th>
                    <th className="p-3">Model Family</th>
                    <th className="p-3">Holdout Accuracy</th>
                    <th className="p-3">MAPE %</th>
                    <th className="p-3">RMSE</th>
                    <th className="p-3">AIC / BIC</th>
                    <th className="p-3">Algorithmic Strengths</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {allModels.map((m) => (
                    <tr
                      key={m.id || m.name}
                      onClick={() => setActiveModelTab(m.id || 'winner')}
                      className={`cursor-pointer transition-colors ${
                        activeModelTab === m.id
                          ? 'bg-white/[0.06]'
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="p-3">
                        {m.isWinner ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/20">
                            ★ Winner
                          </span>
                        ) : (
                          <span className="text-neutral-500 font-mono text-[11px]">#{m.rank}</span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <span>{m.name}</span>
                        {activeModelTab === m.id && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#2997FF]" />
                        )}
                      </td>
                      <td className="p-3 text-neutral-400 text-[11px]">
                        {m.family || 'Statistical'}
                      </td>
                      <td className="p-3 font-mono text-[#30D158] font-semibold">
                        {m.accuracy}%
                      </td>
                      <td className="p-3 font-mono text-neutral-300">
                        {m.mape}%
                      </td>
                      <td className="p-3 font-mono text-neutral-400">
                        {m.rmse || '—'}
                      </td>
                      <td className="p-3 font-mono text-neutral-400 text-[11px]">
                        {m.aic ? `${m.aic} / ${m.bic}` : 'N/A (ML)'}
                      </td>
                      <td className="p-3 text-neutral-400 text-[11px]">
                        {m.strengths || m.methodology}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AI Executive Insights Strip */}
            {executiveInsights.length > 0 && (
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-2 text-xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#2997FF]" />
                  <span>Automated AI Executive Synthesis</span>
                </span>
                <ul className="space-y-1 text-neutral-300">
                  {executiveInsights.map((ins, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#30D158]">•</span>
                      <span>{ins}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 5. Bottom Chart: Sawtooth Depletion & PO Intake */}
          <div className="apple-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-neutral-400" />
                  <span>Sawtooth Inventory Depletion & Replenishment Threshold</span>
                </h3>
                <p className="text-[12px] text-neutral-400 mt-0.5">
                  Day-by-day simulated stock burn towards critical safety buffer and reorder point
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                <span className="flex items-center gap-1.5 text-[#FF453A]">
                  <span className="h-2 w-2 rounded-full bg-[#FF453A]" /> Safety Buffer
                </span>
                <span className="flex items-center gap-1.5 text-[#FF9F0A]">
                  <span className="h-2 w-2 rounded-full bg-[#FF9F0A]" /> Reorder Point (ROP)
                </span>
                <span className="flex items-center gap-1.5 text-[#30D158]">
                  <span className="h-2 w-2 rounded-full bg-[#30D158]" /> PO Receipt Intake
                </span>
              </div>
            </div>

            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={sawtoothChart}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#515154"
                    fontSize={11}
                    tickLine={false}
                    interval={3}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  />
                  <YAxis
                    stroke="#515154"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141416',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '14px',
                      fontSize: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                      color: '#F5F5F7'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                  {/* Safety Stock Line */}
                  <ReferenceLine
                    y={inventoryPlan?.safetyStock}
                    stroke="#FF453A"
                    strokeDasharray="4 4"
                    label={{
                      value: `Safety Buffer (${inventoryPlan?.safetyStock})`,
                      fill: '#FF453A',
                      fontSize: 10,
                      position: 'insideBottomRight'
                    }}
                  />

                  {/* Reorder Point Line */}
                  <ReferenceLine
                    y={inventoryPlan?.reorderPoint}
                    stroke="#FF9F0A"
                    strokeDasharray="4 4"
                    label={{
                      value: `ROP (${inventoryPlan?.reorderPoint})`,
                      fill: '#FF9F0A',
                      fontSize: 10,
                      position: 'insideTopRight'
                    }}
                  />

                  {/* Depleting stock */}
                  <Line
                    type="stepAfter"
                    dataKey="projectedStock"
                    name="On-Hand Inventory Level"
                    stroke="#2997FF"
                    strokeWidth={2}
                    dot={false}
                  />

                  {/* PO Intake Jumps */}
                  <Line
                    type="monotone"
                    dataKey="incomingPO"
                    name="Purchase Order Intake"
                    stroke="#30D158"
                    strokeWidth={0}
                    dot={{ r: 4, fill: '#30D158' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 6. 30-SKU Global Benchmark Leaderboard Modal */}
      <AnimatePresence>
        {showBenchmarkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="apple-card w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-white/[0.1] shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[#0071E3]/10 border border-[#0071E3]/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-[#2997FF]" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white tracking-tight">
                      Python ML Tournament Benchmark Suite
                    </h2>
                    <p className="text-xs text-neutral-400">
                      Evaluated across all 30 catalog SKUs in MongoDB (SARIMA, ARIMA, Holt-Winters, XGBoost, Random Forest)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowBenchmarkModal(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {isLoadingBenchmark ? (
                  <div className="py-20 text-center text-neutral-500 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="h-6 w-6 animate-spin text-[#0071E3]" />
                    <span className="text-xs">Evaluating SARIMA, ARIMA, Holt-Winters & XGBoost across 30 SKUs...</span>
                  </div>
                ) : benchmarkData ? (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.06] text-center">
                        <span className="text-[11px] font-medium text-neutral-400 block">Total Evaluated SKUs</span>
                        <span className="text-2xl font-semibold text-white tracking-tight mt-1 block font-mono">
                          {benchmarkData.totalEvaluatedSKUs || 30}
                        </span>
                      </div>

                      <div className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.06] text-center">
                        <span className="text-[11px] font-medium text-neutral-400 block">Overall Average Accuracy</span>
                        <span className="text-2xl font-semibold text-[#30D158] tracking-tight mt-1 block font-mono">
                          {benchmarkData.averageAccuracy || 89.8}%
                        </span>
                      </div>

                      <div className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.06] text-center">
                        <span className="text-[11px] font-medium text-neutral-400 block">FastAPI Server Port</span>
                        <span className="text-2xl font-semibold text-[#2997FF] tracking-tight mt-1 block font-mono">
                          :8000
                        </span>
                      </div>
                    </div>

                    {/* Model Win-Rate Progress Bars */}
                    <div className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.06] space-y-3">
                      <h4 className="text-xs font-semibold text-white tracking-tight">
                        Algorithm Tournament Win Rates
                      </h4>
                      <div className="space-y-2">
                        {benchmarkData.winRates?.map((wr) => (
                          <div key={wr.algorithm} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-neutral-300 font-medium">{wr.algorithm}</span>
                              <span className="font-mono text-neutral-400">
                                {wr.wins} wins ({wr.winRate})
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#0071E3] to-[#2997FF] rounded-full"
                                style={{ width: wr.winRate }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SKU Leaderboard Table */}
                    <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.06] bg-white/[0.02] text-neutral-400 font-medium">
                            <th className="p-3">SKU</th>
                            <th className="p-3">Product Name</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Winning Model</th>
                            <th className="p-3">Accuracy</th>
                            <th className="p-3">MAPE %</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {benchmarkData.benchmarks?.map((b) => (
                            <tr key={b.skuCode} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-3 font-mono font-semibold text-white">
                                {b.skuCode}
                              </td>
                              <td className="p-3 text-neutral-300">
                                {b.name}
                              </td>
                              <td className="p-3 text-neutral-400 text-[11px]">
                                {b.category}
                              </td>
                              <td className="p-3 text-white font-medium">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#30D158]" />
                                  {b.bestModel.replace(" (Statsmodels)", "").replace(" (ML)", "").replace(" (Ensemble)", "")}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-[#30D158] font-semibold">
                                {b.accuracy}%
                              </td>
                              <td className="p-3 font-mono text-neutral-300">
                                {b.mape}%
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => {
                                    onSelectSku(b.skuCode);
                                    setShowBenchmarkModal(false);
                                  }}
                                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-all"
                                >
                                  Inspect
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-neutral-400 text-xs">
                    Could not load benchmark data. Ensure Python service is active on port 8000.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
