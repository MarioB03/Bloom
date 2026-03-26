import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCheckinStats,
  getGratitudeCount,
  getCompostCount,
  getUniqueEmotionsUsed,
  getCheckinDatesLast30Days,
  getSkillPracticeCount,
  getUniquePracticedCategories,
} from './firestore';
import { calculateStreak } from '@/utils/streak';
import { strings } from '@/constants/strings';

// ── App-wide Achievement definitions ──

export interface AppAchievement {
  id: string;
  title: string | { f: string; m: string; n: string };
  description: string;
  emoji: string;
  threshold?: number; // for progress display
  category: 'checkins' | 'streaks' | 'gratitude' | 'emotions' | 'compost' | 'skills';
}

export const APP_ACHIEVEMENTS: AppAchievement[] = [
  // Check-ins
  { id: 'app_first_checkin', title: strings.achievements.firstCheckin, description: strings.achievements.firstCheckinDesc, emoji: '🌱', threshold: 1, category: 'checkins' },
  { id: 'app_5_checkins', title: strings.achievements.fiveCheckins, description: strings.achievements.fiveCheckinsDesc, emoji: '📝', threshold: 5, category: 'checkins' },
  { id: 'app_25_checkins', title: strings.achievements.twentyFiveCheckins, description: strings.achievements.twentyFiveCheckinsDesc, emoji: '💪', threshold: 25, category: 'checkins' },
  { id: 'app_50_checkins', title: strings.achievements.fiftyCheckins, description: strings.achievements.fiftyCheckinsDesc, emoji: '🏅', threshold: 50, category: 'checkins' },
  { id: 'app_100_checkins', title: strings.achievements.hundredCheckins, description: strings.achievements.hundredCheckinsDesc, emoji: '💯', threshold: 100, category: 'checkins' },
  // Streaks
  { id: 'app_streak_3', title: strings.achievements.streak3, description: strings.achievements.streak3Desc, emoji: '🔥', threshold: 3, category: 'streaks' },
  { id: 'app_streak_7', title: strings.achievements.streak7, description: strings.achievements.streak7Desc, emoji: '⭐', threshold: 7, category: 'streaks' },
  { id: 'app_streak_14', title: strings.achievements.streak14, description: strings.achievements.streak14Desc, emoji: '✨', threshold: 14, category: 'streaks' },
  { id: 'app_streak_30', title: strings.achievements.streak30, description: strings.achievements.streak30Desc, emoji: '👑', threshold: 30, category: 'streaks' },
  { id: 'app_streak_60', title: strings.achievements.streak60, description: strings.achievements.streak60Desc, emoji: '💎', threshold: 60, category: 'streaks' },
  // Gratitude
  { id: 'app_first_gratitude', title: strings.achievements.firstGratitude, description: strings.achievements.firstGratitudeDesc, emoji: '🙏', threshold: 1, category: 'gratitude' },
  { id: 'app_7_gratitudes', title: strings.achievements.sevenGratitudes, description: strings.achievements.sevenGratitudesDesc, emoji: '🌟', threshold: 7, category: 'gratitude' },
  // Emotions
  { id: 'app_all_emotions', title: strings.achievements.allEmotions, description: strings.achievements.allEmotionsDesc, emoji: '🌈', threshold: 12, category: 'emotions' },
  // Compost
  { id: 'app_first_compost', title: strings.achievements.firstCompost, description: strings.achievements.firstCompostDesc, emoji: '🌿', threshold: 1, category: 'compost' },
  { id: 'app_5_composts', title: strings.achievements.fiveComposts, description: strings.achievements.fiveCompostsDesc, emoji: '🦋', threshold: 5, category: 'compost' },
  // Skills
  { id: 'app_first_practice', title: strings.achievements.firstPractice, description: strings.achievements.firstPracticeDesc, emoji: '🧘', threshold: 1, category: 'skills' },
  { id: 'app_5_practices', title: strings.achievements.fivePractices, description: strings.achievements.fivePracticesDesc, emoji: '💪', threshold: 5, category: 'skills' },
  { id: 'app_15_practices', title: strings.achievements.fifteenPractices, description: strings.achievements.fifteenPracticesDesc, emoji: '🏆', threshold: 15, category: 'skills' },
  { id: 'app_all_categories', title: strings.achievements.allCategories, description: strings.achievements.allCategoriesDesc, emoji: '🗺️', threshold: 5, category: 'skills' },
];

// ── Storage keys (separate from garden) ──

const ACHIEVEMENTS_KEY = '@bloom_app_achievements';
const TIMESTAMPS_KEY = '@bloom_app_achievement_timestamps';
const PENDING_TOASTS_KEY = '@bloom_app_pending_toasts';

// ── State helpers ──

export async function getUnlockedAppAchievements(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function getAchievementTimestamps(): Promise<Record<string, string>> {
  try {
    const stored = await AsyncStorage.getItem(TIMESTAMPS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

async function unlockAppAchievement(id: string): Promise<boolean> {
  const unlocked = await getUnlockedAppAchievements();
  if (unlocked.includes(id)) return false;
  unlocked.push(id);
  await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
  // Save timestamp
  const timestamps = await getAchievementTimestamps();
  timestamps[id] = new Date().toISOString();
  await AsyncStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(timestamps));
  return true;
}

// ── Toast queue ──

export async function queueAchievementToast(achievementId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(PENDING_TOASTS_KEY);
    const pending: string[] = stored ? JSON.parse(stored) : [];
    if (!pending.includes(achievementId)) {
      pending.push(achievementId);
      await AsyncStorage.setItem(PENDING_TOASTS_KEY, JSON.stringify(pending));
    }
  } catch {}
}

export async function getPendingToasts(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(PENDING_TOASTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function clearPendingToasts(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_TOASTS_KEY);
}

// ── Data builder ──

export interface AchievementData {
  totalCheckins: number;
  streak: number;
  gratitudeCount: number;
  compostCount: number;
  uniqueEmotions: number;
  practiceCount: number;
  uniqueCategories: number;
}

export async function buildAchievementData(userId: string): Promise<AchievementData> {
  const [stats, dates, gratitudeCount, compostCount, emotions, practiceCount, categories] = await Promise.all([
    getCheckinStats(userId),
    getCheckinDatesLast30Days(userId),
    getGratitudeCount(userId),
    getCompostCount(userId),
    getUniqueEmotionsUsed(userId),
    getSkillPracticeCount(userId),
    getUniquePracticedCategories(userId),
  ]);

  return {
    totalCheckins: stats.totalCheckins,
    streak: calculateStreak(dates),
    gratitudeCount,
    compostCount,
    uniqueEmotions: emotions.length,
    practiceCount,
    uniqueCategories: categories.length,
  };
}

// ── Main check function ──

export function checkAppAchievementsSync(
  data: AchievementData,
  unlockedIds: string[],
): string[] {
  const newlyUnlocked: string[] = [];
  const check = (id: string, condition: boolean) => {
    if (condition && !unlockedIds.includes(id)) newlyUnlocked.push(id);
  };

  // Check-ins
  check('app_first_checkin', data.totalCheckins >= 1);
  check('app_5_checkins', data.totalCheckins >= 5);
  check('app_25_checkins', data.totalCheckins >= 25);
  check('app_50_checkins', data.totalCheckins >= 50);
  check('app_100_checkins', data.totalCheckins >= 100);

  // Streaks
  check('app_streak_3', data.streak >= 3);
  check('app_streak_7', data.streak >= 7);
  check('app_streak_14', data.streak >= 14);
  check('app_streak_30', data.streak >= 30);
  check('app_streak_60', data.streak >= 60);

  // Gratitude
  check('app_first_gratitude', data.gratitudeCount >= 1);
  check('app_7_gratitudes', data.gratitudeCount >= 7);

  // Emotions
  check('app_all_emotions', data.uniqueEmotions >= 12);

  // Compost
  check('app_first_compost', data.compostCount >= 1);
  check('app_5_composts', data.compostCount >= 5);

  // Skills
  check('app_first_practice', data.practiceCount >= 1);
  check('app_5_practices', data.practiceCount >= 5);
  check('app_15_practices', data.practiceCount >= 15);
  check('app_all_categories', data.uniqueCategories >= 5);

  return newlyUnlocked;
}

// ── All-in-one: build data, check, unlock, queue toasts ──

export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  const [data, unlocked] = await Promise.all([
    buildAchievementData(userId),
    getUnlockedAppAchievements(),
  ]);

  const newlyUnlocked = checkAppAchievementsSync(data, unlocked);

  for (const id of newlyUnlocked) {
    await unlockAppAchievement(id);
    await queueAchievementToast(id);
  }

  return newlyUnlocked;
}

// ── Lookup ──

export function getAppAchievementById(id: string): AppAchievement | undefined {
  return APP_ACHIEVEMENTS.find((a) => a.id === id);
}

// ── Progress helpers for the logros screen ──

export function getAchievementProgress(
  achievement: AppAchievement,
  data: AchievementData,
): number {
  if (!achievement.threshold) return 0;

  switch (achievement.category) {
    case 'checkins':
      return Math.min(data.totalCheckins, achievement.threshold);
    case 'streaks':
      return Math.min(data.streak, achievement.threshold);
    case 'gratitude':
      return Math.min(data.gratitudeCount, achievement.threshold);
    case 'compost':
      return Math.min(data.compostCount, achievement.threshold);
    case 'emotions':
      return Math.min(data.uniqueEmotions, achievement.threshold);
    case 'skills':
      if (achievement.id === 'app_all_categories') {
        return Math.min(data.uniqueCategories, achievement.threshold);
      }
      return Math.min(data.practiceCount, achievement.threshold);
    default:
      return 0;
  }
}
