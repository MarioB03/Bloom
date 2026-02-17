import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';

// ── Widget data shape ──

export interface WidgetData {
  streak: number;
  streakEmoji: string;
  streakMessage: string;
  gardenLevel: number;
  gardenName: string;
  seedBalance: number;
  totalPlants: number;
  lastCheckinDate: string;
  updatedAt: string;
}

const WIDGET_STORAGE_KEY = '@bloom_widget_data';
const APP_GROUP_ID = 'group.com.akemi01.bloom';

// On iOS, write to shared App Group UserDefaults
// so the WidgetKit extension can read it.
async function writeToSharedDefaults(data: WidgetData): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    await SharedGroupPreferences.setItem('widgetData', data, APP_GROUP_ID);
  } catch {
    // Best-effort — widget sync is non-critical
  }
}

export async function syncWidgetData(data: WidgetData): Promise<void> {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(payload));
  await writeToSharedDefaults(payload);
}

export async function getWidgetData(): Promise<WidgetData | null> {
  try {
    const stored = await AsyncStorage.getItem(WIDGET_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
