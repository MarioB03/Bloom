import { Timestamp } from 'firebase/firestore';

export interface SharingCode {
  code: string;
  ownerId: string;
  ownerDisplayName: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export interface SharingLink {
  id: string;
  ownerId: string;
  viewerId: string;
  ownerDisplayName: string;
  viewerDisplayName: string;
  createdAt: Timestamp;
  status: 'active' | 'revoked';
}
