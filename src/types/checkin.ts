import { Timestamp } from 'firebase/firestore';

export type EmotionId =
  | 'alegria'
  | 'tristeza'
  | 'ira'
  | 'miedo'
  | 'asco'
  | 'sorpresa'
  | 'ansiedad'
  | 'calma'
  | 'frustracion'
  | 'gratitud'
  | 'verguenza'
  | 'culpa';

export type IntensityLevel = 1 | 2 | 3 | 4 | 5;

export type SleepQuality = 1 | 2 | 3 | 4 | 5;

export type HungerLevel = 1 | 2 | 3 | 4 | 5;

export type CyclePhase =
  | 'menstruacion'
  | 'folicular'
  | 'ovulacion'
  | 'lutea'
  | 'no_aplica';

export interface ImportantEvent {
  title: string;
  description: string;
}

export interface CheckinEntry {
  id: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  createdAt: Timestamp;
  updatedAt: Timestamp;
  emotion: EmotionId;
  emotionIntensity: IntensityLevel;
  sleepQuality: SleepQuality;
  hungerLevel: HungerLevel;
  cyclePhase: CyclePhase | null;
  events: ImportantEvent[];
  notes: string;
}

export interface CheckinFormData {
  emotion: EmotionId;
  emotionIntensity: IntensityLevel;
  sleepQuality: SleepQuality;
  hungerLevel: HungerLevel;
  cyclePhase: CyclePhase | null;
  events: ImportantEvent[];
  notes: string;
}

// --- Emotional Register (Observar y Describir) ---

export interface EmotionalRegisterEntry {
  id: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  createdAt: Timestamp;
  updatedAt: Timestamp;
  emotion: EmotionId | null;
  emotionCustom: string;
  intensity: number; // 1-10
  vulnerability: string;
  trigger: string;
  interpretations: string;
  internalSensations: string;
  externalLanguage: string;
  impulses: string;
  behavior: string;
  consequences: string;
  emotionFunction: string;
  sharedVisible: boolean;
}

export interface EmotionalRegisterFormData {
  emotion: EmotionId | null;
  emotionCustom: string;
  intensity: number;
  vulnerability: string;
  trigger: string;
  interpretations: string;
  internalSensations: string;
  externalLanguage: string;
  impulses: string;
  behavior: string;
  consequences: string;
  emotionFunction: string;
  sharedVisible: boolean;
}
