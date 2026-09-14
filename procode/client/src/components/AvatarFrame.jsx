import React from 'react';

export function getTierInfo(points = 0) {
  const pts = Number(points) || 0;
  if (pts > 700) {
    return {
      tier: 'Cosmic Grandmaster',
      badge: '👑 Cosmic Grandmaster',
      frameClass: 'p-[3px] bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-400 animate-spin-slow shadow-lg shadow-pink-500/40',
      tagColor: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-pink-400/40',
      glow: 'shadow-[0_0_15px_rgba(236,72,153,0.5)]'
    };
  }
  if (pts >= 250) {
    return {
      tier: 'Gold Coder',
      badge: '⭐ Gold Coder',
      frameClass: 'p-[2.5px] bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 shadow-md shadow-amber-500/30 animate-pulse',
      tagColor: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
      glow: 'shadow-[0_0_12px_rgba(245,158,11,0.4)]'
    };
  }
  if (pts >= 100) {
    return {
      tier: 'Silver Knight',
      badge: '⚡ Silver Knight',
      frameClass: 'p-[2px] bg-gradient-to-r from-slate-300 via-blue-200 to-indigo-300 shadow-sm shadow-blue-400/20',
      tagColor: 'bg-blue-50 text-blue-800 border-blue-200 font-semibold',
      glow: 'shadow-[0_0_8px_rgba(147,197,253,0.4)]'
    };
  }
  return {
    tier: 'Bronze',
    badge: '🌱 Bronze',
    frameClass: 'p-[1.5px] bg-slate-200',
    tagColor: 'bg-slate-100 text-slate-700 border-slate-300',
    glow: ''
  };
}

export default function AvatarFrame({ avatar, name = 'User', points = 0, size = 'md', showBadge = false, className = '' }) {
  const tier = getTierInfo(points);

  const sizeMap = {
    xs: { outer: 'w-7 h-7', inner: 'w-6 h-6', text: 'text-[10px]' },
    sm: { outer: 'w-9 h-9', inner: 'w-8 h-8', text: 'text-xs' },
    md: { outer: 'w-12 h-12', inner: 'w-11 h-11', text: 'text-sm' },
    lg: { outer: 'w-16 h-16', inner: 'w-15 h-15', text: 'text-base' },
    xl: { outer: 'w-24 h-24', inner: 'w-22 h-22', text: 'text-xl' }
  };

  const s = sizeMap[size] || sizeMap.md;
  const initial = name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <div className={`relative inline-flex flex-col items-center group ${className}`}>
      {/* Outer animated frame border */}
      <div className={`rounded-full flex items-center justify-center transition-transform group-hover:scale-105 ${tier.frameClass} ${tier.glow}`}>
        {/* Inner avatar container */}
        <div className={`rounded-full overflow-hidden bg-slate-100 flex items-center justify-center font-bold text-slate-700 border-2 border-white ${s.inner}`}>
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className={s.text}>{initial}</span>
          )}
        </div>
      </div>

      {/* Optional floating mini tier badge */}
      {showBadge && (
        <span className={`absolute -bottom-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold border whitespace-nowrap shadow-sm ${tier.tagColor}`}>
          {tier.badge}
        </span>
      )}
    </div>
  );
}
