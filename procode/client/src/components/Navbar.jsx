import React, { useState } from 'react';
import { Terminal, Trophy, User, LogOut, Menu, X, ShieldAlert, Sparkles, ChevronRight, Code2 } from 'lucide-react';
import TierBadge from './TierBadge';
import AvatarFrame from './AvatarFrame';

export default function Navbar({ activePage, setActivePage, user, onOpenAuth, onOpenHostLogin, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'ladder', label: 'Problem Ladder', icon: Terminal },
    { id: 'compiler', label: 'Online Compiler', icon: Code2 },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
  ];

  if (user && user.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Host Console', icon: ShieldAlert });
  }

  const handleNav = (id) => {
    setActivePage(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs transition-all">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Brand / Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNav('ladder')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center shadow-md shadow-sky-500/25 text-white transition-transform group-hover:scale-105 group-hover:rotate-1">
              <Terminal size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900 font-mono">
                  Pro<span className="text-sky-500">Code</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold tracking-wider text-sky-700 border border-sky-200 bg-sky-50 px-2 py-0.5 rounded-full font-mono">
                  Core DSA Basics
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden md:block">Build Solid Core DSA Fundamentals</p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-sky-50/80 hover:scale-[1.02]'
                  }`}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile or Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div
                  onClick={() => handleNav('profile')}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 cursor-pointer transition group"
                >
                  <AvatarFrame
                    avatar={user.avatar}
                    name={user.name}
                    points={user.careerPoints || 0}
                    size="xs"
                  />
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition">
                      {user.alias || user.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono leading-none">{user.batch}</p>
                  </div>
                  <TierBadge tier={user.rankTier || 'Bronze'} size="xs" />
                </div>

                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Host Login Button */}
                <button
                  onClick={onOpenHostLogin}
                  title="Host Administrator Sign In"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-sky-50 border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-sky-300 rounded-xl text-xs font-semibold shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <ShieldAlert size={14} className="text-sky-500" />
                  <span>Host Login</span>
                </button>

                {/* Standard Auth Button */}
                <button
                  onClick={() => onOpenAuth('signin')}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <User size={14} />
                  <span>Student Sign In</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            {user && (
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-1 rounded-lg">
                <span>{user.careerPoints || 0} pts</span>
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white/98 backdrop-blur-xl px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 hover:text-blue-600 hover:bg-sky-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight size={15} className={isActive ? 'text-white' : 'text-slate-400'} />
                </button>
              );
            })}


          </div>

          {user ? (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div
                onClick={() => handleNav('profile')}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <AvatarFrame
                    avatar={user.avatar}
                    name={user.name}
                    points={user.careerPoints || 0}
                    size="sm"
                    showBadge
                  />
                  <div>
                    <p className="font-bold text-sm text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{user.batch} &bull; {user.careerPoints} pts</p>
                  </div>
                </div>
                <TierBadge tier={user.rankTier || 'Bronze'} size="xs" />
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-sm font-semibold transition"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenHostLogin();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm font-semibold transition hover:bg-sky-50"
              >
                <ShieldAlert size={15} className="text-sky-500" /> Host Admin Login
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('signin');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-500/25 transition"
              >
                <User size={15} /> Student Sign In / Register
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
