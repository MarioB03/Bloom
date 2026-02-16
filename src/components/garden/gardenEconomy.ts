import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ──

export interface SeedBalance {
  total: number;
  earned: number;
  spent: number;
  lastDailyReward: string; // ISO date string (YYYY-MM-DD)
  earnedStreakBonuses: number[]; // streak thresholds already claimed
}

export type ShopCategory = 'decorations' | 'pets' | 'cosmetics' | 'terrain';

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  category: ShopCategory;
  cost: number;
  description: string;
}

// ── Constants ──

export const EARNING_RATES = {
  dailyCheckin: 5,
  streak3: 10,
  streak7: 25,
  streak14: 50,
  streak30: 100,
  waterPlant: 1,
  waterAllBonus: 5,
  achievementUnlocked: 15,
  plantStage5: 3,
} as const;

export const STREAK_BONUS_THRESHOLDS = [
  { streak: 3, seeds: EARNING_RATES.streak3 },
  { streak: 7, seeds: EARNING_RATES.streak7 },
  { streak: 14, seeds: EARNING_RATES.streak14 },
  { streak: 30, seeds: EARNING_RATES.streak30 },
] as const;

export const SHOP_CATALOG: ShopItem[] = [
  // Decorations premium
  { id: 'arch',          name: 'Arco de flores',   emoji: '🌸', category: 'decorations', cost: 30, description: 'Un arco cubierto de flores' },
  { id: 'statue',        name: 'Estatua',          emoji: '🗿', category: 'decorations', cost: 50, description: 'Una elegante estatua de piedra' },
  { id: 'swing',         name: 'Columpio',         emoji: '🎪', category: 'decorations', cost: 40, description: 'Un columpio de madera' },
  { id: 'magic_lantern', name: 'Farol mágico',     emoji: '✨', category: 'decorations', cost: 35, description: 'Un farol con luz encantada' },
  { id: 'windmill',      name: 'Molino',           emoji: '🏗️', category: 'decorations', cost: 60, description: 'Un molino con aspas que giran' },
  { id: 'wishing_well',  name: 'Pozo de deseos',   emoji: '🪨', category: 'decorations', cost: 75, description: 'Pide un deseo y lanza una moneda' },
  // Pets
  { id: 'bunny',              name: 'Conejo',             emoji: '🐰', category: 'pets', cost: 30, description: 'Un conejo que salta por el jardín' },
  { id: 'bird',               name: 'Pájaro',             emoji: '🐦', category: 'pets', cost: 25, description: 'Un pájaro que vuela entre las flores' },
  { id: 'golden_butterfly',   name: 'Mariposa dorada',    emoji: '🦋', category: 'pets', cost: 50, description: 'Una brillante mariposa dorada' },
  { id: 'hedgehog',           name: 'Erizo',              emoji: '🦔', category: 'pets', cost: 40, description: 'Un simpático erizo curioso' },
  // Cosmetics
  { id: 'sunset_sky',    name: 'Cielo atardecer',   emoji: '🌅', category: 'cosmetics', cost: 20, description: 'El cielo siempre luce un cálido atardecer' },
  { id: 'flower_fence',  name: 'Valla de flores',   emoji: '🌺', category: 'cosmetics', cost: 25, description: 'La valla se cubre de flores coloridas' },
  { id: 'stone_path',    name: 'Camino de piedra',  emoji: '🪨', category: 'cosmetics', cost: 15, description: 'Un bonito camino de piedra cruza el jardín' },
  { id: 'fireflies_always', name: 'Luciérnagas siempre', emoji: '💫', category: 'cosmetics', cost: 30, description: 'Luciérnagas visibles a cualquier hora' },
  // Terrain expansion
  { id: 'expand_level',  name: 'Expandir terreno',  emoji: '🗺️', category: 'terrain', cost: 40, description: 'Desbloquea el siguiente nivel de terreno' },
];

// ── Storage keys ──

const BALANCE_KEY = '@bloom_seed_balance';
const PURCHASES_KEY = '@bloom_seed_purchases';

// ── Default balance ──

function defaultBalance(): SeedBalance {
  return {
    total: 0,
    earned: 0,
    spent: 0,
    lastDailyReward: '',
    earnedStreakBonuses: [],
  };
}

// ── CRUD ──

export async function getSeedBalance(): Promise<SeedBalance> {
  try {
    const stored = await AsyncStorage.getItem(BALANCE_KEY);
    return stored ? { ...defaultBalance(), ...JSON.parse(stored) } : defaultBalance();
  } catch {
    return defaultBalance();
  }
}

export async function saveSeedBalance(balance: SeedBalance): Promise<void> {
  await AsyncStorage.setItem(BALANCE_KEY, JSON.stringify(balance));
}

export async function addSeeds(amount: number, reason?: string): Promise<SeedBalance> {
  const balance = await getSeedBalance();
  balance.total += amount;
  balance.earned += amount;
  await saveSeedBalance(balance);
  return balance;
}

export async function spendSeeds(amount: number): Promise<SeedBalance | null> {
  const balance = await getSeedBalance();
  if (balance.total < amount) return null; // insufficient funds
  balance.total -= amount;
  balance.spent += amount;
  await saveSeedBalance(balance);
  return balance;
}

// ── Purchases ──

export async function getPurchasedItems(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(PURCHASES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function purchaseItem(itemId: string): Promise<{ success: boolean; balance: SeedBalance }> {
  const item = SHOP_CATALOG.find((i) => i.id === itemId);
  if (!item) return { success: false, balance: await getSeedBalance() };

  const purchased = await getPurchasedItems();
  if (purchased.includes(itemId)) return { success: false, balance: await getSeedBalance() };

  const balance = await spendSeeds(item.cost);
  if (!balance) return { success: false, balance: await getSeedBalance() };

  purchased.push(itemId);
  await AsyncStorage.setItem(PURCHASES_KEY, JSON.stringify(purchased));
  return { success: true, balance };
}

// ── Daily check-in reward ──

export interface DailyRewardResult {
  seeds: number;
  bonusReason?: string;
  streakBonus?: number;
}

export async function awardDailyCheckin(streak: number): Promise<DailyRewardResult | null> {
  const today = new Date().toISOString().split('T')[0];
  const balance = await getSeedBalance();

  // Already claimed today
  if (balance.lastDailyReward === today) return null;

  let totalSeeds = EARNING_RATES.dailyCheckin;
  let bonusReason: string | undefined;
  let streakBonus = 0;

  // Check streak bonuses
  for (const threshold of STREAK_BONUS_THRESHOLDS) {
    if (streak >= threshold.streak && !balance.earnedStreakBonuses.includes(threshold.streak)) {
      streakBonus += threshold.seeds;
      balance.earnedStreakBonuses.push(threshold.streak);
      bonusReason = `Racha de ${threshold.streak} días`;
    }
  }

  totalSeeds += streakBonus;
  balance.total += totalSeeds;
  balance.earned += totalSeeds;
  balance.lastDailyReward = today;
  await saveSeedBalance(balance);

  return { seeds: totalSeeds, bonusReason, streakBonus };
}

// ── Helper: get shop item by id ──

export function getShopItem(id: string): ShopItem | undefined {
  return SHOP_CATALOG.find((i) => i.id === id);
}

// ── Helper: get items by category ──

export function getShopItemsByCategory(category: ShopCategory): ShopItem[] {
  return SHOP_CATALOG.filter((i) => i.category === category);
}
