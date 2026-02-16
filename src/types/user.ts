import { Timestamp } from 'firebase/firestore';
import { PremiumStatus } from './premium';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  preferences: {
    trackMenstrualCycle: boolean;
  };
  premium?: PremiumStatus;
}
