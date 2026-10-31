import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileSpreadsheet,
  TrendingUp,
  Boxes,
  ShoppingCart,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'control-tower',       label: 'Dashboard',          icon: LayoutDashboard },
  { id: 'data-studio',         label: 'Data Quality',        icon: FileSpreadsheet },
  { id: 'forecast-explorer',   label: 'Forecast Explorer',   icon: TrendingUp },
  { id: 'inventory-workbench', label: 'Replenishment',       icon: Boxes },
  { id: 'purchase-orders',     label: 'Purchase Orders',     icon: ShoppingCart },
];

export function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed, atRiskCount = 0, quarantinePendingCount = 0, onOpenWhatIf }) {
  return (
    <aside
      className={`relative flex flex-col border-r border-white/[0.07] bg-[#080809] transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-30 select-none shrink-0 ${
        isCollapsed ? 'w-[68px]' : 'w-60'
      }`}
    >
      {/* Brand */}
      <div className="flex h-[60px] items-center border-b border-white/[0.07] px-4 gap-3 overflow-hidden">
        <motion.div
          whileHover={{ rotate: 8, scale: 1.08 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[#0071E3]/30 to-[#0071E3]/10 border border-[#0071E3]/30 shadow-sm"
        >
          <Layers className="h-4 w-4 text-[#0071E3]" />
        </motion.div>

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col min-w-0"
            >
              <span className="text-[13.5px] font-semibold tracking-tight text-white leading-tight">
                SupplyChain<span className="text-[#0071E3]">IQ</span>
              </span>
              <span className="text-[10px] font-medium text-neutral-500 tracking-tight">
                Enterprise Edition
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`ml-auto rounded-lg p-1.5 text-neutral-500 hover:bg-white/[0.06] hover:text-white transition-all ${isCollapsed ? 'mx-auto' : ''}`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed
            ? <ChevronRight className="h-3.5 w-3.5" />
            : <ChevronLeft className="h-3.5 w-3.5" />
          }
        </button>
      </div>

      {/* Nav list */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          const badge =
            item.id === 'data-studio' && quarantinePendingCount > 0
              ? { text: `${quarantinePendingCount}`, cls: 'bg-[#FF453A]/15 text-[#FF453A]' }
              : item.id === 'inventory-workbench' && atRiskCount > 0
              ? { text: `${atRiskCount}`, cls: 'bg-[#FF9F0A]/15 text-[#FF9F0A]' }
              : null;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors group ${
                isActive
                  ? 'text-white'
                  : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200'
              }`}
            >
              {/* Active background with layout animation */}
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveNav"
                  className="absolute inset-0 rounded-xl bg-white/[0.07] border border-white/[0.08] nav-shine"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <Icon className={`relative h-4 w-4 shrink-0 transition-colors ${
                isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'
              }`} />

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="relative flex flex-1 items-center justify-between overflow-hidden"
                  >
                    <span className="truncate tracking-tight">{item.label}</span>
                    {badge && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${badge.cls}`}>
                        {badge.text}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Collapsed tooltip */}
              {isCollapsed && (
                <div className="absolute left-full ml-2.5 hidden rounded-lg bg-[#1C1C1E] border border-white/10 px-2.5 py-1.5 text-xs text-white shadow-xl group-hover:block whitespace-nowrap z-50 tooltip-animate">
                  {item.label}
                  {badge && (
                    <span className={`ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.text}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* What-If shortcut */}
      <div className="p-2.5 border-t border-white/[0.07]">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onOpenWhatIf}
          title="What-If Simulator"
          className={`flex w-full items-center justify-center gap-2 rounded-xl bg-[#0071E3]/10 hover:bg-[#0071E3]/18 border border-[#0071E3]/20 p-2.5 text-[12px] font-medium text-[#0071E3] transition-all ${
            isCollapsed ? '' : ''
          }`}
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0" />
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                What-If Simulator
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </aside>
  );
}
