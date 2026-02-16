import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Cosmetic theme overrides ──
// Each cosmetic modifies a specific visual aspect of the garden canvas.

export interface CosmeticOverrides {
  /** If true, sky always uses sunset palette regardless of time */
  sunsetSky: boolean;
  /** If true, fence posts are colored with flowers */
  flowerFence: boolean;
  /** If true, a stone path texture is drawn on tiles */
  stonePath: boolean;
  /** If true, fireflies show even during daytime */
  firefliesAlways: boolean;
}

const COSMETICS_KEY = '@bloom_active_cosmetics';

const DEFAULT_OVERRIDES: CosmeticOverrides = {
  sunsetSky: false,
  flowerFence: false,
  stonePath: false,
  firefliesAlways: false,
};

/** Map from purchased shop item ID to the override it enables */
const COSMETIC_MAP: Record<string, keyof CosmeticOverrides> = {
  sunset_sky: 'sunsetSky',
  flower_fence: 'flowerFence',
  stone_path: 'stonePath',
  fireflies_always: 'firefliesAlways',
};

export async function getActiveCosmetics(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(COSMETICS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function setActiveCosmetics(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(COSMETICS_KEY, JSON.stringify(ids));
}

export async function toggleCosmetic(id: string): Promise<string[]> {
  const current = await getActiveCosmetics();
  const idx = current.indexOf(id);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push(id);
  }
  await setActiveCosmetics(current);
  return current;
}

/** Resolve active cosmetic IDs into a typed overrides object */
export function resolveOverrides(activeIds: string[]): CosmeticOverrides {
  const overrides = { ...DEFAULT_OVERRIDES };
  for (const id of activeIds) {
    const key = COSMETIC_MAP[id];
    if (key) {
      (overrides as any)[key] = true;
    }
  }
  return overrides;
}

/** Sunset sky colors */
export const SUNSET_SKY = {
  top: '#F0C478',
  bottom: '#FBF0EC',
} as const;

/** Flower fence colors */
export const FLOWER_FENCE_COLORS = [
  '#E8A0B0', '#F0C478', '#A0B8E0', '#C8E0A0', '#E8C0D0',
] as const;
