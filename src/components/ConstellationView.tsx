import React from 'react';
import { ConstellationNode } from '../types/game';
import { CONSTELLATION_NODES } from '../data/constellations';
import { sound } from '../utils/audio';
import { Compass, Sparkles, ArrowUpCircle } from 'lucide-react';

interface ConstellationViewProps {
  dimensionalRelics: number;
  constellations: Record<string, number>;
  onUpgradeConstellation: (nodeId: string, cost: number) => void;
}

export const ConstellationView: React.FC<ConstellationViewProps> = ({
  dimensionalRelics,
  constellations,
  onUpgradeConstellation,
}) => {
  const getNodeCost = (node: ConstellationNode, currentLevel: number) => {
    return Math.round(node.baseCost * Math.pow(node.costMultiplier, currentLevel));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-8">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-950 to-indigo-950/40 border border-purple-900/50 p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-lg">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
            <Compass className="w-4 h-4" />
            <span>Permanent Meta-Progression</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
            The Astral Constellation
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Inscribe cosmic dimensional relics into the permanent firmament to bestow everlasting stat boons across every hero in your multiverse collection.
          </p>
        </div>

        {/* Currency balance callout */}
        <div className="p-4 rounded-xl bg-purple-950/60 border border-purple-800/80 flex items-center gap-3">
          <span className="text-3xl">🔮</span>
          <div>
            <div className="text-[11px] font-semibold text-purple-300 uppercase">
              Dimensional Relics
            </div>
            <div className="text-2xl font-bold font-mono text-purple-100 tabular-nums">
              {dimensionalRelics.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Constellation Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CONSTELLATION_NODES.map((node) => {
          const curLvl = constellations[node.id] || 0;
          const isMax = curLvl >= node.maxLevel;
          const cost = getNodeCost(node, curLvl);
          const canAfford = dimensionalRelics >= cost && !isMax;

          return (
            <div
              key={node.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all duration-150 ${
                curLvl > 0
                  ? 'bg-slate-900/90 border-purple-800/60 shadow-lg shadow-purple-950/30'
                  : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              <div className="flex flex-col gap-3">
                
                {/* Node Title & Level */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                      {node.icon}
                    </span>
                    <div>
                      <h4 className="font-display text-base font-bold text-white">
                        {node.name}
                      </h4>
                      <div className="text-[11px] text-slate-400">Tier {node.tier} Resonance</div>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/50">
                    Lvl {curLvl}/{node.maxLevel}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {node.description}
                </p>

                {/* Cumulative Stat Display */}
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs flex items-center justify-between font-mono">
                  <span className="text-slate-400">Total Bonus:</span>
                  <span className="text-amber-400 font-bold">
                    +{curLvl * node.valuePerLevel}%
                  </span>
                </div>

              </div>

              {/* Upgrade Button */}
              <div className="mt-5 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    if (canAfford) {
                      sound.playLevelUp();
                      onUpgradeConstellation(node.id, cost);
                    }
                  }}
                  disabled={!canAfford}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    canAfford
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-950 cursor-pointer'
                      : 'opacity-40 bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <ArrowUpCircle className="w-3.5 h-3.5" />
                  <span>
                    {isMax
                      ? 'Fully Awakened'
                      : `Inscribe (🔮 ${cost.toLocaleString()} Relics)`}
                  </span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
