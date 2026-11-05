import React from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Clock,
  CheckSquare,
  Swords,
  Users,
  Compass,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface NavbarProps {
  currentTab: 'battle' | 'summon' | 'roster' | 'constellation';
  setCurrentTab: (tab: 'battle' | 'summon' | 'roster' | 'constellation') => void;
  gold: number;
  astralShards: number;
  dimensionalRelics: number;
  isMuted: boolean;
  toggleMute: () => void;
  onOpenAfk: () => void;
  onOpenQuests: () => void;
  unclaimedQuestsCount: number;
  afkMinutes: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  gold,
  astralShards,
  dimensionalRelics,
  isMuted,
  toggleMute,
  onOpenAfk,
  onOpenQuests,
  unclaimedQuestsCount,
  afkMinutes,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090d1a]/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        
        {/* Zone 1: Single Wordmark Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-cyan-950/40 text-lg">
            🌌
          </div>
          <div>
            <span className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap block">
              COSMIC RIFT
            </span>
            <div className="text-[10px] text-slate-400 font-medium tracking-wider uppercase -mt-0.5">
              Multiverse Battler
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single-line controls) */}
        <nav className="flex items-center gap-1.5 md:gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setCurrentTab('battle');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
              currentTab === 'battle'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Battle Arena</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setCurrentTab('summon');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
              currentTab === 'summon'
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-sm shadow-indigo-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Multiverse Gate</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setCurrentTab('roster');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
              currentTab === 'roster'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Hero Roster</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setCurrentTab('constellation');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
              currentTab === 'constellation'
                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-sm shadow-purple-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Constellation</span>
          </button>
        </nav>

        {/* Zone 3: Resources & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Currencies Bar */}
          <div className="hidden lg:flex items-center gap-3.5 bg-slate-900/80 border border-slate-800 rounded-lg px-3.5 py-1.5 text-xs font-semibold tabular-nums">
            <div className="flex items-center gap-1.5 text-amber-400" title="Rift Gold">
              <span>🪙</span>
              <span>{gold.toLocaleString()}</span>
            </div>
            <div className="w-[1px] h-3.5 bg-slate-800" />
            <div className="flex items-center gap-1.5 text-cyan-400" title="Astral Shards (Gacha Currency)">
              <span>💎</span>
              <span>{astralShards.toLocaleString()}</span>
            </div>
            <div className="w-[1px] h-3.5 bg-slate-800" />
            <div className="flex items-center gap-1.5 text-purple-400" title="Dimensional Relics (Constellation Talent Currency)">
              <span>🔮</span>
              <span>{dimensionalRelics.toLocaleString()}</span>
            </div>
          </div>

          {/* Daily Quests Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenQuests();
            }}
            className="relative flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-colors whitespace-nowrap"
            title="Daily Quests"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Quests</span>
            {unclaimedQuestsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
            )}
          </button>

          {/* AFK Time Capsule */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenAfk();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/50 rounded-lg text-xs font-semibold text-cyan-300 transition-colors whitespace-nowrap"
            title="Multiverse Time Capsule (Idle AFK Earnings)"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">AFK</span>
            <span className="text-[11px] text-cyan-400 font-mono">
              {Math.floor(afkMinutes / 60)}h{afkMinutes % 60}m
            </span>
          </button>

          {/* Audio Mute Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              toggleMute();
            }}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
          </button>
        </div>

      </div>
    </header>
  );
};
