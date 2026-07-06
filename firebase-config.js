// Firebase Config and Auth/Firestore Abstraction Layer
// Supports real Firebase online mode and local Mock offline mode fallback.
import { getStartingThaiSquad } from './game-engine.js';

// ==========================================
// 🔑 FIREBASE WEB SDK CONFIGURATION
// ==========================================
// Paste your Firebase Config credentials object here.
// Leaving it empty or with empty strings will automatically fallback to Offline Mock Mode.
const firebaseConfig = {
  apiKey: "AIzaSyByN88MeX2yk64jHZt_D5wixNm-GXBKSwM",
  authDomain: "gfb-card-online-1.firebaseapp.com",
  projectId: "gfb-card-online-1",
  storageBucket: "gfb-card-online-1.firebasestorage.app",
  messagingSenderId: "209007009808",
  appId: "1:209007009808:web:671799f765b529d4586a95"
};

let app = null;
let auth = null;
let db = null;
let isOnline = false;

// Firebase ESM CDN imports
const firebaseAppUrl = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
const firebaseAuthUrl = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
const firebaseFirestoreUrl = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Import helpers dynamically or keep modular. Since we are in standard ESM,
// we can do dynamic imports to avoid errors if the client is offline/unable to load CDNs.

let firebaseSDK = {};

async function initFirebase() {
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    console.log("No Firebase config hardcoded in script. Running in OFFLINE mode.");
    return false;
  }
  try {
    const config = firebaseConfig;
    // Dynamically import Firebase libraries
    const { initializeApp } = await import(/* @vite-ignore */ firebaseAppUrl);
    const { 
      getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword
    } = await import(/* @vite-ignore */ firebaseAuthUrl);
    const { 
      getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs, limit
    } = await import(/* @vite-ignore */ firebaseFirestoreUrl);

    app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);

    firebaseSDK = {
      signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword,
      doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs, limit
    };

    isOnline = true;
    console.log("Firebase initialized successfully. Running in ONLINE mode.");
    return true;
  } catch (err) {
    console.error("Failed to initialize Firebase online. Falling back to OFFLINE mode.", err);
    isOnline = false;
    return false;
  }
}

// Call initialization and export the promise to be awaited in main application bootstrap
export const initPromise = initFirebase();

export function isFirebaseOnline() {
  return isOnline;
}

// --- OFFLINE / MOCK SIMULATORS ---
// Stores offline data in localStorage
const MOCK_DB = {
  getUsers: () => JSON.parse(localStorage.getItem('offline_users') || '[]'),
  saveUsers: (users) => localStorage.setItem('offline_users', JSON.stringify(users)),
  getMatches: () => JSON.parse(localStorage.getItem('offline_matches') || '{}'),
  saveMatches: (matches) => localStorage.setItem('offline_matches', JSON.stringify(matches)),
  getPacks: () => JSON.parse(localStorage.getItem('offline_packs') || '[]'),
  savePacks: (packs) => localStorage.setItem('offline_packs', JSON.stringify(packs))
};

// Seed default Gacha packs if empty in mock DB
if (MOCK_DB.getPacks().length === 0) {
  const defaultPacks = [
    { id: 'gold', name: 'Gold Pack', cost: 500, icon: 'fa-gift', desc: 'Standard odds (Legendary 5%, Epic 15%)', rates: { legendary: 5, epic: 15, rare: 30, common: 50 } },
    { id: 'legendary', name: 'Legend Pack', cost: 1500, icon: 'fa-chess-king', desc: 'Premium odds (Legendary 50%, Epic 40%)', rates: { legendary: 50, epic: 40, rare: 10, common: 0 } },
    { id: 'thai_national', name: 'Thai National Pack', cost: 800, icon: 'fa-flag', desc: 'Priority for Thai National players (Epic 60%, Rare 40%)', rates: { legendary: 0, epic: 60, rare: 40, common: 0 } }
  ];
  MOCK_DB.savePacks(defaultPacks);
}

// Self-healing check: reset mock DB if it uses outdated templates
const currentUsers = MOCK_DB.getUsers();
const hasOutdated = currentUsers.some(u => u.inventory && u.inventory.some(card => card.id === 'rashford_init' || card.templateId === 'messi')); // messi template changed to epic in some places
if (currentUsers.length === 0 || hasOutdated) {
  localStorage.removeItem('offline_session');
  localStorage.removeItem('offline_users');
  
  const adminStarting = getStartingThaiSquad();
  const userStarting = getStartingThaiSquad();

  const initialUsers = [
    {
      uid: 'offline_admin',
      username: 'System Admin',
      email: 'admin@game.com',
      password: 'admin', // plain for mock only
      role: 'admin',
      coins: 99999,
      stats: { wins: 10, losses: 2, draws: 3 },
      inventory: adminStarting.inventory,
      squad: adminStarting.squad
    },
    {
      uid: 'offline_user',
      username: 'Guest Player',
      email: 'player@game.com',
      password: 'player',
      role: 'user',
      coins: 2000,
      stats: { wins: 0, losses: 0, draws: 0 },
      inventory: userStarting.inventory,
      squad: userStarting.squad
    }
  ];
  MOCK_DB.saveUsers(initialUsers);
}

// --- AUTHENTICATION API ---

let mockAuthListener = null;
let currentMockUser = JSON.parse(localStorage.getItem('offline_session') || 'null');

export function onAuthChange(callback) {
  if (isOnline) {
    firebaseSDK.onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch userData and call callback
        const data = await getUserData(firebaseUser.uid);
        callback(data ? { ...data, uid: firebaseUser.uid } : null);
      } else {
        callback(null);
      }
    });
  } else {
    mockAuthListener = callback;
    // Trigger immediately with current session
    setTimeout(() => {
      if (currentMockUser) {
        const users = MOCK_DB.getUsers();
        const freshUser = users.find(u => u.uid === currentMockUser.uid);
        callback(freshUser || null);
      } else {
        callback(null);
      }
    }, 50);
  }
}

export async function signUp(email, password, username) {
  const defaultSquadData = getStartingThaiSquad();
  if (isOnline) {
    // 1. Create Auth User
    const cred = await firebaseSDK.createUserWithEmailAndPassword(auth, email, password);
    // 2. Create User doc in Firestore
    const userData = {
      uid: cred.user.uid,
      username: username,
      email: email,
      role: 'user',
      coins: 2000,
      stats: { wins: 0, losses: 0, draws: 0 },
      inventory: defaultSquadData.inventory,
      squad: defaultSquadData.squad
    };
    await firebaseSDK.setDoc(firebaseSDK.doc(db, 'users', cred.user.uid), userData);
    return userData;
  } else {
    const users = MOCK_DB.getUsers();
    if (users.find(u => u.email === email)) {
      throw new Error("Email already registered offline.");
    }
    const newUser = {
      uid: 'mock_' + Math.random().toString(36).substr(2, 9),
      username,
      email,
      password,
      role: 'user',
      coins: 2000,
      stats: { wins: 0, losses: 0, draws: 0 },
      inventory: defaultSquadData.inventory,
      squad: defaultSquadData.squad
    };
    users.push(newUser);
    MOCK_DB.saveUsers(users);
    currentMockUser = newUser;
    localStorage.setItem('offline_session', JSON.stringify(newUser));
    if (mockAuthListener) mockAuthListener(newUser);
    return newUser;
  }
}

export async function logIn(email, password) {
  if (isOnline) {
    const cred = await firebaseSDK.signInWithEmailAndPassword(auth, email, password);
    return await getUserData(cred.user.uid);
  } else {
    const users = MOCK_DB.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error("Invalid credentials in offline database.");
    }
    currentMockUser = user;
    localStorage.setItem('offline_session', JSON.stringify(user));
    if (mockAuthListener) mockAuthListener(user);
    return user;
  }
}

export async function logOut() {
  if (isOnline) {
    await firebaseSDK.signOut(auth);
  } else {
    currentMockUser = null;
    localStorage.removeItem('offline_session');
    if (mockAuthListener) mockAuthListener(null);
  }
}

// --- FIRESTORE USER PROFILES ---

export async function getUserData(uid) {
  if (isOnline) {
    const docSnap = await firebaseSDK.getDoc(firebaseSDK.doc(db, 'users', uid));
    return docSnap.exists() ? docSnap.data() : null;
  } else {
    const users = MOCK_DB.getUsers();
    return users.find(u => u.uid === uid) || null;
  }
}

export async function saveUserData(uid, data) {
  if (isOnline) {
    await firebaseSDK.updateDoc(firebaseSDK.doc(db, 'users', uid), data);
  } else {
    const users = MOCK_DB.getUsers();
    const idx = users.findIndex(u => u.uid === uid);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...data };
      MOCK_DB.saveUsers(users);
      if (currentMockUser && currentMockUser.uid === uid) {
        currentMockUser = users[idx];
        localStorage.setItem('offline_session', JSON.stringify(users[idx]));
      }
    }
  }
}

// --- MATCHMAKING & REAL-TIME MATCH LOGIC ---

let mockMatchListeners = {};
let mockMatchState = null; // single active room simulation for offline bot mode

export async function createMatchRoom(roomCode, matchData) {
  if (isOnline) {
    await firebaseSDK.setDoc(firebaseSDK.doc(db, 'matches', roomCode), matchData);
  } else {
    const matches = MOCK_DB.getMatches();
    matches[roomCode] = matchData;
    MOCK_DB.saveMatches(matches);
    mockMatchState = matchData;
    triggerMockListeners(roomCode, matchData);
  }
}

export async function updateMatchRoom(roomCode, updates) {
  if (isOnline) {
    await firebaseSDK.updateDoc(firebaseSDK.doc(db, 'matches', roomCode), updates);
  } else {
    const matches = MOCK_DB.getMatches();
    if (matches[roomCode]) {
      matches[roomCode] = { ...matches[roomCode], ...updates };
      MOCK_DB.saveMatches(matches);
      mockMatchState = matches[roomCode];
      triggerMockListeners(roomCode, matches[roomCode]);
    }
  }
}

export async function getMatchRoom(roomCode) {
  if (isOnline) {
    const docSnap = await firebaseSDK.getDoc(firebaseSDK.doc(db, 'matches', roomCode));
    return docSnap.exists() ? docSnap.data() : null;
  } else {
    const matches = MOCK_DB.getMatches();
    return matches[roomCode] || null;
  }
}

export function subscribeToMatch(roomCode, callback) {
  if (isOnline) {
    return firebaseSDK.onSnapshot(firebaseSDK.doc(db, 'matches', roomCode), (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      } else {
        callback(null);
      }
    });
  } else {
    if (!mockMatchListeners[roomCode]) {
      mockMatchListeners[roomCode] = [];
    }
    mockMatchListeners[roomCode].push(callback);

    // Initial trigger
    const matches = MOCK_DB.getMatches();
    setTimeout(() => callback(matches[roomCode] || null), 20);

    // Unsubscribe helper
    return () => {
      mockMatchListeners[roomCode] = mockMatchListeners[roomCode].filter(cb => cb !== callback);
    };
  }
}

function triggerMockListeners(roomCode, data) {
  if (mockMatchListeners[roomCode]) {
    mockMatchListeners[roomCode].forEach(cb => cb(data));
  }
}

export async function deleteMatchRoom(roomCode) {
  if (isOnline) {
    await firebaseSDK.deleteDoc(firebaseSDK.doc(db, 'matches', roomCode));
  } else {
    const matches = MOCK_DB.getMatches();
    delete matches[roomCode];
    MOCK_DB.saveMatches(matches);
    triggerMockListeners(roomCode, null);
  }
}

export async function searchOpenMatches() {
  if (isOnline) {
    const q = firebaseSDK.query(
      firebaseSDK.collection(db, 'matches'),
      firebaseSDK.where('status', '==', 'waiting'),
      firebaseSDK.where('type', '==', '1v1'),
      firebaseSDK.limit(10)
    );
    const snap = await firebaseSDK.getDocs(q);
    const rooms = [];
    snap.forEach(docSnap => rooms.push(docSnap.data()));
    return rooms;
  } else {
    const matches = MOCK_DB.getMatches();
    return Object.values(matches).filter(m => m.status === 'waiting' && m.type === '1v1');
  }
}

// --- ADMIN API ---

export async function getAllUsers() {
  if (isOnline) {
    const q = firebaseSDK.query(firebaseSDK.collection(db, 'users'), firebaseSDK.limit(100));
    const snap = await firebaseSDK.getDocs(q);
    const list = [];
    snap.forEach(d => list.push(d.data()));
    return list;
  } else {
    return MOCK_DB.getUsers();
  }
}

export async function updateUserByAdmin(uid, updates) {
  if (isOnline) {
    const userDocRef = firebaseSDK.doc(db, 'users', uid);
    
    // Auth password update requires admin to reset via standard API if needed, 
    // but in a client-side environment, we can't easily force Auth password resets without the user log-in.
    // However, we can store it or update their user doc. If password field is present, we handle it.
    await firebaseSDK.updateDoc(userDocRef, updates);
  } else {
    const users = MOCK_DB.getUsers();
    const idx = users.findIndex(u => u.uid === uid);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      MOCK_DB.saveUsers(users);
      if (currentMockUser && currentMockUser.uid === uid) {
        currentMockUser = users[idx];
        localStorage.setItem('offline_session', JSON.stringify(users[idx]));
      }
    }
  }
}

export async function deleteUserByAdmin(uid) {
  if (isOnline) {
    await firebaseSDK.deleteDoc(firebaseSDK.doc(db, 'users', uid));
    // Firebase Auth user cannot be deleted directly from client-side Firestore rules,
    // but clearing their data disables their record in matches/leaderboard.
  } else {
    let users = MOCK_DB.getUsers();
    users = users.filter(u => u.uid !== uid);
    MOCK_DB.saveUsers(users);
    if (currentMockUser && currentMockUser.uid === uid) {
      currentMockUser = null;
      localStorage.removeItem('offline_session');
    }
  }
}

export async function getActiveMatches() {
  if (isOnline) {
    const q = firebaseSDK.query(firebaseSDK.collection(db, 'matches'), firebaseSDK.limit(50));
    const snap = await firebaseSDK.getDocs(q);
    const rooms = [];
    snap.forEach(d => rooms.push(d.data()));
    return rooms;
  } else {
    return Object.values(MOCK_DB.getMatches());
  }
}

// Gacha Packs database access functions
export async function getGachaPacks() {
  if (isOnline) {
    const q = firebaseSDK.query(firebaseSDK.collection(db, 'gacha_packs'), firebaseSDK.limit(50));
    const snap = await firebaseSDK.getDocs(q);
    const list = [];
    snap.forEach(d => list.push({ ...d.data(), id: d.id }));
    return list;
  } else {
    return MOCK_DB.getPacks();
  }
}

export async function addGachaPack(pack) {
  if (isOnline) {
    const docRef = firebaseSDK.doc(firebaseSDK.collection(db, 'gacha_packs'));
    await firebaseSDK.setDoc(docRef, { ...pack, id: docRef.id });
  } else {
    const packs = MOCK_DB.getPacks();
    packs.push(pack);
    MOCK_DB.savePacks(packs);
  }
}

export async function updateGachaPack(id, pack) {
  if (isOnline) {
    await firebaseSDK.updateDoc(firebaseSDK.doc(db, 'gacha_packs', id), pack);
  } else {
    const packs = MOCK_DB.getPacks();
    const idx = packs.findIndex(p => p.id === id);
    if (idx !== -1) {
      packs[idx] = { ...packs[idx], ...pack };
      MOCK_DB.savePacks(packs);
    }
  }
}

export async function deleteGachaPack(id) {
  if (isOnline) {
    await firebaseSDK.deleteDoc(firebaseSDK.doc(db, 'gacha_packs', id));
  } else {
    let packs = MOCK_DB.getPacks();
    packs = packs.filter(p => p.id !== id);
    MOCK_DB.savePacks(packs);
  }
}
