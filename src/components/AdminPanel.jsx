import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Card } from './Card';
import { 
  ShieldCheck, Users, Database, Percent, BookOpen, 
  Plus, Coins, Trash2, Edit3, UserPlus, Gift, 
  AlertTriangle, Save, X, Sparkles, Sliders, Mail, Send 
} from 'lucide-react';

export const AdminPanel = () => {
  const { 
    users, 
    cardsDB, 
    matchLogs, 
    packSettings,
    mails,
    sendMail,
    deleteMail,
    adminAddCardToDB, 
    adminEditCardInDB,
    adminDeleteCardFromDB,
    adminAddCardToUser, 
    adminModifyUserCoins, 
    adminDeleteUser,
    adminModifyPackSettings
  } = useGame();

  const [activeTab, setActiveTab] = useState('users'); // 'users', 'database', 'packs', 'logs'
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states for creating custom card
  const [newCard, setNewCard] = useState({
    name: '', rating: 85, position: 'ST', rarity: 'common',
    nationality: 'Thailand', club: 'Bangkok FC', image: '',
    stats: { pac: 80, sho: 80, pas: 80, dri: 80, def: 50, phy: 70 }
  });

  // State for editing card
  const [editingCard, setEditingCard] = useState(null); // { id, name, rating, ... }

  // Action states
  const [coinAdjustment, setCoinAdjustment] = useState({});
  const [giveCardId, setGiveCardId] = useState({});

  // Custom pack creator state
  const [newPack, setNewPack] = useState({
    name: '',
    price: 300,
    count: 4,
    rates: { common: 50, rare: 35, epic: 10, legendary: 5, icon: 0 }
  });

  // Packs edit form mapping states
  const [editingPacks, setEditingPacks] = useState({}); // { [packId]: { price, rates... } }

  // Mailbox composer form state
  const [mailForm, setMailForm] = useState({
    title: '',
    message: '',
    targetType: 'all', // 'all' or 'user'
    targetUser: '',
    giftCoins: 0,
    giftCardTemplateId: '',
    expiryType: 'permanent', // 'permanent' or 'timed'
    expiryHours: 24
  });

  const handleSendMail = async (e) => {
    e.preventDefault();
    if (!mailForm.title.trim()) {
      showNotification('error', 'กรุณาระบุหัวข้อจดหมาย');
      return;
    }

    if (mailForm.targetType === 'user' && !mailForm.targetUser.trim()) {
      showNotification('error', 'กรุณาระบุชื่อผู้ใช้ผู้รับ');
      return;
    }

    let expiresAt = null;
    if (mailForm.expiryType === 'timed') {
      const hours = parseInt(mailForm.expiryHours) || 24;
      expiresAt = Date.now() + (hours * 60 * 60 * 1000);
    }

    const res = await sendMail({
      title: mailForm.title.trim(),
      message: mailForm.message.trim(),
      targetType: mailForm.targetType,
      targetUser: mailForm.targetType === 'user' ? mailForm.targetUser.trim() : null,
      giftCoins: parseInt(mailForm.giftCoins) || 0,
      giftCardTemplateId: mailForm.giftCardTemplateId || null,
      expiryType: mailForm.expiryType,
      expiresAt
    });

    if (res.success) {
      showNotification('success', 'ส่งจดหมายข่าวสารและของขวัญเรียบร้อยแล้ว!');
      setMailForm({
        title: '',
        message: '',
        targetType: 'all',
        targetUser: '',
        giftCoins: 0,
        giftCardTemplateId: '',
        expiryType: 'permanent',
        expiryHours: 24
      });
    } else {
      showNotification('error', 'เกิดข้อผิดพลาดในการส่งจดหมาย');
    }
  };

  const showNotification = (type, text) => {
    if (type === 'success') {
      setSuccessMsg(text);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(text);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // --- COIN & CARD USER ACTIONS ---
  const handleModifyCoins = (username) => {
    const amountStr = coinAdjustment[username];
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    const res = adminModifyUserCoins(username, amount);
    if (res.success) {
      showNotification('success', res.message);
      setCoinAdjustment(prev => ({ ...prev, [username]: '' }));
    } else {
      showNotification('error', res.message);
    }
  };

  const handleGiveCard = (username) => {
    const cardId = giveCardId[username];
    if (!cardId) return;
    const res = adminAddCardToUser(username, cardId);
    if (res.success) {
      showNotification('success', res.message);
      setGiveCardId(prev => ({ ...prev, [username]: '' }));
    } else {
      showNotification('error', res.message);
    }
  };

  const handleDeleteUser = (username) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้ ${username}?`)) {
      const res = adminDeleteUser(username);
      if (res.success) {
        showNotification('success', res.message);
      } else {
        showNotification('error', res.message);
      }
    }
  };

  // --- CARDS DATABASE ACTIONS ---
  const handleAddCardToDB = (e) => {
    e.preventDefault();
    if (!newCard.name.trim()) {
      showNotification('error', 'กรุณาระบุชื่อการ์ด');
      return;
    }
    const res = adminAddCardToDB(newCard);
    if (res.success) {
      showNotification('success', `เพิ่มการ์ด ${res.card.name} เข้าสู่ฐานข้อมูลระบบสำเร็จ!`);
      setNewCard({
        name: '', rating: 85, position: 'ST', rarity: 'common',
        nationality: 'Thailand', club: 'Bangkok FC', image: '',
        stats: { pac: 80, sho: 80, pas: 80, dri: 80, def: 50, phy: 70 }
      });
    }
  };

  const handleStartEditCard = (card) => {
    setEditingCard({ ...card });
    // Scroll to form view on mobile
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  const handleSaveEditedCard = (e) => {
    e.preventDefault();
    if (!editingCard.name.trim()) {
      showNotification('error', 'กรุณาระบุชื่อการ์ด');
      return;
    }
    const res = adminEditCardInDB(editingCard.id, editingCard);
    if (res.success) {
      showNotification('success', `แก้ไขข้อมูลการ์ด ${editingCard.name} เรียบร้อยแล้ว!`);
      setEditingCard(null);
    }
  };

  const handleDeleteCardFromDB = (cardId) => {
    if (window.confirm('คุณแน่ใจที่จะลบการ์ดนี้ออกจากฐานข้อมูลหลัก? ผู้เล่นจะไม่สามารถสุ่มได้อีก')) {
      const res = adminDeleteCardFromDB(cardId);
      if (res.success) {
        showNotification('success', 'ลบการ์ดสำเร็จ');
        if (editingCard?.id === cardId) setEditingCard(null);
      }
    }
  };

  // --- PACK ACTIONS ---
  const handleSavePackSettings = (packId) => {
    const packEdit = editingPacks[packId];
    if (!packEdit) return;

    // Rates validation: sum to 100%
    const totalRates = 
      (parseInt(packEdit.rates.common) || 0) +
      (parseInt(packEdit.rates.rare) || 0) +
      (parseInt(packEdit.rates.epic) || 0) +
      (parseInt(packEdit.rates.legendary) || 0) +
      (parseInt(packEdit.rates.icon) || 0);

    if (totalRates !== 100) {
      showNotification('error', `ผลรวมอัตราสุ่มของแพ็กต้องมีค่าเท่ากับ 100% พอดี (ปัจจุบันรวมได้ ${totalRates}%)`);
      return;
    }

    const updated = packSettings.map(p => {
      if (p.id === packId) {
        return {
          ...p,
          name: packEdit.name,
          price: parseInt(packEdit.price) || 0,
          count: parseInt(packEdit.count) || 0,
          rates: {
            common: parseInt(packEdit.rates.common) || 0,
            rare: parseInt(packEdit.rates.rare) || 0,
            epic: parseInt(packEdit.rates.epic) || 0,
            legendary: parseInt(packEdit.rates.legendary) || 0,
            icon: parseInt(packEdit.rates.icon) || 0
          }
        };
      }
      return p;
    });

    adminModifyPackSettings(updated);
    showNotification('success', 'บันทึกการแก้ไขแพ็กตู้สุ่มเรียบร้อยแล้ว');
    // Clear editing map for this pack
    setEditingPacks(prev => {
      const copy = { ...prev };
      delete copy[packId];
      return copy;
    });
  };

  const handleAddCustomPack = (e) => {
    e.preventDefault();
    if (!newPack.name.trim()) {
      showNotification('error', 'กรุณาระบุชื่อตู้สุ่ม');
      return;
    }

    const totalRates = 
      (parseInt(newPack.rates.common) || 0) +
      (parseInt(newPack.rates.rare) || 0) +
      (parseInt(newPack.rates.epic) || 0) +
      (parseInt(newPack.rates.legendary) || 0) +
      (parseInt(newPack.rates.icon) || 0);

    if (totalRates !== 100) {
      showNotification('error', `ผลรวมอัตราสุ่มต้องเท่ากับ 100% พอดี (ปัจจุบันรวมได้ ${totalRates}%)`);
      return;
    }

    const newPackInstance = {
      id: `custom_pack_${Date.now()}`,
      name: newPack.name,
      price: parseInt(newPack.price) || 100,
      count: parseInt(newPack.count) || 3,
      rates: {
        common: parseInt(newPack.rates.common) || 0,
        rare: parseInt(newPack.rates.rare) || 0,
        epic: parseInt(newPack.rates.epic) || 0,
        legendary: parseInt(newPack.rates.legendary) || 0,
        icon: parseInt(newPack.rates.icon) || 0
      }
    };

    adminModifyPackSettings([...packSettings, newPackInstance]);
    showNotification('success', `เพิ่มแพ็กตู้สุ่ม "${newPackInstance.name}" สำเร็จ!`);
    setNewPack({
      name: '',
      price: 300,
      count: 4,
      rates: { common: 50, rare: 35, epic: 10, legendary: 5, icon: 0 }
    });
  };

  const handleDeletePack = (packId) => {
    if (window.confirm('คุณต้องการลบตู้สุ่มนี้ออกจากร้านค้าหรือไม่?')) {
      const updated = packSettings.filter(p => p.id !== packId);
      adminModifyPackSettings(updated);
      showNotification('success', 'ลบตู้สุ่มสำเร็จ');
    }
  };

  const tabs = [
    { id: 'users', label: 'จัดการผู้เล่น', icon: Users },
    { id: 'database', label: 'จัดการการ์ด', icon: Database },
    { id: 'packs', label: 'ตั้งค่าร้านค้า & ตู้สุ่ม', icon: Percent },
    { id: 'mailbox', label: 'ระบบส่งจดหมาย', icon: Mail },
    { id: 'logs', label: 'ประวัติแมตช์รวม', icon: BookOpen }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Admin banner */}
      <div className="glass p-6 border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-2">
            <ShieldCheck size={28} className="text-rose-500 animate-pulse" />
            แผงควบคุมแอดมิน (REALTIME ADMIN CONSOLE)
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            แก้ไขนักเตะ สร้างการ์ด ปรับสัดส่วนเรตราคากล่องสุ่ม บันทึกแบบ Real-time ทุกแท็บจะอัปเดตตรงกันทันที
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900 w-full md:w-auto overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setEditingCard(null);
                }}
                className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 text-emerald-400 font-semibold animate-fade-in">
          <Gift size={20} className="shrink-0 animate-bounce" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3 text-rose-400 font-semibold animate-pulse">
          <AlertTriangle size={20} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="glass p-6 border-white/5 space-y-6">
          <h3 className="text-xl font-black text-white">บัญชีสมาชิกทั้งหมดในเซิร์ฟเวอร์</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] text-slate-500 uppercase tracking-widest bg-slate-950/60 border-b border-slate-900">
                <tr>
                  <th className="p-4 font-bold">ชื่อผู้ใช้</th>
                  <th className="p-4 font-bold">ระดับสิทธิ์</th>
                  <th className="p-4 font-bold">เหรียญทองในคลัง</th>
                  <th className="p-4 font-bold">จำนวนการ์ดสะสม</th>
                  <th className="p-4 font-bold">การ์ดในแผนตัวจริง</th>
                  <th className="p-4 font-bold text-center">จัดการด่วน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {users.map(u => (
                  <tr key={u.username} className="hover:bg-slate-900/30">
                    <td className="p-4 font-extrabold text-white">{u.username}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        u.role === 'admin' 
                          ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400' 
                          : 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 font-extrabold text-amber-400 flex items-center gap-1">
                      <Coins size={14} />
                      {u.coins.toLocaleString()}
                    </td>
                    <td className="p-4 font-semibold text-slate-300">{u.cards?.length || 0} ใบ</td>
                    <td className="p-4 font-semibold text-slate-400">
                      {Object.keys(u.squad || {}).length} / 11 นักเตะ
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2.5 max-w-[280px] mx-auto bg-slate-950 p-3 rounded-xl border border-slate-900">
                        {/* Adjust Coins */}
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="+/- เหรียญ..."
                            value={coinAdjustment[u.username] || ''}
                            onChange={(e) => setCoinAdjustment({ ...coinAdjustment, [u.username]: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                          />
                          <button
                            onClick={() => handleModifyCoins(u.username)}
                            className="btn btn-primary px-3 py-1 rounded text-xs font-bold"
                          >
                            ตกลง
                          </button>
                        </div>

                        {/* Give Player Card */}
                        <div className="flex items-center gap-2">
                          <select
                            value={giveCardId[u.username] || ''}
                            onChange={(e) => setGiveCardId({ ...giveCardId, [u.username]: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                          >
                            <option value="">-- ส่งการ์ดผู้เล่น --</option>
                            {cardsDB.map(c => (
                              <option key={c.id} value={c.id}>
                                [{c.rating}] {c.name} ({c.position} - {c.rarity.toUpperCase()})
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleGiveCard(u.username)}
                            className="btn btn-gold px-3 py-1 rounded text-xs font-bold shrink-0"
                          >
                            ส่งการ์ด
                          </button>
                        </div>
                        
                        {/* Delete User */}
                        {u.username !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.username)}
                            className="w-full btn btn-danger py-1 rounded text-xs font-black flex items-center justify-center gap-1"
                          >
                            <Trash2 size={12} />
                            <span>ลบบัญชีถาวร</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DATABASE */}
      {activeTab === 'database' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Creator / Editor panel */}
          <div className="lg:col-span-1 glass p-6 border-white/5">
            {editingCard ? (
              // Edit Card Form
              <div>
                <h3 className="text-lg font-black text-rose-400 mb-4 flex items-center justify-between border-b border-slate-900 pb-3">
                  <span className="flex items-center gap-2">
                    <Edit3 size={18} />
                    แก้ไขข้อมูลนักเตะ
                  </span>
                  <button 
                    onClick={() => setEditingCard(null)}
                    className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </h3>

                <form onSubmit={handleSaveEditedCard} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ชื่อนักเตะ</label>
                    <input
                      type="text"
                      value={editingCard.name}
                      onChange={(e) => setEditingCard({ ...editingCard, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">OVR พลังรวม</label>
                      <input
                        type="number"
                        min="1" max="99"
                        value={editingCard.rating}
                        onChange={(e) => setEditingCard({ ...editingCard, rating: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-extrabold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ตำแหน่ง</label>
                      <select
                        value={editingCard.position}
                        onChange={(e) => setEditingCard({ ...editingCard, position: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold"
                      >
                        {['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'CM', 'LM', 'RM', 'CDM', 'CAM', 'ST', 'LW', 'RW', 'CF'].map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ความหายาก</label>
                      <select
                        value={editingCard.rarity}
                        onChange={(e) => setEditingCard({ ...editingCard, rarity: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold"
                      >
                        <option value="common">Common (การ์ดเทา)</option>
                        <option value="rare">Rare (การ์ดทอง)</option>
                        <option value="epic">Epic (การ์ดม่วงนีออน)</option>
                        <option value="legendary">Legendary (การ์ดแดงไฟ)</option>
                        <option value="icon">Icon (การ์ดไอคอนทองขาว)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">สโมสร</label>
                      <input
                        type="text"
                        value={editingCard.club}
                        onChange={(e) => setEditingCard({ ...editingCard, club: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">สัญชาติ</label>
                      <input
                        type="text"
                        value={editingCard.nationality}
                        onChange={(e) => setEditingCard({ ...editingCard, nationality: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">รูปภาพ (URL)</label>
                      <input
                        type="text"
                        value={editingCard.image}
                        onChange={(e) => setEditingCard({ ...editingCard, image: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Attributes */}
                  <div className="border-t border-slate-900 pt-4 mt-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">แก้ไขค่าพลังสเตตัส</span>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.keys(editingCard.stats || {}).map(statKey => (
                        <div key={statKey}>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{statKey}</label>
                          <input
                            type="number"
                            min="1" max="99"
                            value={editingCard.stats[statKey]}
                            onChange={(e) => {
                              const updatedStats = { ...editingCard.stats, [statKey]: parseInt(e.target.value) || 0 };
                              setEditingCard({ ...editingCard, stats: updatedStats });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-xs text-white text-center font-extrabold"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="submit"
                      className="flex-1 btn btn-primary py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5"
                    >
                      <Save size={14} />
                      <span>บันทึกการแก้ไข</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCard(null)}
                      className="btn btn-secondary px-4 py-2.5 rounded-xl font-semibold"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              // Add New Card Form
              <div>
                <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2 border-b border-slate-900 pb-3">
                  <Plus size={18} className="text-emerald-400" />
                  เพิ่มการ์ดใหม่ในระบบ
                </h3>

                <form onSubmit={handleAddCardToDB} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ชื่อนักเตะ</label>
                    <input
                      type="text"
                      value={newCard.name}
                      onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                      placeholder="เช่น Jude Bellingham"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">OVR พลังรวม</label>
                      <input
                        type="number"
                        min="1" max="99"
                        value={newCard.rating}
                        onChange={(e) => setNewCard({ ...newCard, rating: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-extrabold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ตำแหน่ง</label>
                      <select
                        value={newCard.position}
                        onChange={(e) => setNewCard({ ...newCard, position: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold"
                      >
                        {['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'CM', 'LM', 'RM', 'CDM', 'CAM', 'ST', 'LW', 'RW', 'CF'].map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ความหายาก</label>
                      <select
                        value={newCard.rarity}
                        onChange={(e) => setNewCard({ ...newCard, rarity: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold"
                      >
                        <option value="common">Common (การ์ดเทา)</option>
                        <option value="rare">Rare (การ์ดทอง)</option>
                        <option value="epic">Epic (การ์ดม่วงนีออน)</option>
                        <option value="legendary">Legendary (การ์ดแดงไฟ)</option>
                        <option value="icon">Icon (การ์ดไอคอนทองขาว)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">สโมสร</label>
                      <input
                        type="text"
                        value={newCard.club}
                        onChange={(e) => setNewCard({ ...newCard, club: e.target.value })}
                        placeholder="เช่น Arsenal"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">สัญชาติ</label>
                      <input
                        type="text"
                        value={newCard.nationality}
                        onChange={(e) => setNewCard({ ...newCard, nationality: e.target.value })}
                        placeholder="เช่น England"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">รูปภาพ (URL)</label>
                      <input
                        type="text"
                        value={newCard.image}
                        onChange={(e) => setNewCard({ ...newCard, image: e.target.value })}
                        placeholder="เว้นว่างได้ (มีอวาตาร์อัตโนมัติ)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Attributes */}
                  <div className="border-t border-slate-900 pt-4 mt-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">ค่าพลังสเตตัสเฉพาะด้าน</span>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.keys(newCard.stats).map(statKey => (
                        <div key={statKey}>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{statKey}</label>
                          <input
                            type="number"
                            min="1" max="99"
                            value={newCard.stats[statKey]}
                            onChange={(e) => {
                              const updatedStats = { ...newCard.stats, [statKey]: parseInt(e.target.value) || 0 };
                              setNewCard({ ...newCard, stats: updatedStats });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-xs text-white text-center font-extrabold"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full btn btn-primary py-2.5 rounded-xl font-bold mt-4"
                  >
                    เพิ่มเข้าฐานข้อมูลระบบ
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Cards database list viewer */}
          <div className="lg:col-span-2 glass p-6 border-white/5 flex flex-col max-h-[680px]">
            <h3 className="text-lg font-black text-white mb-4 border-b border-slate-900 pb-3 flex justify-between items-center">
              <span>ฐานข้อมูลระบบการ์ด ({cardsDB.length} ใบ)</span>
              <span className="text-xs text-slate-500 font-semibold">อัปเดตแบบ Realtime ทุกการ์ด</span>
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {cardsDB.map(c => (
                <div 
                  key={c.id} 
                  className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-900 rounded-xl hover:border-slate-800/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-10 rounded flex flex-col items-center justify-center font-bold text-xs ${
                      c.rarity === 'icon' ? 'bg-amber-500/20 border border-amber-400 text-amber-300' :
                      c.rarity === 'legendary' ? 'bg-rose-500/20 border border-rose-500 text-rose-300' :
                      c.rarity === 'epic' ? 'bg-purple-500/20 border border-purple-500 text-purple-300' :
                      c.rarity === 'rare' ? 'bg-blue-500/20 border border-blue-500 text-blue-300' :
                      'bg-slate-800 border border-slate-700 text-slate-300'
                    }`}>
                      <span>{c.rating}</span>
                      <span className="text-[7px] uppercase mt-0.5">{c.position}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-white leading-none">{c.name}</h4>
                      <span className="text-[10px] text-slate-500 mt-1 block uppercase font-semibold">
                        {c.rarity} • {c.nationality} • {c.club}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline text-[9px] font-semibold text-slate-600 uppercase tracking-widest bg-slate-900 px-2 py-1 rounded">
                      PAC:{c.stats.pac} SHO:{c.stats.sho} DEF:{c.stats.def}
                    </span>
                    
                    {/* Edit button */}
                    <button
                      onClick={() => handleStartEditCard(c)}
                      className="p-2 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 transition-colors"
                      title="แก้ไขการ์ด"
                    >
                      <Edit3 size={13} />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteCardFromDB(c.id)}
                      className="p-2 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-colors"
                      title="ลบการ์ด"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SHOP PACKS SETTINGS & CREATOR */}
      {activeTab === 'packs' && (
        <div className="space-y-8">
          
          {/* Custom Pack Builder Form */}
          <div className="glass p-6 border-white/5">
            <h3 className="text-lg font-black text-white mb-4 border-b border-slate-900 pb-3 flex items-center gap-2">
              <Plus size={18} className="text-emerald-400" />
              สร้างตู้สุ่มสล๊อตใหม่ (Create Custom Arena Pack)
            </h3>

            <form onSubmit={handleAddCustomPack} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ชื่อตู้สุ่ม</label>
                <input
                  type="text"
                  placeholder="เช่น Ultimate Thai League"
                  value={newPack.name}
                  onChange={(e) => setNewPack({ ...newPack, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 md:col-span-1">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ราคา (เหรียญ)</label>
                  <input
                    type="number"
                    value={newPack.price}
                    onChange={(e) => setNewPack({ ...newPack, price: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-extrabold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">การ์ดที่ได้/ซอง</label>
                  <input
                    type="number"
                    min="1" max="10"
                    value={newPack.count}
                    onChange={(e) => setNewPack({ ...newPack, count: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-extrabold"
                  />
                </div>
              </div>

              {/* Rarity Rates slider inputs */}
              <div className="md:col-span-1 grid grid-cols-5 gap-1.5">
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase text-center mb-1">COM%</label>
                  <input
                    type="number"
                    value={newPack.rates.common}
                    onChange={(e) => setNewPack({ ...newPack, rates: { ...newPack.rates, common: parseInt(e.target.value) || 0 } })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 text-xs text-center text-white"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase text-center mb-1">RARE%</label>
                  <input
                    type="number"
                    value={newPack.rates.rare}
                    onChange={(e) => setNewPack({ ...newPack, rates: { ...newPack.rates, rare: parseInt(e.target.value) || 0 } })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 text-xs text-center text-white"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase text-center mb-1">EPIC%</label>
                  <input
                    type="number"
                    value={newPack.rates.epic}
                    onChange={(e) => setNewPack({ ...newPack, rates: { ...newPack.rates, epic: parseInt(e.target.value) || 0 } })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 text-xs text-center text-white"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase text-center mb-1">LEG%</label>
                  <input
                    type="number"
                    value={newPack.rates.legendary}
                    onChange={(e) => setNewPack({ ...newPack, rates: { ...newPack.rates, legendary: parseInt(e.target.value) || 0 } })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 text-xs text-center text-white"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase text-center mb-1">ICON%</label>
                  <input
                    type="number"
                    value={newPack.rates.icon}
                    onChange={(e) => setNewPack({ ...newPack, rates: { ...newPack.rates, icon: parseInt(e.target.value) || 0 } })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 text-xs text-center text-white"
                  />
                </div>
              </div>

              <div className="md:col-span-1">
                <button
                  type="submit"
                  className="w-full btn btn-primary py-2.5 rounded-xl font-bold"
                >
                  เปิดขายตู้สุ่มนี้
                </button>
              </div>
            </form>
          </div>

          {/* Active Packs List */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-white">ตู้สุ่มที่เปิดจำหน่ายอยู่ขณะนี้ ({packSettings.length} แพ็ก)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {packSettings.map(pack => {
                // Initialize default values for editing form
                const editState = editingPacks[pack.id] || {
                  name: pack.name,
                  price: pack.price,
                  count: pack.count,
                  rates: { ...pack.rates }
                };

                const updateEditState = (field, val, isRate = false, rateKey = '') => {
                  setEditingPacks(prev => {
                    const current = prev[pack.id] || { ...editState };
                    if (isRate) {
                      current.rates[rateKey] = parseInt(val) || 0;
                    } else {
                      current[field] = val;
                    }
                    return { ...prev, [pack.id]: current };
                  });
                };

                const isModified = editingPacks[pack.id] !== undefined;

                return (
                  <div key={pack.id} className="glass p-6 border-white/5 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <input
                          type="text"
                          value={editState.name}
                          onChange={(e) => updateEditState('name', e.target.value)}
                          className="bg-transparent border-b border-transparent focus:border-slate-800 text-lg font-black text-white focus:outline-none w-full max-w-[200px]"
                        />
                        <span className="text-[10px] text-slate-500 font-bold block uppercase mt-1">ID: {pack.id}</span>
                      </div>
                      <button
                        onClick={() => handleDeletePack(pack.id)}
                        className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                        title="ลบแพ็กเกจนี้"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">ราคาตู้ (เหรียญ)</label>
                        <input
                          type="number"
                          value={editState.price}
                          onChange={(e) => updateEditState('price', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-extrabold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">จำนวนการ์ดสุ่มได้</label>
                        <input
                          type="number"
                          value={editState.count}
                          onChange={(e) => updateEditState('count', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-extrabold"
                        />
                      </div>
                    </div>

                    {/* Rates editor */}
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider mb-2">อัตราความน่าจะเป็นของการ์ด (เรต%)</span>
                      <div className="grid grid-cols-5 gap-1.5">
                        {['common', 'rare', 'epic', 'legendary', 'icon'].map(rKey => (
                          <div key={rKey}>
                            <label className="block text-[8px] font-bold text-slate-500 text-center uppercase mb-1">{rKey.slice(0, 3)}</label>
                            <input
                              type="number"
                              value={editState.rates[rKey]}
                              onChange={(e) => updateEditState(null, e.target.value, true, rKey)}
                              className="w-full bg-slate-950 border border-slate-850 rounded py-1 text-xs text-center text-white"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {isModified && (
                      <button
                        onClick={() => handleSavePackSettings(pack.id)}
                        className="w-full btn btn-primary py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Save size={12} />
                        <span>บันทึกการแก้ไข</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT MATCH LOGS */}
      {activeTab === 'logs' && (
        <div className="glass p-6 border-white/5 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <h3 className="text-xl font-black text-white">บันทึกแมตช์รวมในระบบ</h3>
            <span className="text-xs text-slate-500 font-semibold">เก็บประวัติแมตช์ 100 รายการล่าสุด</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] text-slate-500 uppercase tracking-widest bg-slate-950/60 border-b border-slate-900">
                <tr>
                  <th className="p-4 font-bold">วัน-เวลาแข่ง</th>
                  <th className="p-4 font-bold">ผู้เล่นหลัก</th>
                  <th className="p-4 font-bold">คู่แข่งในสนาม</th>
                  <th className="p-4 font-bold text-center">สกอร์รวม</th>
                  <th className="p-4 font-bold">ผลรางวัล</th>
                  <th className="p-4 font-bold">เหรียญทอง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {matchLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-900/30">
                    <td className="p-4 text-slate-400 text-xs font-semibold">
                      {new Date(log.timestamp).toLocaleString('th-TH')}
                    </td>
                    <td className="p-4 font-bold text-white">{log.player}</td>
                    <td className="p-4 font-bold text-slate-300">{log.opponent}</td>
                    <td className="p-4 font-black text-center text-white text-base">
                      {log.playerScore} - {log.opponentScore}
                    </td>
                    <td className="p-4 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        log.result === 'win' 
                          ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400' 
                          : log.result === 'loss'
                          ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400'
                          : 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                      }`}>
                        {log.result === 'win' ? 'WIN' : log.result === 'loss' ? 'LOSS' : 'DRAW'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-emerald-400">+{log.coinsEarned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: MAILBOX COMPOSER */}
      {activeTab === 'mailbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          
          {/* Form Composer (Left) */}
          <div className="lg:col-span-5 glass p-6 border-white/5 space-y-6 h-fit">
            <div className="border-b border-slate-900 pb-3 flex items-center gap-2">
              <Mail className="text-rose-500" size={18} />
              <h3 className="text-lg font-black text-white">เขียนจดหมาย & ของขวัญ</h3>
            </div>

            <form onSubmit={handleSendMail} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">หัวข้อจดหมาย</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ฉลองเปิดระบบออนไลน์ใหม่..."
                  value={mailForm.title}
                  onChange={(e) => setMailForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">เนื้อความ / รายละเอียด</label>
                <textarea
                  rows={4}
                  required
                  placeholder="รายละเอียดประกาศหรือคำอธิบายข้อความสโมสร..."
                  value={mailForm.message}
                  onChange={(e) => setMailForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-semibold resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">เป้าหมายผู้รับ</label>
                  <select
                    value={mailForm.targetType}
                    onChange={(e) => setMailForm(prev => ({ ...prev, targetType: e.target.value, targetUser: '' }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 transition-all font-bold"
                  >
                    <option value="all">ผู้เล่นทุกคน (All)</option>
                    <option value="user">ระบุชื่อผู้ใช้ (User)</option>
                  </select>
                </div>

                {mailForm.targetType === 'user' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">ชื่อผู้ใช้ (Username)</label>
                    <input
                      type="text"
                      required
                      placeholder="ระบุชื่อไอดี..."
                      value={mailForm.targetUser}
                      onChange={(e) => setMailForm(prev => ({ ...prev, targetUser: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 transition-all font-extrabold"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-900/60 pt-4 space-y-4">
                <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">แนบรางวัลส่งเสริมสโมสร (Attachments)</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5"><Coins size={12} className="text-amber-400" /> เหรียญทอง (Coins)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={mailForm.giftCoins || ''}
                      onChange={(e) => setMailForm(prev => ({ ...prev, giftCoins: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-extrabold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5"><Plus size={12} className="text-emerald-400" /> การ์ดนักเตะ</label>
                    <select
                      value={mailForm.giftCardTemplateId}
                      onChange={(e) => setMailForm(prev => ({ ...prev, giftCardTemplateId: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    >
                      <option value="">-- ไม่มีการแนบการ์ด --</option>
                      {cardsDB.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.rating} {c.position} - {c.name} ({c.rarity.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-900/60 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">อายุจดหมาย</label>
                  <select
                    value={mailForm.expiryType}
                    onChange={(e) => setMailForm(prev => ({ ...prev, expiryType: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="permanent">ถาวร (Permanent)</option>
                    <option value="timed">จำกัดเวลา (Timed)</option>
                  </select>
                </div>

                {mailForm.expiryType === 'timed' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">ชั่วโมงหมดอายุ</label>
                    <select
                      value={mailForm.expiryHours}
                      onChange={(e) => setMailForm(prev => ({ ...prev, expiryHours: parseInt(e.target.value) || 24 }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-extrabold focus:outline-none"
                    >
                      <option value={24}>24 ชั่วโมง (1 วัน)</option>
                      <option value={72}>72 ชั่วโมง (3 วัน)</option>
                      <option value={168}>168 ชั่วโมง (7 วัน)</option>
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full btn btn-primary py-3.5 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 mt-6"
              >
                <Send size={14} />
                <span>ส่งจดหมาย & ของขวัญเรียบร้อย</span>
              </button>
            </form>
          </div>

          {/* Mails History (Right) */}
          <div className="lg:col-span-7 glass p-6 border-white/5 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h3 className="text-xl font-black text-white">ประวัติจดหมายที่จัดส่งแล้ว</h3>
              <span className="text-xs text-slate-550 font-semibold">รายการจดหมายข่าวในระบบคลาวด์</span>
            </div>

            <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
              {!mails || mails.length === 0 ? (
                <div className="text-center p-8 text-slate-500 text-xs font-semibold">
                  ไม่มีประวัติจดหมายในระบบขณะนี้
                </div>
              ) : (
                mails.map((mail) => {
                  const giftCard = cardsDB.find(c => c.id === mail.giftCardTemplateId);
                  const isGlobal = mail.targetType === 'all';
                  return (
                    <div key={mail.id} className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl flex flex-col justify-between gap-3 relative select-none">
                      
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-heading font-black text-white uppercase bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">
                              {isGlobal ? 'ผู้เล่นทุกคน' : `ผู้ใช้: ${mail.targetUser}`}
                            </span>
                            <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded ${
                              mail.expiresAt ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {mail.expiresAt ? `EXP: ${new Date(mail.expiresAt).toLocaleDateString()}` : 'ถาวร'}
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-heading font-black text-white mt-2 leading-none">{mail.title}</h4>
                          <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{mail.message}</p>
                        </div>

                        <button
                          onClick={() => deleteMail(mail.id)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg shrink-0 transition-colors"
                          title="ลบออกถาวร"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Attachments preview */}
                      {(mail.giftCoins > 0 || giftCard) && (
                        <div className="flex flex-wrap gap-2 border-t border-slate-900/60 pt-3">
                          {mail.giftCoins > 0 && (
                            <span className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/20 text-amber-400 text-[10px] font-black px-2 py-1 rounded-xl leading-none">
                              <Coins size={11} /> +{mail.giftCoins}
                            </span>
                          )}
                          {giftCard && (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-1 rounded-xl leading-none">
                              🎁 การ์ด: {giftCard.name} ({giftCard.rating} {giftCard.position})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Claim metadata */}
                      <div className="flex items-center justify-between text-[8px] font-bold text-slate-500 uppercase pt-2 border-t border-slate-900/30">
                        <span>ส่งเมื่อ: {new Date(mail.createdAt).toLocaleString('th-TH')}</span>
                        <span>มีผู้เคลมแล้ว: {mail.claimedBy?.length || 0} คน</span>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
