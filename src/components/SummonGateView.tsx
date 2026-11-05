import React, { useState } from 'react';
import { HeroDefinition, PlayerHeroState } from '../types/game';
import { HERO_CATALOG } from '../data/heroes';
import { sound } from '../utils/audio';
import { Sparkles, Star, Shield, ArrowRight, RotateCcw } from 'lucide-react';

interface SummonGateViewProps {
  astralShards: number;
  pityCounter: number;
  heroes: Record<string, PlayerHeroState>;
  onPerformSummon: (
    pulls: { hero: HeroDefinition; isDuplicate: boolean }[],
    shardsCost: number,
    newPity: number
  ) => void;
  onQuestProgress: (type: 'summons', count: number) => void;
}

export const SummonGateView: React.FC<SummonGateViewProps> = ({
  astralShards,
  pityCounter,
  heroes,
  onPerformSummon,
  onQuestProgress,
}) => {
  const [summonResults, setSummonResults] = useState<{
    hero: HeroDefinition;
    isDuplicate: boolean;
  }[] | null>(null);
  const [isSummoning, setIsSummoning] = useState<boolean>(false);

  // Gacha probability roll
  const rollSingleHero = (currentPity: number): { hero: HeroDefinition; resetPity: boolean } => {
    // Check if hard pity reached (30 pulls)
    if (currentPity <= 1) {
      const legendaries = HERO_CATALOG.filter((h) => h.rarity === '5-star');
      const picked = legendaries[Math.floor(Math.random() * legendaries.length)];
      return { hero: picked, resetPity: true };
    }

    const rand = Math.random() * 100;
    if (rand < 4.0) {
      // 4% 5-Star Legendary
      const pool = HERO_CATALOG.filter((h) => h.rarity === '5-star');
      const picked = pool[Math.floor(Math.random() * pool.length)];
      return { hero: picked, resetPity: true };
    } else if (rand < 24.0) {
      // 20% 4-Star Epic
      const pool = HERO_CATALOG.filter((h) => h.rarity === '4-star');
      const picked = pool[Math.floor(Math.random() * pool.length)];
      return { hero: picked, resetPity: false };
    } else {
      // 76% 3-Star Rare
      const pool = HERO_CATALOG.filter((h) => h.rarity === '3-star');
      const picked = pool[Math.floor(Math.random() * pool.length)];
      return { hero: picked, resetPity: false };
    }
  };

  const executeSummon = (count: number, cost: number) => {
    if (astralShards < cost || isSummoning) return;

    sound.playSummon();
    setIsSummoning(true);
    onQuestProgress('summons', count);

    let rollingPity = pityCounter;
    const pulls: { hero: HeroDefinition; isDuplicate: boolean }[] = [];

    for (let i = 0; i < count; i++) {
      const { hero, resetPity } = rollSingleHero(rollingPity);
      const isDuplicate = !!heroes[hero.id];
      pulls.push({ hero, isDuplicate });

      if (resetPity) {
        rollingPity = 30;
      } else {
        rollingPity = Math.max(1, rollingPity - 1);
      }
    }

    setTimeout(() => {
      setSummonResults(pulls);
      setIsSummoning(false);
      onPerformSummon(pulls, cost, rollingPity);
    }, 600);
  };

  const getRarityBadge = (rarity: HeroDefinition['rarity']) => {
    switch (rarity) {
      case '5-star':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case '4-star':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      default:
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    }
  };

  const getRarityBorder = (rarity: HeroDefinition['rarity']) => {
    switch (rarity) {
      case '5-star':
        return 'border-amber-500/70 shadow-amber-950/60 ring-1 ring-amber-400/40';
      case '4-star':
        return 'border-purple-500/70 shadow-purple-950/60 ring-1 ring-purple-400/40';
      default:
        return 'border-cyan-500/60 shadow-cyan-950/50';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-6">
      
      {/* Summon Chamber Portal Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-indigo-900/50 p-6 md:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Left Information */}
        <div className="flex flex-col gap-2 max-w-lg z-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            <Sparkles className="w-4 h-4" />
            <span>Dimensional Rift Gate</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-white">
            Multiverse Summoning
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Channel pure Astral Shards to tear open dimensional fissures and summon mythic champions, alien dreadnoughts, and cosmic beings into your ranks.
          </p>

          {/* Pity Counter Bar */}
          <div className="mt-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-200">Guaranteed 5★ Legendary Pity</div>
              <div className="text-[11px] text-slate-400">Resets on summoning any 5★ hero</div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">
                {pityCounter}
              </span>
              <span className="text-xs text-slate-400 ml-1">pulls left</span>
            </div>
          </div>
        </div>

        {/* Portal Visual Icon */}
        <div className="relative flex items-center justify-center w-48 h-48 rounded-full bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 p-1 shadow-2xl shadow-indigo-900/60 animate-pulse">
          <div className="w-full h-full rounded-full bg-[#070b16] flex items-center justify-center flex-col text-center p-4">
            <span className="text-5xl mb-1">🌌</span>
            <span className="text-xs font-bold text-indigo-300">ASTRAL PORTAL</span>
          </div>
        </div>

      </div>

      {/* Action Buttons Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Single Summon */}
        <button
          onClick={() => executeSummon(1, 100)}
          disabled={astralShards < 100 || isSummoning}
          className={`p-5 rounded-xl border flex items-center justify-between transition-all duration-150 ${
            astralShards >= 100 && !isSummoning
              ? 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/90 hover:shadow-lg cursor-pointer'
              : 'opacity-50 bg-slate-950 border-slate-900 cursor-not-allowed'
          }`}
        >
          <div className="text-left">
            <div className="font-display text-base font-bold text-white">Single Summon</div>
            <div className="text-xs text-slate-400">Summon 1 random hero</div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-bold font-mono">
            <span>💎</span>
            <span>100 Shards</span>
          </div>
        </button>

        {/* 10x Multi Summon (with 10% discount) */}
        <button
          onClick={() => executeSummon(10, 900)}
          disabled={astralShards < 900 || isSummoning}
          className={`p-5 rounded-xl border flex items-center justify-between transition-all duration-150 ${
            astralShards >= 900 && !isSummoning
              ? 'bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border-indigo-700/60 hover:border-indigo-500 hover:shadow-xl shadow-indigo-950/50 cursor-pointer'
              : 'opacity-50 bg-slate-950 border-slate-900 cursor-not-allowed'
          }`}
        >
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-bold text-white">10x Multi-Summon</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                10% OFF
              </span>
            </div>
            <div className="text-xs text-slate-400">Summon 10 heroes at once</div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs font-bold font-mono">
            <span>💎</span>
            <span>900 Shards</span>
          </div>
        </button>

      </div>

      {/* Rarity Drop Rates Breakdown */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <span className="text-slate-400 font-medium">Multiverse Probability Distribution:</span>
        <div className="flex items-center gap-4">
          <span className="text-amber-400 font-semibold">5★ Legendary: 4.0%</span>
          <span className="text-slate-600">·</span>
          <span className="text-purple-400 font-semibold">4★ Epic: 20.0%</span>
          <span className="text-slate-600">·</span>
          <span className="text-cyan-400 font-semibold">3★ Rare: 76.0%</span>
        </div>
      </div>

      {/* Summon Reveal Overlay Modal */}
      {summonResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            
            <div className="text-center flex flex-col items-center gap-1">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Dimensional Convergence Results
              </div>
              <h3 className="font-display text-2xl font-bold text-white">
                Summoned Heroes ({summonResults.length})
              </h3>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {summonResults.map((pull, idx) => (
                <div
                  key={`${pull.hero.id}-${idx}`}
                  className={`p-3.5 rounded-xl bg-slate-900 border flex flex-col items-center text-center gap-2 shadow-lg ${getRarityBorder(
                    pull.hero.rarity
                  )}`}
                >
                  <span className="text-4xl">{pull.hero.avatarIcon}</span>
                  <div className="w-full truncate">
                    <div className="text-xs font-bold text-white truncate">{pull.hero.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{pull.hero.title}</div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getRarityBadge(
                      pull.hero.rarity
                    )}`}
                  >
                    {pull.hero.rarity}
                  </span>

                  {pull.isDuplicate ? (
                    <span className="text-[10px] text-emerald-400 font-medium">
                      +1 Star Essence
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-bold">
                      ✨ NEW HERO!
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Close Button */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setSummonResults(null);
                }}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white transition-colors"
              >
                Collect & Return to Chamber
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
