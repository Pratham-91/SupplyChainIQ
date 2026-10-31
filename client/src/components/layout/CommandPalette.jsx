import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, Boxes, FileSpreadsheet, LayoutDashboard, ChevronRight } from 'lucide-react';
import { StatusBadge, AbcBadge } from '../common/Badge.jsx';

export function CommandPalette({
  isOpen,
  onClose,
  products = [],
  onSelectSku,
  onNavigateTab
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose ? onClose(!isOpen) : null;
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredProducts = products.filter((p) =>
    p.skuCode.toLowerCase().includes(query.toLowerCase()) ||
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  const quickNav = [
    { id: 'control-tower', label: 'Control Tower', icon: LayoutDashboard },
    { id: 'data-studio', label: 'Data Hygiene & Quarantine', icon: FileSpreadsheet },
    { id: 'forecast-explorer', label: 'Demand Trajectory & Confidence Cone', icon: TrendingUp },
    { id: 'inventory-workbench', label: 'Replenishment Workbench', icon: Boxes },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.1] bg-[#141416] shadow-apple-card"
        >
          {/* Spotlight Search Header */}
          <div className="flex items-center border-b border-white/[0.06] px-4 py-3.5">
            <Search className="h-4 w-4 text-neutral-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search catalog, SKU, or feature..."
              className="ml-3 flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
            />
            <button
              onClick={onClose}
              className="rounded-full p-1 text-neutral-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {!query && (
              <div className="mb-2">
                <div className="px-3 py-1.5 text-[11px] font-medium text-neutral-500 uppercase tracking-tight">
                  Views
                </div>
                {quickNav.map((nav) => {
                  const Icon = nav.icon;
                  return (
                    <button
                      key={nav.id}
                      onClick={() => {
                        onNavigateTab(nav.id);
                        onClose();
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-neutral-400" />
                        <span>{nav.label}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-neutral-600" />
                    </button>
                  );
                })}
              </div>
            )}

            <div>
              <div className="px-3 py-1.5 text-[11px] font-medium text-neutral-500 uppercase tracking-tight">
                Items ({filteredProducts.length})
              </div>
              {filteredProducts.map((p) => (
                <button
                  key={p.skuCode}
                  onClick={() => {
                    onSelectSku(p.skuCode);
                    onNavigateTab('forecast-explorer');
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-left hover:bg-white/[0.06] transition-colors group"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white group-hover:text-[#2997FF] transition-colors">
                        {p.skuCode}
                      </span>
                      <AbcBadge category={p.abcCategory} velocity={p.velocityCategory} />
                    </div>
                    <span className="text-neutral-400 font-normal truncate max-w-sm mt-0.5 text-[11px]">
                      {p.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[11px] text-neutral-500">Stock</div>
                      <div className="font-mono text-white text-xs">{p.currentStock}</div>
                    </div>
                    <StatusBadge status={p.status} size="sm" />
                  </div>
                </button>
              ))}

              {filteredProducts.length === 0 && (
                <div className="p-8 text-center text-xs text-neutral-500">
                  No catalog items found matching "{query}".
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/[0.06] bg-black/40 px-4 py-2 flex items-center justify-between text-[11px] text-neutral-500">
            <span>Press ESC to dismiss</span>
            <span>Select any item to jump straight into its 30-day trajectory</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
