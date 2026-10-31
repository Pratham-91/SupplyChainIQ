import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  SlidersHorizontal,
  ChevronRight,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { StatCard } from '../common/StatCard.jsx';
import { StatusBadge, AbcBadge } from '../common/Badge.jsx';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl bg-[#1A1A1C] border border-white/10 p-3 shadow-2xl text-xs min-w-[150px]">
      <p className="text-neutral-400 mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: p.fill }} />
            <span className="text-neutral-300">{p.name}</span>
          </div>
          <span className="font-mono font-medium text-white">${p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function ControlTower({ summary, products = [], onNavigateTab, onSelectSku, onOpenWhatIf, onLoadMessyDemo }) {
  const [selectedCell, setSelectedCell] = useState(null);

  const kpis = summary?.kpis || {
    totalInventoryValue: 73363,
    totalProducts: 30,
    healthySkus: 15,
    atRiskSkus: 6,
    reorderSkus: 5,
    overstockedSkus: 4,
    dataQualityScore: 99.7,
    projected30DayRevenue: 800336,
    projected30DaySpend: 352819,
  };

  const abcMatrix = summary?.abcMatrix || {};
  const monthlyCashflow = summary?.monthlyCashflow || [];
  const activeCellProducts = selectedCell ? (abcMatrix[selectedCell] || []) : [];
  const matrixRows = ['A', 'B', 'C'];
  const matrixCols = ['Fast', 'Steady', 'Slow'];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-neutral-500 mb-1.5">
            <span>SupplyChainIQ</span>
            <span className="text-neutral-700">·</span>
            <span className="text-[#30D158]">Live</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
          <p className="mt-0.5 text-[13px] text-neutral-400 max-w-lg">
            Inventory health, demand forecast signals, and buy/sell spread across all cataloged SKUs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onLoadMessyDemo}
            className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[12px] font-medium text-neutral-300 hover:bg-white/[0.07] hover:text-white transition-all"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-neutral-400" />
            <span>Test Data Feed</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onOpenWhatIf}
            className="flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0080F5] px-4 py-2 text-[12px] font-medium text-white shadow-sm transition-all"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Scenario Model</span>
          </motion.button>
        </div>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          index={0}
          title="Total Inventory Value"
          value={kpis.totalInventoryValue}
          prefix="$"
          change="8.4%"
          isPositiveChange={true}
          icon={DollarSign}
          subtitle={`${kpis.totalProducts} Products`}
        />
        <StatCard
          index={1}
          title="At-Risk SKUs"
          value={kpis.atRiskSkus}
          suffix={` / ${kpis.totalProducts}`}
          change={`${kpis.atRiskSkus} critical`}
          isPositiveChange={false}
          icon={AlertTriangle}
          subtitle="< 7 days inventory"
        />
        <StatCard
          index={2}
          title="Data Quality Score"
          value={kpis.dataQualityScore}
          suffix="%"
          change="1.2%"
          isPositiveChange={true}
          icon={ShieldCheck}
          subtitle="Schema validated"
        />
        <StatCard
          index={3}
          title="30-Day Net Spread"
          value={kpis.projected30DayRevenue - kpis.projected30DaySpend}
          prefix="$"
          change="45.5% margin"
          isPositiveChange={true}
          icon={TrendingUp}
          subtitle={`Rev $${Math.round(kpis.projected30DayRevenue / 1000)}k / Cost $${Math.round(kpis.projected30DaySpend / 1000)}k`}
        />
      </div>

      {/* Bottom bento: ABC matrix + cashflow chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ABC Matrix */}
        <motion.div variants={itemVariants} className="lg:col-span-5 apple-card p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
            <div>
              <h3 className="text-[13px] font-semibold text-white tracking-tight flex items-center gap-2">
                <Layers className="h-4 w-4 text-neutral-500" />
                <span>Velocity Segmentation</span>
              </h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">ABC class × demand velocity (3×3)</p>
            </div>
            {selectedCell && (
              <button
                onClick={() => setSelectedCell(null)}
                className="text-[11px] text-[#0071E3] hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="mt-4">
            {/* Header row */}
            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-medium text-neutral-600 pb-2 uppercase tracking-wide">
              <span className="text-left">Tier</span>
              {matrixCols.map((c) => <span key={c}>{c}</span>)}
            </div>

            {/* Matrix */}
            {matrixRows.map((row) => (
              <div key={row} className="grid grid-cols-4 gap-2 py-1 items-center">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold text-neutral-300 bg-white/[0.04] border border-white/[0.07]">
                    {row}
                  </span>
                </div>
                {matrixCols.map((col) => {
                  const key = `${row}-${col}`;
                  const count = (abcMatrix[key] || []).length;
                  const isSelected = selectedCell === key;
                  return (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedCell(isSelected ? null : key)}
                      className={`rounded-xl p-3 text-center border transition-all ${
                        isSelected
                          ? 'bg-white/[0.1] border-white/20 shadow-sm'
                          : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.1]'
                      }`}
                    >
                      <div className="text-[17px] font-semibold text-white leading-none">{count}</div>
                      <div className="text-[9px] text-neutral-600 mt-0.5 uppercase tracking-wide">SKUs</div>
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Cell drill-down */}
          <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex-1">
            <AnimatePresence mode="wait">
              {selectedCell ? (
                <motion.div
                  key="products"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium mb-1">
                    <span>Segment <strong className="text-neutral-200">{selectedCell}</strong> — {activeCellProducts.length} items</span>
                    <span className="text-neutral-600">Click to forecast</span>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {activeCellProducts.map((p) => (
                      <motion.button
                        key={p.skuCode}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ x: 2 }}
                        transition={{ duration: 0.18 }}
                        onClick={() => { onSelectSku(p.skuCode); onNavigateTab('forecast-explorer'); }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.08] text-xs text-left transition-all group"
                      >
                        <div>
                          <span className="font-mono font-medium text-[#2997FF] group-hover:text-white transition-colors text-[11px]">{p.skuCode}</span>
                          <p className="text-neutral-500 truncate max-w-[170px] text-[10px] mt-0.5">{p.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={p.status} size="sm" />
                          <ArrowRight className="h-3 w-3 text-neutral-600 group-hover:text-neutral-300 transition-colors" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-between text-[12px] text-neutral-500"
                >
                  <span>Select a cell to drill down</span>
                  <button
                    onClick={() => onNavigateTab('inventory-workbench')}
                    className="flex items-center gap-1 text-[#0071E3] hover:underline font-medium text-[11px]"
                  >
                    Workbench <ChevronRight className="h-3 w-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Buy / Sell Spread Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-7 apple-card p-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
            <div>
              <h3 className="text-[13px] font-semibold text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-neutral-500" />
                <span>Monthly Buy vs. Sell Spread</span>
              </h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">Procurement spend vs. realized revenue — trailing 6 months</p>
            </div>
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/20">
              +45.5% Margin
            </span>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCashflow} margin={{ top: 5, right: 5, left: -12, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#444"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                />
                <YAxis
                  stroke="#444"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="salesRevenue"     name="Revenue"      fill="#30D158" radius={[5, 5, 0, 0]} />
                <Bar dataKey="procurementSpend" name="Procurement"   fill="#3A3A3C" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 pt-3 border-t border-white/[0.06]">
            {[
              { label: 'Avg Monthly Revenue', val: '$734,200', cls: 'text-white' },
              { label: 'Avg Procurement',     val: '$399,800', cls: 'text-neutral-300' },
              { label: 'Gross Margin',         val: '+45.5%',   cls: 'text-[#30D158]' },
            ].map(({ label, val, cls }) => (
              <div key={label} className="rounded-xl bg-white/[0.02] p-2.5 border border-white/[0.04] text-center">
                <span className="text-neutral-500 text-[10px] font-medium block uppercase tracking-wide">{label}</span>
                <span className={`font-semibold text-[13px] mt-0.5 block font-mono ${cls}`}>{val}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
