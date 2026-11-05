import React, { useState, useEffect, useCallback } from 'react';
import {
  GameSaveData,
  Formation,
  InRunBoon,
  HeroDefinition,
} from './types/game';
import {
  loadGame,
  saveGame,
  calculateAfkEarnings,
} from './utils/gameStorage';
import { sound } from './utils/audio';
import { generateDailyQuests } from './data/quests';
import { Navbar } from './components/Navbar';
import { BattleView } from './components/BattleView';
import { SummonGateView } from './components/SummonGateView';
import { HeroRosterView } from './components/HeroRosterView';
import { ConstellationView } from './components/ConstellationView';
import { DailyQuestsModal } from './components/DailyQuestsModal';
import { AfkChestModal } from './components/AfkChestModal';

export default function App() {
  const [gameState, setGameState] = useState<GameSaveData>(() => loadGame());
  const [currentTab, setCurrentTab] = useState<'battle' | 'summon' | 'roster' | 'constellation'>('battle');
  const [isAfkModalOpen, setIsAfkModalOpen] = useState<boolean>(false);
  const [isQuestsModalOpen, setIsQuestsModalOpen] = useState<boolean>(false);
  const [afkMinutes, setAfkMinutes] = useState<number>(0);

  // Sync sound mute with saved state
  useEffect(() => {
    sound.setMuted(gameState.isSoundMuted);
  }, [gameState.isSoundMuted]);

  // Periodic auto-save & AFK ticker
  useEffect(() => {
    const interval = setInterval(() => {
      // Calculate current AFK elapsed minutes
      const afkLvl = gameState.constellations['time-dilation'] || 0;
      const earnings = calculateAfkEarnings(
        gameState.lastAfkClaimTimestamp,
        gameState.highestStage,
        afkLvl
      );
      setAfkMinutes(earnings.effectiveMinutes);

      // Auto save state
      saveGame(gameState);
    }, 2000);

    return () => clearInterval(interval);
  }, [gameState]);

  // Handle stage cleared in Battle Arena
  const handleStageClear = useCallback(
    (nextStage: number, rewards: { gold: number; shards: number; relics: number }) => {
      setGameState((prev) => {
        const updated = {
          ...prev,
          gold: prev.gold + rewards.gold,
          astralShards: prev.astralShards + rewards.shards,
          dimensionalRelics: prev.dimensionalRelics + rewards.relics,
          riftStage: nextStage,
          highestStage: Math.max(prev.highestStage, nextStage),
        };
        saveGame(updated);
        return updated;
      });
    },
    []
  );

  // Handle formation grid changes
  const handleUpdateFormation = useCallback((newFormation: Formation) => {
    setGameState((prev) => {
      const updated = { ...prev, formation: newFormation };
      saveGame(updated);
      return updated;
    });
  }, []);

  // Handle leveling up a hero with Gold
  const handleLevelUpHero = useCallback((heroId: string, goldCost: number) => {
    setGameState((prev) => {
      const hero = prev.heroes[heroId];
      if (!hero || prev.gold < goldCost) return prev;

      const updated = {
        ...prev,
        gold: prev.gold - goldCost,
        heroes: {
          ...prev.heroes,
          [heroId]: {
            ...hero,
            level: hero.level + 1,
          },
        },
      };
      saveGame(updated);
      return updated;
    });
  }, []);

  // Handle star ascension with duplicate essences
  const handleAscendHero = useCallback((heroId: string) => {
    setGameState((prev) => {
      const hero = prev.heroes[heroId];
      if (!hero || hero.duplicates < 1 || hero.stars >= 5) return prev;

      const updated = {
        ...prev,
        heroes: {
          ...prev.heroes,
          [heroId]: {
            ...hero,
            stars: hero.stars + 1,
            duplicates: hero.duplicates - 1,
          },
        },
      };
      saveGame(updated);
      return updated;
    });
  }, []);

  // Handle constellation node permanent upgrades
  const handleUpgradeConstellation = useCallback((nodeId: string, cost: number) => {
    setGameState((prev) => {
      if (prev.dimensionalRelics < cost) return prev;
      const curLvl = prev.constellations[nodeId] || 0;

      const updated = {
        ...prev,
        dimensionalRelics: prev.dimensionalRelics - cost,
        constellations: {
          ...prev.constellations,
          [nodeId]: curLvl + 1,
        },
      };
      saveGame(updated);
      return updated;
    });
  }, []);

  // Handle Gacha Summon execution
  const handlePerformSummon = useCallback(
    (
      pulls: { hero: HeroDefinition; isDuplicate: boolean }[],
      shardsCost: number,
      newPity: number
    ) => {
      setGameState((prev) => {
        const newHeroes = { ...prev.heroes };

        pulls.forEach(({ hero, isDuplicate }) => {
          if (isDuplicate) {
            newHeroes[hero.id] = {
              ...newHeroes[hero.id],
              duplicates: (newHeroes[hero.id].duplicates || 0) + 1,
            };
          } else {
            newHeroes[hero.id] = {
              heroId: hero.id,
              level: 1,
              stars: hero.rarity === '5-star' ? 3 : hero.rarity === '4-star' ? 2 : 1,
              duplicates: 0,
            };
          }
        });

        const updated = {
          ...prev,
          astralShards: Math.max(0, prev.astralShards - shardsCost),
          heroes: newHeroes,
          pityCounter: newPity,
          totalSummonsPerformed: prev.totalSummonsPerformed + pulls.length,
        };
        saveGame(updated);
        return updated;
      });
    },
    []
  );

  // Handle quest progress accumulation
  const handleQuestProgress = useCallback(
    (type: 'waves' | 'ultimates' | 'summons' | 'upgrades' | 'afk', count: number) => {
      setGameState((prev) => {
        let changed = false;
        const newQuests = prev.dailyQuests.map((q) => {
          if (q.type === type && !q.claimed) {
            const newProg = Math.min(q.target, q.progress + count);
            if (newProg !== q.progress) {
              changed = true;
              return { ...q, progress: newProg, completed: newProg >= q.target };
            }
          }
          return q;
        });

        if (!changed) return prev;
        const updated = { ...prev, dailyQuests: newQuests };
        saveGame(updated);
        return updated;
      });
    },
    []
  );

  // Handle claiming quest rewards
  const handleClaimQuest = useCallback((questId: string) => {
    setGameState((prev) => {
      const quest = prev.dailyQuests.find((q) => q.id === questId);
      if (!quest || quest.claimed || quest.progress < quest.target) return prev;

      const newQuests = prev.dailyQuests.map((q) =>
        q.id === questId ? { ...q, claimed: true } : q
      );

      const updated = {
        ...prev,
        astralShards: prev.astralShards + quest.rewardShards,
        gold: prev.gold + quest.rewardGold,
        dailyQuests: newQuests,
      };
      saveGame(updated);
      return updated;
    });
  }, []);

  // Handle claiming idle AFK rewards
  const handleClaimAfk = useCallback(
    (rewards: { gold: number; exp: number; relics: number }) => {
      setGameState((prev) => {
        const updated = {
          ...prev,
          gold: prev.gold + rewards.gold,
          dimensionalRelics: prev.dimensionalRelics + rewards.relics,
          lastAfkClaimTimestamp: Date.now(),
        };
        saveGame(updated);
        return updated;
      });
      handleQuestProgress('afk', 1);
      setAfkMinutes(0);
    },
    [handleQuestProgress]
  );

  // Handle drafting a Vampire Survivors in-run boon
  const handleSelectBoon = useCallback((boon: InRunBoon) => {
    setGameState((prev) => {
      const curLvl = prev.activeBoons[boon.id] || 0;
      const updated = {
        ...prev,
        activeBoons: {
          ...prev.activeBoons,
          [boon.id]: curLvl + 1,
        },
      };
      saveGame(updated);
      return updated;
    });
  }, []);

  const handleInRunExpGain = useCallback((newExp: number, newLevel: number) => {
    setGameState((prev) => ({
      ...prev,
      inRunExp: newExp,
      inRunLevel: newLevel,
    }));
  }, []);

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    setGameState((prev) => {
      const newMuted = !prev.isSoundMuted;
      sound.setMuted(newMuted);
      const updated = { ...prev, isSoundMuted: newMuted };
      saveGame(updated);
      return updated;
    });
  }, []);

  const unclaimedQuestsCount = gameState.dailyQuests.filter(
    (q) => q.progress >= q.target && !q.claimed
  ).length;

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col">
      
      {/* Top Bar Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        gold={gameState.gold}
        astralShards={gameState.astralShards}
        dimensionalRelics={gameState.dimensionalRelics}
        isMuted={gameState.isSoundMuted}
        toggleMute={handleToggleMute}
        onOpenAfk={() => setIsAfkModalOpen(true)}
        onOpenQuests={() => setIsQuestsModalOpen(true)}
        unclaimedQuestsCount={unclaimedQuestsCount}
        afkMinutes={afkMinutes}
      />

      {/* Main Content Area Based on Active Tab */}
      <main className="flex-1 pb-12">
        {currentTab === 'battle' && (
          <BattleView
            riftStage={gameState.riftStage}
            highestStage={gameState.highestStage}
            heroes={gameState.heroes}
            formation={gameState.formation}
            constellations={gameState.constellations}
            activeBoons={gameState.activeBoons}
            inRunExp={gameState.inRunExp}
            inRunLevel={gameState.inRunLevel}
            autoUltimates={gameState.autoUltimates}
            combatSpeed={gameState.combatSpeed}
            onUpdateAutoUltimates={(auto) => {
              setGameState((prev) => ({ ...prev, autoUltimates: auto }));
            }}
            onUpdateCombatSpeed={(speed) => {
              setGameState((prev) => ({ ...prev, combatSpeed: speed }));
            }}
            onSelectBoon={handleSelectBoon}
            onStageClear={handleStageClear}
            onQuestProgress={handleQuestProgress}
            onInRunExpGain={handleInRunExpGain}
          />
        )}

        {currentTab === 'summon' && (
          <SummonGateView
            astralShards={gameState.astralShards}
            pityCounter={gameState.pityCounter}
            heroes={gameState.heroes}
            onPerformSummon={handlePerformSummon}
            onQuestProgress={handleQuestProgress}
          />
        )}

        {currentTab === 'roster' && (
          <HeroRosterView
            heroes={gameState.heroes}
            formation={gameState.formation}
            gold={gameState.gold}
            onUpdateFormation={handleUpdateFormation}
            onLevelUpHero={handleLevelUpHero}
            onAscendHero={handleAscendHero}
            onQuestProgress={handleQuestProgress}
          />
        )}

        {currentTab === 'constellation' && (
          <ConstellationView
            dimensionalRelics={gameState.dimensionalRelics}
            constellations={gameState.constellations}
            onUpgradeConstellation={handleUpgradeConstellation}
          />
        )}
      </main>

      {/* Daily Quests Modal */}
      {isQuestsModalOpen && (
        <DailyQuestsModal
          quests={gameState.dailyQuests}
          onClaimQuest={handleClaimQuest}
          onRefreshQuests={() => {
            setGameState((prev) => {
              const fresh = generateDailyQuests();
              const updated = { ...prev, dailyQuests: fresh, lastDailyReset: Date.now() };
              saveGame(updated);
              return updated;
            });
          }}
          onClose={() => setIsQuestsModalOpen(false)}
        />
      )}

      {/* AFK Time Capsule Modal */}
      {isAfkModalOpen && (
        <AfkChestModal
          lastAfkClaimTimestamp={gameState.lastAfkClaimTimestamp}
          highestStage={gameState.highestStage}
          afkConstellationLevel={gameState.constellations['time-dilation'] || 0}
          onClaimAfk={handleClaimAfk}
          onClose={() => setIsAfkModalOpen(false)}
        />
      )}

    </div>
  );
}
