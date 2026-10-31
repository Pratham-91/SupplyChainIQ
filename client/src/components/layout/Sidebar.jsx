import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileSpreadsheet,
  TrendingUp,
  Boxes,
  ShoppingCart,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';

export function Sidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  atRiskCount = 0,
  quarantinePendingCount = 0,
  onOpenWhatIf
}) {
  const navItems = [
    {
      id: 'control-tower',
      label: 'Control Tower',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'data-studio',
      label: 'Data Hygiene & Quarantine',
      icon: FileSpreadsheet,
      badge: quarantinePendingCount > 0 ? { text: `${quarantinePendingCount}`, color: 'bg-[#FF453A]/15 text-[#FF453A]' } : null
    },
    {
      id: 'forecast-explorer',
      label: 'Trajectory & Confidence',
      icon: TrendingUp,
      badge: null
    },
    {
      id: 'inventory-workbench',
      label: 'Replenishment Workbench',
      icon: Boxes,
      badge: atRiskCount > 0 ? { text: `${atRiskCount}`, color: 'bg-[#FF9F0A]/15 text-[#FF9F0A]' } : null
    },
    {
      id: 'purchase-orders',
      label: 'Orders & Shipments',
      icon: ShoppingCart,
      badge: null
    }
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-white/[0.08] bg-[#0A0A0C] transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/[0.08] px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-white/10 to-white/[0.02] border border-white/10 text-white shadow-apple-sm">
            <Layers className="h-4 w-4 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-[14px] font-semibold tracking-tight text-white flex items-center gap-1.5">
                SupplyChain<span className="text-[#0071E3]">IQ</span>
              </span>
              <span className="text-[10px] font-medium text-neutral-500 tracking-tight">
                Enterprise Intelligence
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-1.5 text-neutral-500 hover:bg-white/[0.06] hover:text-white transition-colors"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all group ${
                isActive
                  ? 'text-white'
                  : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200'
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeNavBackgroundApple"
                  className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/[0.08]"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}

              <Icon className={`h-4 w-4 shrink-0 transition-colors ${
                isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'
              }`} />

              {!isCollapsed && (
                <div className="flex flex-1 items-center justify-between overflow-hidden">
                  <span className="truncate tracking-tight">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${item.badge.color}`}>
                      {item.badge.text}
                    </span>
                  )}
                </div>
              )}

              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 hidden rounded-lg bg-neutral-900 border border-white/10 px-2.5 py-1 text-xs text-white shadow-apple-card group-hover:block whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Simulator Shortcut */}
      <div className="p-3 border-t border-white/[0.08]">
        <button
          onClick={onOpenWhatIf}
          className={`flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] p-2.5 text-[12px] font-medium text-neutral-300 transition-all active:scale-[0.98] ${
            isCollapsed ? 'px-0' : ''
          }`}
          title="Open What-If Simulator"
        >
          <SlidersHorizontal className="h-4 w-4 text-neutral-400" />
          {!isCollapsed && <span>What-If Simulator</span>}
        </button>
      </div>
    </aside>
  );
}
