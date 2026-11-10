import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Combatant,
  Formation,
  PlayerHeroState,
  FloatingText,
  InRunBoon,
  HeroDefinition,
} from '../types/game';
import {
  createFriendlyCombatants,
  createEnemyWave,
  selectTarget,
  calculateActiveSynergies,
} from '../utils/battleEngine';
import { getHeroDefinition } from '../data/heroes';
import { getRandomBoonChoices, IN_RUN_BOONS_POOL } from '../data/boons';
import { sound } from '../utils/audio';
import { BoonDraftModal } from './BoonDraftModal';
import {
  Play,
  Pause,
  FastForward,
  Zap,
  Shield,
  Heart,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface BattleViewProps {
  riftStage: number;
  highestStage: number;
  heroes: Record<string, PlayerHeroState>;
  formation: Formation;
  constellations: Record<string, number>;
  activeBoons: Record<string, number>;
  inRunExp: number;
  inRunLevel: number;
  autoUltimates: boolean;
  combatSpeed: number;
  onUpdateAutoUltimates: (auto: boolean) => void;
  onUpdateCombatSpeed: (speed: number) => void;
  onSelectBoon: (boon: InRunBoon) => void;
  onStageClear: (
    nextStage: number,
    rewards: { gold: number; shards: number; relics: number }
  ) => void;
  onQuestProgress: (type: 'waves' | 'ultimates', count: number) => void;
  onInRunExpGain: (newExp: number, newLevel: number) => void;
}

export const BattleView: React.FC<BattleViewProps> = ({
  riftStage,
  heroes,
  formation,
  constellations,
  activeBoons,
  inRunExp,
  inRunLevel,
  autoUltimates,
  combatSpeed,
  onUpdateAutoUltimates,
  onUpdateCombatSpeed,
  onSelectBoon,
  onStageClear,
  onQuestProgress,
  onInRunExpGain,
}) => {
  // Battle state
  const [friendlyTeam, setFriendlyTeam] = useState<Combatant[]>([]);
  const [enemyTeam, setEnemyTeam] = useState<Combatant[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [battleOutcome, setBattleOutcome] = useState<'none' | 'victory' | 'defeat'>('none');
  const [pendingDraft, setPendingDraft] = useState<InRunBoon[] | null>(null);
  const [activeAttackerId, setActiveAttackerId] = useState<string | null>(null);

  // References to keep loop state accurate without stale closures
  const friendlyRef = useRef<Combatant[]>([]);
  const enemyRef = useRef<Combatant[]>([]);
  const isLoopRunning = useRef<boolean>(true);
  const stageRef = useRef(riftStage);
  stageRef.current = riftStage;
  const phoenixRevivesUsedRef = useRef<number>(0);
  const orbitalTimerRef = useRef<number>(0);
  const singularityTimerRef = useRef<number>(0);

  // Synergies summary
  const { activeOrigins, activeRoles } = calculateActiveSynergies(formation, heroes);

  // EXP requirements for in-run rogue-lite level up
  const expNeeded = inRunLevel * 80;

  // Spawn float text helper
  const addFloatingText = useCallback(
    (text: string, x: number, y: number, color: string, isCrit: boolean = false) => {
      const id = `${Date.now()}-${Math.random()}`;
      setFloatingTexts((prev) => [...prev.slice(-15), { id, text, x, y, color, isCrit }]);
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
      }, 900);
    },
    []
  );

  // Initialize or restart current wave
  const initBattle = useCallback(() => {
    const friendlies = createFriendlyCombatants(
      formation,
      heroes,
      activeBoons,
      constellations
    );
    const enemies = createEnemyWave(riftStage);

    friendlyRef.current = friendlies;
    enemyRef.current = enemies;
    phoenixRevivesUsedRef.current = 0;
    orbitalTimerRef.current = 0;
    singularityTimerRef.current = 0;
    setFriendlyTeam(friendlies);
    setEnemyTeam(enemies);
    setBattleOutcome('none');
    setFloatingTexts([]);
  }, [formation, heroes, constellations, riftStage]);

  // Trigger init on stage or formation change
  useEffect(() => {
    initBattle();
  }, [initBattle]);

  // Dynamically update friendly stats when new in-run boons are drafted without resetting enemy wave
  useEffect(() => {
    if (friendlyRef.current.length === 0) return;
    const fresh = createFriendlyCombatants(formation, heroes, activeBoons, constellations);
    friendlyRef.current.forEach((hero) => {
      const match = fresh.find((f) => f.instanceId === hero.instanceId);
      if (match) {
        const hpRatio = hero.stats.maxHp > 0 ? hero.currentHp / hero.stats.maxHp : 1;
        hero.stats = match.stats;
        hero.currentHp = Math.min(match.stats.maxHp, Math.max(1, Math.round(match.stats.maxHp * hpRatio)));
      }
    });
    setFriendlyTeam([...friendlyRef.current]);
  }, [activeBoons]);

  // Cast an ultimate skill manually or automatically
  const castUltimate = useCallback(
    (heroInstanceId: string) => {
      const hero = friendlyRef.current.find((h) => h.instanceId === heroInstanceId);
      if (!hero || hero.currentHp <= 0 || hero.currentMana < 100) return;

      const heroDef = getHeroDefinition(hero.heroId);
      if (!heroDef) return;

      sound.playUltimate();
      onQuestProgress('ultimates', 1);

      // Reset hero mana
      hero.currentMana = 0;

      const ult = heroDef.ultimate;
      addFloatingText(
        `ULTIMATE: ${ult.name}!`,
        50,
        35,
        '#38bdf8',
        true
      );

      // Execute ultimate mechanics
      if (ult.type === 'aoe') {
        const damage = Math.round(hero.stats.atk * ult.multiplier);
        let totalDamage = 0;
        enemyRef.current.forEach((enemy) => {
          if (enemy.currentHp > 0) {
            const actualDamage = Math.max(1, damage - enemy.stats.def * 0.35);
            enemy.currentHp = Math.max(0, enemy.currentHp - actualDamage);
            totalDamage += actualDamage;
            addFloatingText(`-${Math.round(actualDamage)}`, 75, 45 + Math.random() * 20, '#f87171');
          }
        });
        if (activeBoons['vampiric-drain']) {
          const stealPercent = activeBoons['vampiric-drain'] * 12;
          const heal = Math.round((totalDamage * stealPercent) / 100);
          hero.currentHp = Math.min(hero.stats.maxHp, hero.currentHp + heal);
          addFloatingText(`+${heal}`, 25, 45, '#34d399');
        }
      } else if (ult.type === 'heal' || ult.type === 'shield') {
        const healAmt = Math.round(hero.stats.atk * ult.multiplier);
        friendlyRef.current.forEach((ally) => {
          if (ally.currentHp > 0) {
            if (ult.type === 'heal') {
              ally.currentHp = Math.min(ally.stats.maxHp, ally.currentHp + healAmt);
              addFloatingText(`+${healAmt}`, 25, 45 + Math.random() * 20, '#34d399');
            } else {
              ally.shield += healAmt;
              addFloatingText(`🛡️ +${healAmt}`, 25, 45 + Math.random() * 20, '#67e8f9');
            }
          }
        });
      } else if (ult.type === 'damage') {
        const target = selectTarget(hero, enemyRef.current);
        if (target) {
          const damage = Math.round(hero.stats.atk * ult.multiplier * hero.stats.critDmg);
          target.currentHp = Math.max(0, target.currentHp - damage);
          addFloatingText(`CRIT! -${damage}`, 75, 45, '#fbbf24', true);
          if (activeBoons['vampiric-drain']) {
            const stealPercent = activeBoons['vampiric-drain'] * 12;
            const heal = Math.round((damage * stealPercent) / 100);
            hero.currentHp = Math.min(hero.stats.maxHp, hero.currentHp + heal);
            addFloatingText(`+${heal}`, 25, 45, '#34d399');
          }
        }
      }

      setFriendlyTeam([...friendlyRef.current]);
      setEnemyTeam([...enemyRef.current]);
    },
    [addFloatingText, onQuestProgress, activeBoons]
  );

  // Main combat tick loop
  useEffect(() => {
    isLoopRunning.current = true;

    const interval = setInterval(() => {
      if (isPaused || pendingDraft !== null || battleOutcome !== 'none') {
        return;
      }

      const friends = friendlyRef.current;
      const enemies = enemyRef.current;

      const livingFriends = friends.filter((f) => f.currentHp > 0);
      const livingEnemies = enemies.filter((e) => e.currentHp > 0);

      // Check Victory
      if (livingEnemies.length === 0 && enemies.length > 0) {
        sound.playVictory();
        setBattleOutcome('victory');
        onQuestProgress('waves', 1);

        // Radiant Aegis boon: restore team HP on wave milestone
        const aegisLvl = activeBoons['radiant-aegis'] || 0;
        if (aegisLvl > 0) {
          friends.forEach((f) => {
            if (f.currentHp > 0) {
              const heal = Math.round(f.stats.maxHp * (0.25 * aegisLvl));
              f.currentHp = Math.min(f.stats.maxHp, f.currentHp + heal);
              addFloatingText(`🛡️ +${heal}`, 25, 45, '#34d399');
            }
          });
        }

        // Calculate stage rewards with Cosmic Midas multiplier
        const isBoss = riftStage % 5 === 0;
        const midasLvl = activeBoons['cosmic-midas'] || 0;
        const midasMult = 1 + midasLvl * 0.35;
        const rewards = {
          gold: Math.round(Math.round(150 + riftStage * 65 * (isBoss ? 2.5 : 1)) * midasMult),
          shards: Math.round((isBoss ? 60 : 15) * midasMult),
          relics: isBoss ? Math.floor(riftStage / 5) + 1 : 0,
        };

        // Advance in-run EXP
        const expGained = 45 + riftStage * 15;
        const totalExp = inRunExp + expGained;
        if (totalExp >= expNeeded) {
          // Trigger level up draft!
          const choices = getRandomBoonChoices(activeBoons);
          sound.playLevelUp();
          setPendingDraft(choices);
          onInRunExpGain(totalExp - expNeeded, inRunLevel + 1);
        } else {
          onInRunExpGain(totalExp, inRunLevel);
        }

        setTimeout(() => {
          onStageClear(riftStage + 1, rewards);
        }, 1500);
        return;
      }

      // Check Defeat
      if (livingFriends.length === 0 && friends.length > 0) {
        setBattleOutcome('defeat');
        return;
      }

      const tickDelta = (combatSpeed * 10) / 2; // Speed multiplier scaling

      // Orbital Stars Boon: periodic revolving cosmic damage
      const orbitalLvl = activeBoons['orbital-stars'] || 0;
      if (orbitalLvl > 0 && livingEnemies.length > 0) {
        orbitalTimerRef.current += tickDelta;
        if (orbitalTimerRef.current >= 30) {
          orbitalTimerRef.current = 0;
          const orbDmg = orbitalLvl * 35;
          livingEnemies.forEach((e) => {
            e.currentHp = Math.max(0, e.currentHp - orbDmg);
            addFloatingText(`💫 -${orbDmg}`, 75, 40 + Math.random() * 20, '#38bdf8');
          });
          sound.playHit(true);
        }
      }

      // Void Singularity Boon: periodic gravity pulse every 8s
      const singularityLvl = activeBoons['singularity-burst'] || 0;
      if (singularityLvl > 0 && livingEnemies.length > 0) {
        singularityTimerRef.current += tickDelta;
        if (singularityTimerRef.current >= 80) {
          singularityTimerRef.current = 0;
          const singDmg = singularityLvl * 120;
          livingEnemies.forEach((e) => {
            e.currentHp = Math.max(0, e.currentHp - singDmg);
            addFloatingText(`🌀 -${singDmg}`, 75, 45, '#c084fc', true);
          });
          sound.playHit(true);
        }
      }

      // Advance Friendlies
      friends.forEach((hero) => {
        if (hero.currentHp <= 0) return;

        // Auto cast ultimate if enabled
        if (autoUltimates && hero.currentMana >= 100) {
          castUltimate(hero.instanceId);
          return;
        }

        hero.attackTimer += hero.stats.spd * tickDelta;
        if (hero.attackTimer >= 100) {
          hero.attackTimer = 0;
          const target = selectTarget(hero, enemies);
          if (!target) return;

          setActiveAttackerId(hero.instanceId);
          setTimeout(() => setActiveAttackerId(null), 180);

          // Calculate damage
          const isCrit = Math.random() < hero.stats.critRate;
          const critMultiplier = isCrit ? hero.stats.critDmg : 1.0;
          const rawDamage = hero.stats.atk * critMultiplier;
          const netDamage = Math.max(1, Math.round(rawDamage - target.stats.def * 0.4));

          // Damage absorption with shield
          if (target.shield > 0) {
            if (target.shield >= netDamage) {
              target.shield -= netDamage;
            } else {
              const leftover = netDamage - target.shield;
              target.shield = 0;
              target.currentHp = Math.max(0, target.currentHp - leftover);
            }
          } else {
            target.currentHp = Math.max(0, target.currentHp - netDamage);
          }

          // Chain Lightning Boon
          const chainLvl = activeBoons['chain-lightning'] || 0;
          if (chainLvl > 0 && Math.random() < 0.30 + chainLvl * 0.05) {
            const otherEnemies = enemies.filter((e) => e.currentHp > 0 && e.instanceId !== target.instanceId);
            const chainTargets = otherEnemies.slice(0, 2);
            const chainDmg = Math.round(netDamage * 0.55);
            chainTargets.forEach((ct) => {
              ct.currentHp = Math.max(0, ct.currentHp - chainDmg);
              addFloatingText(`⚡ -${chainDmg}`, 75, 45 + Math.random() * 15, '#facc15');
            });
          }

          // Lifesteal check (Vampiric Drain)
          if (activeBoons['vampiric-drain']) {
            const stealPercent = activeBoons['vampiric-drain'] * 12;
            const heal = Math.round((netDamage * stealPercent) / 100);
            hero.currentHp = Math.min(hero.stats.maxHp, hero.currentHp + heal);
          }

          // Overcharge Capacitor Mana gain (+35% per lvl)
          const overchargeLvl = activeBoons['overcharge-capacitor'] || 0;
          const manaGain = Math.round(22 * (1 + overchargeLvl * 0.35));
          hero.currentMana = Math.min(100, hero.currentMana + manaGain);

          // SFX & Floating Text
          if (isCrit) {
            sound.playCrit();
            addFloatingText(`CRIT! -${netDamage}`, 75, 50, '#fbbf24', true);
          } else {
            sound.playHit(hero.role === 'Mystic');
            addFloatingText(`-${netDamage}`, 75, 50, '#f87171');
          }
        }
      });

      // Advance Enemies
      enemies.forEach((enemy) => {
        if (enemy.currentHp <= 0) return;

        enemy.attackTimer += enemy.stats.spd * tickDelta;
        if (enemy.attackTimer >= 100) {
          enemy.attackTimer = 0;
          const target = selectTarget(enemy, friends);
          if (!target) return;

          const isCrit = Math.random() < enemy.stats.critRate;
          const rawDamage = enemy.stats.atk * (isCrit ? 1.5 : 1.0);
          const netDamage = Math.max(1, Math.round(rawDamage - target.stats.def * 0.4));

          if (target.shield > 0) {
            if (target.shield >= netDamage) {
              target.shield -= netDamage;
            } else {
              const leftover = netDamage - target.shield;
              target.shield = 0;
              target.currentHp = Math.max(0, target.currentHp - leftover);
            }
          } else {
            target.currentHp = Math.max(0, target.currentHp - netDamage);
          }

          // Phoenix Feather Revive Check
          if (target.currentHp <= 0) {
            const phoenixLvl = activeBoons['phoenix-blessing'] || 0;
            if (phoenixLvl > phoenixRevivesUsedRef.current) {
              phoenixRevivesUsedRef.current += 1;
              const reviveHp = Math.round(target.stats.maxHp * 0.5);
              target.currentHp = reviveHp;
              sound.playHeal();
              addFloatingText(`🪶 PHOENIX REVIVAL! +${reviveHp}`, 25, 40, '#f59e0b', true);
            }
          }

          target.currentMana = Math.min(100, target.currentMana + 14);

          if (isCrit) {
            addFloatingText(`-${netDamage}`, 25, 50, '#ea580c', true);
          } else {
            addFloatingText(`-${netDamage}`, 25, 50, '#f87171');
          }
        }
      });

      // Sync React state
      setFriendlyTeam([...friends]);
      setEnemyTeam([...enemies]);
    }, 100);

    return () => clearInterval(interval);
  }, [
    isPaused,
    pendingDraft,
    battleOutcome,
    combatSpeed,
    autoUltimates,
    riftStage,
    inRunExp,
    inRunLevel,
    expNeeded,
    activeBoons,
    castUltimate,
    addFloatingText,
    onInRunExpGain,
    onQuestProgress,
    onStageClear,
  ]);

  // Handle hotkeys 1-5 for manual ultimates
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (autoUltimates || isPaused || pendingDraft !== null) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 5) {
        const hero = friendlyTeam[num - 1];
        if (hero && hero.currentMana >= 100) {
          castUltimate(hero.instanceId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [autoUltimates, isPaused, pendingDraft, friendlyTeam, castUltimate]);

  // Position slots on grid
  const renderCombatantCard = (combatant: Combatant, isPlayerSide: boolean) => {
    const isDead = combatant.currentHp <= 0;
    const hpPercent = Math.max(0, Math.min(100, (combatant.currentHp / combatant.stats.maxHp) * 100));
    const manaPercent = Math.max(0, Math.min(100, combatant.currentMana));
    const hasFullMana = combatant.currentMana >= 100 && !isDead;
    const isAttacking = activeAttackerId === combatant.instanceId;

    return (
      <div
        key={combatant.instanceId}
        className={`relative flex flex-col p-2.5 rounded-xl border transition-all duration-150 select-none ${
          isDead
            ? 'opacity-30 bg-slate-950/40 border-slate-900 grayscale'
            : isPlayerSide
            ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-md'
            : 'bg-red-950/20 border-red-900/40 shadow-md'
        } ${hasFullMana && isPlayerSide ? 'ring-2 ring-cyan-400/80 shadow-cyan-950/80' : ''} ${
          isAttacking ? 'scale-105' : ''
        }`}
      >
        {/* Top Info Bar */}
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xl shrink-0">{combatant.avatarIcon}</span>
            <div className="truncate">
              <div className="text-xs font-bold text-slate-100 truncate">{combatant.name}</div>
              <div className="text-[10px] text-slate-400">
                {combatant.role} · {combatant.origin}
              </div>
            </div>
          </div>
          {combatant.shield > 0 && (
            <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              🛡️ {combatant.shield}
            </span>
          )}
        </div>

        {/* Health Bar */}
        <div className="w-full bg-slate-950 rounded-full h-2 mb-1 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-100 ${
              isPlayerSide ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-600 to-red-500'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>

        {/* HP Text & Mana Bar */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
          <span>HP</span>
          <span className="tabular-nums">
            {Math.max(0, combatant.currentHp)} / {combatant.stats.maxHp}
          </span>
        </div>

        {/* Energy / Mana Bar */}
        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ${
              hasFullMana
                ? 'bg-gradient-to-r from-cyan-400 to-indigo-400 animate-pulse'
                : 'bg-indigo-600'
            }`}
            style={{ width: `${manaPercent}%` }}
          />
        </div>

        {/* Ready to cast manual hint */}
        {hasFullMana && isPlayerSide && !autoUltimates && (
          <button
            onClick={() => castUltimate(combatant.instanceId)}
            className="mt-2 w-full py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] tracking-wide uppercase transition-colors"
          >
            ⚡ CAST ULTIMATE
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex flex-col gap-5">
      
      {/* Tactical Top Bar: Stage, Controls, Vampire Survivors EXP */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        
        {/* Stage and Rift Header */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            Rift Stage {riftStage}
          </div>
          {riftStage % 5 === 0 && (
            <span className="text-xs font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800">
              ⚠️ Dimensional Boss
            </span>
          )}
        </div>

        {/* Vampire Survivors In-Run Augment EXP Bar */}
        <div className="flex items-center gap-3 flex-1 max-w-md mx-auto">
          <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-amber-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Augment Lvl {inRunLevel}</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-200"
              style={{ width: `${Math.min(100, (inRunExp / expNeeded) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-400 shrink-0 tabular-nums">
            {inRunExp}/{expNeeded}
          </span>
        </div>

        {/* Combat Settings: Auto Ultimate Switch & Speed Multipliers */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Toggleable AUTO / MANUAL ULTIMATE */}
          <button
            onClick={() => {
              sound.playClick();
              onUpdateAutoUltimates(!autoUltimates);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              autoUltimates
                ? 'bg-cyan-950/50 text-cyan-400 border-cyan-500/40 shadow-sm shadow-cyan-950'
                : 'bg-amber-950/50 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-950'
            }`}
            title="Toggle between AI automatic ultimate activation or manual player triggers"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{autoUltimates ? 'Auto Ultimate: ON' : 'Auto Ultimate: MANUAL'}</span>
          </button>

          {/* Speed Toggle (1x, 2x, 3x) */}
          <button
            onClick={() => {
              sound.playClick();
              onUpdateCombatSpeed(combatSpeed === 1 ? 2 : combatSpeed === 2 ? 3 : 1);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            title="Combat Speed"
          >
            <FastForward className="w-3.5 h-3.5 text-cyan-400" />
            <span>{combatSpeed}x</span>
          </button>

          {/* Pause / Resume */}
          <button
            onClick={() => {
              sound.playClick();
              setIsPaused(!isPaused);
            }}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            title={isPaused ? 'Resume Battle' : 'Pause Battle'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-slate-400" />}
          </button>

        </div>

      </div>

      {/* Main Battlefield Canvas */}
      <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#0a0f1d] via-[#070b16] to-[#040711] border border-slate-800/80 p-5 md:p-8 min-h-[460px] flex flex-col justify-between overflow-hidden shadow-2xl">
        
        {/* Floating Combat Damage Numbers */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
          {floatingTexts.map((item) => (
            <div
              key={item.id}
              className={`absolute font-black animate-out fade-out slide-out-to-top duration-700 select-none ${
                item.isCrit ? 'text-lg md:text-xl drop-shadow-md scale-110' : 'text-sm md:text-base'
              }`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                color: item.color,
              }}
            >
              {item.text}
            </div>
          ))}
        </div>

        {/* Combat Grid Arena */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center z-10">
          
          {/* Left Side: Player Tactical Formation */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
              <span className="text-cyan-400 font-bold uppercase tracking-wider">Allied Formation</span>
              <span>Backline · Midline · Frontline</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Backline (1 slot) */}
              <div className="flex flex-col justify-center">
                {friendlyTeam.filter((h) => h.gridPos === 'back-center').map((hero) => renderCombatantCard(hero, true))}
              </div>

              {/* Midline (2 slots) */}
              <div className="flex flex-col gap-2.5">
                {friendlyTeam.filter((h) => h.gridPos === 'mid-top').map((hero) => renderCombatantCard(hero, true))}
                {friendlyTeam.filter((h) => h.gridPos === 'mid-bottom').map((hero) => renderCombatantCard(hero, true))}
              </div>

              {/* Frontline (2 slots) */}
              <div className="flex flex-col gap-2.5">
                {friendlyTeam.filter((h) => h.gridPos === 'front-top').map((hero) => renderCombatantCard(hero, true))}
                {friendlyTeam.filter((h) => h.gridPos === 'front-bottom').map((hero) => renderCombatantCard(hero, true))}
              </div>
            </div>
          </div>

          {/* Right Side: Invading Rift Wave */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
              <span>Frontline · Midline · Backline</span>
              <span className="text-rose-400 font-bold uppercase tracking-wider">Invading Rift Wave</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Enemy Frontline (2 slots) */}
              <div className="flex flex-col gap-2.5">
                {enemyTeam.filter((e) => e.gridPos === 'front-top').map((enemy) => renderCombatantCard(enemy, false))}
                {enemyTeam.filter((e) => e.gridPos === 'front-bottom').map((enemy) => renderCombatantCard(enemy, false))}
              </div>

              {/* Enemy Midline (2 slots) */}
              <div className="flex flex-col gap-2.5">
                {enemyTeam.filter((e) => e.gridPos === 'mid-top').map((enemy) => renderCombatantCard(enemy, false))}
                {enemyTeam.filter((e) => e.gridPos === 'mid-bottom').map((enemy) => renderCombatantCard(enemy, false))}
              </div>

              {/* Enemy Backline (1 slot / Boss) */}
              <div className="flex flex-col justify-center">
                {enemyTeam.filter((e) => e.gridPos === 'back-center').map((enemy) => renderCombatantCard(enemy, false))}
              </div>
            </div>
          </div>

        </div>

        {/* Active In-Run Boons Bar */}
        {Object.keys(activeBoons).length > 0 && (
          <div className="mt-6 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-slate-400 font-medium shrink-0">Active In-Run Boons:</div>
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(activeBoons).map(([boonId, lvl]) => {
                const boonDef = IN_RUN_BOONS_POOL.find((b) => b.id === boonId);
                return (
                  <span
                    key={boonId}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 shadow-sm"
                    title={boonDef?.description || ''}
                  >
                    <span>{boonDef?.icon || '✨'}</span>
                    <span>{boonDef?.name || boonId}</span>
                    <span className="font-mono text-amber-400 font-bold">Lvl {lvl}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Synergies Active Bar */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-300">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Active Formation Synergies:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeOrigins.length === 0 && activeRoles.length === 0 ? (
            <span className="text-slate-500">No active synergies. Assign more heroes with shared origins/roles.</span>
          ) : (
            <>
              {activeOrigins.map((s) => (
                <div
                  key={s.definition.id}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-cyan-300 flex items-center gap-1.5"
                  title={s.activeTier?.description}
                >
                  <span>{s.definition.icon}</span>
                  <span className="font-semibold">{s.definition.name}</span>
                  <span className="font-mono text-cyan-400">({s.count})</span>
                </div>
              ))}
              {activeRoles.map((r) => (
                <div
                  key={r.definition.id}
                  className="px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-800/50 text-purple-300 flex items-center gap-1.5"
                  title={r.activeTier?.description}
                >
                  <span>{r.definition.icon}</span>
                  <span className="font-semibold">{r.definition.name}</span>
                  <span className="font-mono text-purple-400">({r.count})</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* In-Run Vampire Survivors Level Up Perk Modal */}
      {pendingDraft && (
        <BoonDraftModal
          level={inRunLevel}
          choices={pendingDraft}
          activeBoons={activeBoons}
          onSelectBoon={(boon) => {
            onSelectBoon(boon);
            setPendingDraft(null);
          }}
        />
      )}

      {/* Battle Defeat Modal */}
      {battleOutcome === 'defeat' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0b0f19] border border-rose-900/60 rounded-2xl p-6 text-center shadow-2xl flex flex-col items-center gap-4">
            <span className="text-4xl">💀</span>
            <h3 className="font-display text-2xl font-bold text-white">Party Overwhelmed</h3>
            <p className="text-sm text-slate-400">
              The dimensional rift was too fierce. Level up your heroes in the Roster Lab, adjust your grid formation, or retry this stage!
            </p>
            <div className="flex items-center gap-3 w-full mt-2">
              <button
                onClick={() => {
                  sound.playClick();
                  initBattle();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-semibold text-xs text-white transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Wave</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
