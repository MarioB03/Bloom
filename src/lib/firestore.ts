import {
  collection,
  collectionGroup,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { CheckinEntry, CheckinFormData, EmotionalRegisterEntry, EmotionalRegisterFormData } from '@/types/checkin';
import { SharingCode, SharingLink } from '@/types/sharing';
import { PremiumCode, PremiumStatus } from '@/types/premium';
import { formatDate } from '@/utils/date';

// --- Check-ins ---

function checkinsRef(userId: string) {
  return collection(db, 'users', userId, 'checkins');
}

export async function createCheckin(
  userId: string,
  data: CheckinFormData
): Promise<string> {
  const now = Timestamp.now();
  const docRef = await addDoc(checkinsRef(userId), {
    ...data,
    userId,
    date: formatDate(new Date()),
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function getCheckinsByDate(
  userId: string,
  date: string
): Promise<CheckinEntry[]> {
  const q = query(
    checkinsRef(userId),
    where('date', '==', date)
  );
  const snapshot = await getDocs(q);
  const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CheckinEntry));
  // Sort client-side to avoid composite index requirement
  return results.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
}

export async function getCheckinsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<CheckinEntry[]> {
  const q = query(
    checkinsRef(userId),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  const snapshot = await getDocs(q);
  const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CheckinEntry));
  // Sort client-side: by date desc, then createdAt desc
  return results.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.createdAt.seconds - a.createdAt.seconds;
  });
}

export async function getAllCheckins(userId: string): Promise<CheckinEntry[]> {
  const q = query(checkinsRef(userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CheckinEntry));
}

export async function getCheckinById(
  userId: string,
  checkinId: string
): Promise<CheckinEntry | null> {
  const docSnap = await getDoc(doc(checkinsRef(userId), checkinId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as CheckinEntry;
}

export async function updateCheckin(
  userId: string,
  checkinId: string,
  data: Partial<CheckinFormData>
): Promise<void> {
  await updateDoc(doc(checkinsRef(userId), checkinId), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteCheckin(
  userId: string,
  checkinId: string
): Promise<void> {
  await deleteDoc(doc(checkinsRef(userId), checkinId));
}

// --- Emotional Registers (Observar y Describir) ---

function registersRef(userId: string) {
  return collection(db, 'users', userId, 'registers');
}

export async function createEmotionalRegister(
  userId: string,
  data: EmotionalRegisterFormData
): Promise<string> {
  const now = Timestamp.now();
  const docRef = await addDoc(registersRef(userId), {
    ...data,
    userId,
    date: formatDate(new Date()),
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function getEmotionalRegistersByDate(
  userId: string,
  date: string,
  options?: { sharedOnly?: boolean }
): Promise<EmotionalRegisterEntry[]> {
  const constraints: any[] = [where('date', '==', date)];
  if (options?.sharedOnly) {
    constraints.push(where('sharedVisible', '==', true));
  }
  const q = query(registersRef(userId), ...constraints);
  const snapshot = await getDocs(q);
  const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as EmotionalRegisterEntry));
  return results.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
}

export async function getEmotionalRegisterById(
  userId: string,
  registerId: string
): Promise<EmotionalRegisterEntry | null> {
  const docSnap = await getDoc(doc(registersRef(userId), registerId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as EmotionalRegisterEntry;
}

export async function updateEmotionalRegister(
  userId: string,
  registerId: string,
  data: Partial<EmotionalRegisterFormData>
): Promise<void> {
  await updateDoc(doc(registersRef(userId), registerId), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteEmotionalRegister(
  userId: string,
  registerId: string
): Promise<void> {
  await deleteDoc(doc(registersRef(userId), registerId));
}

export async function getAllEmotionalRegisters(
  userId: string,
  options?: { sharedOnly?: boolean }
): Promise<EmotionalRegisterEntry[]> {
  const constraints: any[] = [orderBy('createdAt', 'desc')];
  if (options?.sharedOnly) {
    constraints.unshift(where('sharedVisible', '==', true));
  }
  const q = query(registersRef(userId), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as EmotionalRegisterEntry));
}

export async function getEmotionalRegistersByDateRange(
  userId: string,
  startDate: string,
  endDate: string,
  options?: { sharedOnly?: boolean }
): Promise<EmotionalRegisterEntry[]> {
  const constraints: any[] = [
    where('date', '>=', startDate),
    where('date', '<=', endDate),
  ];
  if (options?.sharedOnly) {
    constraints.push(where('sharedVisible', '==', true));
  }
  const q = query(registersRef(userId), ...constraints);
  const snapshot = await getDocs(q);
  const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as EmotionalRegisterEntry));
  return results.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.createdAt.seconds - a.createdAt.seconds;
  });
}

// --- Streak / Stats ---

export async function getCheckinDatesLast30Days(
  userId: string
): Promise<string[]> {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
  const startDate = formatDate(thirtyDaysAgo);
  const endDate = formatDate(today);

  const q = query(
    checkinsRef(userId),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => (d.data() as CheckinEntry).date);
}

export async function getCheckinStats(userId: string): Promise<{
  totalCheckins: number;
  uniqueDays: number;
  dates: string[];
}> {
  const q = query(checkinsRef(userId));
  const snapshot = await getDocs(q);
  const dates = snapshot.docs.map((d) => (d.data() as CheckinEntry).date);
  const uniqueDays = new Set(dates).size;
  return {
    totalCheckins: snapshot.size,
    uniqueDays,
    dates,
  };
}

// --- Sharing ---

const SHARING_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += SHARING_CODE_CHARS.charAt(
      Math.floor(Math.random() * SHARING_CODE_CHARS.length)
    );
  }
  return code;
}

export async function createSharingCode(
  userId: string,
  displayName: string
): Promise<string> {
  const code = generateCode();
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000);

  await setDoc(doc(db, 'sharingCodes', code), {
    code,
    ownerId: userId,
    ownerDisplayName: displayName,
    createdAt: now,
    expiresAt,
  });

  return code;
}

export async function getSharingCode(
  code: string
): Promise<SharingCode | null> {
  const docSnap = await getDoc(doc(db, 'sharingCodes', code.toUpperCase()));
  if (!docSnap.exists()) return null;
  return docSnap.data() as SharingCode;
}

export async function deleteSharingCode(code: string): Promise<void> {
  await deleteDoc(doc(db, 'sharingCodes', code));
}

function viewersRef(ownerId: string) {
  return collection(db, 'users', ownerId, 'viewers');
}

export async function redeemSharingCode(
  code: string,
  viewerId: string,
  viewerDisplayName: string
): Promise<SharingLink> {
  const sharingCode = await getSharingCode(code.toUpperCase());
  if (!sharingCode) {
    throw new Error('INVALID_CODE');
  }

  if (sharingCode.expiresAt.toMillis() < Date.now()) {
    throw new Error('CODE_EXPIRED');
  }

  if (sharingCode.ownerId === viewerId) {
    throw new Error('CANNOT_LINK_SELF');
  }

  const viewerDocRef = doc(viewersRef(sharingCode.ownerId), viewerId);
  const existingDoc = await getDoc(viewerDocRef);
  if (existingDoc.exists()) {
    const existing = existingDoc.data();
    if (existing.status === 'active') {
      // Ensure the reverse lookup exists (migration for existing links)
      await setDoc(doc(db, 'viewerLinks', viewerId), existing);
      throw new Error('ALREADY_LINKED');
    }
    throw new Error('LINK_REVOKED');
  }

  const now = Timestamp.now();
  const linkData = {
    ownerId: sharingCode.ownerId,
    viewerId,
    ownerDisplayName: sharingCode.ownerDisplayName,
    viewerDisplayName,
    createdAt: now,
    status: 'active' as const,
  };

  await setDoc(viewerDocRef, linkData);

  // Also write a reverse lookup so the viewer can find this link
  // without a collectionGroup query
  await setDoc(doc(db, 'viewerLinks', viewerId), linkData);

  return { id: viewerId, ...linkData };
}

export async function getMyViewer(
  ownerId: string
): Promise<SharingLink | null> {
  const q = query(viewersRef(ownerId), where('status', '==', 'active'));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as SharingLink;
}

export async function getMySharedAccount(
  viewerId: string
): Promise<SharingLink | null> {
  // Direct document read — no collectionGroup query needed
  const docSnap = await getDoc(doc(db, 'viewerLinks', viewerId));
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  if (data.status !== 'active') return null;
  return { id: docSnap.id, ...data } as SharingLink;
}

export async function revokeAccess(
  ownerId: string,
  viewerId: string
): Promise<void> {
  await updateDoc(doc(viewersRef(ownerId), viewerId), {
    status: 'revoked',
  });
  // Also update the reverse lookup
  await updateDoc(doc(db, 'viewerLinks', viewerId), {
    status: 'revoked',
  });
}

// --- Premium Gift Codes ---

export async function createPremiumCode(
  adminUserId: string,
  durationDays: number = 365,
  codeExpiryDays: number = 30
): Promise<string> {
  const code = generateCode();
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(now.toMillis() + codeExpiryDays * 24 * 60 * 60 * 1000);

  await setDoc(doc(db, 'premiumCodes', code), {
    code,
    createdBy: adminUserId,
    createdAt: now,
    expiresAt,
    durationDays,
    redeemedBy: null,
    redeemedAt: null,
    status: 'active',
  });

  return code;
}

export async function redeemPremiumCode(
  code: string,
  userId: string
): Promise<PremiumStatus> {
  const codeDoc = await getDoc(doc(db, 'premiumCodes', code.toUpperCase()));
  if (!codeDoc.exists()) {
    throw new Error('INVALID_CODE');
  }

  const codeData = codeDoc.data() as PremiumCode;

  if (codeData.status === 'redeemed') {
    throw new Error('ALREADY_REDEEMED');
  }

  if (codeData.expiresAt.toMillis() < Date.now()) {
    throw new Error('CODE_EXPIRED');
  }

  const now = Timestamp.now();
  const premiumExpiresAt = Timestamp.fromMillis(
    now.toMillis() + codeData.durationDays * 24 * 60 * 60 * 1000
  );

  const premiumStatus: PremiumStatus = {
    isActive: true,
    expiresAt: premiumExpiresAt,
    giftCode: code.toUpperCase(),
    activatedAt: now,
  };

  // Update user profile with premium status
  await updateDoc(doc(db, 'users', userId), {
    premium: premiumStatus,
    updatedAt: now,
  });

  // Mark code as redeemed
  await updateDoc(doc(db, 'premiumCodes', code.toUpperCase()), {
    redeemedBy: userId,
    redeemedAt: now,
    status: 'redeemed',
  });

  return premiumStatus;
}

export async function getUserPremiumStatus(
  userId: string
): Promise<PremiumStatus | null> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) return null;

  const data = userDoc.data();
  if (!data.premium) return null;

  const premium = data.premium as PremiumStatus;

  // Check expiration
  if (premium.isActive && premium.expiresAt && premium.expiresAt.toMillis() < Date.now()) {
    // Premium expired — update in background
    await updateDoc(doc(db, 'users', userId), {
      'premium.isActive': false,
    });
    return { ...premium, isActive: false };
  }

  return premium;
}

export async function togglePremiumStatus(userId: string): Promise<boolean> {
  const status = await getUserPremiumStatus(userId);
  const newActive = !(status?.isActive ?? false);

  if (newActive && !status) {
    // Activate without a code (admin self-activate)
    await updateDoc(doc(db, 'users', userId), {
      'premium.isActive': true,
      'premium.activatedAt': Timestamp.now(),
      'premium.expiresAt': Timestamp.fromMillis(Date.now() + 365 * 24 * 60 * 60 * 1000),
      'premium.giftCode': 'ADMIN',
    });
  } else {
    await updateDoc(doc(db, 'users', userId), {
      'premium.isActive': newActive,
    });
  }

  return newActive;
}
