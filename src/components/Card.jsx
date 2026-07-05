import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ShieldAlert, Award } from 'lucide-react';

export const Card = ({ card, size = 'medium', showStats = true, isSelected = false, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef(null);

  // Dynamic dimensions based on card sizes
  const isSmall = size === 'small';
  const cardWidth = isSmall ? 'var(--card-pitch-width)' : size === 'large' ? '240px' : '180px';
  const cardHeight = isSmall ? 'var(--card-pitch-height)' : size === 'large' ? '335px' : '255px';

  // State for 3D card tilt effect
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });

  const handleMouseMove = (e) => {
    if (!cardRef.current || isSmall) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -12; // tilt max 12 deg
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 12;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ rotateX, rotateY, glareX, glareY });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  // Get color configurations based on card rarity tier
  const getRarityDetails = (rarity) => {
    switch (rarity) {
      case 'icon':
        return {
          bg: 'linear-gradient(135deg, #fff7ad 0%, #ffa939 50%, #8c5200 100%)',
          borderClass: 'border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.3)]',
          textClass: 'text-amber-300',
          cardLabel: 'HISTORIC ICON',
          stars: 5
        };
      case 'legendary':
        return {
          bg: 'linear-gradient(135deg, #ff9fbe 0%, #e0115f 50%, #4a001e 100%)',
          borderClass: 'border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
          textClass: 'text-rose-450',
          cardLabel: 'LEGENDARY FLAME',
          stars: 4
        };
      case 'epic':
        return {
          bg: 'linear-gradient(135deg, #e1b3ff 0%, #7b2cbf 50%, #240046 100%)',
          borderClass: 'border-purple-500/70',
          textClass: 'text-purple-400',
          cardLabel: 'EPIC SHADOW',
          stars: 3
        };
      case 'rare':
        return {
          bg: 'linear-gradient(135deg, #90e0ef 0%, #0077b6 50%, #03045e 100%)',
          borderClass: 'border-blue-500/60',
          textClass: 'text-blue-400',
          cardLabel: 'RARE TALENT',
          stars: 2
        };
      case 'common':
      default:
        return {
          bg: 'linear-gradient(135deg, #e2e8f0 0%, #475569 50%, #0f172a 100%)',
          borderClass: 'border-slate-500/50',
          textClass: 'text-slate-400',
          cardLabel: 'STARTER CORE',
          stars: 1
        };
    }
  };

  const details = getRarityDetails(card.rarity);
  const showImage = card.image && !imageError;

  // Real-time checks for suspension or injury
  const isSuspended = card.suspensionRemaining > 0;
  const isInjured = card.injuredUntil && card.injuredUntil > Date.now();

  const getInitials = (name = '') => {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getInjuryMinutesRemaining = () => {
    if (!card.injuredUntil) return 0;
    return Math.max(0, Math.ceil((card.injuredUntil - Date.now()) / 60000));
  };

  return (
    <div 
      className={`card-container transition-transform select-none ${isSelected ? 'ring-4 ring-emerald-500 rounded-2xl scale-[1.03]' : ''}`}
      onClick={onClick}
      style={{
        width: cardWidth,
        height: cardHeight,
      }}
    >
      <div
        ref={cardRef}
        className={`hologram-card ${details.borderClass}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          background: details.bg,
          transform: isSmall || isSuspended || isInjured ? 'none' : `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
          boxShadow: isSelected 
            ? `0 20px 30px rgba(0, 255, 102, 0.4), ${tilt.rotateY * -2}px ${tilt.rotateX * 2}px 25px rgba(0,0,0,0.5)`
            : `${tilt.rotateY * -1}px ${tilt.rotateX * 1}px 15px rgba(0,0,0,0.4)`
        }}
      >
        {/* Holographic light overlay */}
        {!isSmall && !isSuspended && !isInjured && (
          <div 
            className="absolute inset-0 rounded-xl pointer-events-none mix-blend-color-dodge z-10 opacity-70"
            style={{
              background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 60%), 
                           linear-gradient(${tilt.rotateX * 4}deg, rgba(255,0,128,0.1) 0%, rgba(0,255,255,0.1) 50%, rgba(255,255,0,0.1) 100%)`
            }}
          />
        )}

        {/* Card Body inner container */}
        <div 
          className="absolute rounded-[11px] overflow-hidden flex flex-col z-0 justify-between bg-slate-950/90"
          style={{
            inset: isSmall ? '2px' : '3px',
            padding: isSmall ? '5px' : '10px'
          }}
        >
          {/* PLAYER PHOTO AS FULL BACKGROUND */}
          {showImage ? (
            <img 
              src={card.image} 
              alt={card.name} 
              className="absolute inset-0 w-full h-full object-cover z-0"
              onError={() => setImageError(true)}
            />
          ) : (
            <>
              {/* Fallback card background styling */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 z-0 opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/90 z-5 pointer-events-none" />
              
              {/* Big center initials watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <span 
                  className="font-heading font-black text-white/5 uppercase tracking-widest leading-none select-none"
                  style={{ fontSize: isSmall ? '24px' : '56px' }}
                >
                  {getInitials(card.name)}
                </span>
              </div>
            </>
          )}

          {/* TEXT OVERLAYS: ONLY RENDERED IF CARD HAS NO IMAGE */}
          {!showImage && (
            <>
              {/* Top Row: Rating and Position (Left), Rarity stars (Right) */}
              <div className="relative z-10 flex justify-between items-start w-full">
                <div className="flex flex-col items-center">
                  <span 
                    className="font-heading font-black text-white tracking-tighter leading-none"
                    style={{ fontSize: isSmall ? '12px' : '26px' }}
                  >
                    {card.rating}
                  </span>
                  <span 
                    className="font-heading font-bold text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded leading-none text-center"
                    style={{ 
                      fontSize: isSmall ? '5.5px' : '8px',
                      marginTop: isSmall ? '1px' : '3px'
                    }}
                  >
                    {card.position}
                  </span>
                </div>
                
                {!isSmall && (
                  <div className="text-right flex flex-col items-end">
                    <div className="flex gap-0.5 mb-1">
                      {Array.from({ length: details.stars }).map((_, i) => (
                        <Sparkles key={i} size={8} className="text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[7.5px] font-bold text-slate-500 tracking-wider uppercase">
                      {details.cardLabel}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Area: Name, Club, and Stats Grid (pushed to bottom using mt-auto) */}
              <div className="relative z-10 w-full mt-auto space-y-1 sm:space-y-1.5">
                
                {/* Player Name and Club Panel */}
                <div className="text-center bg-slate-950/75 border border-slate-900/50 p-1.5 rounded-lg backdrop-blur-sm">
                  <h3 
                    className="font-semibold text-white tracking-wide truncate px-0.5 leading-none"
                    style={{ fontSize: isSmall ? '7px' : '11px' }}
                  >
                    {card.name}
                  </h3>
                  {!isSmall && (
                    <span className="text-[7.5px] text-slate-450 font-bold uppercase tracking-wider block mt-1">
                      {card.club}
                    </span>
                  )}
                </div>

                {/* Dynamic Stats Grid */}
                {showStats && !isSmall && (
                  <div className="grid grid-cols-3 gap-0.5 text-center bg-slate-950/85 border border-slate-900 rounded-lg p-1 leading-none">
                    {[
                      { l: 'PAC', v: card.stats.pac },
                      { l: 'SHO', v: card.stats.sho },
                      { l: 'PAS', v: card.stats.pas },
                      { l: 'DRI', v: card.stats.dri },
                      { l: 'DEF', v: card.stats.def },
                      { l: 'PHY', v: card.stats.phy }
                    ].map(stat => (
                      <div key={stat.l} className="flex flex-col py-0.5">
                        <span className="text-[6.5px] text-slate-500 font-bold">{stat.l}</span>
                        <span className="text-[9px] font-heading font-black text-gray-200 mt-0.5">{stat.v}</span>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </>
          )}

          {/* Red-Card Suspension overlay */}
          {isSuspended && (
            <div className="absolute inset-0 bg-rose-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-3 text-center z-20">
              <ShieldAlert className="text-rose-500 animate-pulse mb-1.5" size={isSmall ? 14 : 26} />
              <span className="text-white font-extrabold tracking-wider leading-none" style={{ fontSize: isSmall ? '7px' : '12px' }}>
                ติดโทษแบน
              </span>
              <span className="text-rose-400 font-bold mt-1 text-[7px] sm:text-[9px] leading-none">
                เหลือ {card.suspensionRemaining} นัด
              </span>
            </div>
          )}

          {/* Injury cooldown overlay */}
          {isInjured && (
            <div className="absolute inset-0 bg-amber-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-3 text-center z-20">
              <ShieldAlert className="text-amber-500 animate-pulse mb-1.5" size={isSmall ? 14 : 26} />
              <span className="text-white font-extrabold tracking-wider leading-none" style={{ fontSize: isSmall ? '7px' : '12px' }}>
                บาดเจ็บ
              </span>
              <span className="text-amber-400 font-bold mt-1 text-[7px] sm:text-[9px] leading-none">
                ฟื้นตัว {getInjuryMinutesRemaining()} นาที
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
