import { audio } from './audio.js';
import * as dbLib from './firebase-config.js';
import * as engine from './game-engine.js';

// --- APPLICATION STATE ---
let currentUser = null;
let activeRoomCode = null;
let matchUnsubscribe = null;
let currentMatchState = null;
let simulationInterval = null;
let isHost = false;
let isBotMatch = false;

// Halftime sub states
let selectedHalfActiveId = null;
let selectedHalfBenchId = null;

// Live Match 2D mini-map animation states
let tacticalAnimationRequest = null;
let tacticalBallX = 50;

// Gacha current card reveal state
let gachaOpenedCard = null;

// UI View Management
const SCREENS = ['auth', 'dashboard', 'play', 'squad', 'shop', 'inventory', 'match-arena', 'admin'];

function navigateTo(screenId) {
  SCREENS.forEach(s => {
    const el = document.getElementById(`screen-${s}`);
    if (el) {
      if (s === screenId) el.classList.add('active');
      else el.classList.remove('active');
    }
  });

  // Load screen data
  if (screenId === 'dashboard') {
    renderDashboard();
  } else if (screenId === 'squad') {
    renderSquadBuilder();
  } else if (screenId === 'inventory') {
    renderInventory();
  } else if (screenId === 'shop') {
    renderGachaShop();
  } else if (screenId === 'play') {
    renderPlayLobby();
  } else if (screenId === 'admin') {
    renderAdminDashboard();
  }
}

// Helper to open/close modals
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

// Custom Toast Notification System
window.showNotification = function(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  
  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check';
  else if (type === 'error') icon = 'fa-circle-xmark';
  else if (type === 'warning') icon = 'fa-triangle-exclamation';
  
  let iconColor = 'var(--accent-blue)';
  if (type === 'success') iconColor = 'var(--accent-neon-green)';
  else if (type === 'error') iconColor = '#ef5350';
  else if (type === 'warning') iconColor = 'var(--accent-gold)';

  toast.innerHTML = `
    <i class="fa-solid ${icon}" style="font-size: 1.2rem; color: ${iconColor};"></i>
    <div style="font-size: 0.9rem; font-weight: 500;">${message}</div>
  `;
  
  container.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('active'), 50);
  
  // Remove toast after delay
  setTimeout(() => {
    toast.classList.remove('active');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
};

// Custom Confirm Modal System
window.showConfirmModal = function(message, onConfirm, onCancel = null) {
  const modal = document.getElementById('confirm-modal');
  const msgEl = document.getElementById('confirm-modal-message');
  const okBtn = document.getElementById('confirm-modal-ok');
  const cancelBtn = document.getElementById('confirm-modal-cancel');
  
  if (!modal || !msgEl || !okBtn || !cancelBtn) return;
  
  msgEl.textContent = message;
  modal.classList.add('active');
  
  // Clone nodes to easily clean old listeners
  const newOkBtn = okBtn.cloneNode(true);
  const newCancelBtn = cancelBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOkBtn, okBtn);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  
  newOkBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    if (onConfirm) onConfirm();
  });
  
  newCancelBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    if (onCancel) onCancel();
  });
};

// --- INITIALIZE APPLICATION ---
window.addEventListener('DOMContentLoaded', async () => {
  // Wait for Firebase/LocalStorage DB initialization to complete first
  await dbLib.initPromise;
  
  setupEventListeners();
  checkFirebaseStatus();

  // Listen for Authentication Changes
  dbLib.onAuthChange((user) => {
    if (user) {
      currentUser = user;
      document.getElementById('user-header-profile').style.display = 'flex';
      document.getElementById('header-username').textContent = user.username;
      document.getElementById('header-coins').textContent = user.coins;

      // Toggle Admin UI
      if (user.role === 'admin') {
        document.getElementById('admin-shortcut-btn').style.display = 'inline-flex';
      } else {
        document.getElementById('admin-shortcut-btn').style.display = 'none';
      }

      // Fix halftime bug: Only redirect to dashboard if we are currently on the auth screen
      const currentActiveScreen = document.querySelector('.screen.active');
      if (!currentActiveScreen || currentActiveScreen.id === 'screen-auth') {
        navigateTo('dashboard');
      }
    } else {
      currentUser = null;
      document.getElementById('user-header-profile').style.display = 'none';
      document.getElementById('admin-shortcut-btn').style.display = 'none';
      navigateTo('auth');
    }
  });
});

// Update connection banner
function checkFirebaseStatus() {
  const banner = document.getElementById('firebase-status-badge');
  if (dbLib.isFirebaseOnline()) {
    banner.className = "firebase-status-banner online";
    banner.innerHTML = '<i class="fa-solid fa-cloud-bolt"></i> Firebase Connected';
  } else {
    banner.className = "firebase-status-banner offline";
    banner.innerHTML = '<i class="fa-solid fa-wifi-slash"></i> Offline Mode (Local DB Active)';
  }
}

// Bind clicks & form submits
function setupEventListeners() {
  // Navigation Shortcuts
  document.querySelectorAll('.back-to-dash-btn').forEach(btn => {
    btn.addEventListener('click', () => navigateTo('dashboard'));
  });

  document.getElementById('menu-play-mode').addEventListener('click', () => navigateTo('play'));
  document.getElementById('menu-squad-builder').addEventListener('click', () => navigateTo('squad'));
  document.getElementById('menu-shop').addEventListener('click', () => navigateTo('shop'));
  document.getElementById('menu-inventory').addEventListener('click', () => navigateTo('inventory'));
  
  document.getElementById('admin-shortcut-btn').addEventListener('click', () => navigateTo('admin'));



  // Authentication Forms
  document.getElementById('submit-login-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) return;

    try {
      await dbLib.logIn(email, password);
    } catch (err) {
      showNotification("เข้าสู่ระบบล้มเหลว: " + err.message, "error");
    }
  });

  document.getElementById('submit-signup-btn').addEventListener('click', async () => {
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    if (!username || !email || !password) return;

    try {
      await dbLib.signUp(email, password, username);
    } catch (err) {
      showNotification("สมัครสมาชิกล้มเหลว: " + err.message, "error");
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    dbLib.logOut();
  });

  // Squad Customization
  document.getElementById('formation-select').addEventListener('change', async (e) => {
    if (!currentUser) return;
    const formation = e.target.value;
    currentUser.squad = engine.autoBuildSquad(currentUser.inventory, formation);
    await dbLib.saveUserData(currentUser.uid, { squad: currentUser.squad });
    renderSquadBuilder();
    audio.playCardDraw();
  });

  document.getElementById('squad-auto-btn').addEventListener('click', async () => {
    if (!currentUser) return;
    const formation = document.getElementById('formation-select').value;
    currentUser.squad = engine.autoBuildSquad(currentUser.inventory, formation);
    await dbLib.saveUserData(currentUser.uid, { squad: currentUser.squad });
    renderSquadBuilder();
    audio.playPackOpening();
  });

  // Gacha Reveal Close Button
  document.getElementById('gacha-reveal-close-btn').addEventListener('click', () => {
    closeModal('gacha-reveal-overlay');
    navigateTo('inventory');
  });

  // Multiplayer Lobby Events
  document.getElementById('create-room-btn').addEventListener('click', createCustomRoom);
  document.getElementById('join-room-btn').addEventListener('click', joinCustomRoom);
  document.getElementById('start-matchmaking-btn').addEventListener('click', startQuickMatchmaking);
  document.getElementById('cancel-lobby-btn').addEventListener('click', cancelCurrentLobby);

  // Bot Match selector triggers
  document.querySelectorAll('.bot-match-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const teamKey = e.currentTarget.dataset.team;
      window.startAIBotMatch(teamKey);
    });
  });

  // Search & Filter Inventory
  document.getElementById('inventory-search').addEventListener('input', renderInventory);
  document.getElementById('inventory-filter-pos').addEventListener('change', renderInventory);

  // Admin user edit triggers
  document.getElementById('admin-user-save-btn').addEventListener('click', saveAdminUserEdits);
  document.getElementById('admin-user-delete-btn').addEventListener('click', deleteAdminUser);
  document.getElementById('admin-card-save-btn').addEventListener('click', saveAdminCardEdits);
  document.getElementById('admin-card-delete-btn').addEventListener('click', deleteAdminCardTemplate);
  document.getElementById('admin-pack-save-btn').addEventListener('click', saveAdminPackEdits);
  document.getElementById('admin-pack-delete-btn').addEventListener('click', deleteAdminPack);
}

// --- RENDER VIEWS ---

function renderDashboard() {
  document.getElementById('dashboard-coach-name').textContent = currentUser.username;
  document.getElementById('header-coins').textContent = currentUser.coins;
}

// Render inventory roster
function renderInventory() {
  const cardsList = document.getElementById('inventory-cards-list');
  const countSpan = document.getElementById('inventory-count');
  cardsList.innerHTML = '';

  const searchVal = document.getElementById('inventory-search').value.toLowerCase().trim();
  const filterPos = document.getElementById('inventory-filter-pos').value;

  const filtered = currentUser.inventory.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchVal);
    const matchesPos = filterPos === 'ALL' || card.position === filterPos;
    return matchesSearch && matchesPos;
  });

  // Sort from best (highest OVR) to worst (lowest OVR)
  filtered.sort((a, b) => b.ovr - a.ovr);

  countSpan.textContent = filtered.length;

  filtered.forEach(card => {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-wrapper';
    wrapper.innerHTML = createCardHTML(card);

    // Apply tilt listener
    const cardEl = wrapper.querySelector('.card-3d');
    if (cardEl) {
      // Keep card flipped to show stats immediately
      cardEl.classList.add('flipped');
      // Hover tilt animation using JS inline transforms
      cardEl.addEventListener('mousemove', (e) => applyTilt(e, cardEl));
      cardEl.addEventListener('mouseleave', () => resetTilt(cardEl));
    }

    cardsList.appendChild(wrapper);
  });
}

// Dynamic Card HTML Generation
function createCardHTML(card) {
  const isBanned = card.banMatches && card.banMatches > 0;
  const isYellow = card.yellowCards && card.yellowCards > 0;

  return `
    <div class="card-3d flipped">
      <div class="card-face card-back">
        <i class="fa-solid fa-circle-nodes"></i>
      </div>
      <div class="card-face card-front rarity-${card.rarity}">
        ${card.imageUrl ? `<img src="${card.imageUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%;   object-fit:cover; opacity:0.35; z-index:-1; pointer-events:none;">` : ''}
        ${isBanned ? `<div class="card-ban-badge"><i class="fa-solid fa-hand"></i><br>Banned<br>(${card.banMatches} Match)</div>` : ''}
        
        <div class="card-header-info">
          <div class="card-rating-group">
            <span class="card-ovr">${card.ovr}</span>
            <span class="card-pos">${card.position}</span>
          </div>
          <span class="card-rarity-lbl">${card.rarity}</span>
        </div>

        <div class="card-body-graphic">
          <i class="fa-solid fa-user-ninja"></i>
          ${isYellow ? `
            <div class="card-yellows-badges">
              <div class="yellow-card-indicator"></div>
              ${card.yellowCards === 2 ? `<div class="yellow-card-indicator"></div>` : ''}
            </div>
          ` : ''}
        </div>

        <div>
          <div class="card-name-txt">${card.name}</div>
          <div class="card-stats-grid">
            <div><div class="stat-val">${card.stats.pac}</div><div class="stat-lbl">PAC</div></div>
            <div><div class="stat-val">${card.stats.sho}</div><div class="stat-lbl">SHO</div></div>
            <div><div class="stat-val">${card.stats.pas}</div><div class="stat-lbl">PAS</div></div>
            <div><div class="stat-val">${card.stats.dri}</div><div class="stat-lbl">DRI</div></div>
            <div><div class="stat-val">${card.stats.def}</div><div class="stat-lbl">DEF</div></div>
            <div><div class="stat-val">${card.stats.phy}</div><div class="stat-lbl">PHY</div></div>
          </div>
          <div class="card-skill-footer" title="${card.skillDesc || ''}">
            ⚡ ${card.skill || 'No Skill'}
          </div>
        </div>
      </div>
    </div>
  `;
}

// 3D Card tilt formula
function applyTilt(e, cardEl) {
  const rect = cardEl.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const midX = rect.width / 2;
  const midY = rect.height / 2;

  const rotateX = -((y - midY) / midY) * 15; // max 15deg
  const rotateY = ((x - midX) / midX) * 15;

  cardEl.style.transform = `perspective(1000px) rotateY(180deg) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
}

function resetTilt(cardEl) {
  cardEl.style.transform = `perspective(1000px) rotateY(180deg) rotateX(0deg) rotateY(0deg) scale(1)`;
}

// --- SQUAD BUILDER ENGINE ---

function validateAndCleanupSquad() {
  if (!currentUser || !currentUser.squad) return;
  let modified = false;

  // Check starting slots
  if (currentUser.squad.slots) {
    for (const key in currentUser.squad.slots) {
      const instId = currentUser.squad.slots[key];
      if (instId) {
        const exists = currentUser.inventory.some(c => c.id === instId);
        if (!exists) {
          currentUser.squad.slots[key] = null;
          modified = true;
        }
      }
    }
  }

  // Check bench slots
  if (currentUser.squad.bench) {
    const initialLen = currentUser.squad.bench.length;
    currentUser.squad.bench = currentUser.squad.bench.filter(instId => {
      return currentUser.inventory.some(c => c.id === instId);
    });
    if (currentUser.squad.bench.length !== initialLen) {
      modified = true;
    }
  }

  if (modified) {
    dbLib.saveUserData(currentUser.uid, { squad: currentUser.squad });
  }
}

function renderSquadBuilder() {
  validateAndCleanupSquad();
  const pitch = document.getElementById('tactical-pitch');
  pitch.innerHTML = '';

  const formation = currentUser.squad.formation || '4-3-3';
  document.getElementById('formation-select').value = formation;

  // Render tactical positions based on selection
  let dfCount = 4, mfCount = 3, fwCount = 3;
  if (formation === '4-4-2') {
    dfCount = 4; mfCount = 4; fwCount = 2;
  } else if (formation === '3-5-2') {
    dfCount = 3; mfCount = 5; fwCount = 2;
  }

  // Draw GK Row
  const gkRow = createPitchRow([
    { key: 'gk', label: 'GK' }
  ]);
  pitch.appendChild(gkRow);

  // Draw DF Row
  const dfSlots = [];
  for (let i = 1; i <= dfCount; i++) dfSlots.push({ key: `df${i}`, label: `DF ${i}` });
  pitch.appendChild(createPitchRow(dfSlots));

  // Draw MF Row
  const mfSlots = [];
  for (let i = 1; i <= mfCount; i++) mfSlots.push({ key: `mf${i}`, label: `MF ${i}` });
  pitch.appendChild(createPitchRow(mfSlots));

  // Draw FW Row
  const fwSlots = [];
  for (let i = 1; i <= fwCount; i++) fwSlots.push({ key: `fw${i}`, label: `FW ${i}` });
  pitch.appendChild(createPitchRow(fwSlots));

  // Calculate and display OVR
  const teamOvr = engine.calculateTeamOVR(currentUser.squad, currentUser.inventory);
  document.getElementById('squad-team-ovr').textContent = teamOvr;

  // Render Bench
  renderBenchPanel();
}

function createPitchRow(slotsData) {
  const row = document.createElement('div');
  row.className = 'pitch-row';
  
  slotsData.forEach(slotInfo => {
    const slotId = slotInfo.key;
    const instId = currentUser.squad.slots[slotId];
    const cardObj = instId ? currentUser.inventory.find(c => c.id === instId) : null;

    const slotEl = document.createElement('div');
    slotEl.className = 'pitch-slot';
    slotEl.dataset.slotId = slotId;

    if (cardObj) {
      slotEl.classList.add('active-card');
      slotEl.innerHTML = createCardHTML(cardObj);
      const card3D = slotEl.querySelector('.card-3d');
      if (card3D) card3D.style.transform = 'perspective(1000px) rotateY(180deg)';
      
      // Make occupied card draggable
      slotEl.setAttribute('draggable', 'true');
      slotEl.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({
          sourceType: 'pitch',
          sourceKey: slotId,
          cardId: instId
        }));
        slotEl.classList.add('dragging');
      });
      slotEl.addEventListener('dragend', () => {
        slotEl.classList.remove('dragging');
      });

      // Add close button to remove card
      const closeBtn = document.createElement('button');
      closeBtn.className = 'remove-card-btn';
      closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeCardFromSquad(slotId);
      });
      slotEl.appendChild(closeBtn);
    } else {
      slotEl.innerHTML = `<span class="pitch-slot-lbl">${slotInfo.label}</span><i class="fa-solid fa-plus" style="opacity: 0.3; font-size:1.4rem;"></i>`;
    }

    // Set up dropzone events on slot
    slotEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      slotEl.classList.add('drag-over');
    });
    slotEl.addEventListener('dragleave', () => {
      slotEl.classList.remove('drag-over');
    });
    slotEl.addEventListener('drop', async (e) => {
      e.preventDefault();
      slotEl.classList.remove('drag-over');
      try {
        const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
        await handleDragDropSwap(dragData.sourceType, dragData.sourceKey, dragData.cardId, 'pitch', slotId);
      } catch (err) {
        console.error("Drop error", err);
      }
    });

    slotEl.addEventListener('click', () => handleSquadSlotClick(slotId));
    row.appendChild(slotEl);
  });

  return row;
}

function renderBenchPanel() {
  const benchList = document.getElementById('bench-slots-list');
  benchList.innerHTML = '';

  const activeBenchIds = currentUser.squad.bench || [];
  
  for (let i = 0; i < 3; i++) {
    const instId = activeBenchIds[i];
    const cardObj = instId ? currentUser.inventory.find(c => c.id === instId) : null;

    const slotEl = document.createElement('div');
    slotEl.className = 'pitch-slot';
    slotEl.style.width = '70px';
    slotEl.style.height = '100px';

    if (cardObj) {
      slotEl.classList.add('active-card');
      slotEl.innerHTML = createCardHTML(cardObj);
      const card3D = slotEl.querySelector('.card-3d');
      if (card3D) card3D.style.transform = 'perspective(1000px) rotateY(180deg)';

      // Make occupied card draggable
      slotEl.setAttribute('draggable', 'true');
      slotEl.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({
          sourceType: 'bench',
          sourceKey: i,
          cardId: instId
        }));
        slotEl.classList.add('dragging');
      });
      slotEl.addEventListener('dragend', () => {
        slotEl.classList.remove('dragging');
      });

      // Add close button to remove card from bench
      const closeBtn = document.createElement('button');
      closeBtn.className = 'remove-card-btn';
      closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeCardFromBench(i);
      });
      slotEl.appendChild(closeBtn);
    } else {
      slotEl.innerHTML = `<span class="pitch-slot-lbl">Bench</span><i class="fa-solid fa-plus" style="opacity: 0.3;"></i>`;
    }

    // Set up dropzone events on bench slot
    slotEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      slotEl.classList.add('drag-over');
    });
    slotEl.addEventListener('dragleave', () => {
      slotEl.classList.remove('drag-over');
    });
    slotEl.addEventListener('drop', async (e) => {
      e.preventDefault();
      slotEl.classList.remove('drag-over');
      try {
        const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
        await handleDragDropSwap(dragData.sourceType, dragData.sourceKey, dragData.cardId, 'bench', i);
      } catch (err) {
        console.error("Drop error", err);
      }
    });

    slotEl.addEventListener('click', () => handleBenchSlotClick(i));
    benchList.appendChild(slotEl);
  }
}

// Click tactical slot selection logic
let selectedSquadSlotId = null;

async function handleSquadSlotClick(slotId) {
  const instId = currentUser.squad.slots[slotId];
  if (!instId) {
    openSquadCardSelector('pitch', slotId);
  } else {
    selectedSquadSlotId = slotId;
    document.querySelectorAll('.pitch-slot').forEach(el => el.style.borderColor = '');
    const activeSlotEl = document.querySelector(`[data-slot-id="${slotId}"]`);
    if (activeSlotEl) activeSlotEl.style.borderColor = 'var(--accent-purple)';
  }
}

async function handleBenchSlotClick(benchIdx) {
  if (selectedSquadSlotId) {
    const startingInstId = currentUser.squad.slots[selectedSquadSlotId];
    const benchInstId = currentUser.squad.bench[benchIdx];

    // Check position compatibility
    const benchCard = benchInstId ? currentUser.inventory.find(c => c.id === benchInstId) : null;
    const positionGroup = selectedSquadSlotId.replace(/[0-9]/g, '').toUpperCase();

    if (benchCard && benchCard.position !== positionGroup) {
      showNotification(`ตำแหน่งไม่ถูกต้อง! ช่องนี้สามารถใส่นักเตะตำแหน่ง ${positionGroup} ได้เท่านั้น`, "warning");
      return;
    }

    currentUser.squad.slots[selectedSquadSlotId] = benchInstId || null;
    currentUser.squad.bench[benchIdx] = startingInstId || null;

    currentUser.squad.bench = currentUser.squad.bench.filter(id => id !== null);

    await dbLib.saveUserData(currentUser.uid, { squad: currentUser.squad });
    audio.playCardDraw();
    
    selectedSquadSlotId = null;
    renderSquadBuilder();
  } else {
    const instId = currentUser.squad.bench[benchIdx];
    if (!instId) {
      openSquadCardSelector('bench', benchIdx);
    }
  }
}

window.removeCardFromSquad = async function(slotId) {
  if (!currentUser) return;
  currentUser.squad.slots[slotId] = null;
  await dbLib.saveUserData(currentUser.uid, { squad: currentUser.squad });
  audio.playCardDraw();
  renderSquadBuilder();
  showNotification("นำนักเตะออกจากสนามตัวจริงแล้ว", "info");
};

window.removeCardFromBench = async function(benchIdx) {
  if (!currentUser) return;
  currentUser.squad.bench.splice(benchIdx, 1);
  await dbLib.saveUserData(currentUser.uid, { squad: currentUser.squad });
  audio.playCardDraw();
  renderSquadBuilder();
  showNotification("นำนักเตะออกจากม้านั่งสำรองแล้ว", "info");
};

window.openSquadCardSelector = function(targetType, targetKey) {
  openModal('modal-squad-select');
  const posLbl = document.getElementById('squad-select-position-lbl');
  const listEl = document.getElementById('squad-select-list');
  listEl.innerHTML = '';
  
  let requiredPos = 'ALL';
  if (targetType === 'pitch') {
    requiredPos = targetKey.replace(/[0-9]/g, '').toUpperCase();
  }
  posLbl.textContent = requiredPos === 'ALL' ? 'สำรอง' : requiredPos;
  
  const activeIds = Object.values(currentUser.squad.slots).filter(id => id !== null);
  const benchIds = currentUser.squad.bench.filter(id => id !== null);
  const assignedIds = [...activeIds, ...benchIds];
  
  const eligible = currentUser.inventory.filter(card => {
    const isUnassigned = !assignedIds.includes(card.id);
    const matchesPos = requiredPos === 'ALL' || card.position === requiredPos;
    const isNotBanned = !card.banMatches || card.banMatches === 0;
    return isUnassigned && matchesPos && isNotBanned;
  });
  
  if (eligible.length === 0) {
    listEl.innerHTML = `<div style="grid-column: span 3; text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 20px 0;">ไม่มีนักเตะตำแหน่งนี้ว่างในคลังการ์ดสโมสรของคุณ</div>`;
    return;
  }
  
  eligible.forEach(card => {
    const item = document.createElement('div');
    item.className = 'card-wrapper';
    item.style.cursor = 'pointer';
    item.innerHTML = createCardHTML(card);
    
    const cardEl = item.querySelector('.card-3d');
    if (cardEl) {
      cardEl.classList.add('flipped');
    }
    
    item.addEventListener('click', async () => {
      closeModal('modal-squad-select');
      if (targetType === 'pitch') {
        currentUser.squad.slots[targetKey] = card.id;
      } else {
        if (currentUser.squad.bench.length > targetKey) {
          currentUser.squad.bench[targetKey] = card.id;
        } else {
          currentUser.squad.bench.push(card.id);
        }
      }
      
      await dbLib.saveUserData(currentUser.uid, { squad: currentUser.squad });
      audio.playCardDraw();
      renderSquadBuilder();
    });
    
    listEl.appendChild(item);
  });
};

async function handleDragDropSwap(sourceType, sourceKey, cardId, targetType, targetKey) {
  const card = currentUser.inventory.find(c => c.id === cardId);
  if (!card) return;
  
  if (targetType === 'pitch') {
    const requiredPos = targetKey.replace(/[0-9]/g, '').toUpperCase();
    if (card.position !== requiredPos) {
      showNotification(`ตำแหน่งไม่ถูกต้อง! ช่องนี้สามารถใส่นักเตะตำแหน่ง ${requiredPos} ได้เท่านั้น`, "warning");
      return;
    }
  }
  
  let targetCardId = null;
  if (targetType === 'pitch') {
    targetCardId = currentUser.squad.slots[targetKey];
  } else {
    targetCardId = currentUser.squad.bench[targetKey] || null;
  }
  
  if (targetCardId && sourceType === 'pitch') {
    const targetCard = currentUser.inventory.find(c => c.id === targetCardId);
    const sourceRequiredPos = sourceKey.replace(/[0-9]/g, '').toUpperCase();
    if (targetCard && targetCard.position !== sourceRequiredPos) {
      showNotification(`ไม่สามารถสลับได้! นักเตะ ${targetCard.name} มีตำแหน่งไม่ตรงกับช่องต้นทาง ${sourceRequiredPos}`, "warning");
      return;
    }
  }
  
  if (sourceType === 'pitch') {
    currentUser.squad.slots[sourceKey] = targetCardId;
  } else {
    currentUser.squad.bench[sourceKey] = targetCardId;
  }
  
  if (targetType === 'pitch') {
    currentUser.squad.slots[targetKey] = cardId;
  } else {
    currentUser.squad.bench[targetKey] = cardId;
  }
  
  currentUser.squad.bench = currentUser.squad.bench.filter(id => id !== null);
  
  await dbLib.saveUserData(currentUser.uid, { squad: currentUser.squad });
  audio.playCardDraw();
  renderSquadBuilder();
}

// --- GACHA SHOP IMPLEMENTATION ---

// Dynamic Gacha Shop rendering
async function renderGachaShop() {
  const packsList = document.getElementById('shop-pack-list');
  packsList.innerHTML = '<div style="color:var(--text-muted); text-align:center; width:100%;"><i class="fa-solid fa-spinner fa-spin"></i> Loading shop packs...</div>';

  try {
    const packs = await dbLib.getGachaPacks();
    packsList.innerHTML = '';

    packs.forEach(pack => {
      const wrapper = document.createElement('div');
      wrapper.className = 'pack-wrapper';
      
      let borderStyle = 'var(--accent-gold)';
      if (pack.id === 'legendary') borderStyle = 'var(--accent-purple)';
      else if (pack.id === 'thai_national') borderStyle = 'var(--accent-neon-green)';

      wrapper.innerHTML = `
        <div class="pack-card" style="border-color: ${borderStyle};">
          <span class="pack-badge" style="background: ${borderStyle}; color: ${pack.id === 'thai_national' ? 'white' : 'var(--text-dark)'};">${pack.name}</span>
          <div class="pack-art"><i class="fa-solid ${pack.icon || 'fa-gift'}" style="color: ${borderStyle};"></i></div>
          <div style="text-align: center; width: 100%;">
            <div class="coins-badge" style="font-size: 1.3rem; justify-content: center; margin-bottom: 5px;">
              <i class="fa-solid fa-coins"></i> ${pack.cost}
            </div>
            <p style="font-size: 0.75rem; color: var(--text-muted); padding: 0 10px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${pack.desc || ''}</p>
          </div>
        </div>
      `;
      wrapper.addEventListener('click', () => buyDynamicGachaPack(pack.id));
      packsList.appendChild(wrapper);
    });
  } catch (err) {
    packsList.innerHTML = `<div style="color:red;">Error loading shop packs: ${err.message}</div>`;
  }
}

async function buyDynamicGachaPack(packId) {
  try {
    const packs = await dbLib.getGachaPacks();
    const pack = packs.find(p => p.id === packId);
    if (!pack) return;

    if (currentUser.coins < pack.cost) {
      showNotification("เหรียญสโมสรไม่เพียงพอ! กรุณาชนะการแข่งขันเพื่อสะสมเหรียญเพิ่ม", "warning");
      audio.playFoul();
      return;
    }

    // Deduct coins
    currentUser.coins -= pack.cost;
    
    // Roll Pack
    const newCard = engine.openPack(pack);
    currentUser.inventory.push(newCard);

    // Update user profile in Firebase
    await dbLib.saveUserData(currentUser.uid, {
      coins: currentUser.coins,
      inventory: currentUser.inventory
    });

    // Update coins header badge
    document.getElementById('header-coins').textContent = currentUser.coins;

    // Launch Pack Reveal Animation
    openGachaRevealModal(newCard);
  } catch (e) {
    showNotification("เปิดซองล้มเหลว: " + e.message, "error");
  }
}

function openGachaRevealModal(card) {
  gachaOpenedCard = card;
  const spot = document.getElementById('gacha-reveal-card-spot');
  spot.innerHTML = createCardHTML(card);
  
  // Make card back visible (remove .flipped initially to show flip animation)
  const card3D = spot.querySelector('.card-3d');
  card3D.classList.remove('flipped');

  // Hide close actions until card flipped
  document.getElementById('gacha-reveal-actions').style.display = 'none';
  openModal('gacha-reveal-overlay');
  audio.playPackOpening();

  // Click card to flip reveal listener
  card3D.addEventListener('click', () => {
    if (!card3D.classList.contains('flipped')) {
      card3D.classList.add('flipped');
      audio.playGoal();
      // Trigger confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      // Show action buttons
      setTimeout(() => {
        document.getElementById('gacha-reveal-actions').style.display = 'block';
      }, 500);
    }
  });
}

// --- PLAY LOBBIES / MATCHMAKING VIEW ---

function renderPlayLobby() {
  // Reset wait panel
  document.getElementById('lobby-status-content').style.display = 'block';
  document.getElementById('lobby-active-content').style.display = 'none';
}

// private lobby creation
async function createCustomRoom() {
  // Validate starter lineup first
  if (!validateSquadSize()) return;

  const roomCode = Math.random().toString(36).substr(2, 4).toUpperCase();
  isHost = true;
  isBotMatch = false;
  activeRoomCode = roomCode;

  const teamOvr = engine.calculateTeamOVR(currentUser.squad, currentUser.inventory);
  
  const matchData = {
    id: roomCode,
    status: 'waiting',
    type: '1v1',
    hostId: currentUser.uid,
    players: {
      p1: {
        uid: currentUser.uid,
        username: currentUser.username,
        teamOvr: teamOvr,
        score: 0,
        squad: currentUser.squad,
        inventory: currentUser.inventory
      },
      p2: null
    },
    currentHalf: 1,
    minute: 0,
    ballZone: 'mf',
    possession: Math.random() < 0.5 ? 'p1' : 'p2',
    logs: [
      { min: 0, text: `Room created by ${currentUser.username}. Waiting for Opponent.`, type: 'whistle' }
    ],
    timerEnd: null,
    subsRequested: { p1: [], p2: [] },
    banEvents: []
  };

  await dbLib.createMatchRoom(roomCode, matchData);
  
  // Show UI state
  showLobbyWaitState(`Waiting for opponent...`, true, roomCode);
  
  // Start subscription listener
  startMatchDocSubscription(roomCode);
}

// private lobby join
async function joinCustomRoom() {
  if (!validateSquadSize()) return;

  const roomCode = document.getElementById('join-room-code-input').value.toUpperCase().trim();
  if (!roomCode) return;

  try {
    const match = await dbLib.getMatchRoom(roomCode);
    if (!match) {
      showNotification("ไม่พบรหัสห้องแข่งขันที่ระบุ!", "error");
      return;
    }
    if (match.status !== 'waiting') {
      showNotification("ห้องนี้มีผู้เล่นเต็มแล้ว หรือเริ่มการแข่งขันไปแล้ว", "warning");
      return;
    }

    isHost = false;
    isBotMatch = false;
    activeRoomCode = roomCode;

    const teamOvr = engine.calculateTeamOVR(currentUser.squad, currentUser.inventory);

    // Write join parameters
    const updates = {
      'players.p2': {
        uid: currentUser.uid,
        username: currentUser.username,
        teamOvr: teamOvr,
        score: 0,
        squad: currentUser.squad,
        inventory: currentUser.inventory
      },
      status: 'playing',
      logs: [
        ...match.logs,
        { min: 0, text: `Coach ${currentUser.username} has joined. Match Live!`, type: 'whistle' }
      ]
    };

    await dbLib.updateMatchRoom(roomCode, updates);
    startMatchDocSubscription(roomCode);

  } catch (e) {
    showNotification("เชื่อมต่อห้องแข่งขันล้มเหลว: " + e.message, "error");
  }
}

// Quick Match Matchmaking
async function startQuickMatchmaking() {
  if (!validateSquadSize()) return;

  showLobbyWaitState(`Searching for opponent...`, false);

  try {
    const openRooms = await dbLib.searchOpenMatches();
    if (openRooms.length > 0) {
      // Join first available
      const room = openRooms[0];
      document.getElementById('join-room-code-input').value = room.id;
      await joinCustomRoom();
    } else {
      // Create a room and wait
      await createCustomRoom();
      showLobbyWaitState(`Queueing in Matchmaking...`, false);
    }
  } catch (err) {
    showNotification("จับคู่แข่งขันล้มเหลว: " + err.message, "error");
    cancelCurrentLobby();
  }
}

function showLobbyWaitState(title, showCode, code = '') {
  document.getElementById('lobby-status-content').style.display = 'none';
  document.getElementById('lobby-active-content').style.display = 'block';
  document.getElementById('lobby-title-txt').textContent = title;
  
  if (showCode) {
    document.getElementById('room-code-display-box').style.display = 'block';
    document.getElementById('room-code-large').textContent = code;
  } else {
    document.getElementById('room-code-display-box').style.display = 'none';
  }
}

async function cancelCurrentLobby() {
  if (matchUnsubscribe) {
    matchUnsubscribe();
    matchUnsubscribe = null;
  }
  if (isHost && activeRoomCode) {
    await dbLib.deleteMatchRoom(activeRoomCode);
  }
  activeRoomCode = null;
  renderPlayLobby();
}

// Make sure starting squad is complete before playing
function validateSquadSize() {
  validateAndCleanupSquad();
  if (!currentUser.squad || !currentUser.squad.slots) {
    showNotification("กรุณาจัดทีมผู้เล่นในหน้าจัดแผนสโมสรก่อนเริ่มเกม!", "warning");
    navigateTo('squad');
    return false;
  }

  // Check if any slot is vacant
  for (const key in currentUser.squad.slots) {
    if (currentUser.squad.slots[key] === null) {
      showNotification("จำนวนผู้เล่นไม่ครบ! กรุณาจัดนักเตะให้ครบ 11 ตัวจริง", "warning");
      navigateTo('squad');
      return false;
    }
  }

  // Check if any starter is banned
  for (const key in currentUser.squad.slots) {
    const instId = currentUser.squad.slots[key];
    const card = currentUser.inventory.find(c => c.id === instId);
    if (card && card.banMatches > 0) {
      showNotification(`นักเตะ ${card.name} ติดโทษแบนใบแดง เหลืออีก ${card.banMatches} นัด! โปรดนำออกจากทีมตัวจริงเพื่อเข้าแข่ง`, "error");
      navigateTo('squad');
      return false;
    }
  }

  return true;
}

// --- MATCH ENGINE SIMULATOR RUNNER ---

function startMatchDocSubscription(roomCode) {
  navigateTo('match-arena');
  document.getElementById('arena-commentary-log').innerHTML = '';
  
  // Unsubscribe old
  if (matchUnsubscribe) matchUnsubscribe();

  matchUnsubscribe = dbLib.subscribeToMatch(roomCode, (match) => {
    if (!match) {
      // Match deleted/terminated by Host or Admin
      showNotification("ห้องแข่งขันนี้ถูกยกเลิกแล้ว", "warning");
      cleanupMatchContext();
      return;
    }

    currentMatchState = match;
    renderMatchArenaUpdate(match);

    // Host simulator loop initiator
    if (match.status === 'playing' && isHost && !simulationInterval) {
      runMatchSimulationTicks(roomCode);
    }
  });
}

function runMatchSimulationTicks(roomCode) {
  simulationInterval = setInterval(async () => {
    if (currentMatchState && currentMatchState.status === 'playing') {
      const nextState = engine.simulateMatchTick(currentMatchState);
      
      // If halftime or finished, clear simulation tick intervals (will resume after timer/saves)
      if (nextState.status === 'halftime' || nextState.status === 'finished') {
        clearInterval(simulationInterval);
        simulationInterval = null;
      }
      
      await dbLib.updateMatchRoom(roomCode, nextState);
    }
  }, 3000); // Ticks every 3s
}

// Offline VS AI Bot Match based on famous club teams
window.startAIBotMatch = function(teamKey) {
  if (!validateSquadSize()) return;

  isHost = true;
  isBotMatch = true;
  activeRoomCode = 'BOT_ROOM';
  
  const botClub = engine.generateBotSquad(teamKey);
  const teamOvr = engine.calculateTeamOVR(currentUser.squad, currentUser.inventory);

  const localMatch = {
    id: 'BOT_ROOM',
    status: 'playing',
    type: 'bot',
    hostId: currentUser.uid,
    botTeamKey: teamKey,
    players: {
      p1: {
        uid: currentUser.uid,
        username: currentUser.username,
        teamOvr: teamOvr,
        score: 0,
        squad: currentUser.squad,
        inventory: currentUser.inventory
      },
      p2: {
        uid: 'bot',
        username: botClub.username,
        teamOvr: botClub.teamOvr,
        score: 0,
        squad: botClub.squad,
        inventory: botClub.inventory
      }
    },
    currentHalf: 1,
    minute: 0,
    ballZone: 'mf',
    possession: Math.random() < 0.5 ? 'p1' : 'p2',
    logs: [
      { min: 0, text: `Kickoff! Match VS ${botClub.username}.`, type: 'whistle' }
    ],
    timerEnd: null,
    subsRequested: { p1: [], p2: [] },
    banEvents: []
  };

  navigateTo('match-arena');
  document.getElementById('arena-commentary-log').innerHTML = '';
  currentMatchState = localMatch;
  renderMatchArenaUpdate(localMatch);

  // Local loop simulation
  simulationInterval = setInterval(() => {
    if (currentMatchState && currentMatchState.status === 'playing') {
      const nextState = engine.simulateMatchTick(currentMatchState);
      currentMatchState = nextState;
      renderMatchArenaUpdate(nextState);

      if (nextState.status === 'halftime') {
        clearInterval(simulationInterval);
        simulationInterval = null;
        startHalftimeCountdown(30);
      } else if (nextState.status === 'finished') {
        clearInterval(simulationInterval);
        simulationInterval = null;
        concludeMatchOutcome(nextState);
      }
    }
  }, 2500);
};

let halftimeTimeRemaining = 30;
let halftimeInterval = null;

function startHalftimeCountdown(initialSeconds) {
  halftimeTimeRemaining = initialSeconds;
  
  const fill = document.getElementById('halftime-progress-fill');
  const timerLbl = document.getElementById('halftime-timer-label');
  
  if (fill) fill.style.width = `${(halftimeTimeRemaining / 30) * 100}%`;
  if (timerLbl) timerLbl.textContent = `เวลาคงเหลือ: ${halftimeTimeRemaining} วินาที`;
  
  openHalftimeSubstitutionModal();
  
  if (halftimeInterval) clearInterval(halftimeInterval);
  
  halftimeInterval = setInterval(async () => {
    halftimeTimeRemaining--;
    const pct = (halftimeTimeRemaining / 30) * 100;
    if (fill) fill.style.width = `${Math.max(0, pct)}%`;
    if (timerLbl) timerLbl.textContent = `เวลาคงเหลือ: ${Math.max(0, halftimeTimeRemaining)} วินาที`;
    
    if (halftimeTimeRemaining <= 0) {
      clearInterval(halftimeInterval);
      halftimeInterval = null;
      closeModal('halftime-overlay');
      
      if (isBotMatch) {
        currentMatchState.status = 'playing';
        currentMatchState.currentHalf = 2;
        currentMatchState.minute = 45;
        currentMatchState.logs.push({
          min: 45,
          text: "=== เริ่มการแข่งขันครึ่งหลัง! ===",
          type: 'whistle'
        });

        renderMatchArenaUpdate(currentMatchState);
        startAIBotMatchLoop();
      } else {
        // Multiplayer: Host handles moving match state forward
        if (isHost && currentMatchState) {
          const updates = {
            status: 'playing',
            currentHalf: 2,
            minute: 45,
            logs: [
              ...currentMatchState.logs,
              { min: 45, text: "=== เริ่มการแข่งขันครึ่งหลัง! ===", type: 'whistle' }
            ],
            'players.p1.squad': currentMatchState.players.p1.squad,
            'players.p2.squad': currentMatchState.players.p2.squad
          };
          
          await dbLib.updateMatchRoom(currentMatchState.id, updates);
          runMatchSimulationTicks(currentMatchState.id);
        }
      }
    }
  }, 1000);
}

function startAIBotMatchLoop() {
  simulationInterval = setInterval(() => {
    if (currentMatchState && currentMatchState.status === 'playing') {
      const nextState = engine.simulateMatchTick(currentMatchState);
      currentMatchState = nextState;
      renderMatchArenaUpdate(nextState);

      if (nextState.status === 'finished') {
        clearInterval(simulationInterval);
        simulationInterval = null;
        concludeMatchOutcome(nextState);
      }
    }
  }, 2500);
}

function startTacticalFieldAnimation() {
  if (tacticalAnimationRequest) return;
  
  const animate = () => {
    const arenaScreen = document.getElementById('screen-match-arena');
    if (!currentMatchState || currentMatchState.status !== 'playing' || !arenaScreen || !arenaScreen.classList.contains('active')) {
      tacticalAnimationRequest = null;
      return;
    }
    
    const ballEl = document.getElementById('arena-ball');
    if (ballEl) {
      let targetPct = 50;
      if (currentMatchState.ballZone === 'gk1') targetPct = 10;
      else if (currentMatchState.ballZone === 'df1') targetPct = 30;
      else if (currentMatchState.ballZone === 'mf') targetPct = 50;
      else if (currentMatchState.ballZone === 'df2') targetPct = 70;
      else if (currentMatchState.ballZone === 'gk2') targetPct = 90;
      
      // Smoothly ease ball position
      tacticalBallX += (targetPct - tacticalBallX) * 0.08;
      const ballJitterX = (Math.random() - 0.5) * 2;
      const ballJitterY = (Math.random() - 0.5) * 2;
      ballEl.style.left = `calc(${tacticalBallX}% + ${ballJitterX}px)`;
      ballEl.style.top = `calc(50% + ${ballJitterY}px)`;
      
      // Smoothly ease player dots + add jogging animations
      document.querySelectorAll('.field-player-dot').forEach((dot) => {
        const baseLeft = parseFloat(dot.dataset.baseLeft);
        const baseTop = parseFloat(dot.dataset.baseTop);
        
        const ballDiff = tacticalBallX - baseLeft;
        const isGK = baseLeft === 8 || baseLeft === 92;
        const factor = isGK ? 0.03 : 0.16;
        
        const targetLeft = baseLeft + ballDiff * factor;
        const timeScale = Date.now() * 0.004 + baseLeft;
        const targetTop = baseTop + (Math.sin(timeScale) * 5); // running weave pattern
        
        let curLeft = parseFloat(dot.style.left) || baseLeft;
        let curTop = parseFloat(dot.style.top) || baseTop;
        
        // Easing towards destination
        curLeft += (targetLeft - curLeft) * 0.06;
        curTop += (targetTop - curTop) * 0.06;
        
        // Small micro-jogging noise
        const noiseX = (Math.random() - 0.5) * 0.5;
        const noiseY = (Math.random() - 0.5) * 0.5;
        
        dot.style.left = `${curLeft + noiseX}%`;
        dot.style.top = `${curTop + noiseY}%`;
      });
    }
    
    tacticalAnimationRequest = requestAnimationFrame(animate);
  };
  
  tacticalAnimationRequest = requestAnimationFrame(animate);
}

// Render Arena elements
let loggedCount = 0;
function renderMatchArenaUpdate(match) {
  // Score details
  document.getElementById('arena-p1-name').textContent = match.players.p1.username;
  document.getElementById('arena-p1-score').textContent = match.players.p1.score;

  const p2Name = match.players.p2 ? match.players.p2.username : 'รอกองเชียร์...';
  const p2Score = match.players.p2 ? match.players.p2.score : '0';
  document.getElementById('arena-p2-name').textContent = p2Name;
  document.getElementById('arena-p2-score').textContent = p2Score;

  // Format injury time clock
  let clockText = `${match.minute}'`;
  if (match.currentHalf === 1 && match.minute > 45) {
    clockText = `45 + ${match.minute - 45}'`;
  } else if (match.currentHalf === 2 && match.minute > 90) {
    clockText = `90 + ${match.minute - 90}'`;
  }
  document.getElementById('arena-match-clock').textContent = clockText;

  // Toggle possession highlight glow
  const p1Block = document.getElementById('scoreboard-p1-block');
  const p2Block = document.getElementById('scoreboard-p2-block');
  if (p1Block && p2Block) {
    if (match.possession === 'p1') {
      p1Block.classList.add('attacking-active');
      p2Block.classList.remove('attacking-active');
    } else if (match.possession === 'p2') {
      p2Block.classList.add('attacking-active');
      p1Block.classList.remove('attacking-active');
    } else {
      p1Block.classList.remove('attacking-active');
      p2Block.classList.remove('attacking-active');
    }
  }

  // Start smooth real-time animation loop if match is active
  if (match.status === 'playing') {
    startTacticalFieldAnimation();
  }

  // Process and play sound on new logs
  if (match.logs.length > loggedCount) {
    const logBox = document.getElementById('arena-commentary-log');
    
    // slice new additions
    const newLogs = match.logs.slice(loggedCount);
    newLogs.forEach(log => {
      const el = document.createElement('div');
      el.className = `log-entry log-type-${log.type || 'info'}`;
      el.innerHTML = `
        <span class="log-min">${log.min}'</span>
        <span class="log-txt">${log.text}</span>
      `;
      logBox.appendChild(el);
      logBox.scrollTop = logBox.scrollHeight;

      // Play matching sounds
      if (log.type === 'goal') {
        audio.playGoal();
        confetti({ particleCount: 50, spread: 60 });
      } else if (log.type === 'save') {
        audio.playSave();
      } else if (log.type === 'tackle') {
        audio.playKick();
      } else if (log.type === 'foul') {
        audio.playFoul();
      } else if (log.type === 'whistle') {
        audio.playWhistle();
      }
    });

    loggedCount = match.logs.length;
  }

  // Arena Card clash display (based on last event logs)
  const leftSide = document.getElementById('arena-clash-left-side');
  const rightSide = document.getElementById('arena-clash-right-side');
  
  if (match.logs.length > 0) {
    // Determine active players on field from log
    const lastLog = match.logs[match.logs.length - 1];
    
    // Highlight played cards in logs
    let p1Card = null;
    let p2Card = null;

    // Search player names in log
    const searchCardInInventories = (name) => {
      let found = match.players.p1.inventory.find(c => name.includes(c.name));
      if (found) return { card: found, side: 'p1' };
      if (match.players.p2) {
        found = match.players.p2.inventory.find(c => name.includes(c.name));
        if (found) return { card: found, side: 'p2' };
      }
      return null;
    };

    // Very simple lookup in commentary text
    const words = lastLog.text.split(' ');
    match.players.p1.inventory.forEach(c => {
      if (lastLog.text.includes(c.name)) p1Card = c;
    });
    if (match.players.p2) {
      match.players.p2.inventory.forEach(c => {
        if (lastLog.text.includes(c.name)) p2Card = c;
      });
    }

    leftSide.innerHTML = p1Card ? createCardHTML(p1Card) : '';
    rightSide.innerHTML = p2Card ? createCardHTML(p2Card) : '';
    
    // Rotate cards 180 (reveal them in clash)
    document.querySelectorAll('#screen-match-arena .card-3d').forEach(c3D => {
      c3D.classList.add('flipped');
      c3D.style.transform = 'perspective(1000px) rotateY(180deg)';
    });
  }

  // Halftime status handling (Multiplayer)
  if (match.status === 'halftime' && !isBotMatch) {
    if (!halftimeInterval) {
      const remainingSeconds = Math.max(0, Math.round((match.timerEnd - Date.now()) / 1000));
      startHalftimeCountdown(remainingSeconds || 30);
    }
  }

  // Conclude Match (Multiplayer)
  if (match.status === 'finished' && !isBotMatch) {
    concludeMatchOutcome(match);
  }
}

// Render and wire halftime sub panels
function openHalftimeSubstitutionModal() {
  openModal('halftime-overlay');
  
  const activeContainer = document.getElementById('halftime-pitch-slots');
  const benchContainer = document.getElementById('halftime-bench-slots');
  activeContainer.innerHTML = '';
  benchContainer.innerHTML = '';

  const userRole = currentMatchState.players.p1.uid === currentUser.uid ? 'p1' : 'p2';
  const playerState = currentMatchState.players[userRole];

  // Render starting actives to select
  for (const key in playerState.squad.slots) {
    const instId = playerState.squad.slots[key];
    const card = instId ? playerState.inventory.find(c => c.id === instId) : null;
    if (card) {
      const slotEl = document.createElement('div');
      slotEl.className = 'glass-panel';
      slotEl.style.padding = '8px';
      slotEl.style.cursor = 'pointer';
      slotEl.style.fontSize = '0.8rem';
      slotEl.innerHTML = `<strong>${card.position}</strong>: ${card.name} (${card.ovr})`;
      
      slotEl.addEventListener('click', () => {
        selectedHalfActiveId = instId;
        // highlight
        activeContainer.querySelectorAll('div').forEach(d => d.style.borderColor = '');
        slotEl.style.borderColor = 'var(--accent-purple)';
      });
      activeContainer.appendChild(slotEl);
    }
  }

  // Render bench
  playerState.squad.bench.forEach(instId => {
    const card = playerState.inventory.find(c => c.id === instId);
    if (card) {
      const slotEl = document.createElement('div');
      slotEl.className = 'glass-panel';
      slotEl.style.padding = '8px';
      slotEl.style.cursor = 'pointer';
      slotEl.style.fontSize = '0.8rem';
      
      const isBanned = card.banMatches && card.banMatches > 0;
      slotEl.innerHTML = `<strong>${card.position}</strong>: ${card.name} (${card.ovr}) ${isBanned ? '[BANNED]' : ''}`;

      slotEl.addEventListener('click', async () => {
        if (isBanned) return;
        selectedHalfBenchId = instId;

        // Run substitution
        if (selectedHalfActiveId && selectedHalfBenchId) {
          // Verify positions
          const activeCard = playerState.inventory.find(c => c.id === selectedHalfActiveId);
          if (activeCard.position !== card.position) {
            showNotification("ตำแหน่งไม่ตรงกัน! ไม่สามารถเปลี่ยนตัวได้", "warning");
            return;
          }

          // Swap!
          const slotKey = Object.keys(playerState.squad.slots).find(k => playerState.squad.slots[k] === selectedHalfActiveId);
          playerState.squad.slots[slotKey] = selectedHalfBenchId;
          playerState.squad.bench = playerState.squad.bench.map(id => id === selectedHalfBenchId ? selectedHalfActiveId : id);

          // Update local session
          currentUser.squad = playerState.squad;
          await dbLib.saveUserData(currentUser.uid, { squad: playerState.squad });

          // If online, write updates immediately
          if (!isBotMatch) {
            const path = `players.${userRole}.squad`;
            await dbLib.updateMatchRoom(activeRoomCode, { [path]: playerState.squad });
          }

          audio.playCardDraw();
          openHalftimeSubstitutionModal(); // re-draw
        }
      });
      benchContainer.appendChild(slotEl);
    }
  });
}

// Conclude match rewards and bans
async function concludeMatchOutcome(match) {
  // Prevent duplicate runs
  clearInterval(simulationInterval);
  simulationInterval = null;

  if (matchUnsubscribe) {
    matchUnsubscribe();
    matchUnsubscribe = null;
  }

  const userRole = match.players.p1.uid === currentUser.uid ? 'p1' : 'p2';
  const myScore = match.players[userRole].score;
  const oppRole = userRole === 'p1' ? 'p2' : 'p1';
  const oppScore = match.players[oppRole] ? match.players[oppRole].score : 0;

  let rewardCoins = 150; // default draw
  let isWin = false;
  let isDraw = false;

  if (myScore > oppScore) {
    isWin = true;
    currentUser.stats.wins++;
    if (isBotMatch) {
      const teamKey = match.botTeamKey || 'leicester';
      if (teamKey === 'leicester') rewardCoins = 150;
      else if (teamKey === 'chelsea') rewardCoins = 300;
      else if (teamKey === 'mancity') rewardCoins = 600;
      else if (teamKey === 'realmadrid') rewardCoins = 1200;
    } else {
      rewardCoins = 300; // PvP Win
    }
  } else if (myScore < oppScore) {
    currentUser.stats.losses++;
    if (isBotMatch) {
      const teamKey = match.botTeamKey || 'leicester';
      if (teamKey === 'leicester') rewardCoins = 50;
      else if (teamKey === 'chelsea') rewardCoins = 100;
      else if (teamKey === 'mancity') rewardCoins = 150;
      else if (teamKey === 'realmadrid') rewardCoins = 200;
    } else {
      rewardCoins = 100; // PvP Loss
    }
  } else {
    isDraw = true;
    currentUser.stats.draws++;
    if (isBotMatch) {
      const teamKey = match.botTeamKey || 'leicester';
      if (teamKey === 'leicester') rewardCoins = 75;
      else if (teamKey === 'chelsea') rewardCoins = 150;
      else if (teamKey === 'mancity') rewardCoins = 250;
      else if (teamKey === 'realmadrid') rewardCoins = 400;
    } else {
      rewardCoins = 150; // PvP Draw
    }
  }

  currentUser.coins += rewardCoins;

  // Process ban matches decrement for all cards in inventory
  currentUser.inventory.forEach(card => {
    if (card.banMatches && card.banMatches > 0) {
      card.banMatches--;
    }
    // reset match yellow cards count
    card.yellowCards = 0;
  });

  // Apply new bans from banEvents
  match.banEvents.forEach(evt => {
    if (evt.playerKey === userRole) {
      const card = currentUser.inventory.find(c => c.id === evt.cardId);
      if (card && (evt.type === 'red' || evt.type === 'double_yellow')) {
        card.banMatches = 2; // ban 2 matches
      }
    }
  });

  // Save updated user details to Firebase (or Local DB)
  await dbLib.saveUserData(currentUser.uid, {
    coins: currentUser.coins,
    stats: currentUser.stats,
    inventory: currentUser.inventory
  });

  // Populate Match Summary Modal details
  const summaryModal = document.getElementById('modal-match-summary');
  if (summaryModal) {
    const titleEl = document.getElementById('summary-result-title');
    if (isWin) {
      titleEl.textContent = "🏆 ชัยชนะ! (VICTORY)";
      titleEl.style.color = "var(--accent-neon-green)";
    } else if (isDraw) {
      titleEl.textContent = "🤝 เสมอ! (DRAW)";
      titleEl.style.color = "var(--accent-gold)";
    } else {
      titleEl.textContent = "💔 พ่ายแพ้! (DEFEAT)";
      titleEl.style.color = "#ef5350";
    }
    
    document.getElementById('summary-p1-name').textContent = match.players.p1.username;
    document.getElementById('summary-p1-score').textContent = match.players.p1.score;
    document.getElementById('summary-p2-name').textContent = match.players.p2 ? match.players.p2.username : 'คู่แข่ง';
    document.getElementById('summary-p2-score').textContent = match.players.p2 ? match.players.p2.score : '0';
    
    document.getElementById('summary-reward-coins').textContent = `+${rewardCoins} Coins`;
    
    // Parse key events
    const eventsList = document.getElementById('summary-events-list');
    eventsList.innerHTML = '';
    const keyEvents = match.logs.filter(l => l.type === 'goal' || l.type === 'foul');
    if (keyEvents.length === 0) {
      eventsList.innerHTML = `<div style="color:var(--text-muted); font-size:0.75rem; text-align:center; padding: 10px 0;">ไม่มีเหตุการณ์ทำประตูเกิดขึ้น</div>`;
    } else {
      keyEvents.forEach(evt => {
        const entry = document.createElement('div');
        entry.style.fontSize = '0.75rem';
        entry.style.display = 'flex';
        entry.style.gap = '6px';
        entry.style.alignItems = 'baseline';
        
        let icon = '⚽';
        if (evt.text.includes('ใบแดง') || evt.text.includes('🟥')) icon = '🟥';
        else if (evt.text.includes('ใบเหลือง') || evt.text.includes('🟨')) icon = '🟨';
        
        // Strip out some prefixes for cleaner view
        let cleanedText = evt.text
          .replace('⚽ GOAL!!! ', '')
          .replace('🟥 ใบแดงโดยตรง! ', '')
          .replace('🟨🟥 ใบเหลืองที่สองกลายเป็นใบแดง! ', '')
          .replace('🟨 ใบเหลือง! ', '');
          
        entry.innerHTML = `<span style="color:var(--accent-neon-green); font-weight:700;">${evt.min}'</span> <span>${icon} ${cleanedText}</span>`;
        eventsList.appendChild(entry);
      });
    }
    
    // Player of the Match calculation (highest OVR on field)
    const potmCardNameEl = document.getElementById('summary-potm-card');
    const potmReasonEl = document.getElementById('summary-potm-reason');
    
    let bestPlayer = null;
    const p1SquadSlots = match.players.p1.squad.slots;
    for (const key in p1SquadSlots) {
      const instId = p1SquadSlots[key];
      if (instId) {
        const card = match.players.p1.inventory.find(c => c.id === instId);
        if (card && (!bestPlayer || card.ovr > bestPlayer.ovr)) {
          bestPlayer = card;
        }
      }
    }
    
    if (bestPlayer) {
      potmCardNameEl.textContent = `${bestPlayer.name} (OVR ${bestPlayer.ovr})`;
      potmReasonEl.textContent = `ตำแหน่ง ${bestPlayer.position} - โดดเด่นในแนวรับและรุก`;
    } else {
      potmCardNameEl.textContent = "-";
      potmReasonEl.textContent = "";
    }
    
    openModal('modal-match-summary');
    
    // Wire close event
    const closeBtn = document.getElementById('summary-close-btn');
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    
    newCloseBtn.addEventListener('click', () => {
      closeModal('modal-match-summary');
      cleanupMatchContext();
    });
  } else {
    // Fallback if modal container not found
    cleanupMatchContext();
  }
}

function cleanupMatchContext() {
  if (simulationInterval) clearInterval(simulationInterval);
  if (halftimeOverlayTimer) clearInterval(halftimeOverlayTimer);
  simulationInterval = null;
  halftimeOverlayTimer = null;
  activeRoomCode = null;
  loggedCount = 0;
  isHost = false;
  isBotMatch = false;

  navigateTo('dashboard');
}

// --- ADMIN DASHBOARD ACTIONS ---

let currentAdminTabValue = 'users';

window.switchAdminTab = function(tabName) {
  currentAdminTabValue = tabName;
  document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.admin-content-section').forEach(sect => sect.classList.remove('active'));

  // Highlight selected tab
  const btnIdx = tabName === 'users' ? 1 : tabName === 'catalog' ? 2 : tabName === 'packs' ? 3 : 4;
  document.querySelector(`.admin-tab-btn:nth-child(${btnIdx})`).classList.add('active');
  document.getElementById(`admin-sect-${tabName}`).classList.add('active');

  renderAdminDashboard();
};

async function renderAdminDashboard() {
  if (currentAdminTabValue === 'users') {
    const list = await dbLib.getAllUsers();
    const tbody = document.getElementById('admin-users-table-body');
    tbody.innerHTML = '';

    list.forEach(usr => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${usr.username}</strong></td>
        <td>${usr.email}</td>
        <td style="color:var(--accent-gold); font-weight:700;"><i class="fa-solid fa-coins"></i> ${usr.coins}</td>
        <td>${usr.stats.wins} - ${usr.stats.draws} - ${usr.stats.losses}</td>
        <td><span style="background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:4px;">${usr.role}</span></td>
        <td>
          <button onclick="openAdminEditUserModal('${usr.uid}')" class="btn btn-small btn-icon"><i class="fa-solid fa-user-pen"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } else if (currentAdminTabValue === 'catalog') {
    const tbody = document.getElementById('admin-catalog-table-body');
    tbody.innerHTML = '';

    engine.CARD_TEMPLATES.forEach(tmpl => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${tmpl.name}</strong></td>
        <td><span class="card-pos">${tmpl.position}</span></td>
        <td style="font-weight:700;">${tmpl.ovr}</td>
        <td><span class="card-rarity-lbl">${tmpl.rarity}</span></td>
        <td>${tmpl.skill || 'None'}</td>
        <td style="font-family:monospace; font-size:0.75rem;">
          PAC ${tmpl.stats.pac} SHO ${tmpl.stats.sho} PAS ${tmpl.stats.pas} DRI ${tmpl.stats.dri} DEF ${tmpl.stats.def} PHY ${tmpl.stats.phy}
        </td>
        <td>
          <button onclick="openEditCardModal('${tmpl.id}')" class="btn btn-small btn-icon"><i class="fa-solid fa-pen-to-square"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } else if (currentAdminTabValue === 'packs') {
    const list = await dbLib.getGachaPacks();
    const tbody = document.getElementById('admin-packs-table-body');
    tbody.innerHTML = '';

    list.forEach(pack => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${pack.name}</strong></td>
        <td style="color:var(--accent-gold); font-weight:700;"><i class="fa-solid fa-coins"></i> ${pack.cost}</td>
        <td><i class="fa-solid ${pack.icon || 'fa-gift'}"></i></td>
        <td>${pack.desc || ''}</td>
        <td style="font-family:monospace; font-size:0.75rem;">
          L: ${pack.rates.legendary || 0}% / E: ${pack.rates.epic || 0}% / R: ${pack.rates.rare || 0}% / C: ${pack.rates.common || 0}%
        </td>
        <td>
          <button onclick="openEditPackModal('${pack.id}')" class="btn btn-small btn-icon"><i class="fa-solid fa-pen-to-square"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } else if (currentAdminTabValue === 'matches') {
    const list = await dbLib.getActiveMatches();
    const tbody = document.getElementById('admin-matches-table-body');
    tbody.innerHTML = '';

    list.forEach(m => {
      const p1 = m.players.p1;
      const p2 = m.players.p2 || { username: 'Waiting...', teamOvr: 0, score: 0 };
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family:monospace; font-weight:700;">${m.id}</td>
        <td>${m.type}</td>
        <td>${p1.username} (${p1.teamOvr})</td>
        <td>${p2.username} (${p2.teamOvr})</td>
        <td>${m.minute}'</td>
        <td style="color:var(--accent-neon-green); font-weight:700;">${p1.score} - ${p2.score}</td>
        <td>${m.status}</td>
        <td>
          <button onclick="adminTerminateMatch('${m.id}')" class="btn btn-danger btn-small"><i class="fa-solid fa-trash"></i> End</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}

// User edit actions
let editingAdminUid = null;
window.openAdminEditUserModal = async function(uid) {
  editingAdminUid = uid;
  const user = await dbLib.getUserData(uid);
  if (!user) return;

  document.getElementById('admin-user-modal-title').textContent = `Manage Coach Profile: ${user.username}`;
  document.getElementById('admin-user-coins').value = user.coins;
  document.getElementById('admin-user-new-password').value = '';

  // Load Grant Card dropdown option list
  const select = document.getElementById('admin-user-add-card');
  select.innerHTML = '<option value="">-- Choose Card to Grant --</option>';
  engine.CARD_TEMPLATES.forEach(tmpl => {
    select.innerHTML += `<option value="${tmpl.id}">${tmpl.name} (OVR ${tmpl.ovr} - ${tmpl.position})</option>`;
  });

  openModal('modal-admin-user');
};

async function saveAdminUserEdits() {
  if (!editingAdminUid) return;
  const coinsVal = parseInt(document.getElementById('admin-user-coins').value);
  const addCardId = document.getElementById('admin-user-add-card').value;
  const newPass = document.getElementById('admin-user-new-password').value.trim();

  const updates = {};
  if (!isNaN(coinsVal)) updates.coins = coinsVal;

  const targetUser = await dbLib.getUserData(editingAdminUid);
  
  // Grant Card option
  if (addCardId) {
    const newCardInst = engine.createCardInstance(addCardId);
    targetUser.inventory.push(newCardInst);
    updates.inventory = targetUser.inventory;
  }

  // Reset password option
  if (newPass) {
    updates.password = newPass; // updates password in database
  }

  await dbLib.updateUserByAdmin(editingAdminUid, updates);
  closeModal('modal-admin-user');
  renderAdminDashboard();
}

async function deleteAdminUser() {
  if (!editingAdminUid) return;
  showConfirmModal("คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้งานนี้อย่างถาวร?", async () => {
    await dbLib.deleteUserByAdmin(editingAdminUid);
    closeModal('modal-admin-user');
    renderAdminDashboard();
  });
}

// Card catalog edit actions
window.openAddCardModal = function() {
  document.getElementById('admin-card-modal-title').textContent = "Add New Card Template";
  document.getElementById('admin-card-modal-id').value = '';
  document.getElementById('admin-card-name').value = '';
  document.getElementById('admin-card-pos').value = 'FW';
  document.getElementById('admin-card-ovr').value = 85;
  document.getElementById('admin-card-rarity').value = 'rare';
  document.getElementById('admin-card-pac').value = 80;
  document.getElementById('admin-card-sho').value = 80;
  document.getElementById('admin-card-pas').value = 80;
  document.getElementById('admin-card-dri').value = 80;
  document.getElementById('admin-card-def').value = 80;
  document.getElementById('admin-card-phy').value = 80;
  document.getElementById('admin-card-skill').value = '';
  document.getElementById('admin-card-skilldesc').value = '';
  document.getElementById('admin-card-imageurl').value = '';

  document.getElementById('admin-card-delete-btn').style.display = 'none';
  openModal('modal-admin-card');
};

window.openEditCardModal = function(tmplId) {
  const tmpl = engine.CARD_TEMPLATES.find(c => c.id === tmplId);
  if (!tmpl) return;

  document.getElementById('admin-card-modal-title').textContent = `Edit Card Template: ${tmpl.name}`;
  document.getElementById('admin-card-modal-id').value = tmpl.id;
  document.getElementById('admin-card-name').value = tmpl.name;
  document.getElementById('admin-card-pos').value = tmpl.position;
  document.getElementById('admin-card-ovr').value = tmpl.ovr;
  document.getElementById('admin-card-rarity').value = tmpl.rarity;
  document.getElementById('admin-card-pac').value = tmpl.stats.pac;
  document.getElementById('admin-card-sho').value = tmpl.stats.sho;
  document.getElementById('admin-card-pas').value = tmpl.stats.pas;
  document.getElementById('admin-card-dri').value = tmpl.stats.dri;
  document.getElementById('admin-card-def').value = tmpl.stats.def;
  document.getElementById('admin-card-phy').value = tmpl.stats.phy;
  document.getElementById('admin-card-skill').value = tmpl.skill || '';
  document.getElementById('admin-card-skilldesc').value = tmpl.skillDesc || '';
  document.getElementById('admin-card-imageurl').value = tmpl.imageUrl || '';

  document.getElementById('admin-card-delete-btn').style.display = 'inline-block';
  openModal('modal-admin-card');
};

async function saveAdminCardEdits() {
  const idVal = document.getElementById('admin-card-modal-id').value;
  const newCard = {
    id: idVal || 'tmpl_' + Math.random().toString(36).substr(2, 9),
    name: document.getElementById('admin-card-name').value.trim(),
    position: document.getElementById('admin-card-pos').value,
    ovr: parseInt(document.getElementById('admin-card-ovr').value),
    rarity: document.getElementById('admin-card-rarity').value,
    stats: {
      pac: parseInt(document.getElementById('admin-card-pac').value),
      sho: parseInt(document.getElementById('admin-card-sho').value),
      pas: parseInt(document.getElementById('admin-card-pas').value),
      dri: parseInt(document.getElementById('admin-card-dri').value),
      def: parseInt(document.getElementById('admin-card-def').value),
      phy: parseInt(document.getElementById('admin-card-phy').value)
    },
    skill: document.getElementById('admin-card-skill').value.trim(),
    skillDesc: document.getElementById('admin-card-skilldesc').value.trim(),
    imageUrl: document.getElementById('admin-card-imageurl').value.trim()
  };

  if (!newCard.name) {
    showNotification("กรุณาระบุชื่อนักเตะ", "warning");
    return;
  }

  if (idVal) {
    // edit existing template index
    const idx = engine.CARD_TEMPLATES.findIndex(c => c.id === idVal);
    if (idx !== -1) engine.CARD_TEMPLATES[idx] = newCard;
  } else {
    // push new
    engine.CARD_TEMPLATES.push(newCard);
  }

  closeModal('modal-admin-card');
  renderAdminDashboard();
}

function deleteAdminCardTemplate() {
  const idVal = document.getElementById('admin-card-modal-id').value;
  if (!idVal) return;
  showConfirmModal("ต้องการลบแม่แบบการ์ดนี้ออกจากฐานข้อมูลหลักหรือไม่?", () => {
    const idx = engine.CARD_TEMPLATES.findIndex(c => c.id === idVal);
    if (idx !== -1) engine.CARD_TEMPLATES.splice(idx, 1);
    closeModal('modal-admin-card');
    renderAdminDashboard();
  });
}

window.adminTerminateMatch = async function(roomCode) {
  showConfirmModal(`ต้องการสั่งยุติการแข่งขันห้อง ${roomCode} หรือไม่?`, async () => {
    await dbLib.deleteMatchRoom(roomCode);
    renderAdminDashboard();
  });
};

// Admin Gacha Packs dialog handlers
window.openAddPackModal = function() {
  document.getElementById('admin-pack-modal-title').textContent = "Create Gacha Pack";
  document.getElementById('admin-pack-modal-id').value = '';
  document.getElementById('admin-pack-name').value = '';
  document.getElementById('admin-pack-cost').value = 500;
  document.getElementById('admin-pack-icon').value = 'fa-gift';
  document.getElementById('admin-pack-desc').value = '';
  document.getElementById('admin-pack-rate-l').value = 5;
  document.getElementById('admin-pack-rate-e').value = 15;
  document.getElementById('admin-pack-rate-r').value = 30;
  document.getElementById('admin-pack-rate-c').value = 50;

  document.getElementById('admin-pack-delete-btn').style.display = 'none';
  openModal('modal-admin-pack');
};

window.openEditPackModal = async function(packId) {
  const packs = await dbLib.getGachaPacks();
  const pack = packs.find(p => p.id === packId);
  if (!pack) return;

  document.getElementById('admin-pack-modal-title').textContent = `Edit Pack: ${pack.name}`;
  document.getElementById('admin-pack-modal-id').value = pack.id;
  document.getElementById('admin-pack-name').value = pack.name;
  document.getElementById('admin-pack-cost').value = pack.cost;
  document.getElementById('admin-pack-icon').value = pack.icon || 'fa-gift';
  document.getElementById('admin-pack-desc').value = pack.desc || '';
  document.getElementById('admin-pack-rate-l').value = pack.rates.legendary || 0;
  document.getElementById('admin-pack-rate-e').value = pack.rates.epic || 0;
  document.getElementById('admin-pack-rate-r').value = pack.rates.rare || 0;
  document.getElementById('admin-pack-rate-c').value = pack.rates.common || 0;

  document.getElementById('admin-pack-delete-btn').style.display = 'inline-block';
  openModal('modal-admin-pack');
};

async function saveAdminPackEdits() {
  const idVal = document.getElementById('admin-pack-modal-id').value;
  const rates = {
    legendary: parseInt(document.getElementById('admin-pack-rate-l').value) || 0,
    epic: parseInt(document.getElementById('admin-pack-rate-e').value) || 0,
    rare: parseInt(document.getElementById('admin-pack-rate-r').value) || 0,
    common: parseInt(document.getElementById('admin-pack-rate-c').value) || 0
  };
  
  // Validate rates sum
  const sum = rates.legendary + rates.epic + rates.rare + rates.common;
  if (sum !== 100) {
    showNotification(`อัตราสุ่มรวมต้องเท่ากับ 100%! ยอดรวมปัจจุบันคือ: ${sum}%`, "warning");
    return;
  }

  const newPack = {
    id: idVal || 'pack_' + Math.random().toString(36).substr(2, 9),
    name: document.getElementById('admin-pack-name').value.trim(),
    cost: parseInt(document.getElementById('admin-pack-cost').value) || 500,
    icon: document.getElementById('admin-pack-icon').value.trim() || 'fa-gift',
    desc: document.getElementById('admin-pack-desc').value.trim(),
    rates: rates
  };

  if (!newPack.name) {
    showNotification("กรุณาระบุชื่อซองการ์ด", "warning");
    return;
  }

  if (idVal) {
    await dbLib.updateGachaPack(idVal, newPack);
  } else {
    await dbLib.addGachaPack(newPack);
  }

  closeModal('modal-admin-pack');
  renderAdminDashboard();
}

window.deleteAdminPack = async function() {
  const idVal = document.getElementById('admin-pack-modal-id').value;
  if (!idVal) return;
  showConfirmModal("ต้องการลบตู้สุ่มกาชานี้หรือไม่?", async () => {
    await dbLib.deleteGachaPack(idVal);
    closeModal('modal-admin-pack');
    renderAdminDashboard();
  });
};
