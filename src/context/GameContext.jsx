import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_CARDS } from '../data/initialCards';
import { db, isConfigured } from '../firebase';
import { 
  collection, doc, setDoc, getDoc, deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

// 4-second timeout wrapper to prevent Firestore connection hangs
const withTimeout = (promise, timeoutMs = 4000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Firebase Timeout"));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

export const GameProvider = ({ children }) => {
  const [firebaseActive, setFirebaseActive] = useState(isConfigured);

  // --- BASE STATES ---
  const [cardsDB, setCardsDB] = useState(() => {
    if (isConfigured && db) return INITIAL_CARDS;
    const saved = localStorage.getItem('gfb_cards_db_v4');
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  });

  const [users, setUsers] = useState(() => {
    if (isConfigured && db) return [];
    const saved = localStorage.getItem('gfb_users_v4');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.some(u => u.username === 'admin')) {
        parsed.push({
          username: 'admin',
          password: 'admin123',
          coins: 999999,
          role: 'admin',
          cards: [],
          squad: {},
          formation: '4-4-2',
          matchHistory: []
        });
        localStorage.setItem('gfb_users_v4', JSON.stringify(parsed));
      }
      return parsed;
    }
    const defaultAdmin = {
      username: 'admin',
      password: 'admin123',
      coins: 999999,
      role: 'admin',
      cards: [],
      squad: {},
      formation: '4-4-2',
      matchHistory: []
    };
    const initial = [defaultAdmin];
    localStorage.setItem('gfb_users_v4', JSON.stringify(initial));
    return initial;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('gfb_current_user_v4');
    return saved ? JSON.parse(saved) : null;
  });

  const [packSettings, setPackSettings] = useState(() => {
    if (isConfigured && db) return [];
    const saved = localStorage.getItem('gfb_packs_v4');
    return saved ? JSON.parse(saved) : [
      { id: 'starter_pack', name: 'Starter Arena Pack', price: 150, count: 4, rates: { common: 75, rare: 20, epic: 5, legendary: 0, icon: 0 } },
      { id: 'gold_pack', name: 'Gold Arena Pack', price: 450, count: 5, rates: { common: 40, rare: 45, epic: 12, legendary: 3, icon: 0 } },
      { id: 'legendary_pack', name: 'Legendary Flame Pack', price: 1200, count: 5, rates: { common: 15, rare: 35, epic: 35, legendary: 13, icon: 2 } },
      { id: 'icon_pack', name: 'Historic Icon Pack', price: 3500, count: 3, rates: { common: 0, rare: 10, epic: 20, legendary: 45, icon: 25 } }
    ];
  });

  const [matchLogs, setMatchLogs] = useState(() => {
    if (isConfigured && db) return [];
    const saved = localStorage.getItem('gfb_match_logs_v4');
    return saved ? JSON.parse(saved) : [];
  });

  const [customRooms, setCustomRooms] = useState(() => {
    if (isConfigured && db) return [];
    const saved = localStorage.getItem('gfb_custom_rooms_v4');
    return saved ? JSON.parse(saved) : [];
  });

  // --- FIREBASE REAL-TIME CLOUD LISTENERS ---
  useEffect(() => {
    if (!isConfigured || !db || !firebaseActive) return;

    // 1. Sync cards database and seed if empty
    const unsubCards = onSnapshot(
      collection(db, 'cards_db'), 
      (snapshot) => {
        const list = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (list.length > 0) {
          setCardsDB(list);
        } else {
          INITIAL_CARDS.forEach(async (c) => {
            try {
              await setDoc(doc(db, 'cards_db', c.id), c);
            } catch (e) {
              console.warn("Seeding card failed", e);
            }
          });
        }
      },
      (err) => {
        console.error("Firebase cards_db sync error (Check Firestore Rules):", err);
        setFirebaseActive(false);
      }
    );

    // 2. Sync global users database
    const unsubUsers = onSnapshot(
      collection(db, 'users'), 
      (snapshot) => {
        const list = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data());
        });
        
        if (!list.some(u => u.username === 'admin')) {
          const defaultAdmin = {
            username: 'admin',
            password: 'admin123',
            coins: 999999,
            role: 'admin',
            cards: [],
            squad: {},
            formation: '4-4-2',
            matchHistory: []
          };
          try {
            setDoc(doc(db, 'users', 'admin'), defaultAdmin);
          } catch (e) {
            console.warn("Seeding admin failed", e);
          }
          list.push(defaultAdmin);
        }

        setUsers(list);

        const savedSession = localStorage.getItem('gfb_current_user_v4');
        if (savedSession) {
          const parsedSession = JSON.parse(savedSession);
          const freshUser = list.find(u => u.username.toLowerCase() === parsedSession.username.toLowerCase());
          if (freshUser) {
            setCurrentUser(freshUser);
            localStorage.setItem('gfb_current_user_v4', JSON.stringify(freshUser));
          }
        }
      },
      (err) => {
        console.error("Firebase users sync error (Check Firestore Rules):", err);
        setFirebaseActive(false);
      }
    );

    // 3. Sync global pack settings and seed if empty
    const unsubPacks = onSnapshot(
      collection(db, 'pack_settings'), 
      (snapshot) => {
        const list = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (list.length > 0) {
          setPackSettings(list);
        } else {
          const defaultPacks = [
            { id: 'starter_pack', name: 'Starter Arena Pack', price: 150, count: 4, rates: { common: 75, rare: 20, epic: 5, legendary: 0, icon: 0 } },
            { id: 'gold_pack', name: 'Gold Arena Pack', price: 450, count: 5, rates: { common: 40, rare: 45, epic: 12, legendary: 3, icon: 0 } },
            { id: 'legendary_pack', name: 'Legendary Flame Pack', price: 1200, count: 5, rates: { common: 15, rare: 35, epic: 35, legendary: 13, icon: 2 } },
            { id: 'icon_pack', name: 'Historic Icon Pack', price: 3500, count: 3, rates: { common: 0, rare: 10, epic: 20, legendary: 45, icon: 25 } }
          ];
          defaultPacks.forEach(async (p) => {
            try {
              await setDoc(doc(db, 'pack_settings', p.id), p);
            } catch (e) {
              console.warn("Seeding packs failed", e);
            }
          });
        }
      },
      (err) => {
        console.error("Firebase pack_settings sync error (Check Firestore Rules):", err);
        setFirebaseActive(false);
      }
    );

    // 4. Sync global match logs
    const unsubLogs = onSnapshot(
      collection(db, 'match_logs'), 
      (snapshot) => {
        const list = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setMatchLogs(list.slice(0, 100));
      },
      (err) => {
        console.error("Firebase match_logs sync error (Check Firestore Rules):", err);
        setFirebaseActive(false);
      }
    );

    // 5. Sync custom friendly wager rooms
    const unsubRooms = onSnapshot(
      collection(db, 'custom_rooms'), 
      (snapshot) => {
        const list = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setCustomRooms(list);
      },
      (err) => {
        console.error("Firebase custom_rooms sync error (Check Firestore Rules):", err);
        setFirebaseActive(false);
      }
    );

    return () => {
      unsubCards();
      unsubUsers();
      unsubPacks();
      unsubLogs();
      unsubRooms();
    };
  }, [firebaseActive]);

  // --- LOCALSTORAGE TABS SYNCHRONIZER (Fallback Mode) ---
  useEffect(() => {
    if (isConfigured && db && firebaseActive) return;

    const handleStorageSync = (e) => {
      try {
        if (e.key === 'gfb_cards_db_v4' && e.newValue) {
          setCardsDB(JSON.parse(e.newValue));
        }
        if (e.key === 'gfb_users_v4' && e.newValue) {
          const updatedUsersList = JSON.parse(e.newValue);
          setUsers(updatedUsersList);
          
          setCurrentUser(prevCurrentUser => {
            if (!prevCurrentUser) return null;
            const freshUser = updatedUsersList.find(u => u.username === prevCurrentUser.username);
            return freshUser || prevCurrentUser;
          });
        }
        if (e.key === 'gfb_packs_v4' && e.newValue) {
          setPackSettings(JSON.parse(e.newValue));
        }
        if (e.key === 'gfb_match_logs_v4' && e.newValue) {
          setMatchLogs(JSON.parse(e.newValue));
        }
        if (e.key === 'gfb_custom_rooms_v4' && e.newValue) {
          setCustomRooms(JSON.parse(e.newValue));
        }
      } catch (err) {
        console.warn('Storage sync failed', err);
      }
    };

    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, [firebaseActive]);

  // --- HELPERS TO SAVE ---
  const saveUsers = (updatedUsers) => {
    setUsers(updatedUsers);
    localStorage.setItem('gfb_users_v4', JSON.stringify(updatedUsers));
  };

  const saveCardsDB = (updatedCards) => {
    setCardsDB(updatedCards);
    localStorage.setItem('gfb_cards_db_v4', JSON.stringify(updatedCards));
  };

  const savePackSettings = (updatedPacks) => {
    setPackSettings(updatedPacks);
    localStorage.setItem('gfb_packs_v4', JSON.stringify(updatedPacks));
  };

  const saveMatchLogs = (updatedLogs) => {
    setMatchLogs(updatedLogs);
    localStorage.setItem('gfb_match_logs_v4', JSON.stringify(updatedLogs));
  };

  const syncCurrentUser = async (user) => {
    setCurrentUser(user);
    localStorage.setItem('gfb_current_user_v4', JSON.stringify(user));
    
    if (isConfigured && db && firebaseActive) {
      try {
        await withTimeout(setDoc(doc(db, 'users', user.username.toLowerCase()), user, { merge: true }), 4000);
      } catch (err) {
        console.error("Firebase sync user failed, falling back to Local:", err);
        setFirebaseActive(false);
        // Keep in users list locally
        setUsersLocalSync(user);
      }
    } else {
      setUsersLocalSync(user);
    }
  };

  const setUsersLocalSync = (user) => {
    setUsers((prevUsers) => {
      const updated = prevUsers.map(u => u.username === user.username ? user : u);
      if (!updated.some(u => u.username === user.username)) {
        updated.push(user);
      }
      localStorage.setItem('gfb_users_v4', JSON.stringify(updated));
      return updated;
    });
  };

  const getSquadOvr = (user) => {
    if (!user.squad || Object.keys(user.squad).length === 0) return 0;
    const squadCards = Object.values(user.squad)
      .map(instId => user.cards.find(c => c.instanceId === instId))
      .filter(Boolean);
    if (squadCards.length === 0) return 0;
    const sum = squadCards.reduce((acc, c) => acc + c.rating, 0);
    return Math.round(sum / squadCards.length);
  };

  const generateUniqueId = (prefix = 'card') => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let rand = '';
    for (let i = 0; i < 8; i++) {
      rand += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return `${prefix}_${Date.now()}_${rand}`;
  };

  // --- GAME ACTIONS ---
  const login = async (username, password) => {
    const cleanUser = username.trim();
    if (!cleanUser) return { success: false, message: 'กรุณากรอกชื่อผู้ใช้' };

    if (isConfigured && db && firebaseActive) {
      try {
        const userDocRef = doc(db, 'users', cleanUser.toLowerCase());
        const userDoc = await withTimeout(getDoc(userDocRef), 4000);
        if (!userDoc.exists()) {
          return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
        }
        const userData = userDoc.data();
        if (userData.password !== password) {
          return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
        }
        await syncCurrentUser(userData);
        return { success: true };
      } catch (err) {
        console.error("Firebase login failed, falling back to Local:", err);
        setFirebaseActive(false);
        return loginLocalStorage(cleanUser, password);
      }
    } else {
      return loginLocalStorage(cleanUser, password);
    }
  };

  const loginLocalStorage = async (cleanUser, password) => {
    const saved = localStorage.getItem('gfb_users_v4');
    const activeUsersList = saved ? JSON.parse(saved) : users;

    const existing = activeUsersList.find(u => u.username.toLowerCase() === cleanUser.toLowerCase());
    if (!existing || existing.password !== password) {
      return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }

    await syncCurrentUser(existing);
    return { success: true };
  };

  const register = async (username, password) => {
    const cleanUser = username.trim();
    if (!cleanUser || password.length < 4) {
      return { success: false, message: 'ชื่อผู้ใช้ห้ามว่าง และรหัสผ่านต้องมี 4 ตัวอักษรขึ้นไป' };
    }

    if (isConfigured && db && firebaseActive) {
      try {
        const userDocRef = doc(db, 'users', cleanUser.toLowerCase());
        const userDoc = await withTimeout(getDoc(userDocRef), 4000);
        if (userDoc.exists()) {
          return { success: false, message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' };
        }

        const starterCards = cardsDB
          .filter(c => c.rarity === 'common')
          .slice(0, 11)
          .map((c) => ({
            ...c,
            instanceId: generateUniqueId('starter'),
            suspensionRemaining: 0,
            injuredUntil: null
          }));

        const starterSquad = {};
        starterCards.forEach((c, idx) => {
          starterSquad[`pos_${idx}`] = c.instanceId;
        });

        const newUser = {
          username: cleanUser,
          password,
          coins: 1000,
          role: cleanUser.toLowerCase() === 'admin' ? 'admin' : 'player',
          cards: starterCards,
          squad: starterSquad,
          formation: '4-4-2',
          matchHistory: []
        };

        await withTimeout(setDoc(userDocRef, newUser), 4000);
        await syncCurrentUser(newUser);
        return { success: true };
      } catch (err) {
        console.error("Firebase register failed, falling back to Local:", err);
        setFirebaseActive(false);
        return registerLocalStorage(cleanUser, password);
      }
    } else {
      return registerLocalStorage(cleanUser, password);
    }
  };

  const registerLocalStorage = async (cleanUser, password) => {
    const saved = localStorage.getItem('gfb_users_v4');
    const activeUsersList = saved ? JSON.parse(saved) : users;

    const existing = activeUsersList.some(u => u.username.toLowerCase() === cleanUser.toLowerCase());
    if (existing) {
      return { success: false, message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' };
    }

    const starterCards = cardsDB
      .filter(c => c.rarity === 'common')
      .slice(0, 11)
      .map((c) => ({
        ...c,
        instanceId: generateUniqueId('starter'),
        suspensionRemaining: 0,
        injuredUntil: null
      }));

    const starterSquad = {};
    starterCards.forEach((c, idx) => {
      starterSquad[`pos_${idx}`] = c.instanceId;
    });

    const newUser = {
      username: cleanUser,
      password,
      coins: 1000,
      role: cleanUser.toLowerCase() === 'admin' ? 'admin' : 'player',
      cards: starterCards,
      squad: starterSquad,
      formation: '4-4-2',
      matchHistory: []
    };

    await syncCurrentUser(newUser);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gfb_current_user_v4');
  };

  const updateSquad = (formation, squad) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      squad,
      formation
    };
    syncCurrentUser(updated);
  };

  const buyPack = (packId) => {
    if (!currentUser) return { success: false, message: 'ไม่พบบัญชีผู้ใช้' };

    const pack = packSettings.find(p => p.id === packId);
    if (!pack) return { success: false, message: 'ไม่พบแพ็กเกจนี้' };

    if (currentUser.coins < pack.price) {
      return { success: false, message: 'เหรียญทองของคุณมีไม่เพียงพอสำหรับการสุ่มซื้อตู้นี้' };
    }

    const rolledCards = [];
    const rollRarity = () => {
      const roll = Math.random() * 100;
      let cumulative = 0;

      const rates = pack.rates;
      cumulative += rates.common;
      if (roll <= cumulative) return 'common';
      cumulative += rates.rare;
      if (roll <= cumulative) return 'rare';
      cumulative += rates.epic;
      if (roll <= cumulative) return 'epic';
      cumulative += rates.legendary;
      if (roll <= cumulative) return 'legendary';
      return 'icon';
    };

    for (let i = 0; i < pack.count; i++) {
      const rarity = rollRarity();
      const pool = cardsDB.filter(c => c.rarity === rarity);
      const finalPool = pool.length > 0 ? pool : cardsDB;
      const randCard = finalPool[Math.floor(Math.random() * finalPool.length)];
      
      rolledCards.push({
        ...randCard,
        instanceId: generateUniqueId('gacha'),
        suspensionRemaining: 0,
        injuredUntil: null
      });
    }

    const updatedUser = {
      ...currentUser,
      coins: currentUser.coins - pack.price,
      cards: [...currentUser.cards, ...rolledCards]
    };

    syncCurrentUser(updatedUser);
    return { success: true, cards: rolledCards };
  };

  const sellCard = (instanceId) => {
    if (!currentUser) return { success: false };

    const inSquad = Object.values(currentUser.squad || {}).includes(instanceId);
    if (inSquad) {
      return { success: false, message: 'ไม่สามารถขายนักเตะตัวจริง 11 คนได้ ต้องถอดถอนออกจากสนามก่อน' };
    }

    const cardToSell = currentUser.cards.find(c => c.instanceId === instanceId);
    if (!cardToSell) return { success: false, message: 'ไม่พบการ์ดนี้ในบัญชีคลังของคุณ' };

    let payout = 20;
    if (cardToSell.rarity === 'icon') payout = 1000;
    else if (cardToSell.rarity === 'legendary') payout = 400;
    else if (cardToSell.rarity === 'epic') payout = 150;
    else if (cardToSell.rarity === 'rare') payout = 50;

    const updatedCards = currentUser.cards.filter(c => c.instanceId !== instanceId);
    const updatedUser = {
      ...currentUser,
      coins: currentUser.coins + payout,
      cards: updatedCards
    };

    syncCurrentUser(updatedUser);
    return { success: true };
  };

  const addCoins = (amount) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      coins: currentUser.coins + amount
    };
    syncCurrentUser(updated);
  };

  const logMatch = (log) => {
    const updatedLogs = [log, ...matchLogs].slice(0, 100);
    saveMatchLogs(updatedLogs);

    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        matchHistory: [log, ...(currentUser.matchHistory || [])].slice(0, 20)
      };
      syncCurrentUser(updatedUser);
    }
  };

  const handlePostMatchStatus = (suspendedIds, injuredIds) => {
    if (!currentUser) return;

    const updatedCards = currentUser.cards.map(card => {
      const updatedCard = { ...card };
      if (suspendedIds.includes(card.instanceId)) {
        updatedCard.suspensionRemaining = 2;
      } else if (updatedCard.suspensionRemaining > 0) {
        updatedCard.suspensionRemaining -= 1;
      }
      if (injuredIds.includes(card.instanceId)) {
        updatedCard.injuredUntil = Date.now() + 60 * 60 * 1000;
      }
      return updatedCard;
    });

    const updatedSquad = { ...currentUser.squad };
    Object.keys(updatedSquad).forEach(k => {
      const instId = updatedSquad[k];
      if (suspendedIds.includes(instId) || injuredIds.includes(instId)) {
        delete updatedSquad[k];
      }
    });

    const updatedUser = {
      ...currentUser,
      cards: updatedCards,
      squad: updatedSquad
    };

    syncCurrentUser(updatedUser);
  };

  // --- ATOMIC END-MATCH FINALIZATION ---
  const finalizeUserMatchData = async (earnings, log, suspendedIds, injuredIds) => {
    if (!currentUser) return;

    const newCoins = currentUser.coins + earnings;
    const newHistory = [log, ...(currentUser.matchHistory || [])].slice(0, 20);

    const updatedCards = currentUser.cards.map(card => {
      const updatedCard = { ...card };
      if (suspendedIds.includes(card.instanceId)) {
        updatedCard.suspensionRemaining = 2;
      } else if (updatedCard.suspensionRemaining > 0) {
        updatedCard.suspensionRemaining -= 1;
      }
      if (injuredIds.includes(card.instanceId)) {
        updatedCard.injuredUntil = Date.now() + 60 * 60 * 1000;
      }
      return updatedCard;
    });

    const updatedSquad = { ...currentUser.squad };
    Object.keys(updatedSquad).forEach(k => {
      const instId = updatedSquad[k];
      if (suspendedIds.includes(instId) || injuredIds.includes(instId)) {
        delete updatedSquad[k];
      }
    });

    const updatedUser = {
      ...currentUser,
      coins: newCoins,
      cards: updatedCards,
      squad: updatedSquad,
      matchHistory: newHistory
    };

    await syncCurrentUser(updatedUser);

    if (isConfigured && db && firebaseActive) {
      try {
        await withTimeout(setDoc(doc(db, 'match_logs', log.id), log), 4000);
      } catch (err) {
        console.error("Firebase log match failed", err);
      }
    } else {
      const updatedLogs = [log, ...matchLogs].slice(0, 100);
      saveMatchLogs(updatedLogs);
    }
  };

  // --- 1V1 CUSTOM ROOM ACTIONS ---
  const createRoom = async (name, wager) => {
    if (!currentUser) return { success: false, message: 'กรุณาเข้าสู่ระบบ' };
    if (currentUser.coins < wager) return { success: false, message: 'เหรียญทองของคุณไม่พอสำหรับวางเดิมพัน' };

    const newRoom = {
      id: `room_${Date.now()}`,
      name: name || `ห้องท้าดวลของ ${currentUser.username}`,
      creator: currentUser.username,
      creatorOvr: getSquadOvr(currentUser),
      creatorCards: Object.values(currentUser.squad || {})
        .map(instId => currentUser.cards.find(c => c.instanceId === instId))
        .filter(Boolean),
      wager: parseInt(wager) || 0,
      status: 'waiting',
      guest: null,
      guestOvr: null,
      guestCards: null
    };

    const updatedUser = { ...currentUser, coins: currentUser.coins - wager };
    await syncCurrentUser(updatedUser);

    if (isConfigured && db && firebaseActive) {
      try {
        await withTimeout(setDoc(doc(db, 'custom_rooms', newRoom.id), newRoom), 4000);
      } catch (err) {
        console.error("Firebase create room failed", err);
      }
    } else {
      const updatedRooms = [...customRooms, newRoom];
      setCustomRooms(updatedRooms);
      localStorage.setItem('gfb_custom_rooms_v4', JSON.stringify(updatedRooms));
    }

    return { success: true, room: newRoom };
  };

  const cancelRoom = async (roomId) => {
    const room = customRooms.find(r => r.id === roomId);
    if (!room) return { success: false, message: 'ไม่พบห้องนี้' };

    if (isConfigured && db && firebaseActive) {
      try {
        const creatorDocRef = doc(db, 'users', room.creator.toLowerCase());
        const creatorDoc = await getDoc(creatorDocRef);
        if (creatorDoc.exists()) {
          const creatorData = creatorDoc.data();
          const updatedCreator = {
            ...creatorData,
            coins: creatorData.coins + room.wager
          };
          await withTimeout(setDoc(creatorDocRef, updatedCreator), 4000);
          if (currentUser && currentUser.username.toLowerCase() === room.creator.toLowerCase()) {
            setCurrentUser(updatedCreator);
            localStorage.setItem('gfb_current_user_v4', JSON.stringify(updatedCreator));
          }
        }
        await deleteDoc(doc(db, 'custom_rooms', roomId));
      } catch (err) {
        console.error("Firebase cancel room failed", err);
      }
    } else {
      setUsers(prevUsers => {
        const updatedList = prevUsers.map(u => {
          if (u.username === room.creator) {
            const updatedUser = { ...u, coins: u.coins + room.wager };
            if (currentUser && currentUser.username === room.creator) {
              setCurrentUser(updatedUser);
              localStorage.setItem('gfb_current_user_v4', JSON.stringify(updatedUser));
            }
            return updatedUser;
          }
          return u;
        });
        localStorage.setItem('gfb_users_v4', JSON.stringify(updatedList));
        return updatedList;
      });

      const updatedRooms = customRooms.filter(r => r.id !== roomId);
      setCustomRooms(updatedRooms);
      localStorage.setItem('gfb_custom_rooms_v4', JSON.stringify(updatedRooms));
    }

    return { success: true };
  };

  const joinRoom = async (roomId) => {
    if (!currentUser) return { success: false, message: 'กรุณาเข้าสู่ระบบ' };

    const room = customRooms.find(r => r.id === roomId);
    if (!room || room.status !== 'waiting') {
      return { success: false, message: 'ไม่สามารถเข้าร่วมได้ ห้องถูกเล่น/ปิดแล้ว' };
    }

    if (currentUser.coins < room.wager) {
      return { success: false, message: 'เหรียญทองของคุณไม่พอเข้าร่วมดวล' };
    }

    const updatedUser = { ...currentUser, coins: currentUser.coins - room.wager };
    await syncCurrentUser(updatedUser);

    const guestOvr = getSquadOvr(currentUser);
    const guestCards = Object.values(currentUser.squad || {})
      .map(instId => currentUser.cards.find(c => c.instanceId === instId))
      .filter(Boolean);

    const joinedRoom = {
      ...room,
      status: 'playing',
      guest: currentUser.username,
      guestOvr,
      guestCards
    };

    if (isConfigured && db && firebaseActive) {
      try {
        await withTimeout(setDoc(doc(db, 'custom_rooms', roomId), joinedRoom), 4000);
      } catch (err) {
        console.error("Firebase join room failed", err);
      }
    } else {
      const updatedRooms = customRooms.map(r => r.id === roomId ? joinedRoom : r);
      setCustomRooms(updatedRooms);
      localStorage.setItem('gfb_custom_rooms_v4', JSON.stringify(updatedRooms));
    }

    return { success: true, room: joinedRoom };
  };

  const finalizeRoomMatch = async (roomId, winnerUsername) => {
    const room = customRooms.find(r => r.id === roomId);
    if (!room) return;

    if (winnerUsername) {
      if (isConfigured && db && firebaseActive) {
        try {
          const winnerDocRef = doc(db, 'users', winnerUsername.toLowerCase());
          const winnerDoc = await getDoc(winnerDocRef);
          if (winnerDoc.exists()) {
            const winnerData = winnerDoc.data();
            const updatedWinner = {
              ...winnerData,
              coins: winnerData.coins + (room.wager * 2)
            };
            await withTimeout(setDoc(winnerDocRef, updatedWinner), 4000);
            if (currentUser && currentUser.username.toLowerCase() === winnerUsername.toLowerCase()) {
              setCurrentUser(updatedWinner);
              localStorage.setItem('gfb_current_user_v4', JSON.stringify(updatedWinner));
            }
          }
          await deleteDoc(doc(db, 'custom_rooms', roomId));
        } catch (err) {
          console.error("Firebase finalize room failed", err);
        }
      } else {
        setUsers(prevUsers => {
          const updatedList = prevUsers.map(u => {
            if (u.username === winnerUsername) {
              const updatedUser = { ...u, coins: u.coins + (room.wager * 2) };
              if (currentUser && currentUser.username === winnerUsername) {
                setCurrentUser(updatedUser);
                localStorage.setItem('gfb_current_user_v4', JSON.stringify(updatedUser));
              }
              return updatedUser;
            }
            return u;
          });
          localStorage.setItem('gfb_users_v4', JSON.stringify(updatedList));
          return updatedList;
        });

        const updatedRooms = customRooms.filter(r => r.id !== roomId);
        setCustomRooms(updatedRooms);
        localStorage.setItem('gfb_custom_rooms_v4', JSON.stringify(updatedRooms));
      }
    }
  };

  // --- ADMIN ACTIONS ---
  const adminAddCardToDB = async (cardData) => {
    const newCard = {
      ...cardData,
      id: cardData.id || `custom_${Date.now()}`
    };

    if (isConfigured && db && firebaseActive) {
      try {
        await withTimeout(setDoc(doc(db, 'cards_db', newCard.id), newCard), 4000);
      } catch (err) {
        console.error(err);
      }
    } else {
      const updated = [...cardsDB, newCard];
      saveCardsDB(updated);
    }
    return { success: true, card: newCard };
  };

  const adminEditCardInDB = async (cardId, updatedData) => {
    if (isConfigured && db && firebaseActive) {
      try {
        await withTimeout(setDoc(doc(db, 'cards_db', cardId), updatedData, { merge: true }), 4000);
      } catch (err) {
        console.error(err);
      }
    } else {
      const updated = cardsDB.map(c => c.id === cardId ? { ...c, ...updatedData } : c);
      saveCardsDB(updated);
    }
    return { success: true };
  };

  const adminDeleteCardFromDB = async (cardId) => {
    if (isConfigured && db && firebaseActive) {
      try {
        await deleteDoc(doc(db, 'cards_db', cardId));
      } catch (err) {
        console.error(err);
      }
    } else {
      const updated = cardsDB.filter(c => c.id !== cardId);
      saveCardsDB(updated);
    }
    return { success: true };
  };

  const adminAddCardToUser = async (username, cardId) => {
    const baseCard = cardsDB.find(c => c.id === cardId);
    if (!baseCard) return { success: false, message: 'ไม่พบการ์ดนี้ในระบบ' };

    const newInstance = {
      ...baseCard,
      instanceId: generateUniqueId('admin'),
      suspensionRemaining: 0,
      injuredUntil: null
    };

    if (isConfigured && db && firebaseActive) {
      try {
        const targetDocRef = doc(db, 'users', username.toLowerCase());
        const targetDoc = await getDoc(targetDocRef);
        if (targetDoc.exists()) {
          const uData = targetDoc.data();
          const updatedUser = {
            ...uData,
            cards: [...uData.cards, newInstance]
          };
          await withTimeout(setDoc(targetDocRef, updatedUser), 4500);
          if (currentUser && currentUser.username.toLowerCase() === username.toLowerCase()) {
            setCurrentUser(updatedUser);
            localStorage.setItem('gfb_current_user_v4', JSON.stringify(updatedUser));
          }
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setUsers(prevUsers => {
        const updatedList = prevUsers.map(u => {
          if (u.username === username) {
            const updatedUser = {
              ...u,
              cards: [...u.cards, newInstance]
            };
            if (currentUser && currentUser.username === username) {
              setCurrentUser(updatedUser);
              localStorage.setItem('gfb_current_user_v4', JSON.stringify(updatedUser));
            }
            return updatedUser;
          }
          return u;
        });
        localStorage.setItem('gfb_users_v4', JSON.stringify(updatedList));
        return updatedList;
      });
    }

    return { success: true, message: `ส่งการ์ด ${baseCard.name} ให้กับ ${username} เรียบร้อยแล้ว` };
  };

  const adminModifyUserCoins = async (username, amount) => {
    let success = false;
    let message = 'ไม่พบผู้ใช้นี้';
    let newCoinsVal = 0;

    if (isConfigured && db && firebaseActive) {
      try {
        const targetDocRef = doc(db, 'users', username.toLowerCase());
        const targetDoc = await getDoc(targetDocRef);
        if (targetDoc.exists()) {
          success = true;
          const uData = targetDoc.data();
          newCoinsVal = Math.max(0, uData.coins + amount);
          const updatedUser = {
            ...uData,
            coins: newCoinsVal
          };
          await withTimeout(setDoc(targetDocRef, updatedUser), 4000);
          if (currentUser && currentUser.username.toLowerCase() === username.toLowerCase()) {
            setCurrentUser(updatedUser);
            localStorage.setItem('gfb_current_user_v4', JSON.stringify(updatedUser));
          }
          message = `อัปเดตเหรียญของ ${username} เป็น ${newCoinsVal} เรียบร้อยแล้ว`;
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setUsers(prevUsers => {
        const exists = prevUsers.some(u => u.username === username);
        if (!exists) return prevUsers;

        success = true;
        const updatedList = prevUsers.map(u => {
          if (u.username === username) {
            newCoinsVal = Math.max(0, u.coins + amount);
            const updatedUser = {
              ...u,
              coins: newCoinsVal
            };
            if (currentUser && currentUser.username === username) {
              setCurrentUser(updatedUser);
              localStorage.setItem('gfb_current_user_v4', JSON.stringify(updatedUser));
            }
            return updatedUser;
          }
          return u;
        });
        message = `อัปเดตเหรียญของ ${username} เป็น ${newCoinsVal} เรียบร้อยแล้ว`;
        localStorage.setItem('gfb_users_v4', JSON.stringify(updatedList));
        return updatedList;
      });
    }

    return { success, message };
  };

  const adminDeleteUser = async (username) => {
    if (username === 'admin') return { success: false, message: 'ไม่สามารถลบบัญชีผู้ดูแลระบบหลักได้' };
    
    let success = false;

    if (isConfigured && db && firebaseActive) {
      try {
        const targetDocRef = doc(db, 'users', username.toLowerCase());
        const targetDoc = await getDoc(targetDocRef);
        if (targetDoc.exists()) {
          success = true;
          await deleteDoc(targetDocRef);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setUsers(prevUsers => {
        const exists = prevUsers.some(u => u.username === username);
        if (!exists) return prevUsers;

        success = true;
        const updatedList = prevUsers.filter(u => u.username !== username);
        localStorage.setItem('gfb_users_v4', JSON.stringify(updatedList));
        return updatedList;
      });
    }

    if (success) {
      if (currentUser && currentUser.username === username) {
        logout();
      }
      return { success: true, message: `ลบบัญชีผู้ใช้ ${username} สำเร็จ` };
    }
    return { success: false, message: 'ไม่พบผู้ใช้นี้' };
  };

  const adminModifyPackSettings = async (updatedPacks) => {
    if (isConfigured && db && firebaseActive) {
      try {
        updatedPacks.forEach(async (p) => {
          await withTimeout(setDoc(doc(db, 'pack_settings', p.id), p, { merge: true }), 4000);
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      savePackSettings(updatedPacks);
    }
    return { success: true };
  };

  return (
    <GameContext.Provider value={{
      cardsDB,
      users,
      currentUser,
      matchLogs,
      packSettings,
      customRooms,
      firebaseActive,
      login,
      register,
      logout,
      updateSquad,
      buyPack,
      sellCard,
      addCoins,
      logMatch,
      handlePostMatchStatus,
      finalizeUserMatchData,
      createRoom,
      cancelRoom,
      joinRoom,
      finalizeRoomMatch,
      adminAddCardToDB,
      adminEditCardInDB,
      adminDeleteCardFromDB,
      adminAddCardToUser,
      adminModifyUserCoins,
      adminDeleteUser,
      adminModifyPackSettings
    }}>
      {children}
    </GameContext.Provider>
  );
};
