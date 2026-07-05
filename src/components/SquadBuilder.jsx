import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Card } from './Card';
import { Shield, Sparkles, HelpCircle, Check, ArrowRightLeft, Search, Plus } from 'lucide-react';

// Formations layout templates (X and Y percentage coordinates)
const FORMATIONS = {
  '4-4-2': [
    { label: 'GK', x: 50, y: 88, role: 'GK' },
    { label: 'LB', x: 15, y: 68, role: 'DEF' },
    { label: 'CB', x: 38, y: 70, role: 'DEF' },
    { label: 'CB', x: 62, y: 70, role: 'DEF' },
    { label: 'RB', x: 85, y: 68, role: 'DEF' },
    { label: 'LM', x: 15, y: 44, role: 'MID' },
    { label: 'CM', x: 37, y: 45, role: 'MID' },
    { label: 'CM', x: 63, y: 45, role: 'MID' },
    { label: 'RM', x: 85, y: 44, role: 'MID' },
    { label: 'ST', x: 35, y: 18, role: 'ATT' },
    { label: 'ST', x: 65, y: 18, role: 'ATT' }
  ],
  '4-3-3': [
    { label: 'GK', x: 50, y: 88, role: 'GK' },
    { label: 'LB', x: 15, y: 68, role: 'DEF' },
    { label: 'CB', x: 38, y: 70, role: 'DEF' },
    { label: 'CB', x: 62, y: 70, role: 'DEF' },
    { label: 'RB', x: 85, y: 68, role: 'DEF' },
    { label: 'CM', x: 25, y: 46, role: 'MID' },
    { label: 'CM', x: 50, y: 48, role: 'MID' },
    { label: 'CM', x: 75, y: 46, role: 'MID' },
    { label: 'LW', x: 20, y: 18, role: 'ATT' },
    { label: 'ST', x: 50, y: 16, role: 'ATT' },
    { label: 'RW', x: 80, y: 18, role: 'ATT' }
  ],
  '3-5-2': [
    { label: 'GK', x: 50, y: 88, role: 'GK' },
    { label: 'CB', x: 25, y: 70, role: 'DEF' },
    { label: 'CB', x: 50, y: 72, role: 'DEF' },
    { label: 'CB', x: 75, y: 70, role: 'DEF' },
    { label: 'LM', x: 15, y: 45, role: 'MID' },
    { label: 'CM', x: 35, y: 48, role: 'MID' },
    { label: 'CM', x: 50, y: 52, role: 'MID' },
    { label: 'CM', x: 65, y: 48, role: 'MID' },
    { label: 'RM', x: 85, y: 45, role: 'MID' },
    { label: 'ST', x: 35, y: 18, role: 'ATT' },
    { label: 'ST', x: 65, y: 18, role: 'ATT' }
  ],
  '5-3-2': [
    { label: 'GK', x: 50, y: 88, role: 'GK' },
    { label: 'LWB', x: 12, y: 65, role: 'DEF' },
    { label: 'CB', x: 32, y: 70, role: 'DEF' },
    { label: 'CB', x: 50, y: 72, role: 'DEF' },
    { label: 'CB', x: 68, y: 70, role: 'DEF' },
    { label: 'RWB', x: 88, y: 65, role: 'DEF' },
    { label: 'CM', x: 28, y: 45, role: 'MID' },
    { label: 'CM', x: 50, y: 46, role: 'MID' },
    { label: 'CM', x: 72, y: 45, role: 'MID' },
    { label: 'ST', x: 35, y: 18, role: 'ATT' },
    { label: 'ST', x: 65, y: 18, role: 'ATT' }
  ]
};

export const SquadBuilder = () => {
  const { currentUser, updateSquad } = useGame();
  const [selectedSlot, setSelectedSlot] = useState(null); // Index 0-10 on pitch
  const [searchQuery, setSearchQuery] = useState('');
  const [posFilter, setPosFilter] = useState('ALL');

  if (!currentUser) return null;

  const currentSquad = currentUser.squad || {};
  const currentFormation = currentUser.formation || '4-4-2';
  const slots = FORMATIONS[currentFormation];

  // Get active cards mapped by slot index
  const activeLineup = slots.map((slot, idx) => {
    const instId = currentSquad[`pos_${idx}`];
    return currentUser.cards.find(c => c.instanceId === instId) || null;
  });

  // Calculate stats
  const calculateSquadMetrics = () => {
    const activeCards = activeLineup.filter(Boolean);
    if (activeCards.length === 0) return { ovr: 0, chem: 0 };

    // 1. OVR Calculation (Average)
    const totalOvr = activeCards.reduce((sum, c) => sum + c.rating, 0);
    const ovr = Math.round(totalOvr / activeCards.length);

    // 2. Chemistry Calculation
    let chem = 0;
    activeLineup.forEach((card, idx) => {
      if (!card) return;
      const slot = slots[idx];

      // Native position bonus (+4)
      if (card.position === slot.label) {
        chem += 4;
      } else {
        // Generics checks (GK in GK, Defender in Def position, etc.)
        const cardRole = ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(card.position) ? 'DEF' : 
                         ['CM', 'LM', 'RM', 'CDM', 'CAM'].includes(card.position) ? 'MID' : 
                         ['ST', 'CF', 'LW', 'RW'].includes(card.position) ? 'ATT' : 
                         card.position === 'GK' ? 'GK' : '';
        if (cardRole === slot.role) {
          chem += 2;
        }
      }

      // Synergies with other squad members
      activeCards.forEach(otherCard => {
        if (card.instanceId === otherCard.instanceId) return;

        // Same Nation (+0.6 per card)
        if (card.nationality === otherCard.nationality) {
          chem += 0.6;
        }
        // Same Club (+0.8 per card)
        if (card.club === otherCard.club) {
          chem += 0.8;
        }
      });
    });

    return {
      ovr,
      chem: Math.min(100, Math.round(chem))
    };
  };

  const { ovr, chem } = calculateSquadMetrics();

  // Handle assigning a card to a slot
  const handleAssignPlayer = (cardInstanceId) => {
    const selectedCard = currentUser.cards.find(c => c.instanceId === cardInstanceId);
    if (!selectedCard) return;

    const newSquad = { ...currentSquad };
    const slotKey = `pos_${selectedSlot}`;
    const previousCardInSlot = newSquad[slotKey]; // The card currently in the edited slot

    // 1. Check if another slot is already using a player with the SAME name
    let duplicateNameSlotKey = null;
    Object.keys(newSquad).forEach(k => {
      if (k !== slotKey) {
        const activeCard = currentUser.cards.find(c => c.instanceId === newSquad[k]);
        if (activeCard && activeCard.name === selectedCard.name) {
          duplicateNameSlotKey = k;
        }
      }
    });

    if (duplicateNameSlotKey) {
      alert(`คุณมีนักเตะชื่อ ${selectedCard.name} อยู่ในสนามแล้ว ไม่สามารถส่งนักเตะคนเดียวกันลงสนามซ้ำในแผนการเล่นได้!`);
      return;
    }

    // 2. Perform direct position swap if the card was assigned to another slot
    let otherSlotKey = null;
    Object.keys(newSquad).forEach(k => {
      if (newSquad[k] === cardInstanceId && k !== slotKey) {
        otherSlotKey = k;
      }
    });

    if (otherSlotKey && previousCardInSlot) {
      // Direct swap: place previous player card in the other slot
      newSquad[otherSlotKey] = previousCardInSlot;
    } else if (otherSlotKey) {
      // If the edited slot was empty, just clear the card's old slot
      delete newSquad[otherSlotKey];
    }

    // Place the selected card in the edited slot
    newSquad[slotKey] = cardInstanceId;

    updateSquad(currentFormation, newSquad);
    setSelectedSlot(null); // Close sidebar drawer
  };

  // Change Formation
  const handleFormationChange = (e) => {
    const newForm = e.target.value;
    // Keep cards in slots if possible, otherwise clear
    const newSquad = { ...currentSquad };
    updateSquad(newForm, newSquad);
  };

  // Remove player from squad
  const handleRemovePlayer = (slotIdx) => {
    const newSquad = { ...currentSquad };
    delete newSquad[`pos_${slotIdx}`];
    updateSquad(currentFormation, newSquad);
  };

  // Filter player inventory
  const getFilteredInventory = () => {
    return currentUser.cards.filter(card => {
      // Exclude cards already in the current slot
      const isAlreadyInActiveSlot = currentSquad[`pos_${selectedSlot}`] === card.instanceId;
      if (isAlreadyInActiveSlot) return false;

      // Filter by search query
      const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            card.club.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            card.nationality.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Filter by Position Filter
      if (posFilter === 'ALL') return true;
      if (posFilter === 'GK') return card.position === 'GK';
      if (posFilter === 'DEF') return ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(card.position);
      if (posFilter === 'MID') return ['CM', 'LM', 'RM', 'CDM', 'CAM'].includes(card.position);
      if (posFilter === 'ATT') return ['ST', 'CF', 'LW', 'RW'].includes(card.position);

      return true;
    }).sort((a, b) => b.rating - a.rating); // Show highest rating first
  };

  const slotPositionName = selectedSlot !== null ? slots[selectedSlot].label : '';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Top Banner / Controls */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8 justify-between items-start lg:items-center bg-slate-900/40 p-6 rounded-2xl border border-white/5">
        <div>
          <h2 className="text-3xl font-black text-white">จัดทีมการ์ดสุดล้ำ</h2>
          <p className="text-slate-400 text-sm mt-1">
            ปรับแผน เลือกนักเตะที่ดีที่สุด และสะสมระดับเคมีผู้เล่นให้พุ่งสูงสุด 100
          </p>
        </div>

        {/* Formation Selection and Stats */}
        <div className="flex flex-wrap gap-4 items-center w-full lg:w-auto">
          {/* Formation Dropdown */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">ระบบแผนการเล่น</span>
            <select
              value={currentFormation}
              onChange={handleFormationChange}
              className="bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="4-4-2">4-4-2 (สมดุลคลาสสิก)</option>
              <option value="4-3-3">4-3-3 (เกมบุกทางปีก)</option>
              <option value="3-5-2">3-5-2 (กองกลางหนาแน่น)</option>
              <option value="5-3-2">5-3-2 (รับเหนียวแน่น)</option>
            </select>
          </div>

          {/* OVR Box */}
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-5 py-2.5 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
              <Sparkles size={16} className="text-emerald-400" />
            </div>
            <div>
              <span className="text-[9px] font-semibold text-slate-500 block uppercase leading-none">TEAM RATING</span>
              <span className="text-lg font-black text-white">{ovr} OVR</span>
            </div>
          </div>

          {/* Chemistry Box */}
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-5 py-2.5 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
              <Shield size={16} className="text-cyan-400" />
            </div>
            <div>
              <span className="text-[9px] font-semibold text-slate-500 block uppercase leading-none">CHEMISTRY</span>
              <span className="text-lg font-black text-white">{chem} / 100</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Pitch (Grid span-2) */}
        <div className="lg:col-span-2 flex justify-center">
          <div className="w-full max-w-[620px] aspect-[3/4] football-pitch relative shadow-2xl">
            <div className="pitch-lines">
              <div className="pitch-midline" />
              <div className="pitch-center-circle" />
              <div className="pitch-penalty-area-top" />
              <div className="pitch-penalty-area-bottom" />
            </div>

            {/* Render 11 Player Cards on Pitch */}
            {slots.map((slot, idx) => {
              const card = activeLineup[idx];
              const isSelected = selectedSlot === idx;

              return (
                <div
                  key={idx}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 group"
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`
                  }}
                >
                  {card ? (
                    // Display Card
                    <div className="relative">
                      <Card 
                        card={card} 
                        size="small" 
                        showStats={false}
                        isSelected={isSelected}
                        onClick={() => setSelectedSlot(idx)}
                      />
                      
                      {/* Hover action bar */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePlayer(idx);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500 border border-rose-400 text-white flex items-center justify-center text-[10px] font-black z-30 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="นำออกจากทีม"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    // Empty Slot Graphic
                    <button
                      onClick={() => setSelectedSlot(idx)}
                      className={`rounded-xl bg-slate-950/60 border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all hover:bg-slate-900/80 ${
                        isSelected 
                          ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105' 
                          : 'border-white/20 hover:border-white/40'
                      }`}
                      style={{
                        width: 'var(--card-pitch-width)',
                        height: 'var(--card-pitch-height)'
                      }}
                    >
                      <Plus size={16} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                        {slot.label}
                      </span>
                    </button>
                  )}
                  {/* Position Tag */}
                  {card && (
                    <div className={`mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold border leading-none shadow-sm ${
                      card.position === slot.label 
                        ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-300'
                        : 'bg-amber-500/25 border-amber-400/50 text-amber-300'
                    }`}>
                      {slot.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Card Selection Drawer (Grid span-1) */}
        <div className="lg:col-span-1">
          {selectedSlot !== null ? (
            <div className="glass p-6 border-white/5 h-full flex flex-col min-h-[500px]">
              
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <ArrowRightLeft size={18} className="text-emerald-400" />
                    เลือกผู้เล่นตำแหน่ง {slotPositionName}
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">
                    แสดงการ์ดในคลังของคุณ เรียงตามพลัง OVR สูงสุด
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Filters */}
              <div className="space-y-3 mb-6">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อ, สโมสร, สัญชาติ..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                </div>

                {/* Quick Roster filters */}
                <div className="flex flex-wrap gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-900">
                  {['ALL', 'ATT', 'MID', 'DEF', 'GK'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setPosFilter(filter)}
                      className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg uppercase tracking-wider transition-all ${
                        posFilter === filter
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Player Grid List */}
              <div className="flex-1 overflow-y-auto space-y-3 max-h-[420px] pr-2">
                {getFilteredInventory().length > 0 ? (
                  getFilteredInventory().map((card) => {
                    const isInSquadElsewhere = Object.values(currentSquad).includes(card.instanceId);
                    const isCardSuspended = card.suspensionRemaining > 0;
                    const isCardInjured = card.injuredUntil && Date.now() < card.injuredUntil;
                    const isDisabled = isCardSuspended || isCardInjured;
                    
                    return (
                      <div 
                        key={card.instanceId}
                        onClick={() => {
                          if (isDisabled) return;
                          handleAssignPlayer(card.instanceId);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isDisabled
                            ? 'bg-slate-950/20 border-slate-900 opacity-40 cursor-not-allowed'
                            : isInSquadElsewhere 
                            ? 'bg-slate-900/30 border-amber-500/20 hover:border-amber-500/40 cursor-pointer hover:bg-slate-900/60' 
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 cursor-pointer hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Mini Card Preview */}
                          <div className={`w-8 h-10 rounded flex flex-col items-center justify-center font-bold text-xs ${
                            card.rarity === 'icon' ? 'bg-amber-500/20 border border-amber-400 text-amber-300' :
                            card.rarity === 'legendary' ? 'bg-rose-500/20 border border-rose-500 text-rose-300' :
                            card.rarity === 'epic' ? 'bg-purple-500/20 border border-purple-500 text-purple-300' :
                            card.rarity === 'rare' ? 'bg-blue-500/20 border border-blue-500 text-blue-300' :
                            'bg-slate-800 border border-slate-700 text-slate-300'
                          }`}>
                            <span>{card.rating}</span>
                            <span className="text-[7px] uppercase mt-0.5 leading-none">{card.position}</span>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-white leading-none">
                              {card.name}
                            </h4>
                            <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                              {card.nationality} • {card.club}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isDisabled ? (
                            <span className={`text-[9px] font-black px-2 py-1 rounded border ${
                              isCardSuspended 
                                ? 'bg-rose-500/10 border-rose-500/25 text-rose-400' 
                                : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                            }`}>
                              {isCardSuspended ? 'แบน' : 'เจ็บ'}
                            </span>
                          ) : isInSquadElsewhere && (
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-1 rounded">
                              ย้ายตำแหน่ง
                            </span>
                          )}
                          <span className="text-xs text-slate-500 font-medium">
                            {isDisabled ? 'พักฟื้น' : 'เลือก'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-slate-950/30 border border-slate-900 border-dashed rounded-2xl">
                    <HelpCircle size={32} className="text-slate-700 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-500">ไม่พบการ์ดที่ค้นหา</p>
                    <p className="text-xs text-slate-600 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองดู</p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="glass p-8 border-white/5 text-center flex flex-col justify-center items-center min-h-[450px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />
              <HelpCircle size={40} className="text-slate-600 mb-3 animate-pulse" />
              <h3 className="text-lg font-black text-white">คลิกเพื่อเพิ่มตัวจริง</h3>
              <p className="text-slate-500 text-sm max-w-xs mt-1.5 leading-relaxed">
                คลิกที่ตำแหน่งว่าง หรือนักเตะบนสนามฟุตบอลเพื่อสลับเปลี่ยนการ์ดในคลังเข้าสู่แผนผังตัวจริง 11 คน
              </p>
              
              <div className="mt-8 p-4 bg-slate-950/40 border border-slate-900 rounded-2xl w-full text-left">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-2">เคล็ดลับการจัดเคมี</span>
                <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                  <li>ใส่การ์ดในตำแหน่งที่ถูกต้อง (เช่น GK ในช่อง GK)</li>
                  <li>ใช้นักเตะสัญชาติเดียวกันในทีมเดียวกัน</li>
                  <li>ใช้นักเตะสโมสรเดียวกันในทีมเดียวกัน</li>
                </ul>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
