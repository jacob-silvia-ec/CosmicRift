import { Formation, GridPosition, PlayerHeroState, HeroDefinition } from '../types/game';
import { HERO_CATALOG, getHeroDefinition } from '../data/heroes';

// Calculate individual combat value of a hero based on stats, level, stars, and rarity
export function calculateHeroPower(heroId: string, heroes: Record<string, PlayerHeroState>): number {
  const def = getHeroDefinition(heroId);
  const state = heroes[heroId];
  if (!def || !state) return 0;

  const lvlMult = 1 + (state.level - 1) * 0.12;
  const starMult = 1 + (state.stars - 1) * 0.20;
  const rarityMult = def.rarity === '5-star' ? 1.35 : def.rarity === '4-star' ? 1.15 : 1.0;
  
  // Base stat weighting: HP contributes to survivability, ATK to DPS, DEF to damage mitigation
  const baseRating = def.baseStats.hp * 0.1 + def.baseStats.atk * 2.0 + def.baseStats.def * 1.6;
  return Math.round(baseRating * lvlMult * starMult * rarityMult);
}

// Generate all combinations of k items from array
function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const head = arr[0];
  const tail = arr.slice(1);
  const withHead = getCombinations(tail, k - 1).map((c) => [head, ...c]);
  const withoutHead = getCombinations(tail, k);
  return [...withHead, ...withoutHead];
}

// Score a candidate team of 5 heroes considering power, synergies, and role balance
function scoreTeam(heroIds: string[], heroes: Record<string, PlayerHeroState>): number {
  let totalPower = 0;
  const originCounts: Record<string, number> = {};
  const roleCounts: Record<string, number> = {};

  heroIds.forEach((id) => {
    totalPower += calculateHeroPower(id, heroes);
    const def = getHeroDefinition(id);
    if (def) {
      originCounts[def.origin] = (originCounts[def.origin] || 0) + 1;
      roleCounts[def.role] = (roleCounts[def.role] || 0) + 1;
    }
  });

  // Calculate Synergy Bonuses
  let synergyBonusPercent = 0;
  Object.values(originCounts).forEach((count) => {
    if (count >= 3) synergyBonusPercent += 35;
    else if (count >= 2) synergyBonusPercent += 15;
  });

  Object.values(roleCounts).forEach((count) => {
    if (count >= 2) synergyBonusPercent += 12;
  });

  // Role Composition Quality
  let compMultiplier = 1.0;
  const hasVanguard = (roleCounts['Vanguard'] || 0) >= 1;
  const hasHealer = (roleCounts['Cleric'] || 0) >= 1;
  const hasDps = (roleCounts['Striker'] || 0) + (roleCounts['Sniper'] || 0) + (roleCounts['Mystic'] || 0) >= 2;

  if (hasVanguard) compMultiplier += 0.12; // Frontline presence
  if (hasHealer) compMultiplier += 0.10;   // Sustain presence
  if (hasDps) compMultiplier += 0.12;      // DPS firepower

  return totalPower * (1 + synergyBonusPercent / 100) * compMultiplier;
}

// Map 5 chosen heroes to their mathematically optimal formation slots
export function mapHeroesToOptimalGrid(heroIds: string[]): Formation {
  const defs = heroIds.map((id) => getHeroDefinition(id)!).filter(Boolean);

  const formation: Formation = {
    'front-top': null,
    'front-bottom': null,
    'mid-top': null,
    'mid-bottom': null,
    'back-center': null,
  };

  const pool = [...defs];

  // 1. Assign Frontline (Front-Top and Front-Bottom):
  // Prioritize Vanguards first, then highest tankiness (HP + DEF * 2)
  pool.sort((a, b) => {
    const aIsVanguard = a.role === 'Vanguard' ? 1 : 0;
    const bIsVanguard = b.role === 'Vanguard' ? 1 : 0;
    if (aIsVanguard !== bIsVanguard) return bIsVanguard - aIsVanguard;
    const aTank = a.baseStats.hp + a.baseStats.def * 2.5;
    const bTank = b.baseStats.hp + b.baseStats.def * 2.5;
    return bTank - aTank;
  });

  if (pool.length > 0) formation['front-top'] = pool.shift()!.id;
  if (pool.length > 0) formation['front-bottom'] = pool.shift()!.id;

  // 2. Assign Backline (Back-Center):
  // Prioritize Snipers (who benefit most from +35% Crit Dmg), then Clerics (protected healer)
  pool.sort((a, b) => {
    const aScore = a.role === 'Sniper' ? 3 : a.role === 'Cleric' ? 2 : 1;
    const bScore = b.role === 'Sniper' ? 3 : b.role === 'Cleric' ? 2 : 1;
    if (aScore !== bScore) return bScore - aScore;
    return b.baseStats.critRate - a.baseStats.critRate;
  });

  if (pool.length > 0) formation['back-center'] = pool.shift()!.id;

  // 3. Assign Midline (Mid-Top and Mid-Bottom):
  // Strikers and Mystics thrive here from +15% Attack Speed for quick mana/burst
  if (pool.length > 0) formation['mid-top'] = pool.shift()!.id;
  if (pool.length > 0) formation['mid-bottom'] = pool.shift()!.id;

  return formation;
}

// Main optimization function: Finds best 5 heroes and places them in best formation
export function optimizePartyFormation(heroes: Record<string, PlayerHeroState>): {
  formation: Formation;
  teamHeroIds: string[];
  totalScore: number;
} {
  const unlockedIds = Object.keys(heroes);

  if (unlockedIds.length === 0) {
    return {
      formation: {
        'front-top': null,
        'front-bottom': null,
        'mid-top': null,
        'mid-bottom': null,
        'back-center': null,
      },
      teamHeroIds: [],
      totalScore: 0,
    };
  }

  // If 5 or fewer unlocked, use all available heroes
  if (unlockedIds.length <= 5) {
    const optimalFormation = mapHeroesToOptimalGrid(unlockedIds);
    return {
      formation: optimalFormation,
      teamHeroIds: unlockedIds,
      totalScore: scoreTeam(unlockedIds, heroes),
    };
  }

  // If more than 5 heroes unlocked, evaluate all combinations of 5 heroes
  const allCombos = getCombinations(unlockedIds, 5);

  let bestCombo = allCombos[0];
  let highestScore = scoreTeam(bestCombo, heroes);

  for (let i = 1; i < allCombos.length; i++) {
    const score = scoreTeam(allCombos[i], heroes);
    if (score > highestScore) {
      highestScore = score;
      bestCombo = allCombos[i];
    }
  }

  const optimalFormation = mapHeroesToOptimalGrid(bestCombo);

  return {
    formation: optimalFormation,
    teamHeroIds: bestCombo,
    totalScore: Math.round(highestScore),
  };
}
