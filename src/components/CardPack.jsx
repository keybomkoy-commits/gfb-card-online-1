import React, { useState } from 'react';
import { Card } from './Card';
import { Sparkles, Gift, ChevronRight, Volume2 } from 'lucide-react';

// Web Audio API sound synthesizer
const playSynthSound = (type) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'shake') {
      // Shaking pack sound (Low metallic rustle)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(140, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'rip') {
      // Rip sound (Metallic sweep)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.6);
      gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);

      // Sub explosion
      const subOsc = audioCtx.createOscillator();
      const subGain = audioCtx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(55, audioCtx.currentTime);
      subOsc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.8);
      subGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      subOsc.connect(subGain);
      subGain.connect(audioCtx.destination);
      subOsc.start();
      subOsc.stop(audioCtx.currentTime + 0.8);
    } else if (type === 'common') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, audioCtx.currentTime); // E4
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'rare') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      osc.frequency.setValueAtTime(554, audioCtx.currentTime + 0.1); // C#5
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'epic' || type === 'legendary' || type === 'icon') {
      // Golden shimmering arpeggio
      const notes = type === 'icon' ? [523.25, 659.25, 783.99, 1046.50] : [440, 554.37, 659.25, 880];
      const duration = type === 'icon' ? 1.0 : 0.6;
      
      notes.forEach((freq, idx) => {
        const noteOsc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        noteOsc.type = 'sine';
        noteOsc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.08);
        noteGain.gain.setValueAtTime(idx === notes.length - 1 ? 0.35 : 0.15, audioCtx.currentTime + idx * 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + idx * 0.08 + 0.4);
        noteOsc.connect(noteGain);
        noteGain.connect(audioCtx.destination);
        noteOsc.start(audioCtx.currentTime + idx * 0.08);
        noteOsc.stop(audioCtx.currentTime + idx * 0.08 + 0.4);
      });
    }
  } catch (error) {
    console.warn('Audio synthesis failed', error);
  }
};

export const CardPack = ({ packName, cards, onFinished }) => {
  const [phase, setPhase] = useState('closed'); // 'closed', 'shaking', 'ripped', 'revealing'
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleOpenPack = () => {
    if (phase !== 'closed') return;
    
    setPhase('shaking');
    playSynthSound('shake');
    
    // Multiple shakes for e-sports feel
    let shakeCount = 0;
    const interval = setInterval(() => {
      if (shakeCount < 4) {
        playSynthSound('shake');
        shakeCount++;
      } else {
        clearInterval(interval);
      }
    }, 300);

    setTimeout(() => {
      clearInterval(interval);
      setPhase('ripped');
      playSynthSound('rip');
      
      setTimeout(() => {
        setPhase('revealing');
        // Play sound for first card
        if (cards && cards[0]) {
          playSynthSound(cards[0].rarity);
        }
      }, 800);
    }, 1500);
  };

  const [isClickGuarded, setIsClickGuarded] = useState(false);

  const handleNextCard = () => {
    if (isClickGuarded) return;
    setIsClickGuarded(true);
    setTimeout(() => setIsClickGuarded(false), 300);

    if (currentIndex < cards.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      playSynthSound(cards[nextIdx].rarity);
    } else {
      onFinished();
    }
  };

  const activeCard = cards[currentIndex];

  const getPackGradient = () => {
    if (packName.includes('Starter')) return 'from-slate-700 via-slate-600 to-slate-800 border-slate-500';
    if (packName.includes('Gold')) return 'from-amber-600 via-yellow-500 to-amber-700 border-yellow-400';
    if (packName.includes('Legendary')) return 'from-purple-800 via-rose-600 to-indigo-900 border-rose-500';
    return 'from-slate-900 via-amber-600 to-slate-950 border-amber-300';
  };

  // Dynamic e-sports particles based on rarity
  const getRarityVFX = (rarity) => {
    switch (rarity) {
      case 'icon':
        return {
          glowColor: 'bg-amber-500/20',
          glowPulse: 'animate-pulse scale-125',
          sparkleColor: 'bg-amber-300 border-amber-400',
          titleColor: 'text-amber-400 font-black',
          ambientBeams: true,
          particleCount: 24
        };
      case 'legendary':
        return {
          glowColor: 'bg-rose-600/15',
          glowPulse: 'animate-pulse scale-110',
          sparkleColor: 'bg-rose-400 border-rose-500',
          titleColor: 'text-rose-500 font-extrabold',
          ambientBeams: true,
          particleCount: 16
        };
      case 'epic':
        return {
          glowColor: 'bg-purple-600/10',
          glowPulse: 'animate-pulse',
          sparkleColor: 'bg-purple-400 border-purple-500',
          titleColor: 'text-purple-400 font-extrabold',
          ambientBeams: false,
          particleCount: 10
        };
      case 'rare':
        return {
          glowColor: 'bg-blue-600/5',
          glowPulse: '',
          sparkleColor: 'bg-blue-400 border-blue-500',
          titleColor: 'text-blue-400 font-bold',
          ambientBeams: false,
          particleCount: 0
        };
      default:
        return {
          glowColor: 'bg-slate-700/0',
          glowPulse: '',
          sparkleColor: 'bg-slate-500',
          titleColor: 'text-slate-400 font-semibold',
          ambientBeams: false,
          particleCount: 0
        };
    }
  };

  const vfx = activeCard ? getRarityVFX(activeCard.rarity) : null;

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-4 backdrop-blur-lg select-none">
      
      {/* Skip/Close pack opening overlay */}
      <button 
        onClick={onFinished} 
        className="absolute top-6 right-6 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white transition-all text-xs font-black z-50"
      >
        ✕ ปิดข้ามหน้านี้
      </button>
      
      {/* Audio Indicator */}
      <div className="absolute top-6 left-6 text-xs text-slate-500 flex items-center gap-1.5 bg-slate-900/50 border border-slate-800 px-3 py-1.5 rounded-full">
        <Volume2 size={14} className="text-emerald-400 animate-pulse" />
        <span>ระบบเสียงจำลอง Web Audio</span>
      </div>

      {phase === 'closed' || phase === 'shaking' ? (
        <div className="flex flex-col items-center max-w-sm w-full">
          {/* Pack Container */}
          <div 
            onClick={handleOpenPack}
            className={`w-[260px] h-[370px] rounded-2xl border-4 shadow-2xl relative cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 bg-gradient-to-b ${getPackGradient()} ${phase === 'shaking' ? 'shake' : ''}`}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 0 40px rgba(255,255,255,0.2)'
            }}
          >
            {/* Glossy Plastic Sheen */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent skew-x-12 transform scale-150 pointer-events-none" />

            {/* Pack Brand details */}
            <div className="absolute inset-2 border border-white/10 rounded-xl flex flex-col justify-between p-4 items-center bg-black/20">
              <div className="flex flex-col items-center">
                <Gift size={32} className="text-white mb-1 animate-bounce" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">GFB CARD ONLINE</span>
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-black text-white tracking-wide uppercase leading-none drop-shadow-md">
                  {packName}
                </h2>
                <div className="flex gap-1 justify-center mt-2">
                  <Sparkles size={14} className="text-amber-400 fill-amber-400 animate-pulse" />
                  <Sparkles size={14} className="text-amber-400 fill-amber-400 animate-pulse" />
                </div>
              </div>

              <div className="w-full text-center">
                <p className="text-[10px] text-white/60 font-semibold tracking-wider bg-white/5 border border-white/10 rounded-lg py-1.5">
                  คลิกเพื่อสปินฉีกซองการ์ด
                </p>
              </div>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-8 text-center animate-pulse">
            {phase === 'shaking' ? 'กำลังเขย่าซอง...' : 'แตะที่กล่องเพื่อฉีกซอง!'}
          </p>
        </div>
      ) : phase === 'ripped' ? (
        <div className="w-full h-full flex items-center justify-center burst">
          {/* Rip Screen Flare */}
          <div className="w-48 h-48 rounded-full bg-white blur-3xl opacity-80 animate-ping" />
        </div>
      ) : (
        activeCard && (
          <div className="flex flex-col items-center max-w-lg w-full">
            {/* Card Revealing Stage */}
            <div className="relative flex justify-center items-center w-full h-[360px] mb-4">
              
              {/* Central Glow Core */}
              <div className={`absolute w-[280px] h-[280px] rounded-full blur-3xl opacity-50 ${vfx.glowColor} ${vfx.glowPulse} transition-all duration-1000`} />
              
              {/* Rotating Beams for high tier cards */}
              {vfx.ambientBeams && (
                <div className="absolute w-[440px] h-[440px] rounded-full border border-dashed border-slate-700/20 animate-spin-slow pointer-events-none" />
              )}

              {/* Orbital Sparkling dust */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {Array.from({ length: vfx.particleCount }).map((_, i) => {
                  const angle = (i * 2 * Math.PI) / vfx.particleCount;
                  const x = Math.cos(angle) * 115;
                  const y = Math.sin(angle) * 145;
                  return (
                    <div 
                      key={i} 
                      className={`absolute w-1.5 h-1.5 rounded-full border animate-bounce ${vfx.sparkleColor}`}
                      style={{
                        animationDelay: `${i * 0.05}s`,
                        transform: `translate(${x}px, ${y}px)`
                      }}
                    />
                  );
                })}
              </div>

              {/* The Card Component */}
              <div key={currentIndex} className="reveal-card relative z-10">
                <Card card={activeCard} size="large" showStats={true} />
              </div>
            </div>

            {/* Reveal details and next button */}
            <div className="text-center w-full relative z-20">
              <span className={`inline-block px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 ${
                activeCard.rarity === 'icon' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/35' :
                activeCard.rarity === 'legendary' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/35' :
                activeCard.rarity === 'epic' ? 'bg-purple-600 text-white' :
                activeCard.rarity === 'rare' ? 'bg-blue-600 text-white' : 'bg-slate-750 text-slate-400'
              }`}>
                {activeCard.rarity} pull!
              </span>
              <h2 className="text-xl font-extrabold text-white mb-6">
                คุณได้รับ {activeCard.name}!
              </h2>

              <button 
                onClick={handleNextCard}
                className="btn btn-primary px-8 py-3.5 rounded-full text-base shadow-lg font-black flex items-center justify-center gap-1.5 mx-auto"
              >
                <span>{currentIndex < cards.length - 1 ? 'ดูการ์ดใบถัดไป' : 'เสร็จสิ้น'}</span>
                <ChevronRight size={18} />
              </button>

              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-4">
                ใบที่ {currentIndex + 1} จากทั้งหมด {cards.length} ใบ
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
};
