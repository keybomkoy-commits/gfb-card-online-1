import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Navbar } from './components/Navbar';
import { Auth } from './components/Auth';
import { SquadBuilder } from './components/SquadBuilder';
import { Shop } from './components/Shop';
import { Battle } from './components/Battle';
import { AdminPanel } from './components/AdminPanel';
import { Card } from './components/Card';
import { Mailbox } from './components/Mailbox';
import { 
  Sparkles, Coins, Users, Swords, Search, Star, 
  History, LayoutDashboard, Trophy, Award, X, Shield 
} from 'lucide-react';

const LEADERBOARD_FORMATIONS = {
  '4-4-2': [
    { label: 'GK', x: 50, y: 88 },
    { label: 'LB', x: 15, y: 68 },
    { label: 'CB', x: 38, y: 70 },
    { label: 'CB', x: 62, y: 70 },
    { label: 'RB', x: 85, y: 68 },
    { label: 'LM', x: 15, y: 44 },
    { label: 'CM', x: 37, y: 45 },
    { label: 'CM', x: 63, y: 45 },
    { label: 'RM', x: 85, y: 44 },
    { label: 'ST', x: 35, y: 18 },
    { label: 'ST', x: 65, y: 18 }
  ],
  '4-3-3': [
    { label: 'GK', x: 50, y: 88 },
    { label: 'LB', x: 15, y: 68 },
    { label: 'CB', x: 38, y: 70 },
    { label: 'CB', x: 62, y: 70 },
    { label: 'RB', x: 85, y: 68 },
    { label: 'CM', x: 25, y: 46 },
    { label: 'CM', x: 50, y: 48 },
    { label: 'CM', x: 75, y: 46 },
    { label: 'LW', x: 20, y: 18 },
    { label: 'ST', x: 50, y: 16 },
    { label: 'RW', x: 80, y: 18 }
  ],
  '3-5-2': [
    { label: 'GK', x: 50, y: 88 },
    { label: 'CB', x: 25, y: 70 },
    { label: 'CB', x: 50, y: 72 },
    { label: 'CB', x: 75, y: 70 },
    { label: 'LM', x: 15, y: 45 },
    { label: 'CM', x: 35, y: 48 },
    { label: 'CM', x: 50, y: 52 },
    { label: 'CM', x: 65, y: 48 },
    { label: 'RM', x: 85, y: 45 },
    { label: 'ST', x: 35, y: 18 },
    { label: 'ST', x: 65, y: 18 }
  ],
  '5-3-2': [
    { label: 'GK', x: 50, y: 88 },
    { label: 'LWB', x: 12, y: 65 },
    { label: 'CB', x: 32, y: 70 },
    { label: 'CB', x: 50, y: 72 },
    { label: 'CB', x: 68, y: 70 },
    { label: 'RWB', x: 88, y: 65 },
    { label: 'CM', x: 28, y: 45 },
    { label: 'CM', x: 50, y: 46 },
    { label: 'CM', x: 72, y: 45 },
    { label: 'ST', x: 35, y: 18 },
    { label: 'ST', x: 65, y: 18 }
  ]
};

const Dashboard = ({ setView }) => {
  const { currentUser, matchLogs } = useGame();
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState('ALL');
  const [selectedCard, setSelectedCard] = useState(null);

  if (!currentUser) return null;

  // Calculate Match Stats
  const getUserStats = () => {
    const userMatches = matchLogs.filter(log => log.player === currentUser.username);
    const wins = userMatches.filter(log => log.result === 'win').length;
    const losses = userMatches.filter(log => log.result === 'loss').length;
    const draws = userMatches.filter(log => log.result === 'draw').length;
    return { total: userMatches.length, wins, losses, draws };
  };

  const stats = getUserStats();

  const getSquadOvr = () => {
    if (!currentUser.squad || Object.keys(currentUser.squad).length === 0) return 0;
    const squadCards = Object.values(currentUser.squad)
      .map(instId => currentUser.cards.find(c => c.instanceId === instId))
      .filter(Boolean);
    if (squadCards.length === 0) return 0;
    const sum = squadCards.reduce((acc, c) => acc + c.rating, 0);
    return Math.round(sum / squadCards.length);
  };

  // Filter user cards
  const getFilteredInventory = () => {
    return currentUser.cards.filter(card => {
      const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            card.club.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            card.nationality.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            card.position.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRarity = rarityFilter === 'ALL' || card.rarity === rarityFilter.toLowerCase();
      return matchesSearch && matchesRarity;
    }).sort((a, b) => b.rating - a.rating); // Highest rating first
  };

  const filteredCards = getFilteredInventory();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="glass-premium p-8 border-white/5 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full" />
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-2">
            <Sparkles size={28} className="text-emerald-400" />
            ยินดีต้อนรับกลับสู่ลีค, {currentUser.username}!
          </h2>
          <p className="text-slate-400 text-sm mt-1.5 leading-relaxed max-w-xl">
            ผู้จัดการทีมและนักวางแผนฟุตบอลผู้ยิ่งใหญ่! รวบรวมการ์ดนักเตะระดับท็อป จัดแผน 11 ตัวจริง แล้วไปวัดพลังโค่นบอทและผู้เล่นในสนามอารีน่า
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button 
            onClick={() => setView('squad')}
            className="btn btn-primary px-5 py-2.5 rounded-xl font-bold flex-1 md:flex-initial"
          >
            <Users size={16} />
            <span>จัดผัง 11 ตัวจริง</span>
          </button>
          <button 
            onClick={() => setView('battle')}
            className="btn btn-gold px-5 py-2.5 rounded-xl font-bold flex-1 md:flex-initial"
          >
            <Swords size={16} />
            <span>เข้าแข่งขันดวลพลัง</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Coins */}
        <div className="glass p-5 border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Coins size={22} className="text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">เหรียญทองสะสม</span>
            <span className="text-2xl font-black text-white">{currentUser.coins.toLocaleString()}</span>
          </div>
        </div>

        {/* Metric 2: OVR */}
        <div className="glass p-5 border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Users size={22} className="text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">สควอดตัวจริง OVR</span>
            <span className="text-2xl font-black text-white">{getSquadOvr()} OVR</span>
          </div>
        </div>

        {/* Metric 3: Record */}
        <div className="glass p-5 border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Swords size={22} className="text-cyan-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">สถิติ (ชนะ-เสมอ-แพ้)</span>
            <span className="text-2xl font-black text-white">
              {stats.wins}-{stats.draws}-{stats.losses}
            </span>
          </div>
        </div>

        {/* Metric 4: Total Cards */}
        <div className="glass p-5 border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Star size={22} className="text-purple-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">คลังการ์ดทั้งหมด</span>
            <span className="text-2xl font-black text-white">{currentUser.cards?.length || 0} ใบ</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Cards Inventory list (Grid span-2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 border-white/5">
            
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-900 pb-5">
              <div>
                <h3 className="text-xl font-black text-white">คลังสะสมนักเตะของคุณ</h3>
                <span className="text-slate-500 text-xs mt-1 block">แสดงผลเฉพาะการ์ดที่คุณครอบครองอยู่</span>
              </div>
              
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900 w-full sm:w-auto overflow-x-auto">
                {['ALL', 'ICON', 'LEGENDARY', 'EPIC', 'RARE', 'COMMON'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setRarityFilter(filter)}
                    className={`flex-1 sm:flex-none text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                      rarityFilter === filter 
                        ? 'bg-slate-800 text-emerald-400' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาตามชื่อนักเตะ, สัญชาติ, สโมสร, ตำแหน่ง..."
                className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
            </div>

            {/* Cards Grid */}
            {filteredCards.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredCards.map((card) => {
                  const isEquipped = Object.values(currentUser.squad || {}).includes(card.instanceId);
                  return (
                    <div 
                      key={card.instanceId} 
                      className="relative flex flex-col items-center group cursor-pointer"
                      onClick={() => setSelectedCard(card)}
                    >
                      <Card card={card} size="medium" showStats={false} />
                      {isEquipped && (
                        <div className="absolute top-2 left-2 bg-emerald-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded shadow border border-emerald-400">
                          ตัวจริง 11 คน
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-slate-500 font-medium">ไม่พบการ์ดนักเตะตรงตามเงื่อนไขค้นหา</p>
              </div>
            )}

          </div>
        </div>

        {/* Right Side: Card details inspection & Match Logs */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Card Inspect Area */}
          <div className="glass p-6 border-white/5 flex flex-col items-center min-h-[380px] justify-center">
            {selectedCard ? (
              <div className="w-full text-center space-y-6 animate-scale-in">
                <div className="flex justify-between items-center w-full border-b border-slate-900 pb-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    ตรวจสอบการ์ดเจาะลึก
                  </span>
                  <button 
                    onClick={() => setSelectedCard(null)}
                    className="p-1 rounded bg-slate-950 border border-slate-900 text-slate-400 hover:text-white text-xs"
                  >
                    ✕ ปิด
                  </button>
                </div>
                
                <div className="flex justify-center">
                  <Card card={selectedCard} size="large" showStats={true} />
                </div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Search size={20} />
                </div>
                <h4 className="text-white font-extrabold text-sm">คลิกเลือกการ์ดเพื่อซูม</h4>
                <p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                  คลิกที่การ์ดใบใดก็ได้ด้านซ้ายมือ เพื่อเปิดดูหน้าตากลิตเตอร์เรืองแสง 3D พิกัดสเตตัสเฉพาะด้านโดยละเอียด
                </p>
              </div>
            )}
          </div>

          {/* User match logs */}
          <div className="glass p-6 border-white/5 flex flex-col h-[320px]">
            <h3 className="text-lg font-black text-white mb-4 border-b border-slate-900 pb-3 flex items-center gap-2">
              <History size={16} className="text-cyan-400" />
              ผลการแข่ง 5 นัดล่าสุดของคุณ
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1.5">
              {currentUser.matchHistory && currentUser.matchHistory.length > 0 ? (
                currentUser.matchHistory
                  .slice(0, 5)
                  .map((log) => {
                    const win = log.result === 'win';
                    const loss = log.result === 'loss';
                    return (
                      <div 
                        key={log.id} 
                        className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-900 rounded-xl"
                      >
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            win ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                            loss ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' :
                            'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                          }`}>
                            {log.result}
                          </span>
                          <h4 className="text-xs font-bold text-white truncate max-w-[130px] sm:max-w-none">
                            สู้กับ: {log.opponent}
                          </h4>
                          <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">
                            โหมด: {log.difficulty || 'นัดกระชับมิตร'}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-heading font-black text-white block">
                            {log.playerScore} - {log.opponentScore}
                          </span>
                          <span className="text-[10px] font-bold text-amber-400">
                            +{log.coinsEarned} เหรียญ
                          </span>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-600 font-medium">ยังไม่เคยลงแข่งขันสนาม</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

// --- LEADERBOARD / TOP SERVER COMPONENT ---
const Leaderboard = () => {
  const { users } = useGame();
  const [inspectedUser, setInspectedUser] = useState(null); // User currently inspected

  const getLeaderboardData = () => {
    return users
      .filter(u => u.username !== 'admin' && u.role !== 'admin')
      .map(u => {
        const matches = u.matchHistory || [];
      const wins = matches.filter(m => m.result === 'win').length;
      const losses = matches.filter(m => m.result === 'loss').length;
      const draws = matches.filter(m => m.result === 'draw').length;
      const total = matches.length;
      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
      
      const squadCards = Object.values(u.squad || {})
        .map(instId => u.cards.find(c => c.instanceId === instId))
        .filter(Boolean);
      const squadOvr = squadCards.length > 0 
        ? Math.round(squadCards.reduce((acc, c) => acc + c.rating, 0) / squadCards.length) 
        : 0;

      return {
        username: u.username,
        role: u.role,
        winRate,
        wins,
        losses,
        draws,
        total,
        coins: u.coins,
        squadOvr,
        squad: u.squad,
        cards: u.cards,
        formation: u.formation
      };
    }).sort((a, b) => {
      // Sort by Win Rate % (require minimum 1 match to rank above 0%)
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.squadOvr - a.squadOvr;
    });
  };

  const rankData = getLeaderboardData();
  const topThree = rankData.slice(0, 3);
  const remainingList = rankData.slice(3);

  // Inspected Squad calculations
  const inspectedSlots = inspectedUser ? LEADERBOARD_FORMATIONS[inspectedUser.formation || '4-4-2'] : [];
  const inspectedLineup = inspectedUser ? inspectedSlots.map((slot, idx) => {
    const instId = inspectedUser.squad[`pos_${idx}`];
    return inspectedUser.cards.find(c => c.instanceId === instId) || null;
  }) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      
      {/* Title */}
      <div className="glass p-6 border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-2">
            <Trophy className="text-amber-400 animate-bounce-short" />
            ทำเนียบโค้ชระดับท็อป (GFB LEADERBOARD)
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            อันดับผู้เล่นและผู้จัดการลีคการ์ดที่แข็งแกร่งที่สุด วัดจากอัตราร้อยละเปอร์เซ็นต์การชนะศึก (Win Rate %)
          </p>
        </div>
      </div>

      {/* Podium for Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto items-end pt-8">
        
        {/* Rank 2 (Silver) */}
        {topThree[1] && (
          <div className="flex flex-col items-center order-2 md:order-1">
            <div className="text-center space-y-2 mb-4 animate-scale-in">
              <span className="text-xs font-black text-slate-400">RANK 2 (🥈 SILVER)</span>
              <h4 className="text-xl font-bold text-white leading-none">{topThree[1].username}</h4>
              <p className="text-sm font-black text-slate-400">{topThree[1].winRate}% Win Rate</p>
              <span className="text-[10px] text-slate-500 block">สควอด OVR: {topThree[1].squadOvr} • ชนะ {topThree[1].wins} นัด</span>
            </div>
            {/* Base */}
            <div className="w-full bg-slate-900/60 border-t-4 border-slate-400 rounded-t-2xl py-8 text-center shadow-xl flex flex-col items-center justify-center min-h-[140px] px-4">
              <span className="text-5xl font-black text-slate-400">2</span>
              <button 
                onClick={() => setInspectedUser(topThree[1])}
                className="btn btn-secondary px-3.5 py-1.5 rounded-lg text-[10px] font-bold mt-4 shrink-0"
              >
                ดูแผนทีม
              </button>
            </div>
          </div>
        )}

        {/* Rank 1 (Gold - Center) */}
        {topThree[0] && (
          <div className="flex flex-col items-center order-1 md:order-2">
            <div className="text-center space-y-2 mb-4 relative z-10 animate-scale-in">
              <Award className="text-amber-400 mx-auto animate-pulse scale-125 mb-1" size={28} />
              <span className="text-xs font-black text-amber-300">RANK 1 (🏆 CHAMPION)</span>
              <h4 className="text-2xl font-black text-white leading-none">{topThree[0].username}</h4>
              <p className="text-lg font-black text-amber-400">{topThree[0].winRate}% Win Rate</p>
              <span className="text-[10px] text-slate-400 block">สควอด OVR: {topThree[0].squadOvr} • ชนะ {topThree[0].wins} นัด</span>
            </div>
            {/* Base */}
            <div className="w-full bg-slate-900 border-t-4 border-amber-400 rounded-t-2xl py-12 text-center shadow-2xl flex flex-col items-center justify-center min-h-[180px] px-4 relative">
              <div className="absolute inset-0 bg-amber-500/5 blur-xl rounded-full" />
              <span className="text-6xl font-black text-amber-400 relative z-10">1</span>
              <button 
                onClick={() => setInspectedUser(topThree[0])}
                className="btn btn-primary px-4 py-2 rounded-lg text-xs font-black mt-4 shrink-0 relative z-10 shadow-lg shadow-emerald-500/10"
              >
                ดูแผนทีม
              </button>
            </div>
          </div>
        )}

        {/* Rank 3 (Bronze) */}
        {topThree[2] && (
          <div className="flex flex-col items-center order-3 md:order-3">
            <div className="text-center space-y-2 mb-4 animate-scale-in">
              <span className="text-xs font-black text-amber-600">RANK 3 (🥉 BRONZE)</span>
              <h4 className="text-xl font-bold text-white leading-none">{topThree[2].username}</h4>
              <p className="text-sm font-black text-amber-600">{topThree[2].winRate}% Win Rate</p>
              <span className="text-[10px] text-slate-500 block">สควอด OVR: {topThree[2].squadOvr} • ชนะ {topThree[2].wins} นัด</span>
            </div>
            {/* Base */}
            <div className="w-full bg-slate-900/40 border-t-4 border-amber-600 rounded-t-2xl py-6 text-center shadow-lg flex flex-col items-center justify-center min-h-[110px] px-4">
              <span className="text-4xl font-black text-amber-600">3</span>
              <button 
                onClick={() => setInspectedUser(topThree[2])}
                className="btn btn-secondary px-3.5 py-1.5 rounded-lg text-[10px] font-bold mt-4 shrink-0"
              >
                ดูแผนทีม
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Rankings List table */}
      <div className="glass p-6 border-white/5 space-y-4">
        <h3 className="text-xl font-black text-white">ตารางจัดอันดับผู้จัดการลีค (RANKINGS TABLE)</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-[10px] text-slate-500 bg-slate-950/60 border-b border-slate-900">
              <tr>
                <th className="p-4 font-bold tracking-widest uppercase">อันดับ</th>
                <th className="p-4 font-bold tracking-widest uppercase">โค้ชผู้เล่น</th>
                <th className="p-4 font-bold tracking-widest uppercase text-center">อัตราชนะ (Win Rate)</th>
                <th className="p-4 font-bold tracking-widest uppercase">สถิติ (W - D - L)</th>
                <th className="p-4 font-bold tracking-widest uppercase">ความแกร่งทีม</th>
                <th className="p-4 font-bold tracking-widest uppercase">เหรียญทองสะสม</th>
                <th className="p-4 font-bold tracking-widest uppercase text-center">แผนการเล่น</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-xs">
              {rankData.map((user, idx) => (
                <tr key={user.username} className="hover:bg-slate-900/30 transition-colors">
                  <td className="p-4">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-heading font-black leading-none ${
                      idx === 0 ? 'bg-amber-400 text-black shadow' :
                      idx === 1 ? 'bg-slate-400 text-black shadow' :
                      idx === 2 ? 'bg-amber-700 text-white shadow' :
                      'bg-slate-950 text-slate-500 border border-slate-900'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white">{user.username}</span>
                      {user.role === 'admin' && (
                        <span className="text-[7.5px] font-black text-rose-450 border border-rose-500/20 bg-rose-500/5 px-1 py-0.5 rounded leading-none">ADMIN</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center font-heading font-black text-white text-base tabular-nums">
                    {user.winRate}%
                  </td>
                  <td className="p-4 font-bold text-slate-400 font-mono tracking-tight">
                    {user.wins}W - {user.draws}D - {user.losses}L
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 font-heading font-black text-[10.5px]">
                      {user.squadOvr} OVR
                    </span>
                  </td>
                  <td className="p-4 font-heading font-bold text-amber-400 tabular-nums">
                    {user.coins.toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => setInspectedUser(user)}
                      className="btn btn-secondary px-3 py-1.5 rounded-lg text-[10px] font-black shrink-0 uppercase tracking-wider"
                    >
                      ดูสควอด {user.formation}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT SQUAD MODAL */}
      {inspectedUser && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4" style={{ zIndex: 100 }}>
          <div className="glass-premium max-w-lg w-full p-6 border border-white/10 relative overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-slate-900 pb-3">
              <div>
                <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-widest">GFB SQUAD INSPECT</span>
                <h3 className="text-xl font-black text-white mt-1">
                  ผังทีมของ {inspectedUser.username} ({inspectedUser.formation})
                </h3>
              </div>
              <button 
                onClick={() => setInspectedUser(null)}
                className="p-1.5 rounded bg-slate-950 border border-slate-850 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Render inspected pitch */}
            <div className="w-full max-w-[440px] aspect-[3/4] football-pitch relative shadow-2xl mx-auto border border-slate-800">
              <div className="pitch-lines">
                <div className="pitch-midline" />
                <div className="pitch-center-circle" />
                <div className="pitch-penalty-area-top" />
                <div className="pitch-penalty-area-bottom" />
              </div>

              {inspectedSlots.map((slot, idx) => {
                const card = inspectedLineup[idx];
                return (
                  <div
                    key={idx}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20"
                    style={{
                      left: `${slot.x}%`,
                      top: `${slot.y}%`
                    }}
                  >
                    {card ? (
                      <Card card={card} size="small" showStats={false} />
                    ) : (
                      <div className="w-[50px] h-[70px] rounded-lg bg-slate-950/70 border border-dashed border-white/10 flex items-center justify-center text-[7px] text-slate-500 font-bold uppercase">
                        {slot.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Back button */}
            <button
              onClick={() => setInspectedUser(null)}
              className="w-full btn btn-secondary py-3 rounded-xl font-bold mt-6"
            >
              ปิดหน้าต่างส่องสควอด
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

// --- APP CONTENT ROUTER ---
const AppContent = () => {
  const { currentUser } = useGame();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'squad', 'shop', 'battle', 'leaderboard', 'admin'
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Navbar currentView={view} setView={setView} onMailboxOpen={() => setIsMailboxOpen(true)} />
      
      <main className="flex-grow">
        {view === 'dashboard' && <Dashboard setView={setView} />}
        {view === 'squad' && <SquadBuilder />}
        {view === 'shop' && <Shop />}
        {view === 'battle' && <Battle />}
        {view === 'leaderboard' && <Leaderboard />}
        {view === 'admin' && currentUser.role === 'admin' && <AdminPanel />}
      </main>
      <Mailbox isOpen={isMailboxOpen} onClose={() => setIsMailboxOpen(false)} />
    </div>
  );
};

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;
