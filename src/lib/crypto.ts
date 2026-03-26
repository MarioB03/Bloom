import { getRandomValues } from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  getDocs,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

// Polyfill crypto.getRandomValues for crypto-js in React Native
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = {};
}
if (!globalThis.crypto.getRandomValues) {
  (globalThis.crypto as any).getRandomValues = getRandomValues;
}

const KEY = '70b2bec4f217fd190c7b6e43c2fab69de2bc11a7587c10bc1bf45d8aa403f038';

// Lazy-load crypto-js to avoid interfering with Skia's JSI initialization
type CryptoJSLib = typeof import('crypto-js');
let _CryptoJS: CryptoJSLib | null = null;
function getCrypto(): CryptoJSLib {
  if (!_CryptoJS) {
    _CryptoJS = require('crypto-js');
  }
  return _CryptoJS!;
}

export function encrypt(text: string): string {
  if (!text || !KEY) return text;
  try {
    return getCrypto().AES.encrypt(text, KEY).toString();
  } catch {
    // Fallback: store plaintext rather than lose data
    return text;
  }
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext || !KEY) return ciphertext;
  try {
    const CryptoJS = getCrypto();
    const bytes = CryptoJS.AES.decrypt(ciphertext, KEY);
    const result = bytes.toString(CryptoJS.enc.Utf8);
    return result || ciphertext; // fallback: dato pre-cifrado (legacy)
  } catch {
    return ciphertext; // dato sin cifrar (legacy)
  }
}

// CryptoJS AES output is base64 that always starts with "U2FsdGVk" ("Salted__")
function isEncrypted(text: string): boolean {
  return text.startsWith('U2FsdGVk');
}

const EVENT_TEXT_FIELDS = ['title', 'description'] as const;
const REGISTER_TEXT_FIELDS = [
  'emotionCustom', 'vulnerability', 'trigger', 'interpretations',
  'internalSensations', 'externalLanguage', 'impulses', 'behavior',
  'consequences', 'emotionFunction',
] as const;

export async function migrateUserEncryption(userId: string): Promise<void> {
  const storageKey = `encryption_migrated_${userId}`;
  const alreadyMigrated = await AsyncStorage.getItem(storageKey);
  if (alreadyMigrated === 'true') return;

  if (!KEY) return;

  try {
    // Migrate checkins
    const checkinsSnap = await getDocs(
      collection(db, 'users', userId, 'checkins')
    );

    const checkinBatches: ReturnType<typeof writeBatch>[] = [];
    let currentBatch = writeBatch(db);
    let opCount = 0;

    for (const docSnap of checkinsSnap.docs) {
      const data = docSnap.data();
      const updates: any = {};
      let needsUpdate = false;

      // Encrypt notes
      if (data.notes && !isEncrypted(data.notes)) {
        updates.notes = encrypt(data.notes);
        needsUpdate = true;
      }

      // Encrypt events
      if (data.events && Array.isArray(data.events)) {
        const encryptedEvents = data.events.map((e: any) => {
          const updated = { ...e };
          let eventChanged = false;
          for (const field of EVENT_TEXT_FIELDS) {
            if (updated[field] && !isEncrypted(updated[field])) {
              updated[field] = encrypt(updated[field]);
              eventChanged = true;
            }
          }
          return eventChanged ? updated : e;
        });
        if (encryptedEvents.some((e: any, i: number) => e !== data.events[i])) {
          updates.events = encryptedEvents;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        currentBatch.update(
          doc(db, 'users', userId, 'checkins', docSnap.id),
          updates
        );
        opCount++;
        if (opCount >= 499) {
          checkinBatches.push(currentBatch);
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      }
    }
    if (opCount > 0) checkinBatches.push(currentBatch);

    for (const batch of checkinBatches) {
      await batch.commit();
    }

    // Migrate emotional registers
    const registersSnap = await getDocs(
      collection(db, 'users', userId, 'registers')
    );

    const registerBatches: ReturnType<typeof writeBatch>[] = [];
    currentBatch = writeBatch(db);
    opCount = 0;

    for (const docSnap of registersSnap.docs) {
      const data = docSnap.data();
      const updates: any = {};
      let needsUpdate = false;

      for (const field of REGISTER_TEXT_FIELDS) {
        if (data[field] && !isEncrypted(data[field])) {
          updates[field] = encrypt(data[field]);
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        currentBatch.update(
          doc(db, 'users', userId, 'registers', docSnap.id),
          updates
        );
        opCount++;
        if (opCount >= 499) {
          registerBatches.push(currentBatch);
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      }
    }
    if (opCount > 0) registerBatches.push(currentBatch);

    for (const batch of registerBatches) {
      await batch.commit();
    }

    await AsyncStorage.setItem(storageKey, 'true');
  } catch (error) {
    console.warn('Encryption migration failed, will retry next launch:', error);
  }
}
