import React from 'react';

export function StatusBadge({ status, size = 'md' }) {
  const isSm = size === 'sm';
  const sizeClass = isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  let dotColor = 'bg-neutral-400';
  let badgeStyle = 'bg-neutral-900/60 text-neutral-300 border-neutral-800/80';
  let label = status;

  switch (status) {
    case 'Healthy':
      dotColor = 'bg-[#30D158]';
      badgeStyle = 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20';
      label = 'Healthy';
      break;
    case 'Reorder Now':
      dotColor = 'bg-[#FF9F0A]';
      badgeStyle = 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/20';
      label = 'Reorder Level';
      break;
    case 'Stockout Risk':
      dotColor = 'bg-[#FF453A] animate-pulse';
      badgeStyle = 'bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/20';
      label = 'Critical (< 7 Days)';
      break;
    case 'Overstocked':
      dotColor = 'bg-[#BF5AF2]';
      badgeStyle = 'bg-[#BF5AF2]/10 text-[#BF5AF2] border-[#BF5AF2]/20';
      label = 'Overstocked';
      break;
    default:
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium tracking-tight ${sizeClass} ${badgeStyle}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
}

export function AbcBadge({ category, velocity }) {
  const getCategoryClass = (cat) => {
    if (cat === 'A') return 'bg-white/10 text-white border-white/15';
    if (cat === 'B') return 'bg-neutral-800/80 text-neutral-300 border-neutral-700/60';
    return 'bg-neutral-900 text-neutral-400 border-neutral-800';
  };

  const getVelocityColor = (vel) => {
    if (vel === 'Fast') return 'text-[#FF9F0A]';
    if (vel === 'Steady') return 'text-[#30D158]';
    return 'text-[#2997FF]';
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getCategoryClass(category)}`}>
        Class {category}
      </span>
      {velocity && (
        <span className={`text-[11px] font-medium tracking-tight ${getVelocityColor(velocity)}`}>
          {velocity}
        </span>
      )}
    </div>
  );
}

export function ErrorTypeBadge({ errorType }) {
  const map = {
    NEGATIVE_QTY: { label: 'Negative Quantity', color: 'text-[#FF453A] bg-[#FF453A]/10 border-[#FF453A]/20' },
    MISSING_DATE: { label: 'Malformed Date', color: 'text-[#FF9F0A] bg-[#FF9F0A]/10 border-[#FF9F0A]/20' },
    PRICE_OUTLIER: { label: 'Outlier Volume (>5x)', color: 'text-[#FF9F0A] bg-[#FF9F0A]/10 border-[#FF9F0A]/20' },
    PRICE_BELOW_COST: { label: 'Margin Inversion', color: 'text-[#FF453A] bg-[#FF453A]/10 border-[#FF453A]/20' },
    INVALID_SKU: { label: 'Missing Identifier', color: 'text-[#BF5AF2] bg-[#BF5AF2]/10 border-[#BF5AF2]/20' },
    NON_NUMERIC: { label: 'Type Mismatch', color: 'text-neutral-300 bg-neutral-800 border-neutral-700' }
  };

  const item = map[errorType] || { label: errorType, color: 'text-neutral-300 bg-neutral-800 border-neutral-700' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono tracking-tight border ${item.color}`}>
      {item.label}
    </span>
  );
}
