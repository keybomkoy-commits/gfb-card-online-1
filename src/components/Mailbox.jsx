import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Mail, Gift, Megaphone, Trash2, X, Coins, Clock, CheckCircle } from 'lucide-react';
import { Card } from './Card';

export const Mailbox = ({ isOpen, onClose }) => {
  const { 
    mails, currentUser, cardsDB, 
    claimMailAttachment, readMail, deleteMail 
  } = useGame();

  const [selectedMail, setSelectedMail] = useState(null);
  const [claimStatus, setClaimStatus] = useState({ type: '', message: '' });
  const [timeTick, setTimeTick] = useState(Date.now());

  // Update timer ticks every 10 seconds for countdowns
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeTick(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  // Filter mails that belong to this user and are not hidden/deleted
  const userMails = mails.filter(mail => {
    // 1. Target check
    const isGlobal = mail.targetType === 'all';
    const isDirect = mail.targetType === 'user' && mail.targetUser?.toLowerCase() === currentUser.username.toLowerCase();
    if (!isGlobal && !isDirect) return false;

    // 2. Hide if deleted by user
    if (mail.deletedBy?.includes(currentUser.username)) return false;

    // 3. Hide if expired
    if (mail.expiresAt && mail.expiresAt < timeTick) return false;

    return true;
  });

  const handleSelectMail = (mail) => {
    setSelectedMail(mail);
    setClaimStatus({ type: '', message: '' });
    // Mark mail as read
    readMail(mail.id);
  };

  const handleClaim = async (mailId) => {
    setClaimStatus({ type: '', message: '' });
    const res = await claimMailAttachment(mailId);
    if (res.success) {
      setClaimStatus({ type: 'success', message: res.message });
      // Update selected mail to show claimed status instantly
      setSelectedMail(prev => prev ? { ...prev, claimedBy: [...(prev.claimedBy || []), currentUser.username] } : null);
    } else {
      setClaimStatus({ type: 'error', message: res.message });
    }
  };

  const handleDelete = async (mailId) => {
    await deleteMail(mailId);
    setSelectedMail(null);
    setClaimStatus({ type: '', message: '' });
  };

  // Expiration countdown formatter
  const getCountdownText = (expiresAt) => {
    if (!expiresAt) return 'จดหมายถาวร';
    const diff = expiresAt - timeTick;
    if (diff <= 0) return 'หมดอายุแล้ว';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `หมดอายุในอีก ${days} วัน ${hours % 24} ชม.`;
    }
    return `หมดอายุในอีก ${hours} ชม. ${minutes} นาที`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
      
      {/* Mailbox Panel Frame */}
      <div 
        className="w-full max-w-4xl h-[85vh] glass border border-white/5 rounded-3xl flex flex-col md:flex-row overflow-hidden shadow-2xl relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Mobile Header close bar */}
        <div className="flex md:hidden items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <Mail className="text-emerald-400" size={20} />
            <span className="font-heading font-black text-white text-sm uppercase tracking-wider">กล่องจดหมายสโมสร</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. LEFT COLUMN: MAILS LIST */}
        <div className="w-full md:w-5/12 border-r border-white/5 flex flex-col h-1/2 md:h-full bg-slate-950/40">
          
          {/* Desktop header bar */}
          <div className="hidden md:flex items-center justify-between px-6 py-5 border-b border-white/5 bg-slate-950/20">
            <div className="flex items-center gap-2">
              <Mail className="text-emerald-400" size={18} />
              <span className="font-heading font-black text-white text-xs uppercase tracking-wider">กล่องจดหมาย ({userMails.length})</span>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* List area */}
          <div className="flex-grow overflow-y-auto p-4 space-y-2">
            {userMails.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                  <Mail size={22} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">กล่องจดหมายว่างเปล่า</h4>
                  <p className="text-[10px] text-slate-600 mt-1">ไม่มีข่าวสารหรือของขวัญใหม่เข้ามาในระบบขณะนี้</p>
                </div>
              </div>
            ) : (
              userMails.map((mail) => {
                const isRead = mail.readBy?.includes(currentUser.username);
                const isGift = mail.giftCoins > 0 || mail.giftCardTemplateId;
                const isClaimed = mail.claimedBy?.includes(currentUser.username);
                const isSelected = selectedMail?.id === mail.id;

                return (
                  <div
                    key={mail.id}
                    onClick={() => handleSelectMail(mail)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      isSelected 
                        ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30' 
                        : isRead 
                          ? 'bg-slate-950/40 border-slate-900 hover:bg-slate-900/40' 
                          : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900/70 shadow-[0_0_10px_rgba(16,185,129,0.02)]'
                    }`}
                  >
                    {/* Mail Icon Type */}
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                      isRead 
                        ? 'bg-slate-950 border-slate-850 text-slate-500' 
                        : isGift 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {isGift ? <Gift size={16} /> : <Megaphone size={16} />}
                    </div>

                    {/* Meta info */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-heading font-black truncate ${isRead ? 'text-slate-400' : 'text-white'}`}>
                          {mail.title}
                        </span>
                        {!isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{mail.message}</p>
                      
                      {/* Timer indicators */}
                      <div className="flex items-center gap-1.5 mt-2 text-[8px] font-bold text-slate-650 uppercase">
                        <Clock size={10} />
                        <span>{getCountdownText(mail.expiresAt)}</span>
                        {isGift && (
                          <span className={`ml-auto px-1.5 py-0.5 rounded text-[7px] font-extrabold ${
                            isClaimed ? 'bg-slate-800 text-slate-500' : 'bg-amber-500/10 text-amber-300'
                          }`}>
                            {isClaimed ? 'รับแล้ว' : 'มีรางวัล'}
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. RIGHT COLUMN: DETAILS PANEL */}
        <div className="w-full md:w-7/12 flex flex-col h-1/2 md:h-full bg-slate-950/20">
          {selectedMail ? (
            <div className="h-full flex flex-col overflow-hidden animate-fade-in">
              
              {/* Header metadata */}
              <div className="px-6 py-5 border-b border-white/5 bg-slate-950/30 flex items-center justify-between shrink-0">
                <div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                    ประกาศโดย: {selectedMail.sender === 'admin' ? 'แอดมินหลังบ้าน' : 'ระบบส่วนกลาง'}
                  </span>
                  <h3 className="font-heading font-black text-white text-sm uppercase tracking-wide leading-none">
                    {selectedMail.title}
                  </h3>
                </div>
                
                <button
                  onClick={() => handleDelete(selectedMail.id)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/25 transition-all"
                  title="ลบจดหมายฉบับนี้"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Message text content */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                  <span className="text-[9px] font-bold text-emerald-400/80 bg-emerald-500/5 border border-emerald-550/10 px-2 py-1 rounded uppercase tracking-wider">
                    {getCountdownText(selectedMail.expiresAt)}
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                    {selectedMail.message}
                  </p>
                </div>

                {/* GALA GIFT COMPONENT (If Coins or Card templates are attached) */}
                {(selectedMail.giftCoins > 0 || selectedMail.giftCardTemplateId) && (
                  <div className="border border-white/5 bg-slate-950/50 p-4 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full pointer-events-none" />
                    
                    <span className="text-[8px] font-bold text-amber-400 uppercase tracking-wider block mb-3">
                      ของรางวัลที่แนบมากับจดหมาย
                    </span>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      
                      {/* Attached Coins preview */}
                      {selectedMail.giftCoins > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl min-w-[140px] flex-grow">
                          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                            <Coins size={22} className="animate-pulse" />
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-500 block uppercase leading-none mb-0.5">ยอดเหรียญทอง</span>
                            <span className="text-sm font-black text-amber-300">+{selectedMail.giftCoins.toLocaleString()} Coins</span>
                          </div>
                        </div>
                      )}

                      {/* Attached Card template preview */}
                      {selectedMail.giftCardTemplateId && (() => {
                        const template = cardsDB.find(c => c.id === selectedMail.giftCardTemplateId);
                        if (!template) return null;
                        return (
                          <div className="flex items-center gap-3 p-2 bg-slate-950 border border-slate-900 rounded-xl min-w-[170px] flex-grow">
                            <div className="shrink-0 scale-75 origin-center">
                              <Card card={template} size="small" showStats={false} />
                            </div>
                            <div className="min-w-0 pr-2">
                              <span className="text-[8px] font-bold text-slate-500 block uppercase leading-none mb-0.5">การ์ดนักเตะพิเศษ</span>
                              <span className="text-xs font-black text-white truncate block">{template.name}</span>
                              <span className="text-[9px] font-bold text-emerald-450 uppercase block mt-0.5">{template.rating} OVR {template.position}</span>
                            </div>
                          </div>
                        );
                      })()}

                    </div>

                    {/* Claim result alert message box */}
                    {claimStatus.message && (
                      <div className={`mt-4 p-3 rounded-xl border text-[10px] font-bold ${
                        claimStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-rose-500/10 border-rose-500/25 text-rose-450'
                      }`}>
                        {claimStatus.message}
                      </div>
                    )}

                    {/* Claim/Claimed Buttons */}
                    <div className="mt-4 shrink-0">
                      {selectedMail.claimedBy?.includes(currentUser.username) ? (
                        <div className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <CheckCircle size={14} className="text-slate-500" />
                          <span>รับของรางวัลเรียบร้อยแล้ว</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleClaim(selectedMail.id)}
                          className="w-full btn btn-primary py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Gift size={14} />
                          <span>กดเคลมรับของรางวัลและนักเตะ</span>
                        </button>
                      )}
                    </div>

                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-900/60 border border-slate-850 flex items-center justify-center text-slate-600">
                <Mail size={24} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">รายละเอียดจดหมาย</h4>
                <p className="text-[10px] text-slate-600 mt-1 max-w-[280px]">กรุณาเลือกข่าวสารหรือรายการของขวัญทางด้านซ้ายเพื่อเปิดอ่านรายละเอียด</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
