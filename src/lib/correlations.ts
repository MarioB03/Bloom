import { CheckinEntry, EmotionId, CyclePhase } from '@/types/checkin';
import { emotionMap } from '@/constants/emotions';

// ── Types ──

export interface EmotionFrequency {
  id: EmotionId;
  count: number;
  percentage: number;
}

export interface SleepCorrelation {
  badSleepEmotion: EmotionFrequency | null;   // sleep 1-2
  goodSleepEmotion: EmotionFrequency | null;  // sleep 4-5
  avgIntensityBadSleep: number;
  avgIntensityGoodSleep: number;
}

export interface CyclePattern {
  phase: CyclePhase;
  topEmotion: EmotionFrequency | null;
  avgIntensity: number;
  count: number;
}

export interface DayOfWeekPattern {
  dayIndex: number; // 0=Mon, 6=Sun
  label: string;
  topEmotion: EmotionFrequency | null;
  avgIntensity: number;
  count: number;
}

export interface WeeklyTrend {
  thisWeekTop: EmotionFrequency | null;
  lastWeekTop: EmotionFrequency | null;
  moreOf: EmotionFrequency | null;   // emotion that increased
  lessOf: EmotionFrequency | null;   // emotion that decreased
  intensityDelta: number;            // positive = more intense this week
}

export interface HungerCorrelation {
  hungryEmotion: EmotionFrequency | null;   // hunger 4-5
  fedEmotion: EmotionFrequency | null;      // hunger 1-2
}

// ── Helpers ──

function topEmotion(entries: CheckinEntry[]): EmotionFrequency | null {
  if (entries.length === 0) return null;
  const counts: Record<string, number> = {};
  entries.forEach((c) => { counts[c.emotion] = (counts[c.emotion] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;
  const [id, count] = sorted[0];
  return { id: id as EmotionId, count, percentage: Math.round((count / entries.length) * 100) };
}

function avgField(entries: CheckinEntry[], field: 'emotionIntensity' | 'sleepQuality' | 'hungerLevel'): number {
  if (entries.length === 0) return 0;
  return entries.reduce((sum, c) => sum + c[field], 0) / entries.length;
}

const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// ── Analysis functions ──

export function analyzeSleepCorrelation(checkins: CheckinEntry[]): SleepCorrelation {
  const badSleep = checkins.filter((c) => c.sleepQuality <= 2);
  const goodSleep = checkins.filter((c) => c.sleepQuality >= 4);

  return {
    badSleepEmotion: topEmotion(badSleep),
    goodSleepEmotion: topEmotion(goodSleep),
    avgIntensityBadSleep: avgField(badSleep, 'emotionIntensity'),
    avgIntensityGoodSleep: avgField(goodSleep, 'emotionIntensity'),
  };
}

export function analyzeCyclePatterns(checkins: CheckinEntry[]): CyclePattern[] {
  const phases: CyclePhase[] = ['menstruacion', 'folicular', 'ovulacion', 'lutea'];
  return phases
    .map((phase) => {
      const entries = checkins.filter((c) => c.cyclePhase === phase);
      return {
        phase,
        topEmotion: topEmotion(entries),
        avgIntensity: avgField(entries, 'emotionIntensity'),
        count: entries.length,
      };
    })
    .filter((p) => p.count >= 2); // only show phases with enough data
}

export function analyzeDayOfWeek(checkins: CheckinEntry[]): DayOfWeekPattern[] {
  const byDay: CheckinEntry[][] = Array.from({ length: 7 }, () => []);

  checkins.forEach((c) => {
    const d = new Date(c.date);
    const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1; // Mon=0..Sun=6
    byDay[dayIndex].push(c);
  });

  return byDay.map((entries, dayIndex) => ({
    dayIndex,
    label: DAY_LABELS[dayIndex],
    topEmotion: topEmotion(entries),
    avgIntensity: avgField(entries, 'emotionIntensity'),
    count: entries.length,
  }));
}

export function analyzeWeeklyTrend(checkins: CheckinEntry[]): WeeklyTrend {
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 86400000);
  const twoWeeksAgo = new Date(today.getTime() - 14 * 86400000);

  const todayStr = today.toISOString().split('T')[0];
  const oneWeekStr = oneWeekAgo.toISOString().split('T')[0];
  const twoWeekStr = twoWeeksAgo.toISOString().split('T')[0];

  const thisWeek = checkins.filter((c) => c.date > oneWeekStr && c.date <= todayStr);
  const lastWeek = checkins.filter((c) => c.date > twoWeekStr && c.date <= oneWeekStr);

  const thisWeekTop = topEmotion(thisWeek);
  const lastWeekTop = topEmotion(lastWeek);

  // Find emotion that increased/decreased most
  const thisWeekCounts: Record<string, number> = {};
  const lastWeekCounts: Record<string, number> = {};
  thisWeek.forEach((c) => { thisWeekCounts[c.emotion] = (thisWeekCounts[c.emotion] || 0) + 1; });
  lastWeek.forEach((c) => { lastWeekCounts[c.emotion] = (lastWeekCounts[c.emotion] || 0) + 1; });

  let maxIncrease = 0;
  let maxDecrease = 0;
  let moreOf: EmotionFrequency | null = null;
  let lessOf: EmotionFrequency | null = null;

  const allEmotions = new Set([...Object.keys(thisWeekCounts), ...Object.keys(lastWeekCounts)]);
  for (const emo of allEmotions) {
    const thisCount = thisWeekCounts[emo] || 0;
    const lastCount = lastWeekCounts[emo] || 0;
    const delta = thisCount - lastCount;
    if (delta > maxIncrease) {
      maxIncrease = delta;
      moreOf = { id: emo as EmotionId, count: thisCount, percentage: thisWeek.length > 0 ? Math.round((thisCount / thisWeek.length) * 100) : 0 };
    }
    if (delta < maxDecrease) {
      maxDecrease = delta;
      lessOf = { id: emo as EmotionId, count: lastCount, percentage: lastWeek.length > 0 ? Math.round((lastCount / lastWeek.length) * 100) : 0 };
    }
  }

  const thisAvg = avgField(thisWeek, 'emotionIntensity');
  const lastAvg = avgField(lastWeek, 'emotionIntensity');

  return {
    thisWeekTop,
    lastWeekTop,
    moreOf: maxIncrease > 0 ? moreOf : null,
    lessOf: maxDecrease < 0 ? lessOf : null,
    intensityDelta: thisAvg - lastAvg,
  };
}

export function analyzeHungerCorrelation(checkins: CheckinEntry[]): HungerCorrelation {
  const hungry = checkins.filter((c) => c.hungerLevel >= 4);
  const fed = checkins.filter((c) => c.hungerLevel <= 2);

  return {
    hungryEmotion: topEmotion(hungry),
    fedEmotion: topEmotion(fed),
  };
}

export function hasEnoughData(checkins: CheckinEntry[]): boolean {
  return checkins.length >= 7;
}

export function hasCycleData(checkins: CheckinEntry[]): boolean {
  return checkins.some((c) => c.cyclePhase && c.cyclePhase !== 'no_aplica');
}
