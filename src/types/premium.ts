import { Timestamp } from 'firebase/firestore';

export interface PremiumCode {
  code: string;
  createdBy: string; // admin userId who created it
  createdAt: Timestamp;
  expiresAt: Timestamp; // when the code can no longer be redeemed
  durationDays: number; // how many days of premium it grants
  redeemedBy: string | null; // userId who redeemed it
  redeemedAt: Timestamp | null;
  status: 'active' | 'redeemed' | 'expired';
}

export interface PremiumStatus {
  isActive: boolean;
  expiresAt: Timestamp | null;
  giftCode: string | null;
  activatedAt: Timestamp | null;
}
