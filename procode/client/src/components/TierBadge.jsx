import React from 'react';
import { Award, Shield, Zap, Flame, Crown } from 'lucide-react';

export const TIERS = {
  Bronze: {
    name: 'Bronze',
    min: 0,
    max: 99,
    color: 'text-amber-600 border-amber-600/40 bg-amber-950/20',
    glow: 'from-amber-600/20 to-transparent',
    icon: Shield
  },
  'Silver Knight': {
    name: 'Silver Knight',
    min: 100,
    max: 249,
    color: 'text-slate-700 border-slate-300 bg-slate-100',
    glow: 'from-slate-400/20 to-transparent',
    icon: Shield
  },
  'Gold Coder': {
    name: 'Gold Coder',
    min: 250,
    max: 700,
    color: 'text-amber-600 border-amber-400 bg-amber-50',
    glow: 'from-amber-400/20 to-transparent',
    icon: Award
  },
  'Cosmic Grandmaster': {
    name: 'Cosmic Grandmaster',
    min: 701,
    max: Infinity,
    color: 'text-purple-700 border-purple-300 bg-purple-50',
    glow: 'from-purple-500/30 to-transparent',
    icon: Crown
  },
  // Backward compatibility aliases
  Silver: {
    name: 'Silver Knight',
    min: 100,
    max: 249,
    color: 'text-slate-700 border-slate-300 bg-slate-100',
    glow: 'from-slate-400/20 to-transparent',
    icon: Shield
  },
  Gold: {
    name: 'Gold Coder',
    min: 250,
    max: 700,
    color: 'text-amber-600 border-amber-400 bg-amber-50',
    glow: 'from-amber-400/20 to-transparent',
    icon: Award
  }
};

export default function TierBadge({ tier = 'Bronze', size = 'sm', showIcon = true }) {
  const config = TIERS[tier] || TIERS.Bronze;
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'text-[11px] px-2 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
    lg: 'text-base px-4 py-2 gap-2.5 font-semibold'
  };

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm uppercase tracking-wider font-mono font-semibold ${config.color} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon size={iconSizes[size]} className="shrink-0" />}
      <span>{config.name}</span>
    </span>
  );
}
