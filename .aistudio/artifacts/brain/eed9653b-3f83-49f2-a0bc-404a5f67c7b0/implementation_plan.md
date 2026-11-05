# Cosmic Rift: Multiverse Idle Battler

A rich incremental idle RPG and auto-battler set in a colliding multiverse, combining tactical 5-hero grid formations, toggleable auto/manual ultimate abilities, Vampire Survivors-style 1-of-3 level-up perk drafting, persistent meta-progression, and completely earnable gacha summoning.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Based on your interview answers, the following architectural choices have been established:

- **Combat System**: Auto-battler mechanics with real-time attack pacing, front/middle/back row targeting priorities, and a dedicated **Auto / Manual Ultimate toggle** so you can strategically trigger game-changing ultimates or let the AI execute them on cooldown.
- **Multiverse Roster**: A high-contrast, imaginative cast spanning high fantasy, futuristic sci-fi, cosmic horrors, and cute critters (e.g., *Ignis the Dragon Sovereign*, *Unit-77 Starship Pilot*, *Yogg'thul the Void Weaver*, *Boba the Slime Cleric*, *Kaelen the Arcane Blade*).
- **Dual-Tier Progression**: Seamlessly blends in-run rogue-lite choices (**Vampire Survivors-style Pick-1-of-3 trait and skill evolutions** whenever the rift wave levels up) with permanent **Meta-Upgrades** (Astral Constellation perks, Hero Ascension, Gear Forge, and stat resonance).
- **5-Hero Tactical Grid**: 3-tier formation (Frontline Vanguard, Midline Skirmishers/Buffers, Backline Snipers/Mages) activating Auto-Chess style origin and class synergies (e.g., Void-born, Cybertech, Draconic, Celestial, Guardian, Striker, Mystic).
- **Zero-Microtransaction Economy**: 100% earnable gacha crystals, rift gold, and ascension stones via stage milestones, idle AFK chest generation (with offline progress calculation), and renewable Daily Quests.

---

### 1. Overview & Core Concept

- **What It Does**: Players assemble and position a team of 5 eccentric heroes summoned from across alternate dimensions to fight through progressively harder dimensional rifts. Heroes auto-attack and build mana, while players draft randomized rogue-lite traits on wave milestones, claim AFK idle rewards, complete daily bounty missions, and spend earnable Astral Shards at the Grand Multiverse Portal.
- **Target Audience / Persona**: Fans of *Auto-Chess*, *Idle Champions of the Forgotten Realms*, *Vampire Survivors*, and *AFK Arena* who enjoy character collecting, tactical build crafting, and satisfying progression loops without predatory monetization.
- **Key Value**: Delivers the instant gratification of incremental idle gains paired with meaningful tactical agency (formation positioning, manual skill timing, rogue-lite drafting, and team synergy theory-crafting).

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **The Rift Arena (Active Combat)**:
   - Displays the 5-hero player party facing off against dimensional invading waves on a distinct tactical grid.
   - Live health and energy bars, floating damage numbers, status effect indicators, and visual ability telegraphs.
   - Global combat controls: `Auto / Manual Ultimate` toggle, `1x / 2x / 3x Speed` toggle, and instant Pause / Retune Formation.
   - When manual mode is on, glowing hero portraits light up with hotkeys/clicks to unleash cinematic screen-clearing ultimate abilities.

2. **Rift Level-Up Draft (Vampire Survivors Loop)**:
   - Defeating waves grants Rift EXP. When the Rift level increases, the battle halts smoothly and presents a **"Choose 1 of 3 Dimensional Augments"** modal.
   - Options include stat multipliers, skill chain lightning evolutions, lifesteal auras, orbital defense shields, burn damage over time, or gold magnets.
   - Builds stack synergistically across the active run.

3. **Multiverse Summon Gate (Gacha)**:
   - Visual summoning chamber with Single Summon (100 Astral Shards) and 10x Multi-Summon (900 Astral Shards).
   - Clear rarity tiers (Rare 3★, Epic 4★, Legendary 5★) with a transparent **Pity Counter** (guaranteed 5★ within 30 pulls).
   - Duplicate pulls automatically grant Ascension Essence used for hero star-upgrades.

4. **Formation & Hero Roster**:
   - Interactive drag-and-drop or click-to-slot 5-position tactical layout: Front row (2 slots - high aggro/defense), Middle row (2 slots - balanced), Back row (1 slot - protected carry/healer).
   - Live display of active Synergies (e.g., `3 Draconic: +25% Burn Damage`, `2 Mystic: +20% Mana Regen`, `2 Cybertech: +15% Shielding`).
   - Detailed Hero Dossier modal: Level up with Gold, Ascend with Shards, view Lore, inspect Skills and Equipment.

5. **Daily Quests & AFK Time Capsule**:
   - Daily Mission board with 5 randomized daily objectives (e.g., "Clear 10 Waves", "Trigger 15 Ultimates", "Perform 1 Summon", "Level Up a Hero 3 Times", "Claim AFK Rewards").
   - Rewarded with generous Gold, Astral Shards, and EXP.
   - Floating Multiverse Time-Capsule accumulating idle Gold and EXP up to 12 hours while offline or away.

6. **The Astral Constellation (Permanent Meta-Forge)**:
   - Tree of permanent account-wide perks unlocked with Dimensional Relics gained from boss waves and daily completions (e.g., `+Gold Drop Rate`, `+Base Crit Rate`, `+Starting Rift Level`, `+AFK Cap Capacity`, `+Gacha Shard Bonus`).

#### Visual Identity & Theme
- **Aesthetic Direction**: Ethereal Multiverse Fantasy meets Tactical Sci-Fi. Deep space void canvases with luminous starlight accents, crystalline borders, and vibrant character splashes.
- **Color Palette (60-30-10 Rule)**:
  - *60% Neutral Canvas*: Void Slate (`#0B0F19`, `#111827`) and Deep Cosmic Obsidian (`#030712`).
  - *30% Structural Surfaces*: Translucent Nebula Panels (`#1E293B` with subtle `#334155` hairline borders).
  - *10% Focal Accents*: Astral Amber/Gold (`#F59E0B`), Rift Cyan (`#06B6D4`), and Celestial Violet (`#8B5CF6`).
- **Typography & Hierarchy**:
  - *Display / Headings*: Bold futuristic geometric display type (`Plus Jakarta Sans` / `Outfit` font stack).
  - *Combat Numbers & Telemetry*: High-legibility tabular numerals (`tabular-nums font-mono`).
- **Audio & Visual Feedback**:
  - Synthesized Web Audio API sound effects: sword slashes, laser blasts, holy healing chimes, level-up fanfares, and gacha reveal suspense chords (all with global mute toggle).
  - Smooth compositor-only animations (`motion` / CSS keyframes): damage floaters, screen shakes on boss ultimates, and card reveal flips.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Real-Time Auto-Battler with Flexible Control Agency**
  - *Chosen Approach*: Real-time tick engine where heroes auto-attack according to attack speeds and cooldowns, with an explicit `Auto / Manual Ultimate` toggle switch.
  - *Why*: Gives players total freedom—active players can micro-time big crowd controls and heals, while idle players can toggle Auto and enjoy passive progression.
  - *Alternatives Considered*: Pure turn-based input (slows down incremental loop) or 100% non-interactive idle (lacks player engagement).

- **Decision 2: Hybrid Dual-Loop Progression (In-Run Perks + Persistent Talents)**
  - *Chosen Approach*: During an active Rift run, heroes gain run-specific rogue-lite buffs (pick 1 of 3) which reset when resetting or teleporting to higher rifts. Meanwhile, all hero levels, star ascensions, gear, and constellation talents persist permanently.
  - *Why*: Satisfies the addictive moment-to-moment decisions of *Vampire Survivors* while honoring the long-term compounding growth of *Idle Champions*.

- **Decision 3: Client-Side State Engine with LocalStorage Persistence & Offline AFK Simulation**
  - *Chosen Approach*: Complete client-side architecture using React state synchronized with `localStorage` and timestamped offline reward calculations.
  - *Why*: Zero server latency, instant load times, works completely offline, and saves progress automatically across sessions.

- **Decision 4: Ethical & Rewarding Gacha Economy**
  - *Chosen Approach*: Currency is 100% earnable through stage clears, daily bounties, and achievements. Includes a hard 30-pull 5★ pity mechanism and a milestone reward track.
  - *Why*: Captures the thrilling dopamine excitement of character summoning without frustrating dead-ends or real-money barriers.

---

### 4. Technical Architecture & Data Strategy

#### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Cosmic Rift Game Engine                         │
│                                                                        │
│   ┌─────────────────────┐   ┌──────────────────────────────────────┐   │
│   │   Offline AFK Calc  │   │          Main Game Loop              │   │
│   │ (Timestamp Delta)   │   │  (requestAnimationFrame / Interval)  │   │
│   └──────────┬──────────┘   └──────────────────┬───────────────────┘   │
│              │                                 │                       │
│              ▼                                 ▼                       │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                 GameState & Persistence Store                  │   │
│   │  • Currency: Gold, Astral Shards, Dimensional Relics           │   │
│   │  • Unlocked Heroes & Star Ascensions                           │   │
│   │  • Formation Grid (5-slot arrangement & synergies)             │   │
│   │  • In-Run Active Boons (Vampire Survivors 1-of-3 picks)        │   │
│   │  • Daily Quests (Progress tracking & daily rollover)           │   │
│   │  • Permanent Astral Constellation Nodes                        │   │
│   └──────┬──────────────────────┬────────────────────────┬─────────┘   │
│          │                      │                        │             │
│          ▼                      ▼                        ▼             │
│   ┌─────────────┐       ┌───────────────┐        ┌─────────────┐       │
│   │ Rift Arena  │       │ Multiverse    │        │ Hero Lab    │       │
│   │ View        │       │ Summon Gate   │        │ & Forge     │       │
│   │ (Combat HUD │       │ (Gacha & Pity │        │ (Formation, │       │
│   │ & Roguelite │       │  Animation)   │        │  Upgrades & │       │
│   │  Level-Ups) │       │               │        │  Synergies) │       │
│   └─────────────┘       └───────────────┘        └─────────────┘       │
│          │                      │                        │             │
│          └──────────────────────┼────────────────────────┘             │
│                                 ▼                                      │
│                     ┌───────────────────────┐                          │
│                     │ Web Audio API Effects │                          │
│                     │ (Hits, Chimes, Fanfare│                          │
│                     └───────────────────────┘                          │
└────────────────────────────────────────────────────────────────────────┘
```

#### Core Entities & Data Models
- **Hero**:
  - `id`: Unique identifier (e.g., `'ignis-dragon'`)
  - `name`: Display name
  - `title`: Multiversal epithet (e.g., `'The Solar Sovereign'`)
  - `rarity`: `3★ Rare`, `4★ Epic`, `5★ Legendary`
  - `origin`: `Draconic`, `Cybertech`, `Voidborn`, `Celestial`, `Forest-Spirit`
  - `role`: `Vanguard` (Tank), `Striker` (Melee DPS), `Sniper` (Ranged DPS), `Mystic` (Mage/AoE), `Cleric` (Support/Heal)
  - `baseStats`: `{ hp, atk, def, spd, critRate }`
  - `ultimateSkill`: `{ name, description, cost, cooldown, effectType, animation }`
  - `passiveTrait`: `{ name, description, trigger }`
  - `stars`: 1 to 5 stars (unlocked via duplicate essence)
  - `level`: Level (upgraded via Gold & EXP)

- **Formation & Grid Positions**:
  - `slots`: 5 slots labeled `Front-Top`, `Front-Bottom`, `Mid-Top`, `Mid-Bottom`, `Back-Center`.
  - Grid row bonuses: Front (+25% Max HP & Aggro target), Mid (+15% Attack Speed), Back (+20% Critical Damage).
  - Faction / Origin Synergies evaluated dynamically from assigned heroes.

- **Vampire Survivors In-Run Augments (Boons)**:
  - 18+ unique selectable boons across tiers (e.g., *Nova Blades*, *Astral Chain Lightning*, *Vampiric Drain*, *Chrono Warp*, *Bouncing Spores*, *Meteor Strike*).
  - Upgradable up to Level 5 each during a single run.

- **Daily Quests**:
  - Pool of balanced daily tasks automatically refreshing every 24 hours (with manual refresh option for testing).
  - Rewards include 50–150 Astral Shards each and bonus Gold.

- **Sound & Web Audio Engine**:
  - Browser-native synthesized sound generator for zero-latency, zero-asset-failure audio with sound on/off switch.

---

### Implementation Milestones

1. **Step 1: Game Data & Sound Engine**:
   - Define character catalogue (12+ diverse heroes across origins and roles).
   - Define synergies, in-run boons, daily quest templates, and permanent constellation perks.
   - Implement the lightweight Web Audio synthesizer for combat sfx.
2. **Step 2: Combat Simulator & Formation Engine**:
   - Build the auto-battler state tick with position-based targeting, attack cooldowns, mana gain, and damage formulas.
   - Build the `Auto / Manual Ultimate` toggle with ability queueing and visual triggers.
   - Build the Vampire Survivors-style "1-of-3 Level-Up Perk" draft modal when wave milestones are breached.
3. **Step 3: Gacha Gate & Summoning**:
   - Build the Multiverse Portal with 1x and 10x summons, pity counter (30), duplicate conversion to Ascension Essence, and summon reveal sequence.
4. **Step 4: Roster, Formation, & Meta-Progression**:
   - 5-hero tactical grid configuration with active synergy bonuses.
   - Hero upgrade screens (Level, Star Ascension, Lore inspection).
   - Astral Constellation permanent talent tree.
   - Daily Quests and AFK time capsule with offline calculation.
5. **Step 5: Polish, Audio-Visual Verification, & Anti-Slop Audit**:
   - Verify crisp typography, clean zero-pill metadata, tabular numerals, responsive 1440px layout, full working handlers, and complete build verification.
