import React from 'react';
import { calculateAfkEarnings } from '../utils/gameStorage';
import { sound } from '../utils/audio';
import { Clock, X, Gift, Sparkles } from 'lucide-react';

interface AfkChestModalProps {
  lastAfkClaimTimestamp: number;
  highestStage: number;
  afkConstellationLevel: number;
  onClaimAfk: (rewards: { gold: number; exp: number; relics: number }) => void;
  onClose: () => void;
}

export const AfkChestModal: React.FC<AfkChestModalProps> = ({
  lastAfkClaimTimestamp,
  highestStage,
  afkConstellationLevel,
  onClaimAfk,
  onClose,
}) => {
  const earnings = calculateAfkEarnings(
    lastAfkClaimTimestamp,
    highestStage,
    afkConstellationLevel
  );

  const hours = Math.floor(earnings.effectiveMinutes / 60);
  const minutes = earnings.effectiveMinutes % 60;
  const maxHours = Math.floor(earnings.maxMinutes / 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0b0f19] border border-cyan-900/60 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 text-center">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>Multiverse Time Capsule</span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Capsule Graphic */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-2xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-4xl shadow-lg shadow-cyan-950/60 animate-bounce">
            ⏳
          </div>
          <h3 className="font-display text-2xl font-bold text-white">
            Idle AFK Spoils
          </h3>
          <p className="text-xs text-slate-400">
            Accumulated over{' '}
            <span className="text-cyan-400 font-mono font-bold">
              {hours}h {minutes}m
            </span>{' '}
            (Cap: {maxHours}h).
          </p>
        </div>

        {/* Accumulated Spoils Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center">
            <span className="text-xl mb-1">🪙</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Gold</span>
            <span className="text-sm font-bold font-mono text-amber-400 tabular-nums">
              +{earnings.totalGold.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center">
            <span className="text-xl mb-1">✨</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Rift EXP</span>
            <span className="text-sm font-bold font-mono text-cyan-400 tabular-nums">
              +{earnings.totalExp.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center">
            <span className="text-xl mb-1">🔮</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Relics</span>
            <span className="text-sm font-bold font-mono text-purple-400 tabular-nums">
              +{earnings.totalRelics.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Claim Action Button */}
        <button
          onClick={() => {
            sound.playVictory();
            onClaimAfk({
              gold: earnings.totalGold,
              exp: earnings.totalExp,
              relics: earnings.totalRelics,
            });
            onClose();
          }}
          disabled={earnings.totalGold <= 0}
          className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
            earnings.totalGold > 0
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950 cursor-pointer'
              : 'opacity-40 bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Claim All AFK Spoils</span>
        </button>

      </div>
    </div>
  );
};
