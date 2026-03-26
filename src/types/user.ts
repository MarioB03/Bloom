import { Timestamp } from 'firebase/firestore';
import { PremiumStatus } from './premium';

export type GenderForm = 'f' | 'm' | 'n';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  preferences: {
    trackMenstrualCycle: boolean;
    genderForm?: GenderForm;
  };
  premium?: PremiumStatus;
  authProvider?: 'email' | 'apple' | 'google';
}
