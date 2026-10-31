import React from 'react';
import {
  Search,
  SlidersHorizontal,
  FileSpreadsheet,
  RefreshCw,
  Sun,
  Moon,
  Command
} from 'lucide-react';

export function Navbar({
  onOpenCommandPalette,
  onOpenWhatIf,
  onLoadMessyDemo,
  onResetSeed,
  isDarkMode,
  setIsDarkMode,
  isSeeding = false
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/[0.08] bg-black/70 px-6 backdrop-blur-2xl select-none">
      {/* Left: Spotlight / Global Search */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs text-neutral-400 hover:border-white/[0.16] hover:bg-white/[0.07] hover:text-white transition-all shadow-apple-sm w-72 md:w-80 justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white transition-colors" />
            <span className="truncate text-[12px] font-normal tracking-tight">Search SKUs, forecasts, orders...</span>
          </div>
          <div className="flex items-center gap-0.5 rounded-md bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-mono text-neutral-400">
            <span>⌘K</span>
          </div>
        </button>

        <div className="hidden lg:flex items-center gap-2 text-[12px] font-medium text-neutral-400">
          <span className="h-2 w-2 rounded-full bg-[#30D158]" />
          <span>MongoDB Connected • 5,600+ Transactions</span>
        </div>
      </div>

      {/* Right Actions: Apple-style frosted buttons */}
      <div className="flex items-center gap-2.5">
        {/* Sample Messy CSV Trigger */}
        <button
          onClick={onLoadMessyDemo}
          className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-[12px] font-medium text-neutral-300 hover:bg-white/[0.08] hover:text-white transition-all active:scale-[0.98]"
          title="Import vendor feed with non-standard columns & anomalies"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-neutral-400" />
          <span className="hidden sm:inline">Import Vendor Feed</span>
        </button>

        {/* What-If Simulator Action */}
        <button
          onClick={onOpenWhatIf}
          className="flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-4 py-1.5 text-[12px] font-medium text-white shadow-apple-sm transition-all active:scale-[0.98]"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>What-If Simulator</span>
        </button>

        {/* Database Reset Seed */}
        <button
          onClick={onResetSeed}
          disabled={isSeeding}
          className="rounded-full border border-white/[0.08] bg-white/[0.04] p-2 text-neutral-400 hover:bg-white/[0.08] hover:text-white transition-all disabled:opacity-40"
          title="Reset Baseline Dataset"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSeeding ? 'animate-spin text-[#0071E3]' : ''}`} />
        </button>

        {/* User Pill */}
        <div className="ml-2 flex items-center gap-2.5 border-l border-white/[0.08] pl-3.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-b from-neutral-700 to-neutral-900 border border-white/[0.1] text-[11px] font-semibold text-white">
            SC
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-[12px] font-medium text-neutral-200 tracking-tight leading-tight">Supply Planner</span>
            <span className="text-[10px] text-neutral-500 tracking-tight">Enterprise Edition</span>
          </div>
        </div>
      </div>
    </header>
  );
}
