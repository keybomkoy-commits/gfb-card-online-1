// Player Card Database (Templates)
export const CARD_TEMPLATES = [
  // Thai National Team Players (80-89)
  { id: 'chanathip', name: 'Chanathip S.', position: 'MF', ovr: 89, rarity: 'epic', stats: { pac: 88, sho: 83, pas: 89, dri: 92, def: 45, phy: 66 }, skill: 'Messi Jay', skillDesc: 'Boosts DRI +12 in the penalty box.' },
  { id: 'theerathon', name: 'Theerathon B.', position: 'DF', ovr: 88, rarity: 'epic', stats: { pac: 80, sho: 82, pas: 90, dri: 83, def: 85, phy: 78 }, skill: 'Devil Left', skillDesc: 'Boosts PAS +12 on long passes.' },
  { id: 'teerasil', name: 'Teerasil D.', position: 'FW', ovr: 87, rarity: 'epic', stats: { pac: 79, sho: 88, pas: 80, dri: 82, def: 38, phy: 80 }, skill: 'El Dangda', skillDesc: 'Boosts SHO +10 inside the box.' },
  { id: 'patiwat', name: 'Patiwat K.', position: 'GK', ovr: 85, rarity: 'epic', stats: { pac: 82, sho: 35, pas: 78, dri: 68, def: 86, phy: 80 }, skill: 'Khammai Save', skillDesc: 'Boosts GK +10 in 1v1 situations.' },
  { id: 'supachok', name: 'Supachok S.', position: 'FW', ovr: 85, rarity: 'epic', stats: { pac: 88, sho: 82, pas: 80, dri: 86, def: 40, phy: 70 }, skill: 'Chock Burst', skillDesc: 'Boosts PAC +10 on wing attacks.' },
  { id: 'supachai', name: 'Supachai C.', position: 'FW', ovr: 84, rarity: 'rare', stats: { pac: 80, sho: 84, pas: 72, dri: 79, def: 45, phy: 82 }, skill: 'Header King', skillDesc: 'Boosts SHO +10 on crosses.' },
  { id: 'mickelson', name: 'N. Mickelson', position: 'DF', ovr: 84, rarity: 'rare', stats: { pac: 87, sho: 65, pas: 79, dri: 80, def: 81, phy: 82 }, skill: 'Euro Runner', skillDesc: 'Boosts PAC +8 on defense counters.' },
  { id: 'sarach', name: 'Sarach Y.', position: 'MF', ovr: 83, rarity: 'rare', stats: { pac: 72, sho: 75, pas: 84, dri: 80, def: 76, phy: 74 }, skill: 'Tang Pass', skillDesc: 'Boosts PAS +8 in midfield.' },
  { id: 'kawin', name: 'Kawin T.', position: 'GK', ovr: 83, rarity: 'rare', stats: { pac: 79, sho: 30, pas: 70, dri: 62, def: 84, phy: 86 }, skill: 'Flying Kawin', skillDesc: 'Boosts GK +10 on leaping saves.' },
  { id: 'weerathep', name: 'Weerathep P.', position: 'MF', ovr: 82, rarity: 'rare', stats: { pac: 70, sho: 73, pas: 83, dri: 80, def: 78, phy: 75 }, skill: 'Golden Left', skillDesc: 'Boosts PAS +8 when under pressure.' },
  { id: 'elias', name: 'Elias D.', position: 'DF', ovr: 82, rarity: 'rare', stats: { pac: 60, sho: 48, pas: 65, dri: 60, def: 82, phy: 88 }, skill: 'Air Shield', skillDesc: 'Boosts PHY +10 on headers.' },
  { id: 'suphanat', name: 'Suphanat M.', position: 'FW', ovr: 84, rarity: 'rare', stats: { pac: 90, sho: 81, pas: 73, dri: 82, def: 35, phy: 70 }, skill: 'Baby Mueanta', skillDesc: 'Boosts PAC +10 in final third.' },
  { id: 'pansa', name: 'Pansa H.', position: 'DF', ovr: 81, rarity: 'rare', stats: { pac: 65, sho: 50, pas: 68, dri: 62, def: 83, phy: 85 }, skill: 'The Wall', skillDesc: 'Boosts DEF +8 on corner clearances.' },
  { id: 'kritsada', name: 'Kritsada K.', position: 'DF', ovr: 81, rarity: 'rare', stats: { pac: 74, sho: 63, pas: 79, dri: 75, def: 82, phy: 78 }, skill: 'Calm Shield', skillDesc: 'Boosts DEF +6 in box defense.' },

  // Global Legends (90+)
  { id: 'messi', name: 'Lionel Messi', position: 'FW', ovr: 93, rarity: 'legendary', stats: { pac: 85, sho: 92, pas: 90, dri: 94, def: 40, phy: 65 }, skill: 'Golden Touch', skillDesc: 'Boosts DRI +12 in the penalty box.' },
  { id: 'ronaldo', name: 'Cristiano Ronaldo', position: 'FW', ovr: 91, rarity: 'legendary', stats: { pac: 86, sho: 91, pas: 80, dri: 84, def: 35, phy: 80 }, skill: 'CR7 Header', skillDesc: 'Boosts SHO +15 on headers in the box.' },
  { id: 'mbappe', name: 'Kylian Mbappé', position: 'FW', ovr: 92, rarity: 'legendary', stats: { pac: 97, sho: 89, pas: 80, dri: 92, def: 36, phy: 78 }, skill: 'Sprint Burst', skillDesc: 'Boosts PAC +15 when dribbling on counter.' },
  { id: 'haaland', name: 'Erling Haaland', position: 'FW', ovr: 91, rarity: 'legendary', stats: { pac: 89, sho: 93, pas: 65, dri: 80, def: 45, phy: 88 }, skill: 'Power Shot', skillDesc: 'Boosts SHO +15 on shots from the box.' },
  { id: 'debruyne', name: 'Kevin De Bruyne', position: 'MF', ovr: 91, rarity: 'legendary', stats: { pac: 72, sho: 86, pas: 93, dri: 87, def: 65, phy: 75 }, skill: 'Laser Pass', skillDesc: 'Boosts PAS +12 when passing into defense.' },
  { id: 'bellingham', name: 'Jude Bellingham', position: 'MF', ovr: 90, rarity: 'legendary', stats: { pac: 79, sho: 85, pas: 83, dri: 88, def: 78, phy: 82 }, skill: 'Box to Box', skillDesc: 'Boosts DEF and PAS +8 in midfield battles.' },
  { id: 'rodri', name: 'Rodri', position: 'MF', ovr: 91, rarity: 'legendary', stats: { pac: 66, sho: 73, pas: 86, dri: 80, def: 89, phy: 85 }, skill: 'Anchor Tackle', skillDesc: 'Boosts DEF +12 when defending midfield.' },
  { id: 'vandijk', name: 'Virgil van Dijk', position: 'DF', ovr: 90, rarity: 'legendary', stats: { pac: 78, sho: 60, pas: 71, dri: 72, def: 90, phy: 86 }, skill: 'The Wall', skillDesc: 'Boosts DEF +15 when defending in the box.' },
  { id: 'courtois', name: 'Thibaut Courtois', position: 'GK', ovr: 90, rarity: 'legendary', stats: { pac: 85, sho: 46, pas: 74, dri: 70, def: 90, phy: 88 }, skill: 'Golden Glove', skillDesc: 'Boosts GK +15 on goal-bound shots.' },

  // Other Global Players
  { id: 'salah', name: 'Mohamed Salah', position: 'FW', ovr: 89, rarity: 'epic', stats: { pac: 93, sho: 87, pas: 82, dri: 88, def: 45, phy: 75 }, skill: 'Pharaoh Run', skillDesc: 'Boosts DRI +8 when attacking from wings.' },
  { id: 'kane', name: 'Harry Kane', position: 'FW', ovr: 89, rarity: 'epic', stats: { pac: 69, sho: 90, pas: 84, dri: 82, def: 47, phy: 82 }, skill: 'Finishing Touch', skillDesc: 'Boosts SHO +10 on box shots.' },
  { id: 'vinicius', name: 'Vinícius Jr.', position: 'FW', ovr: 89, rarity: 'epic', stats: { pac: 95, sho: 82, pas: 79, dri: 90, def: 29, phy: 68 }, skill: 'Samba Dribble', skillDesc: 'Boosts DRI +10 when challenging defenders.' },
  { id: 'maguire', name: 'Harry Maguire', position: 'DF', ovr: 79, rarity: 'common', stats: { pac: 50, sho: 55, pas: 65, dri: 60, def: 78, phy: 82 }, skill: 'Slabhead', skillDesc: 'Boosts PHY +8, PAC -5.' },
  { id: 'karius', name: 'Loris Karius', position: 'GK', ovr: 72, rarity: 'common', stats: { pac: 70, sho: 32, pas: 60, dri: 58, def: 71, phy: 70 }, skill: 'Butter Finger', skillDesc: 'Chance to slip GK -10.' }
];;

// Generate an instance of a card with a unique ID
export function createCardInstance(templateId) {
  const template = CARD_TEMPLATES.find(c => c.id === templateId);
  if (!template) return null;
  return {
    id: 'inst_' + Math.random().toString(36).substr(2, 9),
    templateId: template.id,
    name: template.name,
    position: template.position,
    ovr: template.ovr,
    rarity: template.rarity,
    stats: { ...template.stats },
    skill: template.skill,
    skillDesc: template.skillDesc,
    imageUrl: template.imageUrl || '',
    banMatches: 0,
    yellowCards: 0
  };
}

// Draw cards from dynamic gacha pack config
export function openPack(pack) {
  const rates = pack.rates || { legendary: 5, epic: 15, rare: 30, common: 50 };

  const selectRarity = () => {
    const r = Math.random() * 100;
    let accum = 0;
    
    accum += rates.legendary || 0;
    if (r < accum) return 'legendary';
    accum += rates.epic || 0;
    if (r < accum) return 'epic';
    accum += rates.rare || 0;
    if (r < accum) return 'rare';
    return 'common';
  };

  const rarity = selectRarity();
  let filtered = CARD_TEMPLATES.filter(c => c.rarity === rarity);
  if (filtered.length === 0) filtered = CARD_TEMPLATES; // fallback

  const template = filtered[Math.floor(Math.random() * filtered.length)];
  return createCardInstance(template.id);
}

// Calculate team OVR from current starting squad
export function calculateTeamOVR(squad, inventory) {
  if (!squad || !squad.slots) return 0;
  let total = 0;
  let count = 0;
  
  for (const slotKey in squad.slots) {
    const instId = squad.slots[slotKey];
    if (instId) {
      const card = inventory.find(c => c.id === instId);
      if (card) {
        total += card.ovr;
        count++;
      }
    }
  }
  return count > 0 ? Math.round(total / count) : 0;
}

// Auto builder algorithm
export function autoBuildSquad(inventory, formation = '4-3-3') {
  // Reset all assignments
  const slots = {};
  const bench = [];

  // Filter out banned cards
  const available = inventory.filter(c => !c.banMatches || c.banMatches <= 0);

  // Group by position
  const gks = available.filter(c => c.position === 'GK').sort((a, b) => b.ovr - a.ovr);
  const dfs = available.filter(c => c.position === 'DF').sort((a, b) => b.ovr - a.ovr);
  const mfs = available.filter(c => c.position === 'MF').sort((a, b) => b.ovr - a.ovr);
  const fws = available.filter(c => c.position === 'FW').sort((a, b) => b.ovr - a.ovr);

  // Formations breakdown
  let dfCount = 4, mfCount = 3, fwCount = 3;
  if (formation === '4-4-2') {
    dfCount = 4; mfCount = 4; fwCount = 2;
  } else if (formation === '3-5-2') {
    dfCount = 3; mfCount = 5; fwCount = 2;
  }

  // Helper to assign or push to remaining pool
  const assignedIds = new Set();

  // Goalkeeper
  if (gks.length > 0) {
    slots['gk'] = gks[0].id;
    assignedIds.add(gks[0].id);
  } else {
    slots['gk'] = null;
  }

  // Defenders
  for (let i = 1; i <= dfCount; i++) {
    const slotName = `df${i}`;
    if (dfs[i - 1]) {
      slots[slotName] = dfs[i - 1].id;
      assignedIds.add(dfs[i - 1].id);
    } else {
      slots[slotName] = null;
    }
  }

  // Midfielders
  for (let i = 1; i <= mfCount; i++) {
    const slotName = `mf${i}`;
    if (mfs[i - 1]) {
      slots[slotName] = mfs[i - 1].id;
      assignedIds.add(mfs[i - 1].id);
    } else {
      slots[slotName] = null;
    }
  }

  // Forwards
  for (let i = 1; i <= fwCount; i++) {
    const slotName = `fw${i}`;
    if (fws[i - 1]) {
      slots[slotName] = fws[i - 1].id;
      assignedIds.add(fws[i - 1].id);
    } else {
      slots[slotName] = null;
    }
  }

  // Fill bench with next best unassigned cards
  const remaining = available
    .filter(c => !assignedIds.has(c.id))
    .sort((a, b) => b.ovr - a.ovr);

  for (let i = 0; i < Math.min(3, remaining.length); i++) {
    bench.push(remaining[i].id);
  }

  return { formation, slots, bench };
}

// Bot Match Squad Maker based on famous teams
export function generateBotSquad(teamKey) {
  let username = "AI Bot";
  let teamOvr = 80;
  let templates = [];
  
  if (teamKey === 'leicester') {
    username = "Leicester City (EASY)";
    teamOvr = 78;
    templates = [
      { id: 'gk_lei', name: 'M. Hermansen', position: 'GK', ovr: 78, stats: { pac: 75, sho: 20, pas: 70, dri: 65, def: 78, phy: 75 } },
      { id: 'df1_lei', name: 'W. Faes', position: 'DF', ovr: 78, stats: { pac: 68, sho: 40, pas: 65, dri: 62, def: 80, phy: 80 } },
      { id: 'df2_lei', name: 'J. Vestergaard', position: 'DF', ovr: 77, stats: { pac: 50, sho: 45, pas: 70, dri: 60, def: 78, phy: 84 } },
      { id: 'df3_lei', name: 'R. Pereira', position: 'DF', ovr: 79, stats: { pac: 80, sho: 65, pas: 78, dri: 79, def: 77, phy: 72 } },
      { id: 'df4_lei', name: 'J. Justin', position: 'DF', ovr: 76, stats: { pac: 82, sho: 55, pas: 71, dri: 73, def: 75, phy: 74 } },
      { id: 'mf1_lei', name: 'H. Winks', position: 'MF', ovr: 79, stats: { pac: 66, sho: 65, pas: 82, dri: 77, def: 75, phy: 70 } },
      { id: 'mf2_lei', name: 'W. Ndidi', position: 'MF', ovr: 78, stats: { pac: 70, sho: 62, pas: 70, dri: 74, def: 80, phy: 82 } },
      { id: 'mf3_lei', name: 'B. Soumaré', position: 'MF', ovr: 76, stats: { pac: 72, sho: 60, pas: 74, dri: 75, def: 74, phy: 76 } },
      { id: 'fw1_lei', name: 'J. Vardy', position: 'FW', ovr: 79, stats: { pac: 80, sho: 81, pas: 68, dri: 74, def: 40, phy: 73 } },
      { id: 'fw2_lei', name: 'S. Mavididi', position: 'FW', ovr: 77, stats: { pac: 85, sho: 74, pas: 70, dri: 79, def: 35, phy: 68 } },
      { id: 'fw3_lei', name: 'A. Fatawu', position: 'FW', ovr: 76, stats: { pac: 88, sho: 72, pas: 69, dri: 78, def: 38, phy: 65 } }
    ];
  } else if (teamKey === 'chelsea') {
    username = "Chelsea FC (MEDIUM)";
    teamOvr = 84;
    templates = [
      { id: 'gk_che', name: 'R. Sánchez', position: 'GK', ovr: 81, stats: { pac: 80, sho: 25, pas: 74, dri: 68, def: 82, phy: 78 } },
      { id: 'df1_che', name: 'L. Colwill', position: 'DF', ovr: 80, stats: { pac: 72, sho: 45, pas: 70, dri: 68, def: 81, phy: 78 } },
      { id: 'df2_che', name: 'W. Fofana', position: 'DF', ovr: 81, stats: { pac: 78, sho: 48, pas: 66, dri: 69, def: 82, phy: 80 } },
      { id: 'df3_che', name: 'M. Gusto', position: 'DF', ovr: 82, stats: { pac: 88, sho: 60, pas: 79, dri: 81, def: 79, phy: 76 } },
      { id: 'df4_che', name: 'M. Cucurella', position: 'DF', ovr: 82, stats: { pac: 79, sho: 58, pas: 77, dri: 78, def: 80, phy: 77 } },
      { id: 'mf1_che', name: 'M. Caicedo', position: 'MF', ovr: 84, stats: { pac: 79, sho: 65, pas: 80, dri: 81, def: 83, phy: 84 } },
      { id: 'mf2_che', name: 'Enzo F.', position: 'MF', ovr: 83, stats: { pac: 68, sho: 76, pas: 86, dri: 82, def: 74, phy: 75 } },
      { id: 'mf3_che', name: 'Cole Palmer', position: 'MF', ovr: 86, stats: { pac: 82, sho: 85, pas: 85, dri: 87, def: 52, phy: 70 }, skill: 'Ice Cold' },
      { id: 'fw1_che', name: 'N. Jackson', position: 'FW', ovr: 82, stats: { pac: 86, sho: 80, pas: 74, dri: 81, def: 42, phy: 79 } },
      { id: 'fw2_che', name: 'Jadon Sancho', position: 'FW', ovr: 81, stats: { pac: 78, sho: 74, pas: 80, dri: 85, def: 33, phy: 62 } },
      { id: 'fw3_che', name: 'Noni Madueke', position: 'FW', ovr: 81, stats: { pac: 87, sho: 78, pas: 72, dri: 84, def: 38, phy: 68 } }
    ];
  } else if (teamKey === 'mancity') {
    username = "Man City (HARD)";
    teamOvr = 90;
    templates = [
      { id: 'gk_mc', name: 'Ederson', position: 'GK', ovr: 88, stats: { pac: 86, sho: 40, pas: 90, dri: 75, def: 88, phy: 82 } },
      { id: 'df1_mc', name: 'Rúben Dias', position: 'DF', ovr: 89, stats: { pac: 66, sho: 38, pas: 66, dri: 68, def: 89, phy: 87 } },
      { id: 'df2_mc', name: 'Manuel Akanji', position: 'DF', ovr: 84, stats: { pac: 80, sho: 50, pas: 76, dri: 75, def: 84, phy: 82 } },
      { id: 'df3_mc', name: 'Kyle Walker', position: 'DF', ovr: 84, stats: { pac: 92, sho: 63, pas: 77, dri: 78, def: 82, phy: 81 } },
      { id: 'df4_mc', name: 'Josko Gvardiol', position: 'DF', ovr: 85, stats: { pac: 78, sho: 68, pas: 80, dri: 81, def: 84, phy: 80 } },
      { id: 'mf1_mc', name: 'Rodri', position: 'MF', ovr: 91, stats: { pac: 66, sho: 73, pas: 86, dri: 80, def: 89, phy: 85 }, skill: 'Anchor Tackle' },
      { id: 'mf2_mc', name: 'K. De Bruyne', position: 'MF', ovr: 91, stats: { pac: 72, sho: 86, pas: 93, dri: 87, def: 65, phy: 75 }, skill: 'Laser Pass' },
      { id: 'mf3_mc', name: 'Bernardo Silva', position: 'MF', ovr: 87, stats: { pac: 76, sho: 78, pas: 86, dri: 90, def: 72, phy: 68 } },
      { id: 'fw1_mc', name: 'Erling Haaland', position: 'FW', ovr: 91, stats: { pac: 89, sho: 93, pas: 65, dri: 80, def: 45, phy: 88 }, skill: 'Power Shot' },
      { id: 'fw2_mc', name: 'Phil Foden', position: 'FW', ovr: 88, stats: { pac: 84, sho: 84, pas: 86, dri: 89, def: 56, phy: 66 } },
      { id: 'fw3_mc', name: 'Jérémy Doku', position: 'FW', ovr: 82, stats: { pac: 93, sho: 72, pas: 74, dri: 88, def: 30, phy: 63 } }
    ];
  } else {
    username = "Real Madrid (NIGHTMARE)";
    teamOvr = 92;
    teamKey = 'realmadrid';
    templates = [
      { id: 'gk_rm', name: 'Thibaut Courtois', position: 'GK', ovr: 90, stats: { pac: 85, sho: 46, pas: 74, dri: 70, def: 90, phy: 88 }, skill: 'Golden Glove' },
      { id: 'df1_rm', name: 'Antonio Rüdiger', position: 'DF', ovr: 88, stats: { pac: 82, sho: 53, pas: 71, dri: 72, def: 88, phy: 86 } },
      { id: 'df2_rm', name: 'Éder Militão', position: 'DF', ovr: 86, stats: { pac: 84, sho: 50, pas: 68, dri: 70, def: 85, phy: 82 }, skill: 'Acrobatic Clear' },
      { id: 'df3_rm', name: 'Dani Carvajal', position: 'DF', ovr: 86, stats: { pac: 80, sho: 60, pas: 78, dri: 80, def: 85, phy: 82 } },
      { id: 'df4_rm', name: 'Ferland Mendy', position: 'DF', ovr: 82, stats: { pac: 90, sho: 60, pas: 74, dri: 78, def: 81, phy: 84 } },
      { id: 'mf1_rm', name: 'Jude Bellingham', position: 'MF', ovr: 90, stats: { pac: 79, sho: 85, pas: 83, dri: 88, def: 78, phy: 82 }, skill: 'Box to Box' },
      { id: 'mf2_rm', name: 'Fede Valverde', position: 'MF', ovr: 88, stats: { pac: 88, sho: 80, pas: 84, dri: 83, def: 78, phy: 80 }, skill: 'Falcon Shot' },
      { id: 'mf3_rm', name: 'A. Tchouaméni', position: 'MF', ovr: 84, stats: { pac: 70, sho: 68, pas: 79, dri: 77, def: 82, phy: 83 } },
      { id: 'fw1_rm', name: 'Kylian Mbappé', position: 'FW', ovr: 92, stats: { pac: 97, sho: 89, pas: 80, dri: 92, def: 36, phy: 78 }, skill: 'Sprint Burst' },
      { id: 'fw2_rm', name: 'Vinícius Jr.', position: 'FW', ovr: 89, stats: { pac: 95, sho: 82, pas: 79, dri: 90, def: 29, phy: 68 }, skill: 'Samba Dribble' },
      { id: 'fw3_rm', name: 'Rodrygo', position: 'FW', ovr: 86, stats: { pac: 89, sho: 82, pas: 80, dri: 88, def: 32, phy: 60 } }
    ];
  }

  const botInventory = templates.map(t => {
    return {
      id: 'bot_' + t.id + '_' + Math.random().toString(36).substr(2, 5),
      templateId: t.id,
      name: t.name,
      position: t.position,
      ovr: t.ovr,
      rarity: t.ovr >= 90 ? 'legendary' : t.ovr >= 85 ? 'epic' : 'rare',
      stats: { ...t.stats },
      skill: t.skill || 'No Skill',
      skillDesc: t.skillDesc || '',
      banMatches: 0,
      yellowCards: 0
    };
  });

  const slots = {
    gk: botInventory[0].id,
    df1: botInventory[1].id,
    df2: botInventory[2].id,
    df3: botInventory[3].id,
    df4: botInventory[4].id,
    mf1: botInventory[5].id,
    mf2: botInventory[6].id,
    mf3: botInventory[7].id,
    fw1: botInventory[8].id,
    fw2: botInventory[9].id,
    fw3: botInventory[10].id
  };

  return {
    username,
    teamOvr,
    squad: {
      formation: '4-3-3',
      slots,
      bench: []
    },
    inventory: botInventory
  };
}

// Single-tick Match Simulation Engine
// Computes outcomes, updates score, logs, ball positions, and handles fouls/cards
export function simulateMatchTick(match) {
  const updated = JSON.parse(JSON.stringify(match)); // deep copy

  if (updated.status !== 'playing') return updated;

  // Advance match timer
  updated.minute += 3;

  // Handle First Half end with Injury Time
  if (updated.currentHalf === 1) {
    if (updated.minute >= 45) {
      if (updated.injuryTime === undefined || updated.injuryTime === null) {
        // Calculate injury time based on fouls/goals
        const eventCount = updated.logs.filter(l => l.min <= 45 && (l.type === 'goal' || l.type === 'foul' || l.type === 'save')).length;
        const added = Math.min(6, Math.max(1, Math.floor(Math.random() * 2) + 1 + Math.floor(eventCount / 3)));
        updated.injuryTime = added;
        updated.logs.push({
          min: 45,
          text: `[ทดเวลา] ⏱️ ผู้ตัดสินที่สี่ชี้ป้ายทดเวลาบาดเจ็บครึ่งแรกเพิ่มอีก +${added} นาที!`,
          type: 'info'
        });
      }
      
      if (updated.minute >= 45 + updated.injuryTime) {
        updated.status = 'halftime';
        updated.timerEnd = Date.now() + 30000;
        updated.logs.push({
          min: 45,
          text: "=== พักครึ่งเวลา! ผู้ตัดสินเป่านกหวีดหมดครึ่งแรก สามารถปรับเปลี่ยนแผนการเล่นและเปลี่ยนตัวผู้เล่นสำรองได้ (มีเวลา 30 วินาที) ===",
          type: 'whistle'
        });
        updated.injuryTime = null; // reset for second half
        return updated;
      }
    }
  }

  // Handle Second Half end with Injury Time
  if (updated.currentHalf === 2) {
    if (updated.minute >= 90) {
      if (updated.injuryTime === undefined || updated.injuryTime === null) {
        // Calculate injury time based on fouls/goals in 2nd half
        const eventCount = updated.logs.filter(l => l.min > 45 && l.min <= 90 && (l.type === 'goal' || l.type === 'foul' || l.type === 'save')).length;
        const added = Math.min(6, Math.max(1, Math.floor(Math.random() * 2) + 2 + Math.floor(eventCount / 3)));
        updated.injuryTime = added;
        updated.logs.push({
          min: 90,
          text: `[ทดเวลา] ⏱️ ผู้ตัดสินที่สี่ชี้ป้ายทดเวลาบาดเจ็บครึ่งหลังเพิ่มอีก +${added} นาที!`,
          type: 'info'
        });
      }
      
      if (updated.minute >= 90 + updated.injuryTime) {
        updated.status = 'finished';
        const scoreP1 = updated.players.p1.score;
        const scoreP2 = updated.players.p2.score;

        let matchWinner = null;
        let text = "";
        if (scoreP1 > scoreP2) {
          matchWinner = 'p1';
          text = `=== จบการแข่งขัน! ${updated.players.p1.username} เอาชนะ ${scoreP1}-${scoreP2}! ===`;
        } else if (scoreP2 > scoreP1) {
          matchWinner = 'p2';
          text = `=== จบการแข่งขัน! ${updated.players.p2.username} เอาชนะ ${scoreP2}-${scoreP1}! ===`;
        } else {
          text = `=== จบการแข่งขัน! เสมอกันไปอย่างสุดมันส์ด้วยสกอร์ ${scoreP1}-${scoreP2}! ===`;
        }

        updated.winner = matchWinner;
        updated.logs.push({ min: 90, text: text, type: 'whistle' });
        updated.injuryTime = null; // reset
        return updated;
      }
    }
  }

  // --- GAME EVENTS SIMULATION TICK ---
  const attackingPlayerKey = updated.possession; // 'p1' or 'p2'
  const defendingPlayerKey = attackingPlayerKey === 'p1' ? 'p2' : 'p1';

  const atkUser = updated.players[attackingPlayerKey];
  const defUser = updated.players[defendingPlayerKey];

  // Get active cards on field for specific positions
  const getCardsByPosition = (playerData, pos) => {
    const list = [];
    if (!playerData.squad || !playerData.squad.slots) return list;
    for (const key in playerData.squad.slots) {
      const instId = playerData.squad.slots[key];
      if (instId && key.startsWith(pos.toLowerCase())) {
        const card = playerData.squad.slots[key]; // inside match slots, we store the full card details or instance
        // Look up in match inventory
        if (playerData.inventory) {
          const found = playerData.inventory.find(c => c.id === instId);
          if (found && (!found.ejected)) {
            list.push(found);
          }
        }
      }
    }
    // Fallback: if no players or all ejected, make a fake 10 OVR player
    if (list.length === 0) {
      list.push({ name: 'Backup Player', ovr: 30, stats: { pac: 30, sho: 30, pas: 30, dri: 30, def: 30, phy: 30 } });
    }
    return list;
  };

  const getGoalkeeper = (playerData) => {
    if (playerData.squad && playerData.squad.slots && playerData.squad.slots.gk) {
      const instId = playerData.squad.slots.gk;
      const found = playerData.inventory.find(c => c.id === instId);
      if (found && !found.ejected) return found;
    }
    return { name: 'Emergency GK', ovr: 40, stats: { pac: 40, sho: 20, pas: 40, dri: 40, def: 40, phy: 40 } };
  };

  const selectRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Match event depends on ball zone
  // Zones: 'gk1' (P1's Goal), 'df1' (P1's defense), 'mf' (Midfield), 'df2' (P2's defense), 'gk2' (P2's Goal)
  // Possession: if p1 possesses, they attack from left to right: mf -> df2 -> gk2 -> Goal!
  // If p2 possesses, they attack from right to left: mf -> df1 -> gk1 -> Goal!

  const zoneLogs = [];

  if (updated.ballZone === 'mf') {
    // MIDFIELD BATTLE
    const atkMFs = getCardsByPosition(atkUser, 'MF');
    const defMFs = getCardsByPosition(defUser, 'MF');

    const activeAtk = selectRandom(atkMFs);
    const activeDef = selectRandom(defMFs);

    const atkRoll = (activeAtk.stats.pas + activeAtk.stats.dri) / 2 * (0.8 + Math.random() * 0.4);
    const defRoll = (activeDef.stats.def + activeDef.stats.phy) / 2 * (0.8 + Math.random() * 0.4);

    // Skill trigger checking
    let skillText = "";
    let atkSkillBonus = 0;
    let defSkillBonus = 0;

    if (activeAtk.skill === 'Box to Box' || activeAtk.skill === 'Visionary') {
      atkSkillBonus = 8;
      skillText = ` ✨ [${activeAtk.name}] ใช้สกิลพิเศษ [${activeAtk.skill}]!`;
    }
    if (activeDef.skill === 'Anchor Tackle' || activeDef.skill === 'Box to Box') {
      defSkillBonus = 8;
      skillText = ` ✨ [${activeDef.name}] ใช้สกิลพิเศษ [${activeDef.skill}]!`;
    }

    if (atkRoll + atkSkillBonus > defRoll + defSkillBonus) {
      // Attacker wins and passes ball forward
      updated.ballZone = attackingPlayerKey === 'p1' ? 'df2' : 'df1';
      updated.logs.push({
        min: updated.minute,
        text: `[แดนกลาง] ${activeAtk.name} ชนะการปะทะในแดนกลางและจ่ายทะลุช่องไปแดนหน้าอย่างสวยงาม${skillText}`,
        type: 'pass'
      });
    } else {
      // Defender intercepts and takes possession
      updated.possession = defendingPlayerKey;
      updated.logs.push({
        min: updated.minute,
        text: `[แดนกลาง] ${activeDef.name} เข้าสกัดบอลและแย่งการครอบครองบอลกลับมาให้ทีม ${defUser.username}${skillText}`,
        type: 'tackle'
      });

      // Small chance of foul on tackle
      rollFoulChance(updated, activeDef, defendingPlayerKey);
    }

  } else if (updated.ballZone === 'df1' || updated.ballZone === 'df2') {
    // ATTACKING DEFENSE ZONE
    // e.g. p1 has ball in df2 (attacking p2's half)
    const targetDefendingZone = attackingPlayerKey === 'p1' ? 'df2' : 'df1';
    
    const atkFWs = getCardsByPosition(atkUser, 'FW');
    const defDFs = getCardsByPosition(defUser, 'DF');

    const activeAtk = selectRandom(atkFWs);
    const activeDef = selectRandom(defDFs);

    const atkRoll = (activeAtk.stats.dri + activeAtk.stats.pac) / 2 * (0.8 + Math.random() * 0.4);
    const defRoll = (activeDef.stats.def + activeDef.stats.phy) / 2 * (0.8 + Math.random() * 0.4);

    let skillText = "";
    let atkSkillBonus = 0;
    let defSkillBonus = 0;

    if (activeAtk.skill === 'Sprint Burst' || activeAtk.skill === 'Samba Dribble' || activeAtk.skill === 'Pharaoh Run') {
      atkSkillBonus = 12;
      skillText = ` ✨ [${activeAtk.name}] ใช้สกิลพิเศษ [${activeAtk.skill}]!`;
    }
    if (activeDef.skill === 'The Wall' || activeDef.skill === 'Calm Tackle' || activeDef.skill === 'Commander') {
      defSkillBonus = 12;
      skillText = ` ✨ [${activeDef.name}] ใช้สกิลพิเศษ [${activeDef.skill}]!`;
    }

    if (atkRoll + atkSkillBonus > defRoll + defSkillBonus) {
      // Passes/Dribbles past defender, advances to goalkeeper zone
      updated.ballZone = attackingPlayerKey === 'p1' ? 'gk2' : 'gk1';
      updated.logs.push({
        min: updated.minute,
        text: `[แดนหน้า] ${activeAtk.name} เลี้ยงหลบกองหลัง ${activeDef.name} เข้าสู่พื้นที่อันตรายแล้ว!${skillText}`,
        type: 'dribble'
      });
    } else {
      // Defended! Ball cleared to Midfield, possession switches
      updated.ballZone = 'mf';
      updated.possession = defendingPlayerKey;
      updated.logs.push({
        min: updated.minute,
        text: `[แดนหลัง] สกัดได้! ${activeDef.name} สไลด์สกัดบอลจาก ${activeAtk.name} ได้อย่างเด็ดขาดและสกัดบอลเคลียร์ขึ้นมาแดนกลาง${skillText}`,
        type: 'tackle'
      });

      // Regular check for fouls in defending zone (higher chance)
      rollFoulChance(updated, activeDef, defendingPlayerKey, 0.08);
    }

  } else if (updated.ballZone === 'gk1' || updated.ballZone === 'gk2') {
    // SHOOTING CHANCE
    const atkFWs = getCardsByPosition(atkUser, 'FW');
    const gk = getGoalkeeper(defUser);

    const activeAtk = selectRandom(atkFWs);

    const atkRoll = activeAtk.stats.sho * (0.75 + Math.random() * 0.5);
    const defRoll = gk.ovr * (0.75 + Math.random() * 0.5); // use gk OVR rating

    let skillText = "";
    let atkSkillBonus = 0;
    let defSkillBonus = 0;

    if (activeAtk.skill === 'Power Shot' || activeAtk.skill === 'CR7 Header' || activeAtk.skill === 'Finishing Touch') {
      atkSkillBonus = 15;
      skillText = ` ✨ [${activeAtk.name}] ใช้สกิลพิเศษ [${activeAtk.skill}]!`;
    }
    if (gk.skill === 'Golden Glove' || gk.skill === 'Reflex Save' || gk.skill === '1v1 Rush') {
      defSkillBonus = 15;
      skillText = ` ✨ [${gk.name}] ใช้สกิลพิเศษ [${gk.skill}]!`;
    }

    if (atkRoll + atkSkillBonus > defRoll + defSkillBonus) {
      // GOAL!
      atkUser.score++;
      updated.ballZone = 'mf';
      // Kickoff possession goes to defender
      updated.possession = defendingPlayerKey;

      updated.logs.push({
        min: updated.minute,
        text: `⚽ GOAL!!! ${activeAtk.name} สับไกยิงเต็มข้อ บอลพุ่งแสกหน้าผู้รักษาประตูเสียบก้นตาข่ายอย่างงดงาม! ทีมของ ${atkUser.username} ยิงประตูได้!${skillText}`,
        type: 'goal'
      });
    } else {
      // SAVE! Ball cleared to midfield, possession switches to defender
      updated.ballZone = 'mf';
      updated.possession = defendingPlayerKey;
      
      updated.logs.push({
        min: updated.minute,
        text: `🧤 ซุปเปอร์เซฟ! ${gk.name} บินปัดยอดลูกยิงเหนือกรงเล็บจาก ${activeAtk.name} ได้หวุดหวิดสุดๆ!${skillText}`,
        type: 'save'
      });
    }
  }

  return updated;
}

// Roll for a foul, apply yellow/red cards in simulation
function rollFoulChance(match, defendingCard, playerKey, baseChance = 0.04) {
  // If card is already a mock backup player, skip
  if (defendingCard.name === 'Backup Player') return;

  const r = Math.random();
  if (r < baseChance) {
    // A foul happened!
    const isRed = Math.random() < 0.15; // 15% red card, 85% yellow card
    
    // Find card inside match player inventory to mark cards
    const playerObj = match.players[playerKey];
    const cardInst = playerObj.inventory.find(c => c.id === defendingCard.id);
    
    if (cardInst) {
      if (isRed) {
        cardInst.ejected = true;
        // Save ban event
        match.banEvents.push({
          playerKey: playerKey,
          cardId: cardInst.id,
          type: 'red',
          cardName: cardInst.name
        });
        match.logs.push({
          min: match.minute,
          text: `🟥 ใบแดงโดยตรง! ${defendingCard.name} สกัดขาคู่รุนแรงเกินกว่าเหตุ ผู้ตัดสินชูใบแดงไล่ออกจากสนามทันที!`,
          type: 'foul'
        });
      } else {
        cardInst.yellowCards = (cardInst.yellowCards || 0) + 1;
        if (cardInst.yellowCards >= 2) {
          cardInst.ejected = true;
          match.banEvents.push({
            playerKey: playerKey,
            cardId: cardInst.id,
            type: 'double_yellow',
            cardName: cardInst.name
          });
          match.logs.push({
            min: match.minute,
            text: `🟨🟥 ใบเหลืองที่สองกลายเป็นใบแดง! ${defendingCard.name} ได้รับโทษซ้ำและถูกไล่ออกจากสนาม!`,
            type: 'foul'
          });
        } else {
          match.banEvents.push({
            playerKey: playerKey,
            cardId: cardInst.id,
            type: 'yellow',
            cardName: cardInst.name
          });
          match.logs.push({
            min: match.minute,
            text: `🟨 ใบเหลือง! กรรมการเป่าฟาวล์พร้อมแจกใบเหลืองคาดโทษแก่ ${defendingCard.name}`,
            type: 'foul'
          });
        }
      }
    }
  }
}

// Generate starting squad of 11 players + 3 substitutes prioritizing Thai National Team players
export function getStartingThaiSquad() {
  const ids = [
    'patiwat',    // GK
    'mickelson',  // DF 1
    'theerathon', // DF 2
    'pansa',      // DF 3
    'elias',      // DF 4
    'chanathip',  // MF 1
    'sarach',     // MF 2
    'weerathep',  // MF 3
    'teerasil',   // FW 1
    'supachok',   // FW 2
    'supachai',   // FW 3
    // Substitutes
    'kawin',      // GK sub
    'kritsada',   // DF sub
    'suphanat'    // FW sub
  ];
  
  const inventory = ids.map(id => createCardInstance(id));
  
  const gk = inventory[0].id;
  const df1 = inventory[1].id;
  const df2 = inventory[2].id;
  const df3 = inventory[3].id;
  const df4 = inventory[4].id;
  const mf1 = inventory[5].id;
  const mf2 = inventory[6].id;
  const mf3 = inventory[7].id;
  const fw1 = inventory[8].id;
  const fw2 = inventory[9].id;
  const fw3 = inventory[10].id;

  const bench = [
    inventory[11].id,
    inventory[12].id,
    inventory[13].id
  ];

  return {
    inventory,
    squad: {
      formation: '4-3-3',
      slots: { gk, df1, df2, df3, df4, mf1, mf2, mf3, fw1, fw2, fw3 },
      bench
    }
  };
}
