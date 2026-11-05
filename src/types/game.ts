export type Rarity = '3-star' | '4-star' | '5-star';

export type Origin = 'Draconic' | 'Cybertech' | 'Voidborn' | 'Celestial' | 'Beastkin';

export type Role = 'Vanguard' | 'Striker' | 'Sniper' | 'Mystic' | 'Cleric';

export type GridPosition = 'front-top' | 'front-bottom' | 'mid-top' | 'mid-bottom' | 'back-center';

export interface BaseStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number; // Attacks per 10 seconds baseline
  critRate: number; // 0.05 to 0.50
  critDmg: number; // default 1.5
  mana: number;
  maxMana: number;
}

export interface Skill {
  name: string;
  description: string;
  manaCost: number;
  cooldownSeconds: number;
  type: 'damage' | 'heal' | 'buff' | 'aoe' | 'shield';
  multiplier: number;
}

export interface HeroDefinition {
  id: string;
  name: string;
  title: string;
  avatarIcon: string; // Emoji / stylized token
  accentColor: string; // Tailwind color token or hex
  rarity: Rarity;
  origin: Origin;
  role: Role;
  baseStats: BaseStats;
  basicAttackName: string;
  ultimate: Skill;
  passiveTrait: {
    name: string;
    description: string;
  };
  lore: string;
}

export interface PlayerHeroState {
  heroId: string;
  level: number;
  stars: number; // 1 to 5
  duplicates: number;
}

export interface Formation {
  'front-top': string | null;
  'front-bottom': string | null;
  'mid-top': string | null;
  'mid-bottom': string | null;
  'back-center': string | null;
}

export interface Combatant {
  instanceId: string;
  heroId: string;
  name: string;
  avatarIcon: string;
  isEnemy: boolean;
  gridPos: GridPosition | string;
  rarity: Rarity;
  origin: Origin;
  role: Role;
  stats: BaseStats;
  currentHp: number;
  currentMana: number;
  shield: number;
  attackTimer: number; // Counts up to 100/spd
  ultimateCooldown: number;
  isStunned: boolean;
  statusEffects: {
    type: 'burn' | 'poison' | 'shield' | 'atkBuff' | 'defBuff';
    duration: number;
    value: number;
  }[];
}

export interface InRunBoon {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  level: number;
  maxLevel: number;
  statBonus: {
    atkPercent?: number;
    hpPercent?: number;
    critRateBonus?: number;
    attackSpeedPercent?: number;
    healOnWaveEnd?: number;
    goldMultiplier?: number;
    orbitalDamage?: number;
    chainLightningChance?: number;
    vampiricDrainPercent?: number;
  };
}

export interface SynergyTier {
  count: number;
  description: string;
  bonus: {
    atkPercent?: number;
    hpPercent?: number;
    critRate?: number;
    shieldPercent?: number;
    manaRegen?: number;
    armorShred?: number;
    lifesteal?: number;
    burnChance?: number;
  };
}

export interface SynergyDefinition {
  id: string;
  name: string;
  type: 'origin' | 'role';
  description: string;
  icon: string;
  tiers: SynergyTier[];
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  type: 'waves' | 'ultimates' | 'summons' | 'upgrades' | 'afk';
  target: number;
  progress: number;
  rewardShards: number;
  rewardGold: number;
  completed: boolean;
  claimed: boolean;
}

export interface ConstellationNode {
  id: string;
  name: string;
  description: string;
  tier: number;
  icon: string;
  currentLevel: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  statKey: 'atk' | 'hp' | 'def' | 'goldRate' | 'critRate' | 'afkCapacity' | 'manaRegen';
  valuePerLevel: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  isCrit?: boolean;
}

export interface GameSaveData {
  version: number;
  gold: number;
  astralShards: number;
  dimensionalRelics: number;
  riftStage: number;
  highestStage: number;
  pityCounter: number; // pulls until guaranteed 5-star
  autoUltimates: boolean;
  combatSpeed: number; // 1, 2, or 3
  isSoundMuted: boolean;
  heroes: Record<string, PlayerHeroState>;
  formation: Formation;
  constellations: Record<string, number>; // nodeId -> level
  dailyQuests: DailyQuest[];
  lastDailyReset: number; // timestamp
  lastAfkClaimTimestamp: number;
  activeBoons: Record<string, number>; // boonId -> current level in run
  inRunExp: number;
  inRunLevel: number;
  totalSummonsPerformed: number;
}
