import {
  Combatant,
  Formation,
  GridPosition,
  PlayerHeroState,
  InRunBoon,
  FloatingText,
} from '../types/game';
import { getHeroDefinition } from '../data/heroes';
import { ORIGIN_SYNERGIES, ROLE_SYNERGIES } from '../data/synergies';
import { CONSTELLATION_NODES } from '../data/constellations';

// Calculate team synergies from active assigned heroes
export function calculateActiveSynergies(
  formation: Formation,
  heroes: Record<string, PlayerHeroState>
) {
  const originCounts: Record<string, number> = {};
  const roleCounts: Record<string, number> = {};

  const assignedHeroIds = Object.values(formation).filter(Boolean) as string[];

  assignedHeroIds.forEach((id) => {
    const def = getHeroDefinition(id);
    if (!def) return;
    originCounts[def.origin] = (originCounts[def.origin] || 0) + 1;
    roleCounts[def.role] = (roleCounts[def.role] || 0) + 1;
  });

  const activeOrigins = ORIGIN_SYNERGIES.map((syn) => {
    const count = originCounts[syn.id] || 0;
    const activeTier = syn.tiers
      .filter((t) => count >= t.count)
      .sort((a, b) => b.count - a.count)[0];
    return {
      definition: syn,
      count,
      activeTier: activeTier || null,
    };
  }).filter((s) => s.activeTier !== null);

  const activeRoles = ROLE_SYNERGIES.map((syn) => {
    const count = roleCounts[syn.id] || 0;
    const activeTier = syn.tiers
      .filter((t) => count >= t.count)
      .sort((a, b) => b.count - a.count)[0];
    return {
      definition: syn,
      count,
      activeTier: activeTier || null,
    };
  }).filter((s) => s.activeTier !== null);

  return { activeOrigins, activeRoles, originCounts, roleCounts };
}

// Instantiate friendly combatants from formation with full stat bonuses
export function createFriendlyCombatants(
  formation: Formation,
  heroes: Record<string, PlayerHeroState>,
  activeBoons: Record<string, number>,
  constellations: Record<string, number>
): Combatant[] {
  const combatants: Combatant[] = [];
  const { activeOrigins, activeRoles } = calculateActiveSynergies(formation, heroes);

  // Collect constellation bonus percents
  let constellationHpBonus = 0;
  let constellationAtkBonus = 0;
  let constellationDefBonus = 0;
  let constellationCritBonus = 0;

  CONSTELLATION_NODES.forEach((node) => {
    const lvl = constellations[node.id] || 0;
    if (lvl <= 0) return;
    if (node.statKey === 'hp') constellationHpBonus += lvl * node.valuePerLevel;
    if (node.statKey === 'atk') constellationAtkBonus += lvl * node.valuePerLevel;
    if (node.statKey === 'def') constellationDefBonus += lvl * node.valuePerLevel;
    if (node.statKey === 'critRate') constellationCritBonus += (lvl * node.valuePerLevel) / 100;
  });

  // Collect active boon bonuses
  let boonHpPercent = 0;
  let boonAtkPercent = 0;
  let boonCritRate = 0;
  let boonSpdPercent = 0;

  Object.entries(activeBoons).forEach(([boonId, lvl]) => {
    if (boonId === 'titans-might') boonAtkPercent += lvl * 20;
    if (boonId === 'hyper-vitality') boonHpPercent += lvl * 25;
    if (boonId === 'stellar-precision') boonCritRate += lvl * 0.15;
    if (boonId === 'chrono-haste') boonSpdPercent += lvl * 20;
    if (boonId === 'overcharge-capacitor') boonSpdPercent += lvl * 10;
  });

  // Collect synergy bonuses
  let synergyHpPercent = 0;
  let synergyAtkPercent = 0;
  let synergyCritRate = 0;
  let initialShieldPercent = 0;
  let initialMana = 0;

  activeOrigins.forEach((s) => {
    if (s.activeTier?.bonus.hpPercent) synergyHpPercent += s.activeTier.bonus.hpPercent;
    if (s.activeTier?.bonus.atkPercent) synergyAtkPercent += s.activeTier.bonus.atkPercent;
    if (s.activeTier?.bonus.critRate) synergyCritRate += s.activeTier.bonus.critRate;
    if (s.activeTier?.bonus.shieldPercent) initialShieldPercent += s.activeTier.bonus.shieldPercent;
  });

  activeRoles.forEach((r) => {
    if (r.activeTier?.bonus.hpPercent) synergyHpPercent += r.activeTier.bonus.hpPercent;
    if (r.activeTier?.bonus.atkPercent) synergyAtkPercent += r.activeTier.bonus.atkPercent;
    if (r.definition.id === 'Mystic') initialMana = 50;
  });

  const slots: GridPosition[] = ['front-top', 'front-bottom', 'mid-top', 'mid-bottom', 'back-center'];

  slots.forEach((slot) => {
    const heroId = formation[slot];
    if (!heroId) return;

    const def = getHeroDefinition(heroId);
    const heroState = heroes[heroId];
    if (!def || !heroState) return;

    // Level scaling: +12% stats per level
    const lvlMultiplier = 1 + (heroState.level - 1) * 0.12;
    // Star scaling: +20% stats per star
    const starMultiplier = 1 + (heroState.stars - 1) * 0.20;

    // Row grid bonuses
    let rowHpBonus = 0;
    let rowSpdBonus = 0;
    let rowCritDmgBonus = 0;

    if (slot.startsWith('front')) {
      rowHpBonus = 25; // Front row: +25% HP
    } else if (slot.startsWith('mid')) {
      rowSpdBonus = 15; // Mid row: +15% Speed
    } else if (slot === 'back-center') {
      rowCritDmgBonus = 0.35; // Back row: +35% Crit Dmg
    }

    const totalHpMultiplier =
      lvlMultiplier *
      starMultiplier *
      (1 + (constellationHpBonus + boonHpPercent + synergyHpPercent + rowHpBonus) / 100);

    const totalAtkMultiplier =
      lvlMultiplier *
      starMultiplier *
      (1 + (constellationAtkBonus + boonAtkPercent + synergyAtkPercent) / 100);

    const totalDefMultiplier =
      lvlMultiplier * starMultiplier * (1 + constellationDefBonus / 100);

    const baseSpd = def.baseStats.spd * (1 + (boonSpdPercent + rowSpdBonus) / 100);
    const maxHp = Math.round(def.baseStats.hp * totalHpMultiplier);
    const atk = Math.round(def.baseStats.atk * totalAtkMultiplier);
    const defStat = Math.round(def.baseStats.def * totalDefMultiplier);
    const critRate = Math.min(
      0.85,
      def.baseStats.critRate + constellationCritBonus + boonCritRate + synergyCritRate
    );
    const critDmg = def.baseStats.critDmg + rowCritDmgBonus;

    const initialShield = Math.round((maxHp * initialShieldPercent) / 100);

    combatants.push({
      instanceId: `hero-${heroId}-${slot}`,
      heroId: def.id,
      name: def.name,
      avatarIcon: def.avatarIcon,
      isEnemy: false,
      gridPos: slot,
      rarity: def.rarity,
      origin: def.origin,
      role: def.role,
      stats: {
        hp: maxHp,
        maxHp,
        atk,
        def: defStat,
        spd: baseSpd,
        critRate,
        critDmg,
        mana: def.role === 'Mystic' ? initialMana : 0,
        maxMana: def.baseStats.maxMana,
      },
      currentHp: maxHp,
      currentMana: def.role === 'Mystic' ? initialMana : 0,
      shield: initialShield,
      attackTimer: Math.random() * 20, // Stagger initial attacks slightly
      ultimateCooldown: 0,
      isStunned: false,
      statusEffects: [],
    });
  });

  return combatants;
}

// Generate enemy wave corresponding to the rift stage
export function createEnemyWave(stage: number): Combatant[] {
  const isBossStage = stage % 5 === 0;
  const scaling = Math.pow(1.15, stage - 1);

  const enemyArchetypes = [
    {
      id: 'void-crawler',
      name: 'Void Crawler',
      icon: '👾',
      role: 'Striker' as const,
      origin: 'Voidborn' as const,
      baseHp: 650,
      baseAtk: 65,
      baseDef: 25,
      spd: 1.1,
    },
    {
      id: 'magma-hound',
      name: 'Magma Hound',
      icon: '🐕‍🦺',
      role: 'Vanguard' as const,
      origin: 'Draconic' as const,
      baseHp: 980,
      baseAtk: 50,
      baseDef: 45,
      spd: 0.9,
    },
    {
      id: 'cyber-drone',
      name: 'Plasma Drone',
      icon: '🛸',
      role: 'Sniper' as const,
      origin: 'Cybertech' as const,
      baseHp: 540,
      baseAtk: 80,
      baseDef: 20,
      spd: 1.25,
    },
    {
      id: 'astral-specter',
      name: 'Astral Specter',
      icon: '👻',
      role: 'Mystic' as const,
      origin: 'Celestial' as const,
      baseHp: 620,
      baseAtk: 72,
      baseDef: 28,
      spd: 1.05,
    },
    {
      id: 'mutant-spore',
      name: 'Feral Fungus',
      icon: '🥀',
      role: 'Cleric' as const,
      origin: 'Beastkin' as const,
      baseHp: 800,
      baseAtk: 45,
      baseDef: 35,
      spd: 0.95,
    },
  ];

  const enemySlots: { pos: GridPosition; archIndex: number }[] = isBossStage
    ? [
        { pos: 'front-top', archIndex: 1 },
        { pos: 'front-bottom', archIndex: 0 },
        { pos: 'mid-top', archIndex: 2 },
        { pos: 'mid-bottom', archIndex: 4 },
        { pos: 'back-center', archIndex: 3 }, // Boss slot
      ]
    : [
        { pos: 'front-top', archIndex: 0 },
        { pos: 'front-bottom', archIndex: 1 },
        { pos: 'mid-top', archIndex: 2 },
        { pos: 'mid-bottom', archIndex: 4 },
        { pos: 'back-center', archIndex: 3 },
      ];

  return enemySlots.map((slotInfo, idx) => {
    const arch = enemyArchetypes[slotInfo.archIndex % enemyArchetypes.length];
    const isBoss = isBossStage && slotInfo.pos === 'back-center';

    const bossMultiplier = isBoss ? 2.5 : 1.0;
    const hp = Math.round(arch.baseHp * scaling * bossMultiplier);
    const atk = Math.round(arch.baseAtk * scaling * (isBoss ? 1.6 : 1.0));
    const def = Math.round(arch.baseDef * scaling * (isBoss ? 1.4 : 1.0));

    return {
      instanceId: `enemy-${stage}-${idx}`,
      heroId: `enemy-${arch.id}`,
      name: isBoss ? `Cosmic Dread ${arch.name}` : arch.name,
      avatarIcon: isBoss ? '👹' : arch.icon,
      isEnemy: true,
      gridPos: slotInfo.pos,
      rarity: isBoss ? '5-star' : '3-star',
      origin: arch.origin,
      role: arch.role,
      stats: {
        hp,
        maxHp: hp,
        atk,
        def,
        spd: arch.spd,
        critRate: isBoss ? 0.25 : 0.1,
        critDmg: 1.5,
        mana: 0,
        maxMana: 100,
      },
      currentHp: hp,
      currentMana: 0,
      shield: isBoss ? Math.round(hp * 0.25) : 0,
      attackTimer: Math.random() * 20,
      ultimateCooldown: 0,
      isStunned: false,
      statusEffects: [],
    };
  });
}

// Targeting logic: prioritizes frontline enemies first, then midline, then backline
export function selectTarget(attacker: Combatant, targets: Combatant[]): Combatant | null {
  const living = targets.filter((t) => t.currentHp > 0);
  if (living.length === 0) return null;

  // Snipers prioritize highest-HP or backline targets
  if (attacker.role === 'Sniper') {
    return [...living].sort((a, b) => b.currentHp - a.currentHp)[0];
  }

  // Row priority: frontline first, then mid, then back
  const front = living.filter((t) => t.gridPos.startsWith('front'));
  if (front.length > 0) {
    return front[Math.floor(Math.random() * front.length)];
  }

  const mid = living.filter((t) => t.gridPos.startsWith('mid'));
  if (mid.length > 0) {
    return mid[Math.floor(Math.random() * mid.length)];
  }

  return living[0];
}
