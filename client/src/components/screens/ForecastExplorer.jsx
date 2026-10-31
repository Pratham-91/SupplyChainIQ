import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Award,
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
  Zap,
  Activity,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  GitCompare,
  BarChart2,
  HelpCircle,
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
  ReferenceLine,
} from 'recharts';
import {
  fetchProductForecast,
  fetchForecastingStatus,
  fetchForecastingBenchmark,
} from '../../services/api.js';

/* ─── Model config ─────────────────────────────────────── */
const MODEL_TABS = [
  { id: 'winner',       label: 'Best Fit',        icon: Award,      activeClass: 'bg-gradient-to-r from-[#BF5AF2] to-[#9B3DCB] text-white' },
  { id: 'sarima',       label: 'SARIMA',           icon: Activity,   activeClass: 'bg-[#30D158] text-black' },
  { id: 'arima',        label: 'ARIMA(1,1,1)',     icon: Gauge,      activeClass: 'bg-[#FF9F0A] text-black' },
  { id: 'holt_winters', label: 'Holt-Winters',     icon: TrendingUp, activeClass: 'bg-[#64D2FF] text-black' },
  { id: 'xgboost',      label: 'XGBoost',          icon: Cpu,        activeClass: 'bg-[#FF375F] text-white' },
  { id: 'consensus',    label: 'All Models',       icon: GitCompare, activeClass: 'bg-[#5E5CE6] text-white' },
];

const MODEL_CONFIG = {
  winner:       { key: 'forecast',              color: '#BF5AF2' },
  sarima:       { key: 'sarimaForecast',         color: '#30D158' },
  arima:        { key: 'arimaForecast',          color: '#FF9F0A' },
  holt_winters: { key: 'holtWintersForecast',    color: '#64D2FF' },
  xgboost:      { key: 'xgboostForecast',        color: '#FF375F' },
};

/* ─── Skeleton loader ───────────────────────────────────── */
function SkeletonCard({ className = '' }) {
  return <div className={`skeleton rounded-2xl ${className}`} />;
}

/* ─── Custom chart tooltip ──────────────────────────────── */
function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const filtered = payload.filter((p) => p.value != null && p.value !== undefined);
  return (
    <div className="rounded-2xl bg-[#1A1A1C] border border-white/10 p-3 shadow-2xl text-xs min-w-[170px]">
      <p className="text-neutral-400 mb-2 font-mono">{label}</p>
      {filtered.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color || p.fill || p.stroke }} />
            <span className="text-neutral-300">{p.name}</span>
          </div>
          <span className="font-mono font-medium text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Diagnostic mini-card ──────────────────────────────── */
function DiagCard({ label, badge, badgeCls, value, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="apple-card p-4 space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-neutral-400">{label}</span>
        {badge && (
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${badgeCls}`}>{badge}</span>
        )}
      </div>
      <div className="text-[18px] font-semibold text-white tracking-tight font-mono">{value}</div>
      {sub && <p className="text-[11px] text-neutral-500">{sub}</p>}
    </motion.div>
  );
}

/* ─── Main Component ────────────────────────────────────── */
export function ForecastExplorer({ selectedSku = 'SKU-ELEC-001', onSelectSku, products = [], onOpenWhatIf, onOpenCreatePo }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModelTab, setActiveModelTab] = useState('winner');
  const [forecastHorizon, setForecastHorizon] = useState(30);
  const [confidenceLevel, setConfidenceLevel] = useState('95');
  const [pyStatus, setPyStatus] = useState(null);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [isLoadingBenchmark, setIsLoadingBenchmark] = useState(false);

  useEffect(() => { checkEngineStatus(); }, []);
  useEffect(() => { if (selectedSku) loadForecastData(selectedSku); }, [selectedSku]);

  async function checkEngineStatus() {
    try {
      const res = await fetchForecastingStatus();
      setPyStatus(res);
    } catch { setPyStatus({ available: false }); }
  }

  async function loadForecastData(sku) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchProductForecast(sku);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function openBenchmark(force = false) {
    setShowBenchmarkModal(true);
    if (!benchmarkData || force) {
      setIsLoadingBenchmark(true);
      try {
        const res = await fetchForecastingBenchmark();
        setBenchmarkData(res);
      } catch (err) {
        console.error('Failed to load benchmark data:', err);
      } finally {
        setIsLoadingBenchmark(false);
      }
    }
  }

  const currentProduct = products.find((p) => p.skuCode === selectedSku) || data?.product;
  const tournament = data?.tournament;
  const inventoryPlan = data?.inventoryPlan;
  const combinedChart = data?.combinedForecastChart || [];
  const sawtoothChart = data?.sawtoothDepletionChart || [];
  const diagnostics = tournament?.diagnostics;
  const executiveInsights = tournament?.executiveInsights || [];
  const allModels = tournament?.allModels || [];
  const isPythonEngine = tournament?.engine?.includes('Python ML') || pyStatus?.available;

  // Slice to selected horizon
  const filteredChart = combinedChart.filter((pt) => {
    if (pt.isHistorical) return true;
    const histCount = combinedChart.filter((p) => p.isHistorical).length;
    return combinedChart.indexOf(pt) - histCount < forecastHorizon;
  });

  // Active forecast config
  const activeCfg = MODEL_CONFIG[activeModelTab] || MODEL_CONFIG.winner;
  const activeForecastKey = activeCfg.key;
  const activeForecastColor = activeCfg.color;
  const activeForecastLabel = MODEL_TABS.find((t) => t.id === activeModelTab)?.label || 'Forecast';

  const lbKey = confidenceLevel === '80' ? 'lowerBound80' : confidenceLevel === '99' ? 'lowerBound99' : 'lowerBound';
  const ubKey = confidenceLevel === '80' ? 'upperBound80' : confidenceLevel === '99' ? 'upperBound99' : 'upperBound';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* ── Header toolbar ─────────────────────────────── */}
      <div className="apple-card p-5 space-y-5">
        {/* Top row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* SKU picker */}
            <div className="relative">
              <select
                value={selectedSku}
                onChange={(e) => onSelectSku(e.target.value)}
                className="appearance-none rounded-full border border-white/[0.1] bg-[#0A0A0C] px-4 py-1.5 pr-9 text-[12px] font-semibold text-white outline-none focus:border-white/25 cursor-pointer"
              >
                {products.map((p) => (
                  <option key={p.skuCode} value={p.skuCode}>
                    {p.skuCode} — {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            </div>

            {/* Product badges */}
            {currentProduct && (
              <div className="flex items-center gap-2">
                <AbcBadge category={currentProduct.abcCategory} velocity={currentProduct.velocityCategory} />
                <StatusBadge status={inventoryPlan?.status || currentProduct.status} />
              </div>
            )}

            {/* Engine badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              isPythonEngine
                ? 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20'
                : 'bg-white/[0.04] text-neutral-400 border-white/[0.08]'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isPythonEngine ? 'bg-[#30D158] status-pulse' : 'bg-neutral-500'}`} />
              <span>{isPythonEngine ? 'Python ML Engine' : 'JS Analytical Engine'}</span>
            </div>

            {/* Benchmark button */}
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={openBenchmark}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white border border-white/[0.08] transition-all"
            >
              <BarChart3 className="h-3 w-3 text-[#0071E3]" />
              <span>30-SKU Results</span>
            </motion.button>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => onOpenWhatIf(selectedSku)}
              className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-[12px] font-medium text-neutral-300 hover:bg-white/[0.07] hover:text-white transition-all"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-400" />
              <span>What-If</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => onOpenCreatePo(currentProduct)}
              className="flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0080F5] px-4 py-1.5 text-[12px] font-medium text-white shadow-sm transition-all"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Create PO</span>
            </motion.button>
          </div>
        </div>

        {/* KPI chips */}
        {inventoryPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5"
          >
            {[
              { label: 'On Hand',       val: inventoryPlan.currentStock,          cls: 'text-white' },
              { label: 'Daily Rate',    val: `${inventoryPlan.forecastedDailyDemand}/d`, cls: 'text-[#30D158]' },
              { label: 'Days Left',     val: `${inventoryPlan.daysOfInventory}d`,  cls: inventoryPlan.daysOfInventory < 7 ? 'text-[#FF453A]' : 'text-white' },
              { label: 'Safety Stock', val: inventoryPlan.safetyStock,            cls: 'text-neutral-200' },
              { label: 'Reorder Point', val: inventoryPlan.reorderPoint,          cls: 'text-[#FF9F0A]' },
              { label: 'Depletion ETA', val: inventoryPlan.projectedStockoutDate, cls: inventoryPlan.projectedStockoutDate?.includes('Safe') ? 'text-[#30D158]' : 'text-[#FF453A]', small: true },
            ].map(({ label, val, cls, small }) => (
              <div key={label} className="rounded-xl bg-white/[0.02] p-3 border border-white/[0.04] text-center">
                <span className="text-[10px] font-medium text-neutral-500 block uppercase tracking-wide">{label}</span>
                <span className={`${small ? 'text-[11px] font-semibold mt-1.5' : 'text-lg font-semibold mt-0.5'} block font-mono tracking-tight ${cls}`}>
                  {val}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Loading / Error ──────────────────────────── */}
      {isLoading ? (
        <div className="space-y-5">
          <div className="apple-card p-6 space-y-4">
            <SkeletonCard className="h-8 w-48" />
            <SkeletonCard className="h-80 w-full" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[0,1,2,3].map((i) => <SkeletonCard key={i} className="h-24" />)}
          </div>
        </div>
      ) : error ? (
        <div className="apple-card p-8 text-center border-[#FF453A]/20">
          <p className="text-[#FF453A] text-sm font-medium">{error}</p>
          <button
            onClick={() => loadForecastData(selectedSku)}
            className="mt-3 text-[12px] text-neutral-400 hover:text-white underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-5">

          {/* ── Forecast chart panel ─────────────────── */}
          <div className="apple-card p-5 space-y-4">
            {/* Panel header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
              <div>
                <h3 className="text-[13px] font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-neutral-400" />
                  Demand Forecast
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {tournament?.bestModel ? `Best fit: ${tournament.bestModel} · ${tournament.accuracy}% accuracy` : 'Loading model results…'}
                </p>
              </div>

              {/* Horizon + Confidence controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-0.5 bg-white/[0.03] p-1 rounded-full border border-white/[0.07]">
                  <span className="text-[10px] uppercase font-semibold text-neutral-600 px-1.5">Horizon</span>
                  {[7, 14, 30].map((h) => (
                    <button
                      key={h}
                      onClick={() => setForecastHorizon(h)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                        forecastHorizon === h ? 'bg-white text-black font-semibold shadow-sm' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {h}D
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-0.5 bg-white/[0.03] p-1 rounded-full border border-white/[0.07]">
                  <span className="text-[10px] uppercase font-semibold text-neutral-600 px-1.5">CI</span>
                  {['80', '95', '99'].map((cl) => (
                    <button
                      key={cl}
                      onClick={() => setConfidenceLevel(cl)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                        confidenceLevel === cl ? 'bg-[#0071E3] text-white font-semibold shadow-sm' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {cl}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Model selector pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {MODEL_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeModelTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveModelTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-medium transition-all ${
                      isActive
                        ? tab.activeClass + ' shadow-sm'
                        : 'bg-white/[0.04] text-neutral-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Chart */}
            <div className="w-full">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={filteredChart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#444"
                    fontSize={10}
                    tickLine={false}
                    interval={forecastHorizon <= 14 ? 2 : 4}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  />
                  <YAxis
                    stroke="#444"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  />
                  <Tooltip content={<ForecastTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />

                  {/* Confidence cone */}
                  <Area type="monotone" dataKey={ubKey} name={`${confidenceLevel}% Upper`} stroke="none" fill={activeForecastColor} fillOpacity={0.1} />
                  <Area type="monotone" dataKey={lbKey} name={`${confidenceLevel}% Lower`} stroke="none" fill={activeForecastColor} fillOpacity={0} />

                  {/* Historical */}
                  <Line type="monotone" dataKey="actualSales"   name="Actual Sales"      stroke="#30D158" strokeWidth={2} dot={{ r: 1.5, fill: '#30D158' }} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="effectiveSales" name="Imputed (Stockout)" stroke="#FF9F0A" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />

                  {/* Selected model OR all models */}
                  {activeModelTab !== 'consensus' ? (
                    <Line
                      type="monotone"
                      dataKey={activeForecastKey}
                      name={activeForecastLabel}
                      stroke={activeForecastColor}
                      strokeWidth={2.5}
                      strokeDasharray="5 4"
                      dot={{ r: 2, fill: activeForecastColor }}
                      isAnimationActive={true}
                    />
                  ) : (
                    <>
                      <Line type="monotone" dataKey="sarimaForecast"       name="SARIMA"        stroke="#30D158" strokeWidth={1.8} strokeDasharray="3 3" dot={false} />
                      <Line type="monotone" dataKey="arimaForecast"         name="ARIMA(1,1,1)"  stroke="#FF9F0A" strokeWidth={1.8} strokeDasharray="3 3" dot={false} />
                      <Line type="monotone" dataKey="holtWintersForecast"   name="Holt-Winters"  stroke="#64D2FF" strokeWidth={1.8} strokeDasharray="3 3" dot={false} />
                      <Line type="monotone" dataKey="xgboostForecast"       name="XGBoost"       stroke="#FF375F" strokeWidth={1.8} strokeDasharray="3 3" dot={false} />
                      <Line type="monotone" dataKey="randomForestForecast"  name="Random Forest" stroke="#5E5CE6" strokeWidth={1.8} strokeDasharray="3 3" dot={false} />
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Diagnostics ────────────────────────────── */}
          {diagnostics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <DiagCard
                label="Stationarity (ADF)"
                badge={diagnostics.isStationary ? 'd=0 Stationary' : 'd=1 Differenced'}
                badgeCls={diagnostics.isStationary ? 'bg-[#30D158]/10 text-[#30D158]' : 'bg-[#FF9F0A]/10 text-[#FF9F0A]'}
                value={`t = ${diagnostics.adfStatistic}`}
                sub={`p = ${diagnostics.pValStationarity} (α 5%)`}
              />
              <DiagCard
                label="Weekly Rhythm"
                badge="s = 7"
                badgeCls="bg-[#2997FF]/10 text-[#2997FF]"
                value={`${diagnostics.peakDemandDay} peak (${diagnostics.peakDayMultiplier}×)`}
                sub={`Seasonality strength: ${diagnostics.seasonalityStrength}%`}
              />
              <DiagCard
                label="Trend Momentum"
                badge={diagnostics.trendDirection}
                badgeCls={diagnostics.weeklyDriftUnits >= 0 ? 'bg-[#30D158]/10 text-[#30D158]' : 'bg-[#FF453A]/10 text-[#FF453A]'}
                value={`${diagnostics.weeklyDriftUnits > 0 ? '+' : ''}${diagnostics.weeklyDriftUnits} u/wk`}
                sub={`Residual σ: ${diagnostics.noiseStdDev} units`}
              />
              <DiagCard
                label="Imputation"
                badge="Cleaned"
                badgeCls="bg-[#BF5AF2]/10 text-[#BF5AF2]"
                value={`${tournament.imputedDaysCount || 0} gaps filled`}
                sub={`+${tournament.rescuedDemandUnits || 0} units rescued`}
              />
            </div>
          )}

          {/* ── Model tournament table ─────────────────── */}
          <div className="apple-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-[13px] font-semibold text-white flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#BF5AF2]" />
                  Model Tournament
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  14-day holdout cross-validation · SKU: {selectedSku}
                </p>
              </div>
              <span className="text-[11px] font-mono text-neutral-500">Ranked by MAPE</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-neutral-500 font-medium">
                    <th className="p-3">Rank</th>
                    <th className="p-3">Model</th>
                    <th className="p-3">Family</th>
                    <th className="p-3">Accuracy</th>
                    <th className="p-3">MAPE</th>
                    <th className="p-3">RMSE</th>
                    <th className="p-3 hidden md:table-cell">AIC / BIC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {allModels.map((m) => (
                    <motion.tr
                      key={m.id || m.name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setActiveModelTab(m.id || 'winner')}
                      className={`cursor-pointer transition-colors ${
                        activeModelTab === m.id ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="p-3">
                        {m.isWinner ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/20">
                            <CheckCircle2 className="h-3 w-3" /> Winner
                          </span>
                        ) : (
                          <span className="text-neutral-600 font-mono">#{m.rank}</span>
                        )}
                      </td>
                      <td className="p-3 font-medium text-white">
                        <div className="flex items-center gap-1.5">
                          {m.name}
                          {activeModelTab === m.id && <span className="h-1.5 w-1.5 rounded-full bg-[#0071E3]" />}
                        </div>
                      </td>
                      <td className="p-3 text-neutral-500 text-[11px]">{m.family || 'Statistical'}</td>
                      <td className="p-3 font-mono text-[#30D158] font-semibold">{m.accuracy}%</td>
                      <td className="p-3 font-mono text-neutral-300">{m.mape}%</td>
                      <td className="p-3 font-mono text-neutral-500">{m.rmse || '—'}</td>
                      <td className="p-3 font-mono text-neutral-600 text-[11px] hidden md:table-cell">
                        {m.aic ? `${m.aic} / ${m.bic}` : 'N/A'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Key insights */}
            {executiveInsights.length > 0 && (
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-[#FF9F0A]" />
                  Key Insights
                </span>
                <ul className="space-y-1.5 text-[12px] text-neutral-300">
                  {executiveInsights.map((ins, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#30D158] mt-0.5">·</span>
                      <span>{ins}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── Sawtooth depletion chart ───────────────── */}
          <div className="apple-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.06]">
              <div>
                <h3 className="text-[13px] font-semibold text-white flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-neutral-400" />
                  Inventory Depletion Curve
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">30-day simulated stock burn toward safety buffer</p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                {[
                  { color: '#FF453A', label: 'Safety Buffer' },
                  { color: '#FF9F0A', label: 'Reorder Point' },
                  { color: '#30D158', label: 'PO Receipt' },
                ].map(({ color, label }) => (
                  <span key={label} className="flex items-center gap-1" style={{ color }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={sawtoothChart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" stroke="#444" fontSize={10} tickLine={false} interval={3} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                  <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                  <Tooltip content={<ForecastTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.07)', strokeWidth: 1 }} />
                  <ReferenceLine y={inventoryPlan?.safetyStock} stroke="#FF453A" strokeDasharray="4 4" label={{ value: `Safety (${inventoryPlan?.safetyStock})`, fill: '#FF453A', fontSize: 10, position: 'insideBottomRight' }} />
                  <ReferenceLine y={inventoryPlan?.reorderPoint} stroke="#FF9F0A" strokeDasharray="4 4" label={{ value: `ROP (${inventoryPlan?.reorderPoint})`, fill: '#FF9F0A', fontSize: 10, position: 'insideTopRight' }} />
                  <Line type="stepAfter" dataKey="projectedStock" name="On-Hand Stock" stroke="#0071E3" strokeWidth={2} dot={false} />
                  <Line type="monotone"  dataKey="incomingPO"     name="PO Intake"    stroke="#30D158" strokeWidth={0} dot={{ r: 4, fill: '#30D158' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Benchmark Modal ─────────────────────────── */}
      <AnimatePresence>
        {showBenchmarkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="drawer-backdrop absolute inset-0"
              onClick={() => setShowBenchmarkModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="apple-card relative w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-white/[0.1] shadow-2xl"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-5 border-b border-white/[0.07]">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[#0071E3]/10 border border-[#0071E3]/20 flex items-center justify-center">
                    <BarChart2 className="h-4 w-4 text-[#0071E3]" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-semibold text-white">Model Benchmark — All 30 SKUs</h2>
                    <p className="text-[11px] text-neutral-500">SARIMA, ARIMA, Holt-Winters, XGBoost, Random Forest</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => openBenchmark(true)}
                    disabled={isLoadingBenchmark}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white border border-white/[0.08] transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoadingBenchmark ? 'animate-spin text-[#0071E3]' : ''}`} />
                    <span>Re-evaluate</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setShowBenchmarkModal(false)}
                    className="h-8 w-8 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-all"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>

              {/* Modal body */}
              <div className="p-5 overflow-y-auto space-y-5">
                {isLoadingBenchmark ? (
                  <div className="py-20 flex flex-col items-center gap-3 text-neutral-500">
                    <RefreshCw className="h-6 w-6 animate-spin text-[#0071E3]" />
                    <span className="text-xs">Evaluating all SKUs across 5 algorithms…</span>
                  </div>
                ) : benchmarkData ? (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'SKUs Evaluated',   val: benchmarkData.totalEvaluatedSKUs || 30, cls: 'text-white' },
                        { label: 'Mean Accuracy',    val: `${benchmarkData.averageAccuracy || 89.8}%`, cls: 'text-[#30D158]' },
                        { label: 'Active ML Engine', val: benchmarkData.engine?.includes('Python') ? 'Python ML' : 'JS Engine', cls: 'text-[#0071E3]' },
                      ].map(({ label, val, cls }) => (
                        <div key={label} className="rounded-xl bg-white/[0.02] p-3.5 border border-white/[0.05] text-center">
                          <span className="text-[11px] font-medium text-neutral-500 block">{label}</span>
                          <span className={`text-xl font-semibold font-mono mt-1 block ${cls}`}>{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Win rates */}
                    {benchmarkData.winRates?.length > 0 && (
                      <div className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.05] space-y-3">
                        <h4 className="text-[12px] font-semibold text-white">Algorithm Win Rates</h4>
                        {benchmarkData.winRates.map((wr, i) => (
                          <div key={wr.algorithm} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-neutral-300 font-medium">{wr.algorithm}</span>
                              <span className="font-mono text-neutral-500">{wr.wins} wins — {wr.winRate}</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: wr.winRate }}
                                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                className="h-full bg-gradient-to-r from-[#0071E3] to-[#64D2FF] rounded-full"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SKU leaderboard */}
                    <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.06] bg-white/[0.02] text-neutral-500 font-medium">
                            <th className="p-3">SKU</th>
                            <th className="p-3">Product</th>
                            <th className="p-3 hidden md:table-cell">Category</th>
                            <th className="p-3">Best Model</th>
                            <th className="p-3">Accuracy</th>
                            <th className="p-3">MAPE</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {benchmarkData.benchmarks?.map((b) => (
                            <tr key={b.skuCode} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-3 font-mono font-semibold text-white text-[11px]">{b.skuCode}</td>
                              <td className="p-3 text-neutral-300 max-w-[160px] truncate">{b.name}</td>
                              <td className="p-3 text-neutral-500 text-[11px] hidden md:table-cell">{b.category}</td>
                              <td className="p-3 text-white">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#30D158]" />
                                  {b.bestModel?.replace(' (Statsmodels)', '').replace(' (ML)', '').replace(' (Ensemble)', '')}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-[#30D158] font-semibold">{b.accuracy}%</td>
                              <td className="p-3 font-mono text-neutral-300">{b.mape}%</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => { onSelectSku(b.skuCode); setShowBenchmarkModal(false); }}
                                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-all"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="py-12 flex flex-col items-center gap-3 text-neutral-500 text-xs">
                    <span>Benchmark data unavailable.</span>
                    <button
                      onClick={() => openBenchmark(true)}
                      className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs"
                    >
                      Retry Evaluation
                    </button>
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
