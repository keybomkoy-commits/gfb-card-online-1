import React, { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { CardPack } from './CardPack';
import { Card } from './Card';
import { 
  ShoppingBag, Coins, Sparkles, AlertCircle, Percent, 
  ArrowDownRight, Tag, HelpCircle, Eye, EyeOff, Recycle, Search
} from 'lucide-react';

export const Shop = () => {
  const { currentUser, packSettings, buyPack, sellCard } = useGame();
  
  // Pack states
  const [openedCards, setOpenedCards] = useState(null); // Cards rolled
  const [activePackName, setActivePackName] = useState(''); // Opened pack name
  const [errorMessage, setErrorMessage] = useState('');
  
  // Toggle odds viewing states
  const [showPackOdds, setShowPackOdds] = useState({}); // { [packId]: boolean }

  // Roster sell view state
  const [sellFilter, setSellFilter] = useState('ALL');
  const [sellSearch, setSellSearch] = useState('');

  // Lock double submissions
  const isBuyingRef = useRef(false);

  if (!currentUser) return null;

  const handlePurchase = (packId, packName) => {
    if (isBuyingRef.current || openedCards) return;
    isBuyingRef.current = true;
    
    setErrorMessage('');
    const res = buyPack(packId);
    
    if (res.success) {
      // Play purchase synthesised success chime
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
      } catch (err) {
        console.warn(err);
      }

      setOpenedCards(res.cards);
      setActivePackName(packName);
    } else {
      setErrorMessage(res.message);
      setTimeout(() => setErrorMessage(''), 4000);
    }

    // Debounce buying lock for 500ms
    setTimeout(() => {
      isBuyingRef.current = false;
    }, 500);
  };

  const toggleOdds = (packId) => {
    setShowPackOdds(prev => ({
      ...prev,
      [packId]: !prev[packId]
    }));
  };

  // Filter player cards for the sell panel
  const getSellableCards = () => {
    return currentUser.cards.filter(card => {
      // Exclude cards currently in active squad
      const inSquad = Object.values(currentUser.squad || {}).includes(card.instanceId);
      if (inSquad) return false;

      // Search Query
      const matchesSearch = card.name.toLowerCase().includes(sellSearch.toLowerCase()) ||
                            card.club.toLowerCase().includes(sellSearch.toLowerCase()) ||
                            card.nationality.toLowerCase().includes(sellSearch.toLowerCase()) ||
                            card.position.toLowerCase().includes(sellSearch.toLowerCase());
      if (!matchesSearch) return false;

      // Filter by Rarity
      if (sellFilter !== 'ALL' && card.rarity !== sellFilter.toLowerCase()) return false;

      return true;
    }).sort((a, b) => b.rating - a.rating);
  };

  const getSellValue = (rarity) => {
    switch (rarity) {
      case 'icon': return 1000;
      case 'legendary': return 400;
      case 'epic': return 150;
      case 'rare': return 50;
      default: return 20;
    }
  };

  const handleSellCard = (instanceId) => {
    // Play selling sound
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(392.00, audioCtx.currentTime); // G4
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime + 0.08); // D5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (err) {
      console.warn(err);
    }

    const res = sellCard(instanceId);
    if (!res.success) {
      alert(res.message);
    }
  };

  const sellableCards = getSellableCards();

  const getPackBorderColor = (name) => {
    if (name.includes('Starter')) return 'border-slate-700/60 shadow-slate-900/30';
    if (name.includes('Gold')) return 'border-amber-500/30 shadow-amber-500/5';
    if (name.includes('Legendary')) return 'border-rose-600/40 shadow-rose-600/5';
    return 'border-amber-400/50 shadow-amber-400/10';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      
      {/* Gacha Opening overlay */}
      {openedCards && (
        <CardPack 
          packName={activePackName}
          cards={openedCards}
          onFinished={() => {
            setOpenedCards(null);
            setActivePackName('');
          }}
        />
      )}

      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-white/5">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="text-emerald-400 animate-bounce-short" />
            ตู้สุ่มร้านค้าอารีน่า (GFB STORE & MARKET)
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            เปิดซองสะสมนักเตะดาราดัง เสริมมิติพลังทีม หรือรีไซเคิลขายการ์ดเพื่อฟาร์มเงินทอง
          </p>
        </div>

        {/* User Balance */}
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/25 px-5 py-3 rounded-2xl">
          <Coins size={22} className="text-amber-400 animate-spin-slow" />
          <div>
            <span className="text-[9px] font-bold text-slate-500 block uppercase leading-none mb-1">เหรียญทองปัจจุบัน</span>
            <span className="text-xl font-black text-amber-300">
              {currentUser.coins.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-500/15 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-pulse">
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SECTION 1: PACKS STORE */}
      <div className="space-y-6">
        <h3 className="text-xl font-black text-white flex items-center gap-2">
          <Sparkles size={20} className="text-emerald-400" />
          โซนตู้สุ่มยอดฮิต (PREMIUM GACHA ARENA)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {packSettings.map(pack => {
            const hasOdds = showPackOdds[pack.id];
            
            return (
              <div 
                key={pack.id} 
                className={`glass p-6 border flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 ${getPackBorderColor(pack.name)}`}
              >
                {/* Visual Glow reflection */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30" />
                
                <div className="space-y-4">
                  {/* Brand */}
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                      GFB STORE
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      บรรจุ {pack.count} การ์ด/ซอง
                    </span>
                  </div>

                  {/* Pack name */}
                  <div>
                    <h4 className="text-xl font-black text-white leading-tight uppercase truncate">{pack.name}</h4>
                    <p className="text-slate-400 text-xs mt-1.5">สุ่มลุ้นโชครับดาราฟุตบอลยอดฮิต OVR พลังสูง</p>
                  </div>

                  {/* Price info */}
                  <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900 justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">ราคาต่อซอง</span>
                    <div className="flex items-center gap-1 font-extrabold text-white text-base">
                      <Coins size={16} className="text-amber-400" />
                      <span>{pack.price.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Expandable Odds Probability details */}
                  <div>
                    <button
                      onClick={() => toggleOdds(pack.id)}
                      className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-950 p-2 rounded-lg border border-slate-900 w-full justify-center transition-colors"
                    >
                      {hasOdds ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{hasOdds ? 'ซ่อนเรตสุ่ม' : 'แสดงอัตราสุ่มการ์ด'}</span>
                    </button>

                    {hasOdds && (
                      <div className="mt-3.5 space-y-2.5 bg-slate-950/80 p-3 rounded-xl border border-slate-900 animate-scale-in text-left">
                        <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider border-b border-slate-900 pb-1">Probability Rates</span>
                        
                        {/* Rarity odds stats */}
                        {[
                          { key: 'common', label: 'Common (การ์ดเทา)', color: 'from-slate-600 to-slate-400' },
                          { key: 'rare', label: 'Rare (การ์ดทอง)', color: 'from-amber-600 to-amber-400' },
                          { key: 'epic', label: 'Epic (การ์ดม่วง)', color: 'from-purple-600 to-purple-400' },
                          { key: 'legendary', label: 'Legendary (การ์ดแดง)', color: 'from-rose-600 to-rose-400' },
                          { key: 'icon', label: 'Icon (การ์ดไอคอน)', color: 'from-amber-500 to-yellow-300' }
                        ].map(odd => {
                          const rate = pack.rates[odd.key] || 0;
                          return (
                            <div key={odd.key} className="space-y-1">
                              <div className="flex justify-between text-[9px] font-bold">
                                <span className="text-slate-400">{odd.label}</span>
                                <span className="text-white">{rate}%</span>
                              </div>
                              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full bg-gradient-to-r ${odd.color} rounded-full`}
                                  style={{ width: `${rate}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Purchase buttons */}
                <button
                  onClick={() => handlePurchase(pack.id, pack.name)}
                  disabled={currentUser.coins < pack.price}
                  className="w-full btn btn-primary py-3 rounded-xl font-black text-sm mt-6 shadow-xl disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} className="fill-black" />
                  <span>ซื้อซองสุ่มการ์ด</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: PLAYER RECYCLER MARKET */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-4">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Recycle size={20} className="text-cyan-400" />
            โซนตลาดรีไซเคิลการ์ด (PLAYER MARKET)
          </h3>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900 w-full sm:w-auto overflow-x-auto">
            {['ALL', 'ICON', 'LEGENDARY', 'EPIC', 'RARE', 'COMMON'].map(filter => (
              <button
                key={filter}
                onClick={() => setSellFilter(filter)}
                className={`flex-1 sm:flex-none text-[10px] font-bold px-3.5 py-1.5 rounded-lg transition-all uppercase tracking-wider ${
                  sellFilter === filter 
                    ? 'bg-slate-800 text-cyan-400' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Sell Search and Inventory grid */}
        <div className="glass p-6 border-white/5 space-y-6">
          <div className="relative">
            <input
              type="text"
              value={sellSearch}
              onChange={(e) => setSellSearch(e.target.value)}
              placeholder="ค้นหาชื่อการ์ดนักเตะที่จะขายเอาเงินทอง..."
              className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
          </div>

          {sellableCards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sellableCards.map((card) => {
                const sellValue = getSellValue(card.rarity);
                return (
                  <div 
                    key={card.instanceId} 
                    className="flex flex-col items-center p-4 bg-slate-950/40 border border-slate-900 rounded-2xl hover:border-slate-800 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />
                    
                    <Card card={card} size="medium" showStats={false} />

                    <div className="w-full mt-4 space-y-3">
                      <div className="flex justify-between items-center text-xs text-slate-500 bg-slate-950/80 p-2 rounded-lg border border-slate-900">
                        <span>ราคาแลกเปลี่ยน</span>
                        <div className="flex items-center gap-1 font-bold text-amber-400">
                          <Coins size={12} />
                          <span>+{sellValue} เหรียญ</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSellCard(card.instanceId)}
                        className="w-full btn btn-secondary py-2.5 rounded-xl text-xs font-black text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/25 flex items-center justify-center gap-1"
                      >
                        <Tag size={12} />
                        <span>รีไซเคิลแลกเหรียญ</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500 font-medium">ไม่พบการ์ดนักเตะที่สามารถจำหน่ายแลกเหรียญทองได้</p>
              <p className="text-xs text-slate-600 mt-1">หมายเหตุ: นักเตะที่เป็น 11 ตัวจริงจะไม่ปรากฏที่นี่ ต้องเอาออกจากทีมก่อน</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
