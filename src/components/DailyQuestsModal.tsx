import React from 'react';
import { DailyQuest } from '../types/game';
import { sound } from '../utils/audio';
import { CheckSquare, X, Check, Gift, RotateCcw } from 'lucide-react';

interface DailyQuestsModalProps {
  quests: DailyQuest[];
  onClaimQuest: (questId: string) => void;
  onRefreshQuests: () => void;
  onClose: () => void;
}

export const DailyQuestsModal: React.FC<DailyQuestsModalProps> = ({
  quests,
  onClaimQuest,
  onRefreshQuests,
  onClose,
}) => {
  const completedCount = quests.filter((q) => q.claimed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
              <CheckSquare className="w-6 h-6" />
            </span>
            <div>
              <h3 className="font-display text-xl md:text-2xl font-bold text-white">
                Daily Multiverse Bounties
              </h3>
              <p className="text-xs text-slate-400">
                Complete daily objectives to earn continuous Astral Shards and Gold without microtransactions.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Daily Progress Tracker */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs font-bold text-slate-200">
                Daily Completion: {completedCount}/{quests.length} Completed
              </div>
              <div className="text-[11px] text-slate-400">
                All quests refresh every 24 hours
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onRefreshQuests();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold transition-colors"
            title="Reset Daily Quests for Demo / Testing"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset Demo</span>
          </button>
        </div>

        {/* Quests List */}
        <div className="flex flex-col gap-3">
          {quests.map((quest) => {
            const isReadyToClaim = quest.progress >= quest.target && !quest.claimed;
            const progressPercent = Math.min(100, (quest.progress / quest.target) * 100);

            return (
              <div
                key={quest.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-display text-sm font-bold text-white">
                      {quest.title}
                    </h4>
                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                      {quest.progress}/{quest.target}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-2">{quest.description}</p>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-200"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Rewards & Action */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-cyan-400">💎 +{quest.rewardShards}</span>
                    <span className="text-amber-400">🪙 +{quest.rewardGold}</span>
                  </div>

                  {quest.claimed ? (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-500 text-xs font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Claimed</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        if (isReadyToClaim) {
                          sound.playVictory();
                          onClaimQuest(quest.id);
                        }
                      }}
                      disabled={!isReadyToClaim}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        isReadyToClaim
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950 cursor-pointer animate-pulse'
                          : 'opacity-40 bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isReadyToClaim ? 'Claim Spoils' : 'In Progress'}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
