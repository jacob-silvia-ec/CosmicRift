import { InRunBoon } from '../types/game';

export const IN_RUN_BOONS_POOL: InRunBoon[] = [
  {
    id: 'orbital-stars',
    name: 'Astral Orbiters',
    description: 'Conjures revolving cosmic energy blades that periodically deal damage to all approaching enemies.',
    icon: '💫',
    tier: 'Epic',
    level: 1,
    maxLevel: 5,
    statBonus: { orbitalDamage: 35 },
  },
  {
    id: 'chain-lightning',
    name: 'Chain Lightning',
    description: 'Hero basic attacks have a 30% chance to discharge crackling lightning that jumps between 3 enemies.',
    icon: '⚡',
    tier: 'Epic',
    level: 1,
    maxLevel: 5,
    statBonus: { chainLightningChance: 30 },
  },
  {
    id: 'vampiric-drain',
    name: 'Vampiric Drain',
    description: 'All allied heroes gain +12% lifesteal on all physical and magical damage dealt.',
    icon: '🩸',
    tier: 'Rare',
    level: 1,
    maxLevel: 5,
    statBonus: { vampiricDrainPercent: 12 },
  },
  {
    id: 'titans-might',
    name: "Titan's Might",
    description: 'Increases all heroes base ATK power by +20%.',
    icon: '🗡️',
    tier: 'Common',
    level: 1,
    maxLevel: 5,
    statBonus: { atkPercent: 20 },
  },
  {
    id: 'hyper-vitality',
    name: 'Hyper Vitality',
    description: 'Increases all heroes maximum HP by +25%.',
    icon: '❤️',
    tier: 'Common',
    level: 1,
    maxLevel: 5,
    statBonus: { hpPercent: 25 },
  },
  {
    id: 'chrono-haste',
    name: 'Chrono Haste',
    description: 'Increases attack cadence and animations by +20% attack speed.',
    icon: '⏳',
    tier: 'Rare',
    level: 1,
    maxLevel: 5,
    statBonus: { attackSpeedPercent: 20 },
  },
  {
    id: 'stellar-precision',
    name: 'Stellar Precision',
    description: 'Increases team Critical Strike Chance by +15% and Critical Damage by +30%.',
    icon: '🎯',
    tier: 'Rare',
    level: 1,
    maxLevel: 5,
    statBonus: { critRateBonus: 0.15 },
  },
  {
    id: 'radiant-aegis',
    name: 'Radiant Aegis',
    description: 'Fully restores 25% of team maximum HP upon clearing each wave milestone.',
    icon: '🛡️',
    tier: 'Common',
    level: 1,
    maxLevel: 5,
    statBonus: { healOnWaveEnd: 25 },
  },
  {
    id: 'cosmic-midas',
    name: 'Cosmic Midas',
    description: 'Increases all gold and rift shard spoils earned from defeated foes by +35%.',
    icon: '💰',
    tier: 'Rare',
    level: 1,
    maxLevel: 5,
    statBonus: { goldMultiplier: 35 },
  },
  {
    id: 'singularity-burst',
    name: 'Void Singularity',
    description: 'Every 8 seconds, creates a gravity pulse that pulls foes together and deals 120 damage.',
    icon: '🌀',
    tier: 'Legendary',
    level: 1,
    maxLevel: 5,
    statBonus: { orbitalDamage: 50 },
  },
  {
    id: 'overcharge-capacitor',
    name: 'Overcharge Capacitor',
    description: 'Heroes generate +35% more Mana from all attacks, casting Ultimates much faster.',
    icon: '🔋',
    tier: 'Epic',
    level: 1,
    maxLevel: 5,
    statBonus: { attackSpeedPercent: 10 },
  },
  {
    id: 'phoenix-blessing',
    name: 'Phoenix Feather',
    description: 'Once per run, the first hero to fall in battle immediately revives with 50% HP.',
    icon: '🪶',
    tier: 'Legendary',
    level: 1,
    maxLevel: 3,
    statBonus: { hpPercent: 15 },
  },
];

export function getRandomBoonChoices(activeBoons: Record<string, number>): InRunBoon[] {
  const available = IN_RUN_BOONS_POOL.filter((b) => {
    const curLevel = activeBoons[b.id] || 0;
    return curLevel < b.maxLevel;
  });

  const poolToPick = available.length >= 3 ? available : IN_RUN_BOONS_POOL;
  const shuffled = [...poolToPick].sort(() => 0.5 - Math.random());
  
  return shuffled.slice(0, 3).map((b) => ({
    ...b,
    level: (activeBoons[b.id] || 0) + 1,
  }));
}
