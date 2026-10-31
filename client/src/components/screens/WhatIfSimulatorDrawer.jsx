import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  ShoppingCart
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

export function WhatIfSimulatorDrawer({
  isOpen,
  onClose,
  initialSku = 'SKU-ELEC-001',
  products = [],
  onOpenCreatePo
}) {
  const [selectedSku, setSelectedSku] = useState(initialSku);

  // 3 Interactive Sliders
  const [demandSurgePercent, setDemandSurgePercent] = useState(25);
  const [supplierDelayDays, setSupplierDelayDays] = useState(5);
  const [serviceLevelPercent, setServiceLevelPercent] = useState(95);

  useEffect(() => {
    if (initialSku) setSelectedSku(initialSku);
  }, [initialSku]);

  if (!isOpen) return null;

  const product = products.find(p => p.skuCode === selectedSku) || products[0] || {
    skuCode: 'SKU-ELEC-001',
    name: 'AeroSound Pro Wireless ANC Headphones',
    currentStock: 48,
    avgBuyCost: 65,
    sellingPrice: 129,
    avgLeadTimeDays: 14,
    supplierName: 'Shenzhen Apex Audio Ltd'
  };

  const currentStock = product.currentStock || 50;
  const baseLeadTime = product.avgLeadTimeDays || 10;
  const baseDailyDemand = Math.max(1, Math.round(currentStock > 100 ? currentStock / 25 : 12));

  const simulatedDailyDemand = Math.round(baseDailyDemand * (1 + demandSurgePercent / 100));
  const simulatedLeadTime = baseLeadTime + Number(supplierDelayDays);

  const zScore = serviceLevelPercent >= 99 ? 2.33 : serviceLevelPercent >= 95 ? 1.65 : serviceLevelPercent >= 90 ? 1.28 : 1.04;
  const baseSafetyStock = Math.round(baseDailyDemand * 3 * 1.2);
  const simulatedSafetyStock = Math.round(simulatedDailyDemand * Math.sqrt(simulatedLeadTime) * zScore);

  const baseRop = Math.round((baseDailyDemand * baseLeadTime) + baseSafetyStock);
  const simulatedRop = Math.round((simulatedDailyDemand * simulatedLeadTime) + simulatedSafetyStock);

  const additionalUnitsNeeded = Math.max(0, simulatedRop - currentStock);
  const additionalCapitalNeeded = additionalUnitsNeeded * (product.avgBuyCost || 50);

  const timelineData = [];
  let baseStock = currentStock;
  let simStock = currentStock;
  let baseStockoutDay = null;
  let simStockoutDay = null;

  const today = new Date();
  for (let d = 1; d <= 30; d++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + d);
    const dateStr = futureDate.toISOString().split('T')[0].substring(5);

    baseStock = Math.max(0, baseStock - baseDailyDemand);
    simStock = Math.max(0, simStock - simulatedDailyDemand);

    if (baseStock === 0 && !baseStockoutDay) baseStockoutDay = `Day ${d}`;
    if (simStock === 0 && !simStockoutDay) simStockoutDay = `Day ${d}`;

    timelineData.push({
      day: `+${d}d`,
      date: dateStr,
      baselineStock: baseStock,
      simulatedStock: simStock,
      safetyStock: simulatedSafetyStock
    });
  }

  const handleResetSliders = () => {
    setDemandSurgePercent(0);
    setSupplierDelayDays(0);
    setServiceLevelPercent(90);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 35, stiffness: 350 }}
          className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-white/[0.08] bg-[#0C0C0E] shadow-2xl overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.08] bg-[#0C0C0E]/90 px-6 py-4 backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] text-white border border-white/[0.08]">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-white">
                  Scenario Stress Simulator
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Dynamic simulation of demand spikes, shipping lead-time delays & buffers
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-neutral-400 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* SKU Selector */}
            <div>
              <label className="text-[11px] font-medium text-neutral-400 block mb-1.5">
                Target Catalog SKU:
              </label>
              <select
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                className="w-full rounded-xl border border-white/[0.1] bg-[#141416] px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-white/30"
              >
                {products.map(p => (
                  <option key={p.skuCode} value={p.skuCode}>
                    {p.skuCode} — {p.name} (Stock: {p.currentStock})
                  </option>
                ))}
              </select>
            </div>

            {/* Sliders Card */}
            <div className="apple-card p-5 space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-[11px] font-semibold tracking-tight text-neutral-400">
                  SCENARIO CONTROLS
                </span>
                <button
                  onClick={handleResetSliders}
                  className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>

              {/* Slider 1 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-neutral-300">
                    Demand Surge Factor
                  </span>
                  <span className="font-mono font-medium text-white text-[13px]">
                    +{demandSurgePercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={demandSurgePercent}
                  onChange={(e) => setDemandSurgePercent(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                  <span>Baseline (0%)</span>
                  <span>Promotional (+50%)</span>
                  <span>Peak Holiday (+100%)</span>
                </div>
              </div>

              {/* Slider 2 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-neutral-300">
                    Supplier Lead-Time Delay
                  </span>
                  <span className="font-mono font-medium text-[#FF9F0A] text-[13px]">
                    +{supplierDelayDays} Days
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={supplierDelayDays}
                  onChange={(e) => setSupplierDelayDays(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                  <span>Standard (+0d)</span>
                  <span>Port Congestion (+10d)</span>
                  <span>Disruption (+20d)</span>
                </div>
              </div>

              {/* Slider 3 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-neutral-300">
                    Target Service Level Fill Rate
                  </span>
                  <span className="font-mono font-medium text-[#2997FF] text-[13px]">
                    {serviceLevelPercent}% Fill
                  </span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="99"
                  step="1"
                  value={serviceLevelPercent}
                  onChange={(e) => setServiceLevelPercent(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                  <span>Standard (85%)</span>
                  <span>Balanced (95%)</span>
                  <span>Mission-Critical (99%)</span>
                </div>
              </div>
            </div>

            {/* Impact Metric Chips */}
            <div className="grid grid-cols-2 gap-3">
              <div className="apple-card p-3.5">
                <span className="text-[11px] text-neutral-400 block">Simulated Depletion</span>
                <span className="text-base font-semibold text-white mt-0.5 block font-mono">
                  {simStockoutDay ? `Runout in ${simStockoutDay}` : 'Safe (30+ Days)'}
                </span>
                <span className="text-[10px] text-neutral-500 mt-0.5 block">
                  {baseStockoutDay ? `Baseline was ${baseStockoutDay}` : 'Run-rate accelerated'}
                </span>
              </div>

              <div className="apple-card p-3.5">
                <span className="text-[11px] text-neutral-400 block">Required ROP</span>
                <span className="text-base font-semibold text-white mt-0.5 block font-mono">
                  {simulatedRop} units
                </span>
                <span className="text-[10px] text-neutral-500 mt-0.5 block">
                  Baseline ROP was {baseRop}
                </span>
              </div>

              <div className="apple-card p-3.5">
                <span className="text-[11px] text-neutral-400 block">Replenishment Delta</span>
                <span className="text-base font-semibold text-[#30D158] mt-0.5 block font-mono">
                  +{additionalUnitsNeeded} Units
                </span>
                <span className="text-[10px] text-neutral-500 mt-0.5 block">
                  Coverage requirement
                </span>
              </div>

              <div className="apple-card p-3.5">
                <span className="text-[11px] text-neutral-400 block">Incremental Capital</span>
                <span className="text-base font-semibold text-white mt-0.5 block font-mono">
                  ${additionalCapitalNeeded.toLocaleString()}
                </span>
                <span className="text-[10px] text-neutral-500 mt-0.5 block">
                  At buy cost ${product.avgBuyCost}/unit
                </span>
              </div>
            </div>

            {/* Live Chart */}
            <div className="apple-card p-4">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06] text-xs">
                <span className="font-semibold text-white">
                  60 FPS Live Trajectory Comparison
                </span>
                <span className="text-neutral-400 font-mono text-[11px]">
                  Simulated Run-Rate: {simulatedDailyDemand}/day
                </span>
              </div>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timelineData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="day" stroke="#515154" fontSize={10} interval={4} />
                    <YAxis stroke="#515154" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#141416',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#F5F5F7'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />

                    <Line
                      type="monotone"
                      dataKey="baselineStock"
                      name="Baseline Stock"
                      stroke="#515154"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="simulatedStock"
                      name="Simulated Scenario"
                      stroke="#2997FF"
                      strokeWidth={2}
                      dot={false}
                    />
                    <ReferenceLine
                      y={simulatedSafetyStock}
                      stroke="#FF453A"
                      strokeDasharray="3 3"
                      label={{ value: 'Buffer Limit', fill: '#FF453A', fontSize: 10 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenCreatePo({
                    ...product,
                    recommendedOrderQty: additionalUnitsNeeded > 0 ? additionalUnitsNeeded : 150
                  });
                }}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] py-3 text-xs font-semibold text-white shadow-apple-sm transition-all active:scale-[0.98]"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Create Replenishment Authorization ({additionalUnitsNeeded || 150} Units)</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
