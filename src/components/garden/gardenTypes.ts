import { EmotionId, IntensityLevel } from '@/types/checkin';

// ── Grid ──

/** Maximum possible grid size */
export const MAX_GRID_SIZE = 8;
/** Backward-compat alias — prefer getActiveGridSize(streak) */
export const GRID_SIZE = MAX_GRID_SIZE;

export const TILE_W = 52;
export const TILE_H = 26;

/** Get the active (unlocked) grid dimension based on streak */
export function getActiveGridSize(streak: number): number {
  if (streak <= 1) return 3;
  if (streak <= 4) return 4;
  if (streak <= 9) return 5;
  if (streak <= 17) return 6;
  if (streak <= 29) return 7;
  return 8;
}

/** Streak needed to unlock the next grid expansion */
export function nextGridUnlockStreak(streak: number): number | null {
  const thresholds = [2, 5, 10, 18, 30];
  for (const t of thresholds) {
    if (streak < t) return t;
  }
  return null; // fully expanded
}

export type CellContent = 'empty' | 'plant' | 'decoration' | 'path';

export interface GridPosition {
  gx: number;
  gy: number;
}

// ── Plants ──

export interface PlantPlacement {
  gx: number;
  gy: number;
  emotion: EmotionId;
  intensity: IntensityLevel;
  date: string;
  wateredToday: boolean;
  growthStage: number; // 0-5
}

// ── Decorations ──

export type DecorationType =
  | 'stone'
  | 'bench'
  | 'fountain'
  | 'lantern'
  | 'mushroom'
  | 'butterfly_house'
  | 'birdbath'
  | 'gnome'
  | 'pond'
  | 'tree'
  | 'wildflowers'
  | 'bridge'
  // Premium (purchased with seeds)
  | 'arch'
  | 'statue'
  | 'swing'
  | 'magic_lantern'
  | 'windmill'
  | 'wishing_well';

export interface DecorationConfig {
  type: DecorationType;
  label: string;
  emoji: string;
  unlockStreak: number;
  cost?: number; // seed cost for premium decorations (0 or undefined = free / streak-locked)
}

export const DECORATIONS: DecorationConfig[] = [
  { type: 'stone',           label: 'Piedra',          emoji: '🪨', unlockStreak: 0 },
  { type: 'wildflowers',     label: 'Flores silvestres', emoji: '🌼', unlockStreak: 2 },
  { type: 'mushroom',        label: 'Seta',            emoji: '🍄', unlockStreak: 3 },
  { type: 'lantern',         label: 'Farolillo',       emoji: '🏮', unlockStreak: 5 },
  { type: 'bench',           label: 'Banco',           emoji: '🪑', unlockStreak: 7 },
  { type: 'tree',            label: 'Arbolito',        emoji: '🌳', unlockStreak: 8 },
  { type: 'birdbath',        label: 'Bebedero',        emoji: '🐦', unlockStreak: 10 },
  { type: 'pond',            label: 'Estanque',        emoji: '💧', unlockStreak: 12 },
  { type: 'butterfly_house', label: 'Casa mariposas',  emoji: '🦋', unlockStreak: 14 },
  { type: 'bridge',          label: 'Puente',          emoji: '🌉', unlockStreak: 18 },
  { type: 'fountain',        label: 'Fuente',          emoji: '⛲', unlockStreak: 21 },
  { type: 'gnome',           label: 'Gnomo',           emoji: '🧑‍🌾', unlockStreak: 30 },
  // Premium (seed cost, no streak requirement)
  { type: 'arch',            label: 'Arco de flores',  emoji: '🌸', unlockStreak: 0, cost: 30 },
  { type: 'statue',          label: 'Estatua',         emoji: '🗿', unlockStreak: 0, cost: 50 },
  { type: 'swing',           label: 'Columpio',        emoji: '🎪', unlockStreak: 0, cost: 40 },
  { type: 'magic_lantern',   label: 'Farol mágico',    emoji: '✨', unlockStreak: 0, cost: 35 },
  { type: 'windmill',        label: 'Molino',          emoji: '🏗️', unlockStreak: 0, cost: 60 },
  { type: 'wishing_well',    label: 'Pozo de deseos',  emoji: '🪨', unlockStreak: 0, cost: 75 },
];

// ── Pets ──

export type PetType = 'cat' | 'bunny' | 'bird' | 'golden_butterfly' | 'hedgehog';

export interface DecorationPlacement {
  gx: number;
  gy: number;
  type: DecorationType;
}

// ── Water effect ──

export interface WaterEffect {
  gx: number;
  gy: number;
  startTime: number; // Date.now()
}

// ── Garden state ──

export interface GardenLayout {
  plants: PlantPlacement[];
  decorations: DecorationPlacement[];
  pathTiles: GridPosition[];
}

// ── Weather ──

export type WeatherType = 'clear' | 'rain' | 'sparkle' | 'snow';

// ── Interaction modes ──

export type InteractionMode = 'view' | 'move' | 'decorate' | 'water';

// ── Garden levels ──

export interface GardenLevel {
  level: number;
  name: string;
  minStreak: number;
  gridSize: number;
  unlocks: string; // description of what unlocks
}

export const GARDEN_LEVELS: GardenLevel[] = [
  { level: 1, name: 'Semillero',         minStreak: 0,  gridSize: 3, unlocks: 'Tu primer jardín' },
  { level: 2, name: 'Brote',             minStreak: 2,  gridSize: 4, unlocks: 'Flores silvestres + mariposas' },
  { level: 3, name: 'Jardín joven',      minStreak: 5,  gridSize: 5, unlocks: 'Nubes, colinas, farolillos' },
  { level: 4, name: 'Jardín floreciente', minStreak: 10, gridSize: 6, unlocks: 'Estanque, luciérnagas' },
  { level: 5, name: 'Jardín frondoso',   minStreak: 18, gridSize: 7, unlocks: 'Puente, más visitantes' },
  { level: 6, name: 'Jardín dorado',     minStreak: 30, gridSize: 8, unlocks: 'Arcoíris, jardín completo' },
];

export function getGardenLevel(streak: number): GardenLevel {
  let current = GARDEN_LEVELS[0];
  for (const lvl of GARDEN_LEVELS) {
    if (streak >= lvl.minStreak) current = lvl;
  }
  return current;
}

export function getNextGardenLevel(streak: number): GardenLevel | null {
  for (const lvl of GARDEN_LEVELS) {
    if (streak < lvl.minStreak) return lvl;
  }
  return null;
}
