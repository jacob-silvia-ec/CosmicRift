import { DailyQuest } from '../types/game';

export const DAILY_QUEST_TEMPLATES: Omit<DailyQuest, 'progress' | 'completed' | 'claimed'>[] = [
  {
    id: 'quest-waves-10',
    title: 'Rift Purge',
    description: 'Defeat 10 waves of invading dimensional foes.',
    type: 'waves',
    target: 10,
    rewardShards: 80,
    rewardGold: 1200,
  },
  {
    id: 'quest-ultimates-8',
    title: 'Ultimate Convergence',
    description: 'Trigger 8 hero Ultimate abilities in the Rift Arena.',
    type: 'ultimates',
    target: 8,
    rewardShards: 75,
    rewardGold: 1000,
  },
  {
    id: 'quest-summon-1',
    title: 'Call the Multiverse',
    description: 'Perform at least 1 Hero Summon at the Multiverse Portal.',
    type: 'summons',
    target: 1,
    rewardShards: 100,
    rewardGold: 1500,
  },
  {
    id: 'quest-upgrade-3',
    title: 'Hero Empowerment',
    description: 'Level up any hero 3 times in the Roster Lab.',
    type: 'upgrades',
    target: 3,
    rewardShards: 60,
    rewardGold: 800,
  },
  {
    id: 'quest-afk-claim',
    title: 'Time Capsule Harvest',
    description: 'Collect your idle AFK Capsule rewards at least once.',
    type: 'afk',
    target: 1,
    rewardShards: 50,
    rewardGold: 1000,
  },
];

export function generateDailyQuests(): DailyQuest[] {
  return DAILY_QUEST_TEMPLATES.map((tmpl) => ({
    ...tmpl,
    progress: 0,
    completed: false,
    claimed: false,
  }));
}
