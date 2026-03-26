import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  OAuthProvider,
  GoogleAuthProvider,
  AuthCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  where,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from './firebase';
import { UserProfile, GenderForm } from '@/types/user';

export async function registerUser(
  email: string,
  password: string,
  displayName: string,
  genderForm: GenderForm = 'n'
): Promise<void> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });

  const profile: Omit<UserProfile, 'id'> = {
    email,
    displayName,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    preferences: {
      trackMenstrualCycle: false,
      genderForm,
    },
    authProvider: 'email',
  };

  await setDoc(doc(db, 'users', credential.user.uid), profile);
}

export async function loginUser(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// --- Social Auth ---

/**
 * Sign in with a social credential (Google/Apple).
 * Before signing in, checks if the email already exists with a DIFFERENT provider.
 * This prevents Firebase's "trusted provider" auto-linking which silently removes
 * the existing password provider.
 */
async function signInWithSocialCredential(
  credential: AuthCredential,
  email: string | null,
  providerIdToCheck: string
) {
  // Pre-check: if the email already has an account with a different provider, block
  if (email) {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length > 0 && !methods.includes(providerIdToCheck)) {
      const hasPassword = methods.includes('password');
      const hasApple = methods.includes('apple.com');
      const hasGoogle = methods.includes('google.com');

      let methodName = 'otro método';
      if (hasPassword) methodName = 'correo y contraseña';
      else if (hasApple) methodName = 'Apple';
      else if (hasGoogle) methodName = 'Google';

      throw new Error(
        `Ya tienes una cuenta con este correo usando ${methodName}. Inicia sesión con ese método.`
      );
    }
  }

  return await signInWithCredential(auth, credential);
}

export async function signInWithApple(
  identityToken: string,
  nonce: string,
  fullName?: { givenName?: string | null; familyName?: string | null }
): Promise<void> {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: identityToken,
    rawNonce: nonce,
  });

  const result = await signInWithSocialCredential(credential, null, 'apple.com');
  const user = result.user;

  // Apple only provides the name on first sign-in
  let displayName = user.displayName || '';
  if (!displayName && fullName) {
    const parts = [fullName.givenName, fullName.familyName].filter(Boolean);
    displayName = parts.join(' ') || 'Usuario';
    await updateProfile(user, { displayName });
  }

  // Create Firestore profile if new user
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) {
    const profile: Omit<UserProfile, 'id'> = {
      email: user.email || '',
      displayName: displayName || 'Usuario',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      preferences: {
        trackMenstrualCycle: false,
        genderForm: 'n',
      },
      authProvider: 'apple',
    };
    await setDoc(doc(db, 'users', user.uid), profile);
  }
}

export async function signInWithGoogle(idToken: string, email?: string): Promise<void> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithSocialCredential(credential, email || null, 'google.com');
  const user = result.user;

  // Create Firestore profile if new user
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) {
    const profile: Omit<UserProfile, 'id'> = {
      email: user.email || '',
      displayName: user.displayName || 'Usuario',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      preferences: {
        trackMenstrualCycle: false,
        genderForm: 'n',
      },
      authProvider: 'google',
    };
    await setDoc(doc(db, 'users', user.uid), profile);
  }
}

// --- Auth Provider Detection ---

export function getAuthProvider(): 'password' | 'apple' | 'google' {
  const user = auth.currentUser;
  if (!user) return 'password';

  for (const provider of user.providerData) {
    if (provider.providerId === 'apple.com') return 'apple';
    if (provider.providerId === 'google.com') return 'google';
  }
  return 'password';
}

// --- Re-authentication ---

export async function reauthenticateWithPassword(password: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('NO_USER');
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
}

export async function reauthenticateWithAppleCredential(
  identityToken: string,
  nonce: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('NO_USER');
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: identityToken,
    rawNonce: nonce,
  });
  await reauthenticateWithCredential(user, credential);
}

export async function reauthenticateWithGoogleCredential(idToken: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('NO_USER');
  const credential = GoogleAuthProvider.credential(idToken);
  await reauthenticateWithCredential(user, credential);
}

// --- Account Deletion ---

const ASYNC_STORAGE_KEYS = [
  '@bloom_onboarding_complete',
  '@bloom_reminder_settings',
  '@bloom_garden',
  '@bloom_garden_decorations',
  '@bloom_seeds',
  '@bloom_achievements',
  '@bloom_app_achievements',
  '@bloom_pending_toasts',
  '@bloom_walkthrough_complete',
  '@bloom_last_daily_reward',
  '@bloom_theme',
  '@bloom_shop_purchases',
  '@bloom_pets',
  '@bloom_terrain',
  '@bloom_gender',
];

async function deleteSubcollection(userId: string, subcollection: string): Promise<void> {
  const ref = collection(db, 'users', userId, subcollection);
  const snapshot = await getDocs(ref);
  if (snapshot.empty) return;

  // Firestore batches support max 500 operations
  const batchSize = 450;
  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = snapshot.docs.slice(i, i + batchSize);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

export async function deleteUserAccount(userId: string): Promise<void> {
  // Each step is wrapped individually so partial failures don't block account deletion.
  // The critical operation is step 6 (delete Auth user) — everything else is best-effort.

  // 1. Delete all subcollections
  const subcollections = ['checkins', 'registers', 'gratitude', 'skillPractice', 'safetyPlan', 'viewers'];
  for (const sub of subcollections) {
    try {
      await deleteSubcollection(userId, sub);
    } catch {
      // Continue — subcollection may not exist or rules may differ
    }
  }

  // 2. Delete user document
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch {
    // Continue
  }

  // 3. Delete sharing codes where user is owner
  try {
    const codesQuery = query(collection(db, 'sharingCodes'), where('ownerId', '==', userId));
    const codesSnapshot = await getDocs(codesQuery);
    for (const d of codesSnapshot.docs) {
      await deleteDoc(d.ref);
    }
  } catch {
    // Continue
  }

  // 4. Delete viewerLinks doc if user was a viewer
  try {
    const viewerLinkDoc = await getDoc(doc(db, 'viewerLinks', userId));
    if (viewerLinkDoc.exists()) {
      await deleteDoc(doc(db, 'viewerLinks', userId));
    }
  } catch {
    // Continue
  }

  // 5. Clear all AsyncStorage keys
  try {
    await AsyncStorage.multiRemove(ASYNC_STORAGE_KEYS);
  } catch {
    // Continue
  }

  // 6. Delete Firebase Auth user — this is the critical step
  const user = auth.currentUser;
  if (user) {
    await deleteUser(user);
  }
}
