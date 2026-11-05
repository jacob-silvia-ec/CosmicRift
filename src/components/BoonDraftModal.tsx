import React from 'react';
import { InRunBoon } from '../types/game';
import { sound } from '../utils/audio';

interface BoonDraftModalProps {
  level: number;
  choices: InRunBoon[];
  activeBoons: Record<string, number>;
  onSelectBoon: (boon: InRunBoon) => void;
}

export const BoonDraftModal: React.FC<BoonDraftModalProps> = ({
  level,
  choices,
  activeBoons,
  onSelectBoon,
}) => {
  const getTierBadgeStyle = (tier: InRunBoon['tier']) => {
    switch (tier) {
      case 'Legendary':
        return 'border-amber-500/50 bg-amber-500/10 text-amber-300';
      case 'Epic':
        return 'border-purple-500/50 bg-purple-500/10 text-purple-300';
      case 'Rare':
        return 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300';
      default:
        return 'border-slate-600 bg-slate-800 text-slate-300';
    }
  };

  const getCardBorder = (tier: InRunBoon['tier']) => {
    switch (tier) {
      case 'Legendary':
        return 'border-amber-500/60 hover:border-amber-400 hover:shadow-amber-950/50';
      case 'Epic':
        return 'border-purple-500/60 hover:border-purple-400 hover:shadow-purple-950/50';
      case 'Rare':
        return 'border-cyan-500/60 hover:border-cyan-400 hover:shadow-cyan-950/50';
      default:
        return 'border-slate-700 hover:border-slate-500 hover:shadow-slate-900/50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl shadow-cyan-950/60 flex flex-col gap-6">
        
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-1.5">
          <div className="text-xs font-semibold tracking-wider text-cyan-400 uppercase">
            Rift Augment Draft · Level {level}
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
            Choose Your Dimensional Boon
          </h2>
          <p className="text-sm text-slate-400 max-w-md">
            Select one augmented power to empower your entire party for the remainder of this rift run.
          </p>
        </div>

        {/* 3 Choices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {choices.map((boon) => {
            const curLvl = activeBoons[boon.id] || 0;
            const isNew = curLvl === 0;

            return (
              <button
                key={boon.id}
                onClick={() => {
                  sound.playClick();
                  onSelectBoon(boon);
                }}
                className={`group relative text-left p-5 rounded-xl bg-slate-900/90 border transition-all duration-150 flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl cursor-pointer ${getCardBorder(
                  boon.tier
                )}`}
              >
                <div className="flex flex-col gap-3">
                  
                  {/* Top line with Icon & Tier */}
                  <div className="flex items-center justify-between">
                    <span className="text-3xl p-2 rounded-lg bg-slate-800/80 border border-slate-700/50 inline-block">
                      {boon.icon}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${getTierBadgeStyle(
                        boon.tier
                      )}`}
                    >
                      {boon.tier}
                    </span>
                  </div>

                  {/* Title and Level progression */}
                  <div>
                    <h3 className="font-display text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {boon.name}
                    </h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {isNew ? (
                        <span className="text-emerald-400 font-medium">New Boon</span>
                      ) : (
                        <span>
                          Level {curLvl} <span className="text-slate-500">→</span>{' '}
                          <span className="text-amber-400 font-semibold">Level {curLvl + 1}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {boon.description}
                  </p>
                </div>

                {/* Selection Action Button */}
                <div className="mt-5 pt-3 border-t border-slate-800/80">
                  <span className="w-full block text-center py-2 px-3 rounded-lg bg-slate-800 group-hover:bg-cyan-600 text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                    Draft Augment
                  </span>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
