import { Timestamp } from 'firebase/firestore';
import { EmotionId } from './checkin';

export type SkillCategory =
  | 'tolerancia_malestar'
  | 'regulacion_emocional'
  | 'mindfulness'
  | 'relaciones_interpersonales'
  | 'autocuidado';

export type SkillType = 'exercise' | 'article';

export interface SkillStep {
  title: string;
  instruction: string;
  durationSeconds?: number;
  breathingPattern?: { inhale: number; hold: number; exhale: number };
}

export interface Skill {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  category: SkillCategory;
  type: SkillType;
  targetEmotions: EmotionId[];
  intensityRange: { min: number; max: number };
  steps: SkillStep[];
  totalDurationSeconds: number;
  durationLabel: string;
  tips: string[];
  icon: string;
  order: number;
}

export interface SkillCategoryMeta {
  id: SkillCategory;
  title: string;
  description: string;
  emoji: string;
  color: string;
}

export interface SkillPractice {
  id: string;
  userId: string;
  skillId: string;
  skillTitle: string;
  category: SkillCategory;
  completedAt: Timestamp;
  durationSeconds: number;
}

export interface SkillPracticeFormData {
  skillId: string;
  skillTitle: string;
  category: SkillCategory;
  durationSeconds: number;
}
