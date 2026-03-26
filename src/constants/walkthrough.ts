import { strings } from './strings';

export interface WalkthroughStep {
  id: string;
  emoji: string;
  title: string;
  text: string;
  // Target area hint — the actual measurements come from the home screen
  targetKey: 'header' | 'ctas' | 'miniBook' | 'skillsTab' | 'profileTab';
  tooltipPosition: 'below' | 'above';
}

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 'welcome',
    emoji: '🌿',
    title: strings.walkthrough.step1Title,
    text: strings.walkthrough.step1Text,
    targetKey: 'header',
    tooltipPosition: 'below',
  },
  {
    id: 'checkin',
    emoji: '📝',
    title: strings.walkthrough.step2Title,
    text: strings.walkthrough.step2Text,
    targetKey: 'ctas',
    tooltipPosition: 'below',
  },
  {
    id: 'diary',
    emoji: '📓',
    title: strings.walkthrough.step3Title,
    text: strings.walkthrough.step3Text,
    targetKey: 'miniBook',
    tooltipPosition: 'above',
  },
  {
    id: 'skills',
    emoji: '🧠',
    title: strings.walkthrough.step4Title,
    text: strings.walkthrough.step4Text,
    targetKey: 'skillsTab',
    tooltipPosition: 'above',
  },
  {
    id: 'profile',
    emoji: '👤',
    title: strings.walkthrough.step5Title,
    text: strings.walkthrough.step5Text,
    targetKey: 'profileTab',
    tooltipPosition: 'above',
  },
];
