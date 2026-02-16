import { EmotionId } from '@/types/checkin';
import { emotionMap } from './emotions';

// ── Plant morphology config ──

export interface PlantMorphology {
  name: string;
  /** Number of petals in the bloom (4-8) */
  petalCount: number;
  /** Petal size radius in px */
  petalSize: number;
  /** Distance from center to petal center */
  petalSpread: number;
  /** Stem height range [min, max] */
  stemHeight: [number, number];
  /** Number of leaves (2-4) */
  leafCount: number;
  /** Leaf size [width, height] */
  leafSize: [number, number];
  /** Optional emoji accent shown at bloom center */
  centerEmoji?: string;
  /** Petal shape: 'round' | 'elongated' | 'pointed' */
  petalShape: 'round' | 'elongated' | 'pointed';
}

export const plantMorphology: Record<EmotionId, PlantMorphology> = {
  alegria: {
    name: 'Girasol',
    petalCount: 8,
    petalSize: 7,
    petalSpread: 14,
    stemHeight: [45, 60],
    leafCount: 3,
    leafSize: [7, 18],
    centerEmoji: '☀️',
    petalShape: 'elongated',
  },
  tristeza: {
    name: 'Sauce llorón',
    petalCount: 5,
    petalSize: 6,
    petalSpread: 12,
    stemHeight: [35, 50],
    leafCount: 4,
    leafSize: [6, 20],
    petalShape: 'elongated',
  },
  ira: {
    name: 'Cactus ardiente',
    petalCount: 6,
    petalSize: 5,
    petalSpread: 10,
    stemHeight: [30, 45],
    leafCount: 2,
    leafSize: [5, 12],
    centerEmoji: '🔥',
    petalShape: 'pointed',
  },
  miedo: {
    name: 'Lavanda',
    petalCount: 6,
    petalSize: 5,
    petalSpread: 11,
    stemHeight: [40, 55],
    leafCount: 3,
    leafSize: [5, 16],
    petalShape: 'elongated',
  },
  asco: {
    name: 'Musgo',
    petalCount: 5,
    petalSize: 6,
    petalSpread: 11,
    stemHeight: [25, 38],
    leafCount: 4,
    leafSize: [8, 14],
    petalShape: 'round',
  },
  sorpresa: {
    name: 'Flor tropical',
    petalCount: 7,
    petalSize: 7,
    petalSpread: 14,
    stemHeight: [40, 55],
    leafCount: 3,
    leafSize: [7, 18],
    centerEmoji: '✨',
    petalShape: 'round',
  },
  ansiedad: {
    name: 'Hiedra',
    petalCount: 5,
    petalSize: 5,
    petalSpread: 10,
    stemHeight: [35, 48],
    leafCount: 4,
    leafSize: [6, 15],
    petalShape: 'pointed',
  },
  calma: {
    name: 'Bambú sereno',
    petalCount: 6,
    petalSize: 6,
    petalSpread: 12,
    stemHeight: [45, 60],
    leafCount: 3,
    leafSize: [6, 22],
    petalShape: 'elongated',
  },
  frustracion: {
    name: 'Rosa espinosa',
    petalCount: 7,
    petalSize: 6,
    petalSpread: 13,
    stemHeight: [38, 52],
    leafCount: 3,
    leafSize: [6, 16],
    petalShape: 'pointed',
  },
  gratitud: {
    name: 'Cerezo',
    petalCount: 5,
    petalSize: 8,
    petalSpread: 14,
    stemHeight: [42, 58],
    leafCount: 3,
    leafSize: [7, 17],
    centerEmoji: '💛',
    petalShape: 'round',
  },
  verguenza: {
    name: 'Violeta',
    petalCount: 5,
    petalSize: 6,
    petalSpread: 11,
    stemHeight: [30, 42],
    leafCount: 3,
    leafSize: [6, 15],
    petalShape: 'round',
  },
  culpa: {
    name: 'Helecho',
    petalCount: 6,
    petalSize: 5,
    petalSpread: 10,
    stemHeight: [32, 44],
    leafCount: 4,
    leafSize: [7, 18],
    petalShape: 'elongated',
  },
};

/** Get growth stage 0-5 based on how many days ago the check-in was planted */
export function getGrowthStage(dayIndex: number, totalDays: number): number {
  // Oldest plants are most grown, newest are freshest
  const age = totalDays - dayIndex; // 0 = newest, totalDays-1 = oldest
  if (age <= 0) return 5; // oldest → full bloom
  if (age === 1) return 4;
  if (age === 2) return 3;
  if (age === 3) return 2;
  if (age === 4) return 1;
  return 0; // very recent
}

/** Get the emotion color from the emotions config */
export function getEmotionColor(emotion: EmotionId): string {
  return emotionMap[emotion].color;
}

/** Lighten a hex color by a factor (0-1) */
export function lightenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * factor);
  const lg = Math.round(g + (255 - g) * factor);
  const lb = Math.round(b + (255 - b) * factor);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

/** Darken a hex color by a factor (0-1) */
export function darkenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dr = Math.round(r * (1 - factor));
  const dg = Math.round(g * (1 - factor));
  const db = Math.round(b * (1 - factor));
  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
}

/** Sky gradient colors based on streak length */
export function getSkyColors(streak: number): [string, string] {
  if (streak === 0) return ['#E8E0D8', '#F3EDE6'];
  if (streak <= 3) return ['#FCEBC4', '#FBF0EC'];
  if (streak <= 7) return ['#B8D4E3', '#F0F5EF'];
  if (streak <= 14) return ['#FEF7E8', '#F0F5EF'];
  return ['#FCEBC4', '#FEF7E8'];
}
