// ── Season detection & visual adjustments ──

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/** Detect season from current date (Southern hemisphere optional) */
export function getCurrentSeason(southern = false): Season {
  const month = new Date().getMonth(); // 0-11
  let season: Season;
  if (month >= 2 && month <= 4) season = 'spring';
  else if (month >= 5 && month <= 7) season = 'summer';
  else if (month >= 8 && month <= 10) season = 'autumn';
  else season = 'winter';

  if (southern) {
    const flip: Record<Season, Season> = {
      spring: 'autumn',
      summer: 'winter',
      autumn: 'spring',
      winter: 'summer',
    };
    season = flip[season];
  }
  return season;
}

export interface SeasonalTheme {
  skyTopDay: string;
  skyBottomDay: string;
  skyTopNight: string;
  skyBottomNight: string;
  groundColor: string;
  groundHighlight: string;
  tileBase1: string;
  tileBase2: string;
  leafTint: string;
  particleColor: string;
  /** Extra particles: petals in spring, leaves in autumn, snow in winter */
  particleType: 'blossom' | 'none' | 'leaf' | 'snow';
  particleCount: number;
  ambientOverlay: string | null; // e.g. warm tint for summer, cool for winter
}

export const SEASONAL_THEMES: Record<Season, SeasonalTheme> = {
  spring: {
    skyTopDay: '#B8D4E3',
    skyBottomDay: '#E8F5E0',
    skyTopNight: '#0F1538',
    skyBottomNight: '#2D3560',
    groundColor: '#B8D8A0',
    groundHighlight: 'rgba(190,220,170,0.3)',
    tileBase1: '#A4C68E',
    tileBase2: '#97BB82',
    leafTint: '#6B8B6A',
    particleColor: 'rgba(240,180,200,0.6)',
    particleType: 'blossom',
    particleCount: 8,
    ambientOverlay: null,
  },
  summer: {
    skyTopDay: '#88C4E8',
    skyBottomDay: '#D8ECD0',
    skyTopNight: '#0A1030',
    skyBottomNight: '#1E2850',
    groundColor: '#C4D4A8',
    groundHighlight: 'rgba(200,220,170,0.25)',
    tileBase1: '#A8CA90',
    tileBase2: '#9BBF84',
    leafTint: '#5A8050',
    particleColor: 'rgba(255,220,100,0.4)',
    particleType: 'none',
    particleCount: 0,
    ambientOverlay: 'rgba(255,240,200,0.04)',
  },
  autumn: {
    skyTopDay: '#D4B8A0',
    skyBottomDay: '#F0E4D0',
    skyTopNight: '#1A1530',
    skyBottomNight: '#302848',
    groundColor: '#C8B890',
    groundHighlight: 'rgba(200,180,140,0.25)',
    tileBase1: '#B0A880',
    tileBase2: '#A89E78',
    leafTint: '#8A7A50',
    particleColor: 'rgba(200,140,60,0.5)',
    particleType: 'leaf',
    particleCount: 6,
    ambientOverlay: 'rgba(180,120,60,0.03)',
  },
  winter: {
    skyTopDay: '#C8D8E8',
    skyBottomDay: '#E8ECF0',
    skyTopNight: '#0A1028',
    skyBottomNight: '#1E2548',
    groundColor: '#D0DCC8',
    groundHighlight: 'rgba(215,225,210,0.3)',
    tileBase1: '#B0C4A0',
    tileBase2: '#A8BC96',
    leafTint: '#7A9070',
    particleColor: 'rgba(230,240,255,0.7)',
    particleType: 'snow',
    particleCount: 10,
    ambientOverlay: 'rgba(180,200,230,0.04)',
  },
};

export function getSeasonLabel(season: Season): string {
  const labels: Record<Season, string> = {
    spring: 'Primavera',
    summer: 'Verano',
    autumn: 'Otoño',
    winter: 'Invierno',
  };
  return labels[season];
}

export function getSeasonEmoji(season: Season): string {
  const emojis: Record<Season, string> = {
    spring: '🌸',
    summer: '☀️',
    autumn: '🍂',
    winter: '❄️',
  };
  return emojis[season];
}
