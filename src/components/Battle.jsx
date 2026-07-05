import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Card } from './Card';
import { 
  Swords, Coins, Shield, Play, RefreshCw, Trophy, 
  ChevronRight, Sparkles, UserPlus, Gift, AlertTriangle, 
  HelpCircle, Eye, EyeOff, LayoutGrid, Info, Plus, Trash2,
  Tv, Compass, Settings, ShieldAlert, AlertCircle, Award
} from 'lucide-react';

const BOT_DIFFICULTIES = [
  { id: 'easy', name: 'สโมสรสมัครเล่น (Easy)', manager: 'ลุงพล บงกช', ovr: 72, reward: 150, color: 'border-slate-800 bg-slate-900/30' },
  { id: 'medium', name: 'สโมสรภูมิภาค (Medium)', manager: 'โค้ชซิโก้จำลอง', ovr: 81, reward: 300, color: 'border-blue-900/30 bg-blue-950/20' },
  { id: 'hard', name: 'ไทยลีก แชมเปี้ยนชิพ (Hard)', manager: 'เป๊ป โกวาร์ดิโอลา', ovr: 87, reward: 500, color: 'border-purple-900/30 bg-purple-950/20' },
  { id: 'legendary', name: 'เอเอฟซี แชมเปี้ยนส์ลีกล่าสุด (Legendary)', manager: 'เซอร์ อเล็กซ์ ฟอนซ่า', ovr: 92, reward: 800, color: 'border-rose-900/30 bg-rose-950/20' },
  { id: 'insane', name: 'ลีคระดับโลกเวิลด์สตาร์ (Insane)', manager: 'โค้ชประธานเป้', ovr: 97, reward: 1500, color: 'border-amber-550/30 bg-amber-950/10' }
];

// Synth sounds helper
const playSynthSound = (type) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'whistle') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'goal') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } else if (type === 'foul') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.setValueAtTime(200, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    }
  } catch (e) {
    console.warn(e);
  }
};

export const Battle = () => {
  const { 
    currentUser, cardsDB, users, addCoins, logMatch, handlePostMatchStatus,
    finalizeUserMatchData,
    customRooms, createRoom, cancelRoom, joinRoom, finalizeRoomMatch
  } = useGame();
  
  // Tab selector: 'bot' (PvE), 'matchmaker' (PvP), 'custom' (1v1 custom friendly rooms)
  const [battleTab, setBattleTab] = useState('bot');

  // Match status states
  const [matchState, setMatchState] = useState('menu'); // 'menu', 'matchmaking', 'simulating', 'finished'
  const [opponent, setOpponent] = useState(null); // { name, ovr, manager, isBot, cards, is1v1Room, roomId, wager }
  const [matchDifficulty, setMatchDifficulty] = useState('medium');

  // Match progression states
  const [minute, setMinute] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [events, setEvents] = useState([]);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 5x
  const [redCards, setRedCards] = useState({ player: 0, opponent: 0 });
  const [yellowCards, setYellowCards] = useState({ player: [], opponent: [] });
  const [earnedCoins, setEarnedCoins] = useState(0);

  // Player of the Match and Detailed summary states
  const [potmCard, setPotmCard] = useState(null); // { card, goals, team }
  const [matchStats, setMatchStats] = useState(null); // { possession: [p, o], shots: [p, o] ... }
  const [chemistry, setChemistry] = useState(100);

  // Custom 1v1 Rooms lobby form states
  const [roomName, setRoomName] = useState('');
  const [wagerAmount, setWagerAmount] = useState('100');
  const [activeRoomId, setActiveRoomId] = useState(null); // Track room owned or joined

  // Refs to maintain exact values in fast interval ticks
  const minuteRef = useRef(0);
  const playerScoreRef = useRef(0);
  const opponentScoreRef = useRef(0);
  const redCardsRef = useRef({ player: 0, opponent: 0 });
  const yellowCardsRef = useRef({ player: [], opponent: [] });
  const opponentRef = useRef(null);
  const redCardedInstancesRef = useRef([]);
  const injuredInstancesRef = useRef([]);
  const goalScorersRef = useRef([]); // Accumulate scorers during match

  const timerRef = useRef(null);
  const eventsEndRef = useRef(null);

  if (!currentUser) return null;

  // Active lineup data
  const playerLineup = Object.values(currentUser.squad || {})
    .map(instId => currentUser.cards.find(c => c.instanceId === instId))
    .filter(Boolean);

  const getSquadOvr = (user) => {
    if (!user.squad || Object.keys(user.squad).length === 0) return 0;
    const squadCards = Object.values(user.squad)
      .map(instId => user.cards.find(c => c.instanceId === instId))
      .filter(Boolean);
    if (squadCards.length === 0) return 0;
    const sum = squadCards.reduce((acc, c) => acc + c.rating, 0);
    return Math.round(sum / squadCards.length);
  };

  const playerOvr = getSquadOvr(currentUser);

  // --- REAL-TIME 1V1 ROOM MONITOR ---
  useEffect(() => {
    // If we hosted a custom room and are waiting in the menu, check if someone joined
    if (activeRoomId && matchState === 'menu') {
      const room = customRooms.find(r => r.id === activeRoomId);
      if (room && room.status === 'playing') {
        // Someone joined! Start the 1v1 simulation!
        const oppDetails = {
          name: room.guest,
          ovr: room.guestOvr,
          manager: 'โค้ชผู้ท้าชิง 1-1',
          isBot: false,
          is1v1Room: true,
          roomId: room.id,
          wager: room.wager,
          reward: room.wager * 2,
          cards: room.guestCards
        };

        setOpponent(oppDetails);
        setMatchState('simulating');
        initializeMatch(oppDetails);
      }
    }
  }, [customRooms, activeRoomId, matchState]);

  // Scroll to bottom of match commentary
  useEffect(() => {
    if (eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events]);

  // --- ONLINE PVP MATCHMAKING SCANNER ---
  const startMatchmaking = () => {
    if (playerLineup.length < 11) {
      alert('คุณต้องจัดตัวจริงให้ครบ 11 คนก่อนเข้าแข่งขัน! กรุณาไปจัดทีมที่เมนูจัดทีมการ์ด');
      return;
    }
    setMatchState('matchmaking');
    playSynthSound('whistle');
    
    setTimeout(() => {
      // Filter other users excluding admin & current player
      const otherRealUsers = users.filter(u => u.username !== currentUser.username && u.username !== 'admin');
      
      // Matchmaker looks for users who also have full squads
      const validOpponents = otherRealUsers.filter(u => Object.keys(u.squad || {}).length === 11);
      
      let oppDetails;
      if (validOpponents.length > 0) {
        // Match found! Pull their real roster and OVR
        const randOpp = validOpponents[Math.floor(Math.random() * validOpponents.length)];
        const oppCards = Object.values(randOpp.squad)
          .map(instId => randOpp.cards.find(c => c.instanceId === instId))
          .filter(Boolean);
        
        oppDetails = {
          name: randOpp.username,
          ovr: getSquadOvr(randOpp),
          manager: 'ผู้จัดการลีคออนไลน์',
          isBot: false,
          reward: 350,
          cards: oppCards
        };
      } else {
        // Fallback simulated bot coaches
        const names = ['FC Barcelona Fan', 'RedDevils99', 'GoonerPower', 'KopitesTH', 'ChonburiEagle', 'BuriramKing', 'LeoMessiFan'];
        const oppName = names[Math.floor(Math.random() * names.length)];
        const oppOvr = Math.max(70, Math.min(99, playerOvr + Math.floor(Math.random() * 9) - 4));
        
        const oppCards = [];
        const pool = cardsDB.length > 0 ? cardsDB : playerLineup;
        for (let i = 0; i < 11; i++) {
          const randCard = pool[Math.floor(Math.random() * pool.length)];
          oppCards.push(randCard);
        }

        oppDetails = {
          name: oppName,
          ovr: oppOvr,
          manager: 'โค้ชออนไลน์จำลอง',
          isBot: true,
          reward: 350,
          cards: oppCards
        };
      }

      setOpponent(oppDetails);
      setMatchState('simulating');
      initializeMatch(oppDetails);
    }, 2500); // Radar scanning time simulation
  };

  // --- BOT PvE CHALLENGE ---
  const startBotChallenge = (difficultyId) => {
    if (playerLineup.length < 11) {
      alert('คุณต้องจัดตัวจริงให้ครบ 11 คนก่อนเข้าแข่งขัน! กรุณาไปจัดทีมที่เมนูจัดทีมการ์ด');
      return;
    }
    const diff = BOT_DIFFICULTIES.find(d => d.id === difficultyId);
    playSynthSound('whistle');
    
    const oppCards = [];
    let rarityFilter = ['common'];
    if (difficultyId === 'medium') rarityFilter = ['common', 'rare'];
    if (difficultyId === 'hard') rarityFilter = ['rare', 'epic'];
    if (difficultyId === 'legendary') rarityFilter = ['epic', 'legendary'];
    if (difficultyId === 'insane') rarityFilter = ['legendary', 'icon'];

    const filteredPool = cardsDB.filter(c => rarityFilter.includes(c.rarity));
    const finalPool = filteredPool.length > 0 ? filteredPool : cardsDB;

    for (let i = 0; i < 11; i++) {
      const randCard = finalPool[Math.floor(Math.random() * finalPool.length)];
      oppCards.push(randCard);
    }

    const oppDetails = {
      name: `GFB Bot (${diff.manager})`,
      ovr: diff.ovr,
      manager: diff.manager,
      isBot: true,
      reward: diff.reward,
      cards: oppCards
    };

    setOpponent(oppDetails);
    setMatchDifficulty(difficultyId);
    setMatchState('simulating');
    initializeMatch(oppDetails);
  };

  // --- HOST CUSTOM 1V1 ROOM ---
  const handleHostRoom = (e) => {
    e.preventDefault();
    if (playerLineup.length < 11) {
      alert('คุณต้องมีตัวจริง 11 คนก่อนท้าชิงเดิมพัน');
      return;
    }
    const wager = parseInt(wagerAmount) || 0;
    if (currentUser.coins < wager) {
      alert('เหรียญทองของคุณไม่พอสำหรับค่าเดิมพันห้องนี้');
      return;
    }

    const res = createRoom(roomName, wager);
    if (res.success) {
      setActiveRoomId(res.room.id);
      setRoomName('');
    } else {
      alert(res.message);
    }
  };

  // --- CANCEL WAITING ROOM ---
  const handleCancelRoom = () => {
    if (!activeRoomId) return;
    const res = cancelRoom(activeRoomId);
    if (res.success) {
      setActiveRoomId(null);
    }
  };

  // --- JOIN & CHALLENGE CUSTOM ROOM ---
  const handleJoinRoom = (room) => {
    if (playerLineup.length < 11) {
      alert('คุณต้องมีตัวจริง 11 คนก่อนก้าวเข้าลานเดิมพัน');
      return;
    }
    if (currentUser.coins < room.wager) {
      alert('เหรียญทองของคุณไม่พอวางเดิมพันห้องนี้');
      return;
    }

    const res = joinRoom(room.id);
    if (res.success) {
      const activeRoom = res.room;
      setActiveRoomId(activeRoom.id);

      const oppDetails = {
        name: activeRoom.creator,
        ovr: activeRoom.creatorOvr,
        manager: 'เจ้าของห้องดวลเดือด',
        isBot: false,
        is1v1Room: true,
        roomId: activeRoom.id,
        wager: activeRoom.wager,
        reward: activeRoom.wager * 2,
        cards: activeRoom.creatorCards
      };

      setOpponent(oppDetails);
      setMatchState('simulating');
      initializeMatch(oppDetails);
    } else {
      alert(res.message);
    }
  };

  // --- INITIALIZE MATCH PARAMS ---
  const initializeMatch = (oppDetails) => {
    minuteRef.current = 0;
    playerScoreRef.current = 0;
    opponentScoreRef.current = 0;
    redCardsRef.current = { player: 0, opponent: 0 };
    yellowCardsRef.current = { player: [], opponent: [] };
    opponentRef.current = oppDetails;
    redCardedInstancesRef.current = [];
    injuredInstancesRef.current = [];
    goalScorersRef.current = [];

    // Calculate chemistry dynamically based on positions
    const currentFormation = currentUser.formation || '4-4-2';
    const labels = {
      '4-4-2': ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST'],
      '4-3-3': ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW'],
      '3-5-2': ['GK', 'CB', 'CB', 'CB', 'LM', 'CM', 'CM', 'CM', 'RM', 'ST', 'ST'],
      '5-3-2': ['GK', 'LWB', 'CB', 'CB', 'CB', 'RWB', 'CM', 'CM', 'CM', 'ST', 'ST']
    }[currentFormation] || [];

    let chem = 0;
    playerLineup.forEach((card, idx) => {
      if (!card || idx >= labels.length) return;
      const label = labels[idx];
      if (card.position === label) {
        chem += 4;
      } else {
        const cRole = ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(card.position) ? 'DEF' :
                      ['CM', 'LM', 'RM', 'CDM', 'CAM'].includes(card.position) ? 'MID' : 'ATT';
        const sRole = ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(label) ? 'DEF' :
                      ['CM', 'LM', 'RM', 'CDM', 'CAM'].includes(label) ? 'MID' : 'ATT';
        if (cRole === sRole) {
          chem += 2;
        }
      }
    });

    if (playerLineup.some(c => c && c.position === 'GK')) {
      chem += 56;
    }
    const finalChem = Math.min(100, chem);
    setChemistry(finalChem);

    setMinute(0);
    setPlayerScore(0);
    setOpponentScore(0);
    setRedCards({ player: 0, opponent: 0 });
    setYellowCards({ player: [], opponent: [] });
    setEarnedCoins(0);
    setPotmCard(null);
    setMatchStats(null);
    setEvents([
      { min: 0, text: 'กรรมการเป่านกหวีดเริ่มการแข่งขันคิกออฟเรียบร้อย! ขอให้ผู้เล่นทั้งสองฝั่งโชคดี', type: 'info' }
    ]);
  };

  // --- SIMULATION EFFECTS TIMERS ---
  useEffect(() => {
    if (matchState !== 'simulating') return;

    const intervalTime = speed === 1 ? 1200 : speed === 2 ? 600 : 250;
    
    timerRef.current = setInterval(() => {
      const nextMin = minuteRef.current + 5;
      minuteRef.current = nextMin;
      setMinute(nextMin);
      
      if (nextMin >= 90) {
        clearInterval(timerRef.current);
        handleMatchFinished();
        return;
      }

      runMatchTick(nextMin);
    }, intervalTime);

    return () => clearInterval(timerRef.current);
  }, [matchState, speed]);

  // --- SIMULATOR EVENTS ENGINE ---
  const runMatchTick = (currentMin) => {
    const opp = opponentRef.current;
    if (!opp) return;

    const pRed = redCardsRef.current.player;
    const oRed = redCardsRef.current.opponent;
    const playerPenalty = 1 - (pRed * 0.08);
    const opponentPenalty = 1 - (oRed * 0.08);

    const chemFactor = 0.8 + (chemistry / 100) * 0.2;
    const livePlayerPower = playerOvr * playerPenalty * chemFactor;
    const liveOpponentPower = opp.ovr * opponentPenalty;
    
    // Balanced OVR difference matchmaking chance
    const diff = livePlayerPower - liveOpponentPower;
    const advantage = diff * 0.025; // +10 rating = +25% attack chance
    let playerChance = 0.5 + advantage;
    playerChance = Math.max(0.15, Math.min(0.85, playerChance));

    if (Math.random() > 0.55) return;

    const eventRoll = Math.random();

    if (eventRoll < 0.70) {
      // --- GOAL ATTEMPT ---
      const attackerIsPlayer = Math.random() < playerChance;
      const attackingLineup = attackerIsPlayer ? playerLineup : opp.cards;
      const randAttacker = attackingLineup[Math.floor(Math.random() * attackingLineup.length)];
      
      const shootChance = attackerIsPlayer 
        ? (randAttacker.stats.sho + randAttacker.stats.dri) / (liveOpponentPower * 1.5)
        : (randAttacker.stats.sho + randAttacker.stats.dri) / (livePlayerPower * 1.5);
      
      const isGoal = Math.random() < Math.min(0.85, Math.max(0.15, shootChance));

      if (isGoal) {
        playSynthSound('goal');
        if (attackerIsPlayer) {
          playerScoreRef.current += 1;
          setPlayerScore(playerScoreRef.current);
        } else {
          opponentScoreRef.current += 1;
          setOpponentScore(opponentScoreRef.current);
        }

        // Record Scorer card
        goalScorersRef.current.push({
          card: randAttacker,
          team: attackerIsPlayer ? 'player' : 'opponent'
        });

        const commentary = [
          `ประตู!!! [${randAttacker.name}] เลี้ยงกระชากเดี่ยวหลบแนวรับก่อนยิงสวนปัดปลายมือเสียบเสาไกล เข้าประตูอย่างงดงาม!`,
          `โกลลลลล! [${randAttacker.name}] สลัดหนีกองหลังขึ้นโหม่งลูกเตะมุมสะท้อนพื้นเข้าตาข่ายอย่างเด็ดขาด แฟนบอลเฮลั่น!`,
          `ประตูยอดเยี่ยม! [${randAttacker.name}] ยิงปั่นฟรีคิกระยะไกล บอลย้อยฮุบลงเสียบใต้คานอย่างสมบูรณ์แบบเหนือคำบรรยาย!`,
          `เข้าประตูแล้ว! [${randAttacker.name}] ซ้ำจังหวะสองขลุกขลิกหน้ากรอบก่อนดีดลูกบอลย้อยข้ามหัวผู้รักษาประตูเบียดเสาเข้าไป!`
        ];

        setEvents(prev => [...prev, {
          min: currentMin,
          text: commentary[Math.floor(Math.random() * commentary.length)],
          type: 'goal',
          team: attackerIsPlayer ? 'player' : 'opponent'
        }]);
      } else {
        const saves = [
          `จังหวะหวาดเสียว! [${randAttacker.name}] ซัดเล็งเสาสอง บอลโค้งออกหลังไปแค่นิ้วเดียว`,
          `ชนคานเสา! [${randAttacker.name}] สลัดหลุดกองหลังสับไกเต็มแรง ลูกพุ่งชนเสาเหล็กกระดอนกลับข้ามแดนไปอย่างน่าเสียดาย`,
          `ซูเปอร์เซฟระดับโลก! [${randAttacker.name}] ยิงเบียดมุมซ้ายมือ แต่ผู้รักษาประตูลอยตัวทุบทิ้งออกหลังไปได้ทัน`
        ];
        setEvents(prev => [...prev, {
          min: currentMin,
          text: saves[Math.floor(Math.random() * saves.length)],
          type: 'save'
        }]);
      }

    } else if (eventRoll < 0.95) {
      // --- FOULS / CARDS ---
      playSynthSound('foul');
      const foulOnPlayer = Math.random() > playerChance; 
      const cardedLineup = foulOnPlayer ? playerLineup : opp.cards;
      const randCulprit = cardedLineup[Math.floor(Math.random() * cardedLineup.length)];
      
      const isDirectRed = Math.random() < 0.20;
      const cardArray = foulOnPlayer ? yellowCardsRef.current.player : yellowCardsRef.current.opponent;
      const hasYellowAlready = cardArray.includes(randCulprit.name);

      if (isDirectRed || hasYellowAlready) {
        if (foulOnPlayer) {
          redCardsRef.current.player += 1;
          setRedCards({ ...redCardsRef.current });
          redCardedInstancesRef.current.push(randCulprit.instanceId);
        } else {
          redCardsRef.current.opponent += 1;
          setRedCards({ ...redCardsRef.current });
        }

        const text = isDirectRed
          ? `ใบแดงตรง!!! [${randCulprit.name}] จงใจกระโดดเสียบสไลด์เปิดปุ่มขาคู่สองเท้าใส่ กรรมการไม่ลังเลชูใบแดงไล่ออกทันที!`
          : `ใบเหลืองใบที่สองเป็นใบแดง!!! [${randCulprit.name}] จงใจตัดฟาวล์ขัดจังหวะโต้กลับเร็ว โดนใบเหลืองคาดโทษใบที่สองไล่ออกนอกสนาม!`;

        setEvents(prev => [...prev, {
          min: currentMin,
          text: text,
          type: 'red_card',
          team: foulOnPlayer ? 'player' : 'opponent'
        }]);
      } else {
        if (foulOnPlayer) {
          yellowCardsRef.current.player.push(randCulprit.name);
          setYellowCards({ ...yellowCardsRef.current });
        } else {
          yellowCardsRef.current.opponent.push(randCulprit.name);
          setYellowCards({ ...yellowCardsRef.current });
        }

        const text = `ใบเหลือง! [${randCulprit.name}] วิ่งเข้ามาดึงไหล่ขัดขวางขารบกวนความเร็วฝ่ายตรงข้าม กรรมการวิ่งชูใบเหลืองจดชื่อทันที`;
        setEvents(prev => [...prev, {
          min: currentMin,
          text: text,
          type: 'yellow_card',
          team: foulOnPlayer ? 'player' : 'opponent'
        }]);
      }
    } else {
      // --- GENERAL EVENTS / INJURIES ---
      // 4% chance of player injury
      if (Math.random() < 0.04) {
        const randPlayer = playerLineup[Math.floor(Math.random() * playerLineup.length)];
        if (randPlayer && !injuredInstancesRef.current.includes(randPlayer.instanceId)) {
          injuredInstancesRef.current.push(randPlayer.instanceId);
          
          const injuryTexts = [
            `[บาดเจ็บ] [${randPlayer.name}] ปะทะหนักขากระแทกพื้นอย่างรุนแรง กล้ามเนื้อเข่าบิด ต้องเดินกะเผลกออกสนาม!`,
            `[บาดเจ็บ] [${randPlayer.name}] จังหวะก้าวขาสกัดบอลเกิดกล้ามเนื้อโคนขาหนีบฉีกขาดอย่างกะทันหัน ต้องหามเปลี่ยนตัวออกสนาม!`,
            `[บาดเจ็บ] [${randPlayer.name}] ปะทะกลางอากาศแล้วตกลงมาผิดท่า ไหล่หลุด เล่นต่อไม่ไหวแพทย์สนามหามพยุงตัวออก!`
          ];
          
          setEvents(prev => [...prev, {
            min: currentMin,
            text: injuryTexts[Math.floor(Math.random() * injuryTexts.length)],
            type: 'injury',
            team: 'player'
          }]);
          return;
        }
      }

      const generalComments = [
        `เกมดำเนินไปอย่างตึงเครียด ทั้งสองฝ่ายเน้นเคาะบอลสั้นสลับคุมจังหวะปิดเกมอย่างระวัง`,
        `มีการเข้าสกัดบอลเด็ดขาดหนักหน่วงหลายหนบริเวณริมเส้น โค้ชทั้งสองฝ่ายตะโกนสั่งการไม่หยุด`,
        `กองหลังของทั้งสองฝั่งฟอร์มดุ ป้องกันลูกครอสจากกึ่งกลางสนามได้อย่างแน่นหนาไร้ช่องรอยรั่ว`
      ];
      setEvents(prev => [...prev, {
        min: currentMin,
        text: generalComments[Math.floor(Math.random() * generalComments.length)],
        type: 'info'
      }]);
    }
  };

  // --- INSTANT SKIP MATCH ---
  const handleInstantSkip = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    let curMin = minuteRef.current;
    const opp = opponentRef.current;
    if (!opp) return;

    const newEvents = [];

    while (curMin < 90) {
      curMin += 5;
      
      const pRed = redCardsRef.current.player;
      const oRed = redCardsRef.current.opponent;
      const playerPenalty = 1 - (pRed * 0.08);
      const opponentPenalty = 1 - (oRed * 0.08);
      const chemFactor = 0.8 + (chemistry / 100) * 0.2;
      const livePlayerPower = playerOvr * playerPenalty * chemFactor;
      const liveOpponentPower = opp.ovr * opponentPenalty;

      // Balanced OVR difference matchmaking chance
      const diff = livePlayerPower - liveOpponentPower;
      const advantage = diff * 0.025;
      let playerChance = 0.5 + advantage;
      playerChance = Math.max(0.15, Math.min(0.85, playerChance));

      if (Math.random() < 0.55) {
        const eventRoll = Math.random();

        if (eventRoll < 0.70) {
          const attackerIsPlayer = Math.random() < playerChance;
          const attackingLineup = attackerIsPlayer ? playerLineup : opp.cards;
          const randAttacker = attackingLineup[Math.floor(Math.random() * attackingLineup.length)];
          const shootChance = attackerIsPlayer 
            ? (randAttacker.stats.sho + randAttacker.stats.dri) / (liveOpponentPower * 1.5)
            : (randAttacker.stats.sho + randAttacker.stats.dri) / (livePlayerPower * 1.5);
          
          if (Math.random() < Math.min(0.85, Math.max(0.15, shootChance))) {
            if (attackerIsPlayer) {
              playerScoreRef.current += 1;
            } else {
              opponentScoreRef.current += 1;
            }

            // Record Scorer card
            goalScorersRef.current.push({
              card: randAttacker,
              team: attackerIsPlayer ? 'player' : 'opponent'
            });

            newEvents.push({
              min: curMin,
              text: `[ข้ามเวลาด่วน] [${randAttacker.name}] ซัดประตูระเบิดตาข่ายในกรอบเขตโทษ!`,
              type: 'goal',
              team: attackerIsPlayer ? 'player' : 'opponent'
            });
          }
        } else if (eventRoll < 0.95) {
          const foulOnPlayer = Math.random() > playerChance;
          const cardedLineup = foulOnPlayer ? playerLineup : opp.cards;
          const randCulprit = cardedLineup[Math.floor(Math.random() * cardedLineup.length)];
          const isDirectRed = Math.random() < 0.20;
          const cardArray = foulOnPlayer ? yellowCardsRef.current.player : yellowCardsRef.current.opponent;
          const hasYellowAlready = cardArray.includes(randCulprit.name);

          if (isDirectRed || hasYellowAlready) {
            if (foulOnPlayer) {
              redCardsRef.current.player += 1;
              redCardedInstancesRef.current.push(randCulprit.instanceId);
            } else {
              redCardsRef.current.opponent += 1;
            }
            newEvents.push({
              min: curMin,
              text: `[ข้ามเวลาด่วน] ใบแดง!!! [${randCulprit.name}] ถูกไล่ออกจากสนามสะสมใบโทษ!`,
              type: 'red_card',
              team: foulOnPlayer ? 'player' : 'opponent'
            });
          } else {
            if (foulOnPlayer) {
              yellowCardsRef.current.player.push(randCulprit.name);
            } else {
              yellowCardsRef.current.opponent.push(randCulprit.name);
            }
            newEvents.push({
              min: curMin,
              text: `[ข้ามเวลาด่วน] ใบเหลือง! [${randCulprit.name}] สกัดฟาวล์ล่าช้าโดนสลักจดชื่อจังหวะนี้`,
              type: 'yellow_card',
              team: foulOnPlayer ? 'player' : 'opponent'
            });
          }
        }
      }

      // Skip simulation injury generator
      if (Math.random() < 0.04) {
        const randPlayer = playerLineup[Math.floor(Math.random() * playerLineup.length)];
        if (randPlayer && !injuredInstancesRef.current.includes(randPlayer.instanceId)) {
          injuredInstancesRef.current.push(randPlayer.instanceId);
          newEvents.push({
            min: curMin,
            text: `[ข้ามเวลาด่วน - บาดเจ็บ] [${randPlayer.name}] มีอาการกล้ามเนื้อตึงฉีกขาดระหว่างสกัดบอล ต้องส่งตัวรักษาด่วน!`,
            type: 'injury',
            team: 'player'
          });
        }
      }
    }

    minuteRef.current = 90;
    setMinute(90);
    setPlayerScore(playerScoreRef.current);
    setOpponentScore(opponentScoreRef.current);
    setRedCards({ ...redCardsRef.current });
    setYellowCards({ ...yellowCardsRef.current });
    setEvents(prev => [...prev, ...newEvents]);
    
    finalizeMatchResult(
      playerScoreRef.current, 
      opponentScoreRef.current, 
      redCardsRef.current.player, 
      redCardsRef.current.opponent
    );
  };

  const handleMatchFinished = () => {
    finalizeMatchResult(
      playerScoreRef.current, 
      opponentScoreRef.current, 
      redCardsRef.current.player, 
      redCardsRef.current.opponent
    );
  };

  // --- FINALIZE MATCH PAYOUTS & SUMMARY STATS ---
  const finalizeMatchResult = (finalPlayerScore, finalOpponentScore, finalPlayerRed, finalOpponentRed) => {
    setMatchState('finished');
    playSynthSound('whistle');

    let resultType = 'draw'; 
    let earnings = 0;
    const opp = opponentRef.current;
    if (!opp) return;

    if (finalPlayerScore > finalOpponentScore) {
      resultType = 'win';
      earnings = opp.reward; 
    } else if (finalPlayerScore < finalOpponentScore) {
      resultType = 'loss';
      earnings = opp.is1v1Room ? 0 : Math.round(opp.reward * 0.3); 
    } else {
      const penPlayer = Math.random() > 0.5;
      resultType = penPlayer ? 'win' : 'loss';
      if (opp.is1v1Room) {
        earnings = penPlayer ? opp.reward : 0;
      } else {
        earnings = penPlayer ? Math.round(opp.reward * 0.8) : Math.round(opp.reward * 0.4);
      }
    }

    setEarnedCoins(earnings);

    // A. CALCULATE PLAYER OF THE MATCH (POTM)
    let potm = null;
    if (goalScorersRef.current.length > 0) {
      // Group scorers and count goals
      const goalsMap = {};
      goalScorersRef.current.forEach(gs => {
        const id = gs.card.instanceId || gs.card.id;
        goalsMap[id] = (goalsMap[id] || 0) + 1;
      });

      // Find highest goalscorer
      let maxGoals = 0;
      let topCardId = null;
      Object.keys(goalsMap).forEach(id => {
        if (goalsMap[id] > maxGoals) {
          maxGoals = goalsMap[id];
          topCardId = id;
        }
      });

      const bestScorer = goalScorersRef.current.find(gs => (gs.card.instanceId || gs.card.id) === topCardId);
      if (bestScorer) {
        potm = {
          card: bestScorer.card,
          goals: maxGoals,
          team: bestScorer.team
        };
      }
    }

    // POTM Goalkeeper or Captain fallback if no goals were scored
    if (!potm) {
      const gkCard = playerLineup.find(c => c.position === 'GK') || playerLineup[0] || (opp.cards && opp.cards[0]);
      if (gkCard) {
        potm = {
          card: gkCard,
          goals: 0,
          team: 'player'
        };
      }
    }
    setPotmCard(potm);

    // B. GENERATE DETAILED MATCH STATISTICS SUMMARY
    const pPoss = Math.max(30, Math.min(70, Math.round((playerOvr / (playerOvr + opp.ovr)) * 100) + Math.floor(Math.random() * 9) - 4));
    const oPoss = 100 - pPoss;

    const pShots = finalPlayerScore + Math.floor(Math.random() * 5) + 3;
    const oShots = finalOpponentScore + Math.floor(Math.random() * 5) + 2;

    const pOnTarget = Math.max(finalPlayerScore, pShots - Math.floor(Math.random() * 2) - 1);
    const oOnTarget = Math.max(finalOpponentScore, oShots - Math.floor(Math.random() * 2) - 1);

    const pPassAcc = Math.round(75 + (playerOvr / 10) + Math.random() * 6);
    const oPassAcc = Math.round(72 + (opp.ovr / 10) + Math.random() * 6);

    const pFouls = yellowCardsRef.current.player.length + redCardsRef.current.player * 2 + Math.floor(Math.random() * 3);
    const oFouls = yellowCardsRef.current.opponent.length + redCardsRef.current.opponent * 2 + Math.floor(Math.random() * 3);

    const summaryStats = {
      possession: [pPoss, oPoss],
      shots: [pShots, oShots],
      shotsOnTarget: [pOnTarget, oOnTarget],
      passAccuracy: [pPassAcc, oPassAcc],
      fouls: [pFouls, oFouls]
    };
    setMatchStats(summaryStats);

    const matchLogData = {
      id: `match_${Date.now()}`,
      timestamp: new Date().toISOString(),
      player: currentUser.username,
      opponent: opp.name,
      playerScore: finalPlayerScore,
      opponentScore: finalOpponentScore,
      result: resultType,
      coinsEarned: earnings,
      difficulty: opp.isBot ? matchDifficulty : opp.is1v1Room ? 'ท้าดวล 1-1' : 'PvP ค้นหาคู่แข่ง'
    };

    // If 1v1 Room, distribute coins to guest/host if guest won, and delete room
    if (opp.is1v1Room) {
      const winner = resultType === 'win' ? currentUser.username : opp.name;
      finalizeRoomMatch(opp.roomId, winner);
      setActiveRoomId(null);
    }

    // Atomic context dispatch
    finalizeUserMatchData(
      earnings,
      matchLogData,
      redCardedInstancesRef.current,
      injuredInstancesRef.current
    );
  };

  const resetBattle = () => {
    setMatchState('menu');
    setOpponent(null);
    setEvents([]);
    setEarnedCoins(0);
    setPotmCard(null);
    setMatchStats(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {matchState === 'menu' && (
        <div className="space-y-12 animate-fade-in">
          
          {/* Header Banner */}
          <div className="glass p-8 border-white/5 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full" />
            <div>
              <h2 className="text-3xl font-black text-white flex items-center gap-2">
                <Swords size={28} className="text-emerald-400 animate-pulse" />
                โหมดดวลแข้ง GFB ARENA
              </h2>
              <p className="text-slate-400 text-sm mt-1.5 leading-relaxed max-w-2xl">
                ท้าดวลสโมสรบอทไต่อันดับ ท้าสู้ผู้เล่นลีคออนไลน์ หรือท้าพนันเหรียญทองในห้อง 1-1
              </p>
            </div>
            
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl shrink-0 w-full md:w-auto">
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">ทีม OVR ปัจจุบันของคุณ</span>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-2xl font-black text-emerald-400">{playerOvr} OVR</span>
                <span className="text-xs text-slate-400 font-semibold">{playerLineup.length} / 11 นักเตะครบ</span>
              </div>
            </div>
          </div>

          {/* Tab switches */}
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-900 max-w-xl mx-auto">
            <button
              onClick={() => setBattleTab('bot')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                battleTab === 'bot' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black shadow-lg shadow-emerald-500/10' : 'text-slate-500 hover:text-slate-350'
              }`}
            >
              🎮 ท้าสู้ระดับบอท (PVE)
            </button>
            <button
              onClick={() => setBattleTab('matchmaker')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                battleTab === 'matchmaker' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black shadow-lg shadow-emerald-500/10' : 'text-slate-500 hover:text-slate-355'
              }`}
            >
              ⚡ ค้นหาจับคู่ (PVP)
            </button>
            <button
              onClick={() => setBattleTab('custom')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                battleTab === 'custom' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black shadow-lg shadow-emerald-500/10' : 'text-slate-500 hover:text-slate-360'
              }`}
            >
              🏆 ท้าดวล 1-1 เดิมพัน
            </button>
          </div>

          {/* TAB 1: PvE BOT DIFFICULTY */}
          {battleTab === 'bot' && (
            <div className="glass p-6 border-white/5 max-w-4xl mx-auto space-y-6">
              <div>
                <h3 className="text-xl font-black text-white">ระบบท้าทายหัวหน้าผู้ฝึกสอนบอท</h3>
                <p className="text-slate-400 text-xs mt-1">ไต่ระดับความท้าทายจากทีมสมัครเล่นขึ้นไปสู่ระดับไร้ขีดจำกัด ยิ่งระดับสูง ยิ่งได้เหรียญรางวัลเยอะ</p>
              </div>

              <div className="space-y-3">
                {BOT_DIFFICULTIES.map(diff => (
                  <div 
                    key={diff.id} 
                    className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border transition-all hover:bg-slate-900/60 ${diff.color}`}
                  >
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{diff.name}</h4>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                        โค้ชผู้จัดการ: {diff.manager} • พลัง {diff.ovr} OVR
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-3 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-lg">
                        <Coins size={14} className="text-amber-400 animate-spin-slow" />
                        <span className="text-xs font-black text-amber-300">+{diff.reward}</span>
                      </div>

                      <button
                        onClick={() => startBotChallenge(diff.id)}
                        className="btn btn-primary px-5 py-2 rounded-lg text-xs font-bold"
                      >
                        <Play size={12} className="fill-black" />
                        <span>ลงสนามท้าสู้</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PVP MATCHMAKER */}
          {battleTab === 'matchmaker' && (
            <div className="glass p-8 border-white/5 max-w-2xl mx-auto text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full" />
              
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2 animate-pulse">
                <Swords size={28} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">จับคู่ด่วนระบบออนไลน์ (Quick PvP matchmaking)</h3>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed max-w-sm mx-auto">
                  ระบบเรดาร์จะค้นหาผู้เล่นจริงในระบบที่มีจัดผังการ์ด 11 ตัวจริงไว้ เพื่อดึงข้อมูลสโมสรและ OVR เข้าหวดแข่งขันกัน
                </p>
              </div>

              <button
                onClick={startMatchmaking}
                className="btn btn-primary px-8 py-3.5 rounded-xl font-black text-sm shadow-xl shadow-emerald-500/10 flex items-center gap-2 mx-auto"
              >
                <Compass size={16} className="animate-spin-slow" />
                <span>เปิดเรดาร์สแกนหาคู่ต่อสู้</span>
              </button>

              <div className="flex justify-center gap-6 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>ค่าห้องรางวัลชนะ: +350 เหรียญ</span>
                <span>•</span>
                <span>OVR ยืดหยุ่นทักษะความเท่าเทียม</span>
              </div>
            </div>
          )}

          {/* TAB 3: 1V1 CUSTOM WAGER LOBBY */}
          {battleTab === 'custom' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
              
              {/* Left Form: Host Room */}
              <div className="lg:col-span-1 glass p-6 border-white/5">
                <h3 className="text-lg font-black text-white mb-4 border-b border-slate-900 pb-3 flex items-center gap-1.5">
                  <Plus size={18} className="text-emerald-400" />
                  เปิดห้องท้าดวล 1-1 ใหม่
                </h3>

                {activeRoomId && customRooms.some(r => r.id === activeRoomId && r.creator === currentUser.username) ? (
                  // Created room waiting state
                  <div className="text-center py-8 space-y-4">
                    <div className="relative w-20 h-20 mx-auto">
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
                      <Compass size={24} className="text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">กำลังรอผู้เล่นเข้าร่วม...</h4>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
                        เปิดห้องเดิมพันไว้แล้ว เมื่อมีผู้อื่นเข้ามากดเล่น ระบบจะเด้งไปหน้าแข่งอัตโนมัติ
                      </p>
                    </div>
                    <button
                      onClick={handleCancelRoom}
                      className="btn btn-danger w-full py-2.5 rounded-xl font-bold text-xs"
                    >
                      ยกเลิก & รับเงินคืน
                    </button>
                  </div>
                ) : (
                  // Form
                  <form onSubmit={handleHostRoom} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ชื่อห้องแข่งขัน</label>
                      <input
                        type="text"
                        placeholder="เช่น ห้องดวลเดือดลุงพล"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">เหรียญทองเดิมพัน (Wager)</label>
                      <select
                        value={wagerAmount}
                        onChange={(e) => setWagerAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-extrabold cursor-pointer"
                      >
                        <option value="50">50 เหรียญทอง</option>
                        <option value="100">100 เหรียญทอง</option>
                        <option value="500">500 เหรียญทอง</option>
                        <option value="1000">1,000 เหรียญทอง</option>
                        <option value="5000">5,000 เหรียญทอง</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full btn btn-primary py-3 rounded-xl font-black text-xs uppercase"
                    >
                      สร้างตู้ท้าดวล 1-1
                    </button>
                  </form>
                )}
              </div>

              {/* Right List: Waiting rooms */}
              <div className="lg:col-span-2 glass p-6 border-white/5 flex flex-col min-h-[350px]">
                <h3 className="text-lg font-black text-white mb-4 border-b border-slate-900 pb-3 flex justify-between items-center">
                  <span>ห้องแข่งขันที่รอคู่แข่งอยู่ขณะนี้ ({customRooms.filter(r => r.status === 'waiting').length} ห้อง)</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Realtime Lobby</span>
                </h3>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 max-h-[320px]">
                  {customRooms.filter(r => r.status === 'waiting').length > 0 ? (
                    customRooms
                      .filter(r => r.status === 'waiting')
                      .map(room => {
                        const isOwnRoom = room.creator === currentUser.username;
                        return (
                          <div 
                            key={room.id}
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-950/40 border border-slate-900 rounded-xl hover:border-slate-800 transition-colors"
                          >
                            <div className="space-y-1">
                              <h4 className="font-extrabold text-white text-sm">{room.name}</h4>
                              <span className="text-[10px] text-slate-500 font-semibold block">
                                เจ้าบ้าน: {room.creator} • พลัง {room.creatorOvr} OVR
                              </span>
                            </div>

                            <div className="flex items-center gap-4 mt-3 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 px-3 py-1 rounded-xl">
                                <Coins size={13} className="text-amber-400 animate-pulse" />
                                <span className="text-xs font-black text-amber-305">{room.wager.toLocaleString()}</span>
                              </div>

                              {isOwnRoom ? (
                                <button
                                  onClick={handleCancelRoom}
                                  className="btn btn-danger px-3 py-1.5 rounded-lg text-[10px] font-bold"
                                >
                                  ปิดห้อง
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleJoinRoom(room)}
                                  className="btn btn-gold px-4 py-1.5 rounded-lg text-[10px] font-black"
                                >
                                  เข้าร่วมดวลเดือด
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-sm text-slate-550 font-medium">ยังไม่มีห้องรอท้าทายขณะนี้</p>
                      <p className="text-xs text-slate-600 mt-1">กดเปิดสร้างห้องท้าสู้คนอื่นด้านซ้ายได้เลย!</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* MATCHMAKING RADAR SCREEN */}
      {matchState === 'matchmaking' && (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Cyber radar glow lines */}
          <div className="absolute w-[450px] h-[450px] rounded-full border border-emerald-500/10 animate-ping pointer-events-none" />
          <div className="absolute w-[220px] h-[220px] rounded-full border border-emerald-400/20 animate-spin pointer-events-none" />

          <div className="relative mb-8 z-10">
            <div className="w-24 h-24 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
            <Swords size={24} className="text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          
          <h3 className="text-2xl font-black text-white animate-pulse z-10">กำลังเปิดเครื่องตรวจจับสัญญาณคู่แข่ง...</h3>
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mt-2 z-10">
            เรดาร์สแกน OVR {playerOvr} ที่สูสีในระบบ
          </p>
          <p className="text-slate-500 text-[10px] mt-4 z-10 max-w-xs leading-relaxed">
            ระบบกำลังตรวจสอบลีคคลังผู้เล่นจริง หากยังไม่มีผู้ใดออนไลน์พร้อมกัน ระบบจะเรียก AI ของบอทจำลองมาต่อสู้ดวลพลังทันที
          </p>
        </div>
      )}

      {/* MATCH SIMULATION PLAYING SCREEN */}
      {(matchState === 'simulating' || matchState === 'finished') && opponent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left panel: scoreboard & simulator ticks */}
          <div className="lg:col-span-2 glass p-5 border-white/5 space-y-4 flex flex-col h-[460px]">
            
            {/* SCOREBOARD COMPONENT */}
            <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-900 relative shrink-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-slate-800 rounded-full px-2.5 py-0.5 font-bold text-white text-[10px] z-10">
                {minute}'
              </div>

              {/* Player side */}
              <div className="text-center flex-1 min-w-0">
                <h4 className="text-sm font-black text-white truncate whitespace-nowrap">{currentUser.username}</h4>
                <div className="flex justify-center gap-1.5 mt-1">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase">OVR {playerOvr}</span>
                  {redCards.player > 0 && (
                    <span className="bg-rose-600 text-white font-bold text-[7px] px-1 rounded">RED {redCards.player}</span>
                  )}
                </div>
              </div>

              {/* Score numbers */}
              <div className="flex items-center gap-3 text-2xl font-black text-white px-4 font-heading tabular-nums shrink-0">
                <span className="w-6 text-center">{playerScore}</span>
                <span className="text-slate-800 font-bold text-sm">-</span>
                <span className="w-6 text-center">{opponentScore}</span>
              </div>

              {/* Opponent side */}
              <div className="text-center flex-1 min-w-0">
                <h4 className="text-sm font-black text-slate-300 truncate whitespace-nowrap">{opponent.name}</h4>
                <div className="flex justify-center gap-1.5 mt-1">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase">OVR {opponent.ovr}</span>
                  {redCards.opponent > 0 && (
                    <span className="bg-rose-600 text-white font-bold text-[7px] px-1 rounded">RED {redCards.opponent}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Simulating speed buttons */}
            {matchState === 'simulating' && (
              <div className="flex justify-between items-center gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900 shrink-0">
                <div className="flex items-center gap-1.5">
                  {/* Speed select */}
                  {[{ s: 1, label: '1x' }, { s: 2, label: '2x' }, { s: 5, label: '5x' }].map(item => (
                    <button
                      key={item.s}
                      onClick={() => setSpeed(item.s)}
                      className={`text-[9px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                        speed === item.s 
                          ? 'bg-slate-800 text-emerald-400 font-black border border-slate-700' 
                          : 'text-slate-500 hover:text-slate-350'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleInstantSkip}
                  className="btn btn-gold py-1 px-3 rounded-lg text-[10px] font-black"
                >
                  ข้ามด่วน
                </button>
              </div>
            )}

            {/* Match events commentary logger list */}
            <div className="flex-grow bg-slate-950 p-4 rounded-xl border border-slate-900/80 overflow-y-auto space-y-2.5 pr-2">
              {events.map((ev, index) => {
                const isGoal = ev.type === 'goal';
                const isCard = ev.type === 'red_card' || ev.type === 'yellow_card';
                const isInjury = ev.type === 'injury';

                return (
                  <div 
                    key={index}
                    className={`flex gap-2.5 items-start p-2.5 rounded-lg border animate-scale-in ${
                      isGoal ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' :
                      isCard ? 'bg-rose-500/10 border-rose-500/25 text-rose-400' :
                      isInjury ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' :
                      'bg-slate-900/30 border-slate-900 text-slate-350'
                    }`}
                  >
                    <span className="font-extrabold text-[9px] bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800 leading-none">
                      {ev.min}'
                    </span>
                    <p className="text-[11px] font-medium leading-relaxed">{ev.text}</p>
                  </div>
                );
              })}
              <div ref={eventsEndRef} />
            </div>

          </div>

          {/* Right panel: lineups comparative display */}
          <div className="lg:col-span-1 glass p-5 border-white/5 flex flex-col h-[460px]">
            <h3 className="text-xs font-heading font-black text-white mb-3 text-center border-b border-slate-900 pb-2 shrink-0">
              รายชื่อตัวจริงดวลพลัง
            </h3>
            
            <div className="grid grid-cols-2 gap-4 flex-grow overflow-hidden">
              
              {/* Player lineup */}
              <div className="flex flex-col h-full min-w-0">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-2 text-center block bg-emerald-500/5 border border-emerald-550/20 py-0.5 rounded">
                  {currentUser.username} ({playerOvr})
                </span>
                <div className="flex-grow overflow-y-auto space-y-1.5 pr-1 hover:pr-0 select-none">
                  {playerLineup.map(card => (
                    <div key={card.instanceId} className="flex justify-between items-center p-1.5 bg-slate-950/40 border border-slate-900 rounded-lg text-[10px]">
                      <span className="font-semibold text-white truncate max-w-[65px]">{card.name}</span>
                      <span className="font-heading font-bold text-emerald-450 shrink-0">
                        {card.rating} {card.position}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opponent lineup */}
              <div className="flex flex-col h-full min-w-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center block bg-slate-800/10 border border-slate-700/20 py-0.5 rounded">
                  {opponent.name} ({opponent.ovr})
                </span>
                <div className="flex-grow overflow-y-auto space-y-1.5 pr-1 hover:pr-0 select-none">
                  {opponent.cards?.map((card, idx) => (
                    <div key={idx} className="flex justify-between items-center p-1.5 bg-slate-950/40 border border-slate-900 rounded-lg text-[10px]">
                      <span className="font-bold text-slate-355 truncate max-w-[65px]">{card.name}</span>
                      <span className="font-heading font-medium text-slate-450 shrink-0">
                        {card.rating} {card.position}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* MATCH RESULTS CELEBRATION MODAL OVERLAY */}
      {matchState === 'finished' && opponent && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 backdrop-blur-lg select-none" style={{ zIndex: 100 }}>
          <div className="glass-premium max-w-md w-full p-6 sm:p-8 border border-white/10 text-center relative overflow-hidden animate-scale-in shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Accent border glow */}
            <div className="absolute top-0 left-0 right-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
            
            <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Trophy size={32} className={playerScore > opponentScore ? 'text-amber-400 animate-bounce' : 'text-slate-500 animate-pulse'} />
            </div>

            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">GFB MATCH COMPLETED</span>
            
            <h3 className="text-2xl font-black text-white mt-1 leading-none uppercase tracking-wide">
              {playerScore > opponentScore ? 'ชัยชนะอันยิ่งใหญ่!' : playerScore === opponentScore ? 'ผลเสมอสูสี!' : 'ความพ่ายแพ้!'}
            </h3>

            {/* Score box */}
            <div className="flex items-center justify-center gap-6 text-3xl font-black text-white my-5 bg-slate-950 py-3 rounded-2xl border border-slate-900 max-w-[200px] mx-auto">
              <span>{playerScore}</span>
              <span className="text-slate-800 font-bold">-</span>
              <span>{opponentScore}</span>
            </div>

            {/* PLAYER OF THE MATCH (POTM) */}
            {potmCard && (
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-900/60 flex items-center gap-4 text-left max-w-sm mx-auto mb-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-black text-[7px] font-black px-2 py-0.5 rounded-bl uppercase flex items-center gap-0.5">
                  <Award size={8} />
                  <span>POTM</span>
                </div>
                <div className="shrink-0">
                  <Card card={potmCard.card} size="small" showStats={false} />
                </div>
                <div>
                  <span className="text-[8px] text-amber-400 font-bold tracking-widest uppercase block leading-none">ผู้เล่นยอดเยี่ยมประจำแมตช์</span>
                  <h4 className="text-sm font-black text-white mt-1 leading-tight truncate max-w-[170px]">
                    {potmCard.card.name}
                  </h4>
                  <span className="text-[9px] text-slate-500 block uppercase font-semibold mt-1">
                    OVR {potmCard.card.rating} • {potmCard.card.position}
                  </span>
                  <p className="text-[10px] text-emerald-400 font-bold mt-2">
                    {potmCard.goals > 0 ? `ทำประตูได้ ${potmCard.goals} ลูกในนัดนี้` : 'ผลงานสกัดป้องกันยอดเยี่ยม'}
                  </p>
                </div>
              </div>
            )}

            {/* DETAILED STATS COMPARISON PROGRESS BARS */}
            {matchStats && (
              <div className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-900/80 text-[10px] mb-6 text-left max-w-sm mx-auto">
                <span className="text-[8px] font-bold text-slate-500 block uppercase tracking-wider border-b border-slate-900 pb-1.5 text-center">สถิติวิเคราะห์หลังเกมอย่างละเอียด</span>
                
                {/* 1. Possession */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-400 text-[9px]">
                    <span>{matchStats.possession[0]}% ครองบอล</span>
                    <span>ครองบอล {matchStats.possession[1]}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${matchStats.possession[0]}%` }} />
                    <div className="bg-slate-700 h-full" style={{ width: `${matchStats.possession[1]}%` }} />
                  </div>
                </div>

                {/* 2. Total Shots */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-400 text-[9px]">
                    <span>ยิงทั้งหมด {matchStats.shots[0]} ครั้ง</span>
                    <span>ยิงทั้งหมด {matchStats.shots[1]} ครั้ง</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${(matchStats.shots[0] / (matchStats.shots[0] + matchStats.shots[1] || 1)) * 100}%` }} />
                    <div className="bg-slate-700 h-full" style={{ width: `${(matchStats.shots[1] / (matchStats.shots[0] + matchStats.shots[1] || 1)) * 100}%` }} />
                  </div>
                </div>

                {/* 3. Shots On Target */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-400 text-[9px]">
                    <span>ตรงกรอบ {matchStats.shotsOnTarget[0]} ครั้ง</span>
                    <span>ตรงกรอบ {matchStats.shotsOnTarget[1]} ครั้ง</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${(matchStats.shotsOnTarget[0] / (matchStats.shotsOnTarget[0] + matchStats.shotsOnTarget[1] || 1)) * 100}%` }} />
                    <div className="bg-slate-700 h-full" style={{ width: `${(matchStats.shotsOnTarget[1] / (matchStats.shotsOnTarget[0] + matchStats.shotsOnTarget[1] || 1)) * 100}%` }} />
                  </div>
                </div>

                {/* 4. Pass Accuracy */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-400 text-[9px]">
                    <span>ผ่านบอลแม่นยำ {matchStats.passAccuracy[0]}%</span>
                    <span>ผ่านบอลแม่นยำ {matchStats.passAccuracy[1]}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${matchStats.passAccuracy[0]}%` }} />
                    <div className="bg-slate-700 h-full" style={{ width: `${matchStats.passAccuracy[1]}%` }} />
                  </div>
                </div>

                {/* 5. Fouls */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-400 text-[9px]">
                    <span>ฟาวล์ {matchStats.fouls[0]} ครั้ง</span>
                    <span>ฟาวล์ {matchStats.fouls[1]} ครั้ง</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${(matchStats.fouls[0] / (matchStats.fouls[0] + matchStats.fouls[1] || 1)) * 100}%` }} />
                    <div className="bg-slate-700 h-full" style={{ width: `${(matchStats.fouls[1] / (matchStats.fouls[0] + matchStats.fouls[1] || 1)) * 100}%` }} />
                  </div>
                </div>

              </div>
            )}

            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">
              คู่แข่ง: {opponent.name} ({opponent.manager})
            </p>

            {/* Gold reward display */}
            <div className="flex items-center justify-center gap-2 mt-5 mb-6 bg-amber-500/10 border border-amber-500/25 py-2.5 rounded-xl max-w-xs mx-auto animate-pulse">
              <Coins size={18} className="text-amber-400" />
              <div className="text-left">
                <span className="text-[8px] font-bold text-slate-500 block uppercase leading-none mb-0.5">เหรียญทองที่คุณได้รับ</span>
                <span className="text-lg font-black text-amber-300">+{earnedCoins.toLocaleString()} เหรียญ</span>
              </div>
            </div>

            <button
              onClick={resetBattle}
              className="w-full btn btn-primary py-3.5 rounded-xl font-black text-xs uppercase"
            >
              กลับสู่เมนูล็อบบี้สนาม
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
