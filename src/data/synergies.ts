import { SynergyDefinition } from '../types/game';

export const ORIGIN_SYNERGIES: SynergyDefinition[] = [
  {
    id: 'Draconic',
    name: 'Draconic Might',
    type: 'origin',
    description: 'Draconic heroes channel primordial magma and solar fire.',
    icon: '🔥',
    tiers: [
      {
        count: 2,
        description: 'Allies gain +15% ATK and attacks have a 25% chance to burn targets.',
        bonus: { atkPercent: 15, burnChance: 25 },
      },
      {
        count: 3,
        description: 'Allies gain +35% ATK and attacks explode, damaging adjacent enemies.',
        bonus: { atkPercent: 35, burnChance: 50 },
      },
    ],
  },
  {
    id: 'Cybertech',
    name: 'Cyber Core',
    type: 'origin',
    description: 'Advanced cybernetic combat systems and particle shields.',
    icon: '⚡',
    tiers: [
      {
        count: 2,
        description: 'Battle start: All heroes gain a 20% Max HP hardlight shield.',
        bonus: { shieldPercent: 20 },
      },
      {
        count: 3,
        description: 'All heroes gain a 40% Max HP shield and +25% faster Energy recharge.',
        bonus: { shieldPercent: 40, manaRegen: 25 },
      },
    ],
  },
  {
    id: 'Voidborn',
    name: 'Void Decay',
    type: 'origin',
    description: 'Eldritch dimensional whispers weaken armor and corrupt vitality.',
    icon: '🌌',
    tiers: [
      {
        count: 2,
        description: 'Attacks shred 15% enemy DEF and heal the attacker for 12% of damage dealt.',
        bonus: { armorShred: 15, lifesteal: 12 },
      },
      {
        count: 3,
        description: 'Attacks shred 30% enemy DEF and grant 25% lifesteal.',
        bonus: { armorShred: 30, lifesteal: 25 },
      },
    ],
  },
  {
    id: 'Celestial',
    name: 'Celestial Grace',
    type: 'origin',
    description: 'Pure starlight blesses heroes with critical precision and insight.',
    icon: '✨',
    tiers: [
      {
        count: 2,
        description: 'Party gains +15% Critical Strike Chance.',
        bonus: { critRate: 0.15 },
      },
      {
        count: 3,
        description: 'Party gains +30% Critical Strike Chance and critical hits restore 10 Energy.',
        bonus: { critRate: 0.30, manaRegen: 15 },
      },
    ],
  },
  {
    id: 'Beastkin',
    name: 'Beastkin Vigor',
    type: 'origin',
    description: 'Wild natural spirits grant immense resilience and rapid regeneration.',
    icon: '🌿',
    tiers: [
      {
        count: 2,
        description: 'Party gains +20% Max HP and regenerates 2% HP every 3 seconds.',
        bonus: { hpPercent: 20 },
      },
      {
        count: 3,
        description: 'Party gains +45% Max HP and regenerates 5% HP every 3 seconds.',
        bonus: { hpPercent: 45 },
      },
    ],
  },
];

export const ROLE_SYNERGIES: SynergyDefinition[] = [
  {
    id: 'Vanguard',
    name: 'Vanguard Wall',
    type: 'role',
    description: 'Frontline tanks absorb punishment and draw enemy aggro.',
    icon: '🛡️',
    tiers: [
      {
        count: 2,
        description: 'Vanguards grant +20% DEF to all adjacent heroes.',
        bonus: { hpPercent: 15 },
      },
    ],
  },
  {
    id: 'Striker',
    name: 'Striker Momentum',
    type: 'role',
    description: 'Fierce damage dealers build rapid attack cadence.',
    icon: '⚔️',
    tiers: [
      {
        count: 2,
        description: 'Strikers gain +25% Attack Speed.',
        bonus: { atkPercent: 15 },
      },
    ],
  },
  {
    id: 'Sniper',
    name: 'Sniper Precision',
    type: 'role',
    description: 'Long-range marksmen pierce high-priority targets.',
    icon: '🎯',
    tiers: [
      {
        count: 2,
        description: 'Snipers deal +30% damage against targets with greater than 70% HP.',
        bonus: { critRate: 0.15 },
      },
    ],
  },
  {
    id: 'Mystic',
    name: 'Mystic Surge',
    type: 'role',
    description: 'Magical spellweavers channel cosmic energy rapidly.',
    icon: '🔮',
    tiers: [
      {
        count: 2,
        description: 'Mystics start battles with 50 Initial Mana.',
        bonus: { manaRegen: 20 },
      },
    ],
  },
  {
    id: 'Cleric',
    name: 'Cleric Aegis',
    type: 'role',
    description: 'Sacred healers keep the party healthy through grueling battles.',
    icon: '💖',
    tiers: [
      {
        count: 2,
        description: 'All healing and shielding given or received is increased by +30%.',
        bonus: { hpPercent: 10 },
      },
    ],
  },
];
