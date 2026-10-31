import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from './AnimatedCounter.jsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.38, ease: [0.16, 1, 0.3, 1] },
  }),
};

export function StatCard({ title, value, prefix = '', suffix = '', change, isPositiveChange, icon: Icon, subtitle, index = 0 }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -3, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }}
      className="apple-card card-noise p-5 select-none relative overflow-hidden group cursor-default"
    >
      {/* Subtle corner gradient accent */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, ${isPositiveChange ? 'rgba(48,209,88,0.07)' : 'rgba(255,69,58,0.06)'} 0%, transparent 70%)` }}
      />

      <div className="flex items-start justify-between">
        <p className="text-[12px] font-medium text-neutral-400 tracking-tight leading-tight">{title}</p>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] text-neutral-400 border border-white/[0.06] group-hover:border-white/[0.1] group-hover:text-neutral-200 transition-all duration-200">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tighter text-white">
          <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px]">
        {change !== undefined && (
          <div className="flex items-center gap-1">
            {isPositiveChange
              ? <TrendingUp className="h-3 w-3 text-[#30D158]" />
              : <TrendingDown className="h-3 w-3 text-[#FF453A]" />
            }
            <span className={`font-medium ${isPositiveChange ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>
              {change}
            </span>
            <span className="text-neutral-500 ml-0.5">vs avg</span>
          </div>
        )}
        {subtitle && (
          <span className="text-neutral-500 font-medium tracking-tight truncate">{subtitle}</span>
        )}
      </div>
    </motion.div>
  );
}
