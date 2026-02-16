export type SkillCategory =
  | 'tolerancia_malestar'
  | 'regulacion_emocional'
  | 'mindfulness'
  | 'relaciones_interpersonales'
  | 'autocuidado';

export interface Skill {
  id: string;
  title: string;
  description: string;
  category: SkillCategory;
  targetEmotions: string[];
  intensityRange: {
    min: number;
    max: number;
  };
  steps: string[];
  duration: string;
  icon: string;
  order: number;
}
