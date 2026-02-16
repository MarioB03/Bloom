import { EmotionId } from '@/types/checkin';

export interface EmotionConfig {
  id: EmotionId;
  label: string;
  emoji: string;
  color: string;
}

// Warm botanical palette — earthy, organic, unique to Bloom
export const emotions: EmotionConfig[] = [
  { id: 'alegria', label: 'Alegría', emoji: '😊', color: '#E8A948' },      // Golden Amber
  { id: 'tristeza', label: 'Tristeza', emoji: '😢', color: '#7E9EB5' },    // Dusty Blue
  { id: 'ira', label: 'Ira', emoji: '😠', color: '#A0522D' },             // Burnt Sienna
  { id: 'miedo', label: 'Miedo', emoji: '😰', color: '#8B7EB5' },         // Muted Lavender
  { id: 'asco', label: 'Asco', emoji: '🤢', color: '#7A9E7E' },           // Moss Green
  { id: 'sorpresa', label: 'Sorpresa', emoji: '😮', color: '#D4937E' },   // Light Terracotta
  { id: 'ansiedad', label: 'Ansiedad', emoji: '😟', color: '#B58B9E' },   // Muted Mauve
  { id: 'calma', label: 'Calma', emoji: '😌', color: '#8BA888' },         // Sage Green
  { id: 'frustracion', label: 'Frustración', emoji: '😤', color: '#C4725A' }, // Terracotta
  { id: 'gratitud', label: 'Gratitud', emoji: '🙏', color: '#F0C478' },   // Light Amber
  { id: 'verguenza', label: 'Vergüenza', emoji: '😳', color: '#C9A0B0' }, // Dusty Rose
  { id: 'culpa', label: 'Culpa', emoji: '😔', color: '#B8AFA6' },         // Warm Taupe
];

export const emotionMap = Object.fromEntries(
  emotions.map((e) => [e.id, e])
) as Record<EmotionId, EmotionConfig>;
