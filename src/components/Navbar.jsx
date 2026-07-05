import React from 'react';
import { useGame } from '../context/GameContext';
import { LayoutDashboard, Users, ShoppingBag, Swords, ShieldCheck, LogOut, Coins, Trophy } from 'lucide-react';

export const Navbar = ({ currentView, setView }) => {
  const { currentUser, logout, firebaseActive } = useGame();

  if (!currentUser) return null;

  // Calculate Squad Overall for navbar display
  const getSquadOvr = () => {
    if (!currentUser.squad || Object.keys(currentUser.squad).length === 0) return 0;
    const squadCards = Object.values(currentUser.squad)
      .map(instId => currentUser.cards.find(c => c.instanceId === instId))
      .filter(Boolean);
    if (squadCards.length === 0) return 0;
    const sum = squadCards.reduce((acc, c) => acc + c.rating, 0);
    return Math.round(sum / squadCards.length);
  };

  const navItems = [
    { id: 'dashboard', label: 'หน้าแรก', icon: LayoutDashboard },
    { id: 'squad', label: 'จัดทีมการ์ด', icon: Users },
    { id: 'shop', label: 'ร้านค้าตู้อารีน่า', icon: ShoppingBag },
    { id: 'battle', label: 'ท้าดวลสู้ศึก', icon: Swords },
    { id: 'leaderboard', label: 'ท็อปเซิร์ฟ', icon: Trophy },
  ];

  // If admin, append admin panel
  if (currentUser.role === 'admin') {
    navItems.push({ id: 'admin', label: 'ควบคุมระบบ', icon: ShieldCheck });
  }

  return (
    <header className="sticky top-0 w-full z-40 px-4 pt-4">
      <div className="max-w-7xl mx-auto glass-premium flex items-center justify-between px-6 py-4 border border-white/5 shadow-2xl">
        
        {/* Logo / Title */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-md flex items-center justify-center">
            <span className="text-black font-black text-xl tracking-tighter">GFB</span>
          </div>
          <div>
            <h1 className="text-md font-black tracking-wider text-white leading-none">GFB CARD</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase">ONLINE</span>
              {firebaseActive ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="เซิร์ฟเวอร์คลาวด์ออนไลน์ (Firebase)" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" title="ออฟไลน์ดาต้าเบส (LocalStorage Fallback) - เช็คคีย์และเน็ต" />
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-950/40 p-1 rounded-xl border border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-md font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Stats & Logout */}
        <div className="flex items-center gap-4">
          
          {/* OVR Display */}
          <div className="hidden sm:flex flex-col items-end border-r border-slate-800 pr-3">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">SQUAD OVR</span>
            <span className="text-sm font-black text-white">{getSquadOvr()} OVR</span>
          </div>

          {/* Coins Display */}
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-xl">
            <Coins size={16} className="text-amber-400 animate-spin-slow" />
            <span className="text-sm font-black text-amber-300">
              {currentUser.coins.toLocaleString()}
            </span>
          </div>

          {/* User Profile / Logout */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-white leading-none">
                {currentUser.username}
              </span>
              <span className="text-[9px] font-semibold text-slate-500 mt-0.5 uppercase tracking-wider">
                {currentUser.role === 'admin' ? 'ADMIN' : 'PLAYER'}
              </span>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/25 transition-all ml-1"
              title="ออกจากระบบ"
            >
              <LogOut size={16} />
            </button>
          </div>

        </div>

      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex justify-around mt-2 glass bg-slate-950/80 p-2 border-white/5 rounded-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-bold transition-all ${
                isActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
