import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlantPlacement, DecorationPlacement } from './gardenTypes';

// ── Achievement definitions ──

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_plant', title: '¡Primera flor!', description: 'Plantaste tu primera flor en el jardín', emoji: '🌱' },
  { id: 'garden_watered', title: '¡Jardín regado!', description: 'Regaste todas las plantas del jardín', emoji: '💧' },
  { id: 'five_plants', title: 'Mini jardín', description: 'Tienes 5 plantas en tu jardín', emoji: '🌿' },
  { id: 'ten_plants', title: 'Jardín floreciente', description: '10 plantas crecen en tu jardín', emoji: '🌻' },
  { id: 'first_deco', title: 'Decorador/a', description: 'Colocaste tu primera decoración', emoji: '🎨' },
  { id: 'five_decos', title: 'Paisajista', description: '5 decoraciones adornan tu jardín', emoji: '🏡' },
  { id: 'full_bloom', title: 'Floración completa', description: 'Una planta alcanzó crecimiento máximo', emoji: '🌺' },
  { id: 'streak_7', title: 'Una semana', description: '7 días consecutivos de registro', emoji: '🔥' },
  { id: 'streak_14', title: 'Dos semanas', description: '14 días de racha', emoji: '⭐' },
  { id: 'streak_30', title: '¡Un mes!', description: '30 días de racha — jardín dorado', emoji: '👑' },
  { id: 'night_garden', title: 'Jardín nocturno', description: 'Visitaste tu jardín de noche', emoji: '🌙' },
  { id: 'all_emotions', title: 'Arcoíris emocional', description: 'Has plantado flores de todas las emociones', emoji: '🌈' },
];

const STORAGE_KEY = '@bloom_achievements';

// ── State helpers ──

export async function getUnlockedAchievements(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function unlockAchievement(id: string): Promise<boolean> {
  const unlocked = await getUnlockedAchievements();
  if (unlocked.includes(id)) return false;
  unlocked.push(id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
  return true; // newly unlocked
}

// ── Check functions ──

export function checkAchievements(
  plants: PlantPlacement[],
  decorations: DecorationPlacement[],
  streak: number,
  unlockedIds: string[],
): string[] {
  const newlyUnlocked: string[] = [];
  const check = (id: string, condition: boolean) => {
    if (condition && !unlockedIds.includes(id)) newlyUnlocked.push(id);
  };

  check('first_plant', plants.length >= 1);
  check('five_plants', plants.length >= 5);
  check('ten_plants', plants.length >= 10);
  check('first_deco', decorations.length >= 1);
  check('five_decos', decorations.length >= 5);
  check('full_bloom', plants.some((p) => p.growthStage >= 5));
  check('garden_watered', plants.length > 0 && plants.every((p) => p.wateredToday));
  check('streak_7', streak >= 7);
  check('streak_14', streak >= 14);
  check('streak_30', streak >= 30);

  const hour = new Date().getHours();
  check('night_garden', hour < 6 || hour >= 20);

  const uniqueEmotions = new Set(plants.map((p) => p.emotion));
  check('all_emotions', uniqueEmotions.size >= 12);

  return newlyUnlocked;
}

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
