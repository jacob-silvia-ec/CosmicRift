import { GameSaveData, Formation, PlayerHeroState } from '../types/game';
import { DEFAULT_STARTER_HERO_IDS } from '../data/heroes';
import { generateDailyQuests } from '../data/quests';

const STORAGE_KEY = 'cosmic_rift_save_v1';

export const INITIAL_FORMATION: Formation = {
  'front-top': 'gorgon-ironjaw',
  'front-bottom': 'valkyrie-rx',
  'mid-top': 'kaelen-blade',
  'mid-bottom': 'boba-slime',
  'back-center': 'lyra-ranger',
};

export function getInitialGameState(): GameSaveData {
  const initialHeroes: Record<string, PlayerHeroState> = {};
  DEFAULT_STARTER_HERO_IDS.forEach((id) => {
    initialHeroes[id] = {
      heroId: id,
      level: 1,
      stars: 1,
      duplicates: 0,
    };
  });

  return {
    version: 1,
    gold: 2500,
    astralShards: 500, // Enough for 5 initial pulls or early 10-pull with quests
    dimensionalRelics: 25,
    riftStage: 1,
    highestStage: 1,
    pityCounter: 30, // 30 pulls until guaranteed 5-star
    autoUltimates: true,
    combatSpeed: 1,
    isSoundMuted: false,
    heroes: initialHeroes,
    formation: INITIAL_FORMATION,
    constellations: {},
    dailyQuests: generateDailyQuests(),
    lastDailyReset: Date.now(),
    lastAfkClaimTimestamp: Date.now(),
    activeBoons: {},
    inRunExp: 0,
    inRunLevel: 1,
    totalSummonsPerformed: 0,
  };
}

export function loadGame(): GameSaveData {
  if (typeof window === 'undefined') return getInitialGameState();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialGameState();

    const data = JSON.parse(raw) as GameSaveData;
    const initial = getInitialGameState();

    // Check daily quest rollover (24 hours)
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    let dailyQuests = data.dailyQuests || initial.dailyQuests;
    let lastDailyReset = data.lastDailyReset || Date.now();

    if (Date.now() - lastDailyReset > ONE_DAY_MS) {
      dailyQuests = generateDailyQuests();
      lastDailyReset = Date.now();
    }

    return {
      ...initial,
      ...data,
      heroes: { ...initial.heroes, ...(data.heroes || {}) },
      formation: { ...initial.formation, ...(data.formation || {}) },
      dailyQuests,
      lastDailyReset,
      constellations: data.constellations || {},
      activeBoons: data.activeBoons || {},
    };
  } catch (e) {
    console.error('Failed to load save file, using defaults', e);
    return getInitialGameState();
  }
}

export function saveGame(state: GameSaveData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to write save file to localStorage', e);
  }
}

// Calculate idle AFK earnings based on elapsed time and highest stage
export function calculateAfkEarnings(
  lastClaimTime: number,
  highestStage: number,
  afkConstellationLevel: number = 0
) {
  const now = Date.now();
  const elapsedMs = Math.max(0, now - lastClaimTime);
  const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));

  // Base cap: 12 hours (720 min) + 60 min per 2 levels of constellation
  const maxMinutes = 720 + Math.floor(afkConstellationLevel / 2) * 60;
  const effectiveMinutes = Math.min(elapsedMinutes, maxMinutes);

  // Bonus factor from constellation
  const bonusMultiplier = 1 + afkConstellationLevel * 0.1;

  // Rates per minute
  const goldPerMin = Math.round((20 + highestStage * 6) * bonusMultiplier);
  const expPerMin = Math.round((12 + highestStage * 4) * bonusMultiplier);
  // Chance of finding dimensional relics
  const relicsAccumulated = Math.floor((effectiveMinutes / 30) * bonusMultiplier);

  const totalGold = effectiveMinutes * goldPerMin;
  const totalExp = effectiveMinutes * expPerMin;

  return {
    elapsedMinutes,
    effectiveMinutes,
    maxMinutes,
    totalGold,
    totalExp,
    totalRelics: relicsAccumulated,
  };
}
