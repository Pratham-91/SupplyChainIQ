import React from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  FileSpreadsheet,
  RefreshCw,
  Command,
} from 'lucide-react';

export function Navbar({ onOpenCommandPalette, onOpenWhatIf, onLoadMessyDemo, onResetSeed, isSeeding = false }) {
  return (
    <header className="sticky top-0 z-30 flex h-[60px] w-full items-center justify-between border-b border-white/[0.07] bg-black/80 px-5 backdrop-blur-2xl select-none">
      {/* Search trigger */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onOpenCommandPalette}
          className="flex items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-neutral-400 hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-neutral-200 transition-all w-64 md:w-72 justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="h-3.5 w-3.5 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
            <span className="text-[12px] font-normal tracking-tight">Search SKUs, orders, forecasts…</span>
          </div>
          <div className="flex items-center gap-0.5 rounded bg-white/[0.07] px-1.5 py-0.5 text-[10px] font-mono text-neutral-500">
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </div>
        </motion.button>

        {/* Live DB status indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11.5px] font-medium text-neutral-500">
          <span className="h-1.5 w-1.5 rounded-full bg-[#30D158] status-pulse" />
          <span>Live • MongoDB Atlas</span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onLoadMessyDemo}
          className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[12px] font-medium text-neutral-300 hover:bg-white/[0.07] hover:text-white transition-all"
          title="Import vendor feed with anomalies"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-neutral-400" />
          <span className="hidden sm:inline">Import Feed</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenWhatIf}
          className="flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0080F5] px-4 py-1.5 text-[12px] font-medium text-white shadow-sm transition-all"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>What-If</span>
        </motion.button>

        <motion.button
          whileHover={{ rotate: isSeeding ? 0 : 45 }}
          whileTap={{ scale: 0.95 }}
          onClick={onResetSeed}
          disabled={isSeeding}
          className="rounded-full border border-white/[0.08] bg-white/[0.03] p-2 text-neutral-400 hover:bg-white/[0.08] hover:text-white transition-all disabled:opacity-40"
          title="Reset to default dataset"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSeeding ? 'animate-spin text-[#0071E3]' : ''}`} />
        </motion.button>

        {/* User avatar */}
        <div className="ml-1.5 flex items-center gap-2.5 border-l border-white/[0.07] pl-3">
          <motion.div
            whileHover={{ scale: 1.08 }}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-gradient-to-b from-neutral-600 to-neutral-800 border border-white/[0.1] text-[11px] font-semibold text-white"
          >
            SP
          </motion.div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-[12px] font-medium text-neutral-200 leading-tight">Supply Planner</span>
            <span className="text-[10px] text-neutral-500">Enterprise</span>
          </div>
        </div>
      </div>
    </header>
  );
}
