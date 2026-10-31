import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from './AnimatedCounter.jsx';

export function StatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  change,
  isPositiveChange,
  icon: Icon,
  subtitle
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="apple-card p-5 select-none relative overflow-hidden group"
    >
      <div className="flex items-start justify-between">
        <p className="text-[12px] font-medium text-neutral-400 tracking-tight">
          {title}
        </p>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] text-neutral-300 border border-white/[0.06] group-hover:bg-white/[0.08] transition-colors">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tighter text-[#F5F5F7]">
          <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] pt-3 border-t border-white/[0.05]">
        {change !== undefined && (
          <div className="flex items-center gap-1.5">
            <span
              className={`font-medium ${
                isPositiveChange ? 'text-[#30D158]' : 'text-[#FF453A]'
              }`}
            >
              {isPositiveChange ? '↑' : '↓'} {change}
            </span>
            <span className="text-neutral-500">vs historical</span>
          </div>
        )}

        {subtitle && (
          <span className="text-neutral-400 font-medium tracking-tight">
            {subtitle}
          </span>
        )}
      </div>
    </motion.div>
  );
}
