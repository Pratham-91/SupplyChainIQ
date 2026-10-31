import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  SlidersHorizontal,
  ArrowRight,
  Layers,
  ChevronRight
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
  Legend,
  CartesianGrid
} from 'recharts';

export function ControlTower({
  summary,
  products = [],
  onNavigateTab,
  onSelectSku,
  onOpenWhatIf,
  onLoadMessyDemo
}) {
  const [selectedMatrixCell, setSelectedMatrixCell] = useState(null);

  const kpis = summary?.kpis || {
    totalInventoryValue: 73363,
    totalProducts: 30,
    healthySkus: 15,
    atRiskSkus: 6,
    reorderSkus: 5,
    overstockedSkus: 4,
    dataQualityScore: 99.7,
    projected30DayRevenue: 800336,
    projected30DaySpend: 352819
  };

  const abcMatrix = summary?.abcMatrix || {};
  const monthlyCashflow = summary?.monthlyCashflow || [];

  const activeCellProducts = selectedMatrixCell
    ? (abcMatrix[selectedMatrixCell] || [])
    : [];

  const matrixRows = ['A', 'B', 'C'];
  const matrixCols = ['Fast', 'Steady', 'Slow'];

  const getCellClass = (row, col, isSelected) => {
    let base = 'apple-card p-3.5 text-center cursor-pointer transition-all border border-white/[0.06]';
    if (isSelected) {
      return `${base} bg-white/[0.12] border-white/30 shadow-apple-card ring-1 ring-white/20`;
    }
    return `${base} hover:bg-white/[0.06] hover:border-white/[0.12]`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Executive Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-400 mb-1">
            <span>Executive Dashboard</span>
            <span>•</span>
            <span className="text-[#30D158]">Real-Time Demand Sensing</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Operational Overview
          </h1>
          <p className="mt-1 text-sm text-neutral-400 max-w-xl">
            Multi-echelon demand forecasting, inventory velocity segmentation, and dual buy/sell spread analysis.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onLoadMessyDemo}
            className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-white/[0.08] hover:text-white transition-all active:scale-[0.98]"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-neutral-400" />
            <span>Test Ingestion Feed</span>
          </button>

          <button
            onClick={onOpenWhatIf}
            className="flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-4 py-2 text-xs font-medium text-white shadow-apple-sm transition-all active:scale-[0.98]"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Scenario Modeling</span>
          </button>
        </div>
      </div>

      {/* 4 Bento Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Capital Deployed"
          value={kpis.totalInventoryValue}
          prefix="$"
          change="8.4%"
          isPositiveChange={true}
          icon={DollarSign}
          subtitle={`${kpis.totalProducts} Cataloged Items`}
        />

        <StatCard
          title="Stockout Exposure"
          value={kpis.atRiskSkus}
          suffix={` / ${kpis.healthySkus} Balanced`}
          change={`${kpis.atRiskSkus} Immediate Risks`}
          isPositiveChange={false}
          icon={AlertCircle}
          subtitle="< 7 Days Inventory"
        />

        <StatCard
          title="Data Ingestion Fidelity"
          value={kpis.dataQualityScore}
          suffix="%"
          change="1.2%"
          isPositiveChange={true}
          icon={ShieldCheck}
          subtitle="Validated Against Schemas"
        />

        <StatCard
          title="30-Day Projected Net Spread"
          value={kpis.projected30DayRevenue - kpis.projected30DaySpend}
          prefix="$"
          change="45.5% Margin"
          isPositiveChange={true}
          icon={TrendingUp}
          subtitle={`Rev $${Math.round(kpis.projected30DayRevenue / 1000)}k | Cost $${Math.round(kpis.projected30DaySpend / 1000)}k`}
        />
      </div>

      {/* Bento Grid: 3x3 ABC Matrix + Buy/Sell Spread Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Bento: ABC Matrix (5 cols) */}
        <div className="lg:col-span-5 apple-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                  <Layers className="h-4 w-4 text-neutral-400" />
                  <span>Velocity Segmentation (3×3)</span>
                </h3>
                <p className="text-[12px] text-neutral-400 mt-0.5">
                  Revenue contribution (A/B/C) vs consumption rate
                </p>
              </div>
              {selectedMatrixCell && (
                <button
                  onClick={() => setSelectedMatrixCell(null)}
                  className="text-[11px] text-[#2997FF] hover:underline"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* Matrix Table */}
            <div className="mt-4">
              <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-medium text-neutral-500 pb-2">
                <span className="text-left text-neutral-600 font-mono text-[10px]">TIER</span>
                <span>Fast</span>
                <span>Steady</span>
                <span>Slow</span>
              </div>

              {matrixRows.map((row) => (
                <div key={row} className="grid grid-cols-4 gap-2 py-1 items-center">
                  <div className="text-left">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold text-neutral-300 bg-white/[0.04] border border-white/[0.08]">
                      Class {row}
                    </span>
                  </div>

                  {matrixCols.map((col) => {
                    const cellKey = `${row}-${col}`;
                    const itemsInCell = abcMatrix[cellKey] || [];
                    const isSelected = selectedMatrixCell === cellKey;

                    return (
                      <motion.div
                        key={cellKey}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedMatrixCell(isSelected ? null : cellKey)}
                        className={getCellClass(row, col, isSelected)}
                      >
                        <div className="text-lg font-semibold tracking-tight text-white">
                          {itemsInCell.length}
                        </div>
                        <div className="text-[10px] text-neutral-500 tracking-tight">
                          SKUs
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Filtered Inspection Drawer */}
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            {selectedMatrixCell ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[12px] font-medium text-neutral-300">
                  <span>Filtered: {selectedMatrixCell} ({activeCellProducts.length} items)</span>
                  <span className="text-[11px] text-neutral-500">Click to view forecast</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {activeCellProducts.map((p) => (
                    <button
                      key={p.skuCode}
                      onClick={() => {
                        onSelectSku(p.skuCode);
                        onNavigateTab('forecast-explorer');
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-xs text-left transition-colors group"
                    >
                      <div>
                        <span className="font-mono font-medium text-[#2997FF] group-hover:text-white transition-colors">{p.skuCode}</span>
                        <p className="text-neutral-400 truncate max-w-[200px] text-[11px] mt-0.5">{p.name}</p>
                      </div>
                      <StatusBadge status={p.status} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[12px] text-neutral-400">
                <span>Select a tier segment to inspect component SKUs</span>
                <button
                  onClick={() => onNavigateTab('inventory-workbench')}
                  className="text-[#2997FF] hover:underline flex items-center gap-1 font-medium"
                >
                  Workbench <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Bento: Monthly Cashflow & Spread (7 cols) */}
        <div className="lg:col-span-7 apple-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-neutral-400" />
                <span>Monthly Buy vs. Sell Spread</span>
              </h3>
              <p className="text-[12px] text-neutral-400 mt-0.5">
                Procurement outlays vs. customer realized sales
              </p>
            </div>
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/[0.04] text-neutral-400 border border-white/[0.08]">
              Trailing 6 Months
            </span>
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyCashflow}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#515154"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                />
                <YAxis
                  stroke="#515154"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
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
                  formatter={(val, name) => [`$${val.toLocaleString()}`, name]}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
                <Bar
                  dataKey="salesRevenue"
                  name="Realized Revenue"
                  fill="#30D158"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="procurementSpend"
                  name="Procurement Outlay"
                  fill="#515154"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-3 text-center text-xs">
            <div className="rounded-xl bg-white/[0.02] p-2.5 border border-white/[0.04]">
              <span className="text-neutral-500 text-[11px] block">Mean Monthly Sales</span>
              <span className="text-white font-medium text-sm mt-0.5 block">$734,200</span>
            </div>
            <div className="rounded-xl bg-white/[0.02] p-2.5 border border-white/[0.04]">
              <span className="text-neutral-500 text-[11px] block">Mean Procurement</span>
              <span className="text-neutral-300 font-medium text-sm mt-0.5 block">$399,800</span>
            </div>
            <div className="rounded-xl bg-white/[0.02] p-2.5 border border-white/[0.04]">
              <span className="text-neutral-500 text-[11px] block">Gross Realized Spread</span>
              <span className="text-[#30D158] font-medium text-sm mt-0.5 block">+45.5% Margin</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
