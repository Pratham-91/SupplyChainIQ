import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Boxes,
  Search,
  SlidersHorizontal,
  ShoppingCart,
  TrendingUp,
  ArrowUpDown,
  RefreshCw,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { StatusBadge, AbcBadge } from '../common/Badge.jsx';
import { fetchInventoryWorkbench } from '../../services/api.js';

export function InventoryWorkbench({
  onSelectSku,
  onOpenWhatIf,
  onOpenCreatePo
}) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [sortField, setSortField] = useState('daysOfInventory');
  const [sortDirection, setSortDirection] = useState('asc');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    loadWorkbenchData();
  }, []);

  async function loadWorkbenchData() {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchInventoryWorkbench();
      setProducts(data || []);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  }

  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter((p) => {
    const status = p.calculatedStatus || p.status;
    const matchesTab = activeTab === 'ALL' || status === activeTab;
    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchesSearch =
      p.skuCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesCat && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const statusCounts = {
    all: products.length,
    critical: products.filter(p => (p.calculatedStatus || p.status) === 'Stockout Risk').length,
    reorder: products.filter(p => (p.calculatedStatus || p.status) === 'Reorder Now').length,
    healthy: products.filter(p => (p.calculatedStatus || p.status) === 'Healthy').length,
    overstocked: products.filter(p => (p.calculatedStatus || p.status) === 'Overstocked').length
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-400 mb-1">
            <span>Inventory Workbench</span>
            <span>•</span>
            <span className="text-[#30D158]">Replenishment Queue</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Replenishment & Coverage Ledger
          </h1>
          <p className="mt-1 text-sm text-neutral-400 max-w-xl">
            Live days-of-inventory coverage, run-rates, safety buffer limits, and one-click purchase dispatch.
          </p>
        </div>

        <button
          onClick={loadWorkbenchData}
          className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-white/[0.08] hover:text-white transition-all active:scale-[0.98]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-[#0071E3]' : ''}`} />
          <span>Refresh Run-Rates</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-xl border border-[#FF453A]/30 bg-[#FF453A]/10 px-4 py-3 text-xs text-[#FF453A]"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-neutral-400 hover:text-white"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Filter Toolbar: iOS Segmented Tabs */}
      <div className="apple-card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-full bg-white/[0.04] p-1 text-[11px] border border-white/[0.08] flex-wrap">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1 rounded-full transition-all ${
                activeTab === 'ALL' ? 'bg-white text-black font-medium shadow-apple-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Items ({statusCounts.all})
            </button>
            <button
              onClick={() => setActiveTab('Stockout Risk')}
              className={`px-3 py-1 rounded-full transition-all ${
                activeTab === 'Stockout Risk' ? 'bg-[#FF453A] text-white font-medium shadow-apple-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Critical Risk ({statusCounts.critical})
            </button>
            <button
              onClick={() => setActiveTab('Reorder Now')}
              className={`px-3 py-1 rounded-full transition-all ${
                activeTab === 'Reorder Now' ? 'bg-[#FF9F0A] text-white font-medium shadow-apple-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Reorder ({statusCounts.reorder})
            </button>
            <button
              onClick={() => setActiveTab('Healthy')}
              className={`px-3 py-1 rounded-full transition-all ${
                activeTab === 'Healthy' ? 'bg-[#30D158] text-black font-medium shadow-apple-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Balanced ({statusCounts.healthy})
            </button>
            <button
              onClick={() => setActiveTab('Overstocked')}
              className={`px-3 py-1 rounded-full transition-all ${
                activeTab === 'Overstocked' ? 'bg-[#BF5AF2] text-white font-medium shadow-apple-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Overstocked ({statusCounts.overstocked})
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items, SKU, vendor..."
                className="w-full rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 pl-8 text-xs text-white placeholder-neutral-500 outline-none focus:border-white/30"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-full border border-white/[0.08] bg-[#0A0A0C] px-3 py-1.5 text-xs text-white outline-none focus:border-white/30"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-neutral-400 font-medium select-none">
                <th onClick={() => handleSort('skuCode')} className="p-3.5 cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1.5">
                    <span>SKU / Product</span>
                    <ArrowUpDown className="h-3 w-3 text-neutral-500" />
                  </div>
                </th>
                <th onClick={() => handleSort('category')} className="p-3.5 cursor-pointer hover:text-white">
                  <span>Category</span>
                </th>
                <th className="p-3.5">Tier</th>
                <th onClick={() => handleSort('currentStock')} className="p-3.5 cursor-pointer hover:text-white text-right">
                  <span>On-Hand</span>
                </th>
                <th onClick={() => handleSort('dailyDemand')} className="p-3.5 cursor-pointer hover:text-white text-right">
                  <span>Run-Rate</span>
                </th>
                <th onClick={() => handleSort('daysOfInventory')} className="p-3.5 cursor-pointer hover:text-white min-w-[140px]">
                  <span>Coverage (DoI)</span>
                </th>
                <th className="p-3.5 text-right">Buffer Limits (SS / ROP)</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading && products.length === 0 ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="animate-pulse">
                    <td className="p-3.5">
                      <div className="h-4 w-24 rounded bg-white/[0.06] skeleton mb-1" />
                      <div className="h-3 w-40 rounded bg-white/[0.03] skeleton" />
                    </td>
                    <td className="p-3.5"><div className="h-4 w-20 rounded bg-white/[0.06] skeleton" /></td>
                    <td className="p-3.5"><div className="h-4 w-12 rounded bg-white/[0.06] skeleton" /></td>
                    <td className="p-3.5 text-right"><div className="h-4 w-16 rounded bg-white/[0.06] skeleton ml-auto" /></td>
                    <td className="p-3.5 text-right"><div className="h-4 w-12 rounded bg-white/[0.06] skeleton ml-auto" /></td>
                    <td className="p-3.5"><div className="h-3 w-28 rounded bg-white/[0.06] skeleton" /></td>
                    <td className="p-3.5 text-right"><div className="h-3 w-24 rounded bg-white/[0.06] skeleton ml-auto" /></td>
                    <td className="p-3.5 text-center"><div className="h-5 w-20 rounded-full bg-white/[0.06] skeleton mx-auto" /></td>
                    <td className="p-3.5 text-right"><div className="h-7 w-20 rounded-full bg-white/[0.06] skeleton ml-auto" /></td>
                  </tr>
                ))
              ) : (
                sortedProducts.map((p, index) => {
                  const status = p.calculatedStatus || p.status;
                  const doi = p.daysOfInventory || 0;
                  const doiProgress = Math.min(100, (doi / 45) * 100);

                  return (
                    <motion.tr
                      key={p.skuCode}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3) }}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="p-3.5 max-w-[220px]">
                        <div className="flex flex-col">
                          <span className="font-mono font-medium text-white group-hover:text-[#2997FF] transition-colors">
                            {p.skuCode}
                          </span>
                          <span className="text-neutral-300 font-normal truncate text-[11px] mt-0.5" title={p.name}>
                            {p.name}
                          </span>
                          <span className="text-neutral-500 text-[10px] truncate">
                            {p.supplierName} • {p.avgLeadTimeDays}d lead
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 text-neutral-400 text-[11px] whitespace-nowrap">
                        {p.category}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <AbcBadge category={p.abcCategory} velocity={p.velocityCategory} />
                      </td>

                      <td className="p-3.5 text-right font-mono font-medium text-white whitespace-nowrap">
                        {p.currentStock} {p.baseUnit}s
                      </td>

                      <td className="p-3.5 text-right font-mono text-[#30D158] font-medium whitespace-nowrap">
                        {p.dailyDemand}/d
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className={`font-mono font-medium ${
                              doi < 7 ? 'text-[#FF453A]' : doi <= 14 ? 'text-[#FF9F0A]' : 'text-neutral-300'
                            }`}>
                              {doi} Days
                            </span>
                          </div>
                          <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                doi < 7 ? 'bg-[#FF453A]' : doi <= 14 ? 'bg-[#FF9F0A]' : 'bg-[#30D158]'
                              }`}
                              style={{ width: `${doiProgress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-mono text-[11px] whitespace-nowrap text-neutral-400">
                        <span>SS: {p.safetyStock}</span>
                        <span className="text-neutral-600 mx-1">|</span>
                        <span>ROP: {p.reorderPoint}</span>
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap">
                        <StatusBadge status={status} size="sm" />
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onSelectSku(p.skuCode)}
                            className="rounded-full p-1.5 text-neutral-400 hover:bg-white/[0.06] hover:text-white transition-colors"
                            title="Forecast"
                          >
                            <TrendingUp className="h-3.5 w-3.5" />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onOpenWhatIf(p.skuCode)}
                            className="rounded-full p-1.5 text-neutral-400 hover:bg-white/[0.06] hover:text-white transition-colors"
                            title="Simulate"
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onOpenCreatePo(p)}
                            className="rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-3 py-1 text-xs font-medium text-white transition-all shadow-apple-sm"
                          >
                            Order
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}

              {!isLoading && sortedProducts.length === 0 && (
                <tr>
                  <td colSpan="9" className="p-12 text-center text-neutral-500">
                    No catalog items match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
