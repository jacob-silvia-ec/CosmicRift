import React, { useState } from 'react';
import {
  Formation,
  GridPosition,
  HeroDefinition,
  PlayerHeroState,
  Origin,
  Role,
} from '../types/game';
import { HERO_CATALOG, getHeroDefinition } from '../data/heroes';
import { calculateActiveSynergies } from '../utils/battleEngine';
import { sound } from '../utils/audio';
import {
  Star,
  Shield,
  Zap,
  Heart,
  Sword,
  Sparkles,
  ArrowUpCircle,
  X,
} from 'lucide-react';

interface HeroRosterViewProps {
  heroes: Record<string, PlayerHeroState>;
  formation: Formation;
  gold: number;
  onUpdateFormation: (newFormation: Formation) => void;
  onLevelUpHero: (heroId: string, goldCost: number) => void;
  onAscendHero: (heroId: string) => void;
  onQuestProgress: (type: 'upgrades', count: number) => void;
}

export const HeroRosterView: React.FC<HeroRosterViewProps> = ({
  heroes,
  formation,
  gold,
  onUpdateFormation,
  onLevelUpHero,
  onAscendHero,
  onQuestProgress,
}) => {
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [filterOrigin, setFilterOrigin] = useState<string>('All');
  const [filterRole, setFilterRole] = useState<string>('All');
  const [slottingPosition, setSlottingPosition] = useState<GridPosition | null>(null);

  const { activeOrigins, activeRoles } = calculateActiveSynergies(formation, heroes);

  // Filtered heroes list
  const filteredCatalog = HERO_CATALOG.filter((hero) => {
    if (filterOrigin !== 'All' && hero.origin !== filterOrigin) return false;
    if (filterRole !== 'All' && hero.role !== filterRole) return false;
    return true;
  });

  const selectedHeroDef = selectedHeroId ? getHeroDefinition(selectedHeroId) : null;
  const selectedHeroState = selectedHeroId ? heroes[selectedHeroId] : null;

  // Level up calculation: costs 100 * level gold
  const getLevelUpCost = (currentLevel: number) => currentLevel * 120;

  // Handle assigning a hero into the tactical grid
  const assignHeroToSlot = (heroId: string, pos: GridPosition) => {
    sound.playClick();
    const newFormation = { ...formation };

    // If hero is already in another slot, clear old slot
    (Object.keys(newFormation) as GridPosition[]).forEach((p) => {
      if (newFormation[p] === heroId) {
        newFormation[p] = null;
      }
    });

    newFormation[pos] = heroId;
    onUpdateFormation(newFormation);
    setSlottingPosition(null);
  };

  const removeHeroFromSlot = (pos: GridPosition) => {
    sound.playClick();
    const newFormation = { ...formation, [pos]: null };
    onUpdateFormation(newFormation);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-8">
      
      {/* Section 1: Tactical Grid Formation Manager */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span>5-Hero Tactical Grid Formation</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Position your champions to activate row bonuses and synergy advantages in battle.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {activeOrigins.map((s) => (
              <span
                key={s.definition.id}
                className="px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-semibold flex items-center gap-1"
              >
                <span>{s.definition.icon}</span>
                <span>{s.definition.name} ({s.count})</span>
              </span>
            ))}
            {activeRoles.map((r) => (
              <span
                key={r.definition.id}
                className="px-2.5 py-1 rounded bg-purple-950/60 border border-purple-800/60 text-purple-300 font-semibold flex items-center gap-1"
              >
                <span>{r.definition.icon}</span>
                <span>{r.definition.name} ({r.count})</span>
              </span>
            ))}
          </div>
        </div>

        {/* 3-Row Grid Formation Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
          
          {/* Back Row (1 Slot) */}
          <div className="flex flex-col justify-center gap-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Backline (+35% Crit Dmg)
            </div>
            {renderSlotCard('back-center', 'Protected Carry / Healer')}
          </div>

          {/* Mid Row (2 Slots) */}
          <div className="flex flex-col gap-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Midline (+15% Attack Speed)
            </div>
            {renderSlotCard('mid-top', 'Skirmisher / Buffer')}
            {renderSlotCard('mid-bottom', 'Skirmisher / Buffer')}
          </div>

          {/* Front Row (2 Slots) */}
          <div className="flex flex-col gap-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Frontline (+25% Max HP & Aggro)
            </div>
            {renderSlotCard('front-top', 'Guardian / Tank')}
            {renderSlotCard('front-bottom', 'Guardian / Tank')}
          </div>

        </div>

      </div>

      {/* Section 2: Hero Roster Collection */}
      <div className="flex flex-col gap-5">
        
        {/* Roster Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold text-white">
              Hero Roster ({Object.keys(heroes).length}/{HERO_CATALOG.length} Unlocked)
            </h3>
            <p className="text-xs text-slate-400">
              Inspect hero traits, upgrade stats with Gold, and ascend stars with essence duplicates.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Origin Selector */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              {['All', 'Draconic', 'Cybertech', 'Voidborn', 'Celestial', 'Beastkin'].map((orig) => (
                <button
                  key={orig}
                  onClick={() => setFilterOrigin(orig)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    filterOrigin === orig
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {orig}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hero Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {filteredCatalog.map((hero) => {
            const heroState = heroes[hero.id];
            const isUnlocked = !!heroState;
            const isAssigned = Object.values(formation).includes(hero.id);

            return (
              <div
                key={hero.id}
                onClick={() => {
                  sound.playClick();
                  if (slottingPosition && isUnlocked) {
                    assignHeroToSlot(hero.id, slottingPosition);
                  } else {
                    setSelectedHeroId(hero.id);
                  }
                }}
                className={`group relative p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-150 cursor-pointer ${
                  isUnlocked
                    ? 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/60 hover:shadow-lg'
                    : 'bg-slate-950/60 border-slate-900 opacity-40 grayscale'
                } ${isAssigned ? 'ring-1 ring-amber-500/50' : ''}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">{hero.avatarIcon}</span>
                    {isAssigned && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                        In Team
                      </span>
                    )}
                  </div>

                  <h4 className="font-display text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                    {hero.name}
                  </h4>
                  <div className="text-[11px] text-slate-400">
                    {hero.role} · {hero.origin}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  {isUnlocked ? (
                    <>
                      <span className="text-cyan-400 font-semibold">Lvl {heroState.level}</span>
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: heroState.stars }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <span className="text-slate-500 text-[11px]">Locked in Rift</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Hero Dossier & Upgrade Modal */}
      {selectedHeroDef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-5xl p-2 rounded-xl bg-slate-900 border border-slate-800">
                  {selectedHeroDef.avatarIcon}
                </span>
                <div>
                  <h3 className="font-display text-2xl font-bold text-white">
                    {selectedHeroDef.name}
                  </h3>
                  <div className="text-xs text-slate-400">
                    {selectedHeroDef.title} · {selectedHeroDef.role} · {selectedHeroDef.origin}
                  </div>
                  {selectedHeroState && (
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="text-cyan-400 font-bold font-mono">
                        Level {selectedHeroState.level}
                      </span>
                      <span className="text-slate-600">·</span>
                      <div className="text-amber-400 font-bold">
                        {Array.from({ length: selectedHeroState.stars }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedHeroId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Base Stats Breakdown */}
            {selectedHeroState && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Max HP</div>
                  <div className="text-base font-bold font-mono text-emerald-400">
                    {Math.round(selectedHeroDef.baseStats.hp * (1 + (selectedHeroState.level - 1) * 0.12))}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Attack (ATK)</div>
                  <div className="text-base font-bold font-mono text-rose-400">
                    {Math.round(selectedHeroDef.baseStats.atk * (1 + (selectedHeroState.level - 1) * 0.12))}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Defense (DEF)</div>
                  <div className="text-base font-bold font-mono text-cyan-400">
                    {Math.round(selectedHeroDef.baseStats.def * (1 + (selectedHeroState.level - 1) * 0.12))}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Crit Rate</div>
                  <div className="text-base font-bold font-mono text-amber-400">
                    {Math.round(selectedHeroDef.baseStats.critRate * 100)}%
                  </div>
                </div>
              </div>
            )}

            {/* Skills & Lore */}
            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5 mb-1">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>Ultimate: {selectedHeroDef.ultimate.name}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {selectedHeroDef.ultimate.description}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Passive: {selectedHeroDef.passiveTrait.name}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {selectedHeroDef.passiveTrait.description}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-900">
                <div className="font-bold text-slate-400 mb-1">Multiverse Backstory</div>
                <p className="text-slate-400 italic leading-relaxed">
                  "{selectedHeroDef.lore}"
                </p>
              </div>
            </div>

            {/* Upgrade Actions */}
            {selectedHeroState && (
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                {/* Level Up Button */}
                <button
                  onClick={() => {
                    const cost = getLevelUpCost(selectedHeroState.level);
                    if (gold >= cost) {
                      sound.playClick();
                      onLevelUpHero(selectedHeroDef.id, cost);
                      onQuestProgress('upgrades', 1);
                    }
                  }}
                  disabled={gold < getLevelUpCost(selectedHeroState.level)}
                  className={`flex-1 w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
                    gold >= getLevelUpCost(selectedHeroState.level)
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950 cursor-pointer'
                      : 'opacity-50 bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>
                    Level Up (🪙 {getLevelUpCost(selectedHeroState.level).toLocaleString()} Gold)
                  </span>
                </button>

                {/* Star Ascension Button */}
                <button
                  onClick={() => {
                    if (selectedHeroState.duplicates >= 1 && selectedHeroState.stars < 5) {
                      sound.playLevelUp();
                      onAscendHero(selectedHeroDef.id);
                    }
                  }}
                  disabled={selectedHeroState.duplicates < 1 || selectedHeroState.stars >= 5}
                  className={`flex-1 w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
                    selectedHeroState.duplicates >= 1 && selectedHeroState.stars < 5
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950 cursor-pointer'
                      : 'opacity-50 bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span>
                    {selectedHeroState.stars >= 5
                      ? 'Max Star Rank'
                      : `Ascend Star (${selectedHeroState.duplicates}/1 Essence)`}
                  </span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );

  function renderSlotCard(pos: GridPosition, subtitle: string) {
    const heroId = formation[pos];
    const heroDef = heroId ? getHeroDefinition(heroId) : null;
    const heroState = heroId ? heroes[heroId] : null;

    return (
      <div
        onClick={() => {
          sound.playClick();
          setSlottingPosition(pos);
        }}
        className={`p-3.5 rounded-xl border flex items-center justify-between transition-all duration-150 cursor-pointer ${
          heroDef
            ? 'bg-slate-900 border-slate-700 hover:border-cyan-400 shadow-md'
            : 'bg-slate-900/40 border-dashed border-slate-800 hover:border-slate-600'
        } ${slottingPosition === pos ? 'ring-2 ring-cyan-400' : ''}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{heroDef ? heroDef.avatarIcon : '➕'}</span>
          <div>
            <div className="text-xs font-bold text-white">
              {heroDef ? heroDef.name : 'Empty Slot'}
            </div>
            <div className="text-[10px] text-slate-400">
              {heroDef ? `${heroDef.role} · Lvl ${heroState?.level || 1}` : subtitle}
            </div>
          </div>
        </div>

        {heroDef && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeHeroFromSlot(pos);
            }}
            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
            title="Remove from slot"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
};
