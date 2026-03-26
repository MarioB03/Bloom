import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateGenderPreference } from '@/lib/firestore';
import { useAuth } from './AuthContext';
import { GenderForm } from '@/types/user';

const STORAGE_KEY = '@bloom_gender';

interface GenderedStrings {
  f: string;
  m: string;
  n: string;
}

interface GenderContextValue {
  gender: GenderForm;
  setGender: (form: GenderForm) => Promise<void>;
  g: (forms: GenderedStrings) => string;
}

const GenderContext = createContext<GenderContextValue>({
  gender: 'n',
  setGender: async () => {},
  g: (forms) => forms.n,
});

export function GenderProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [gender, setGenderState] = useState<GenderForm>('n');

  // Load from AsyncStorage instantly on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'f' || stored === 'm' || stored === 'n') {
        setGenderState(stored);
      }
    });
  }, []);

  // Sync from Firestore when auth ready
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (!snap.exists()) return;
      const form = snap.data()?.preferences?.genderForm;
      if (form === 'f' || form === 'm' || form === 'n') {
        setGenderState(form);
        AsyncStorage.setItem(STORAGE_KEY, form);
      }
    }).catch(() => {});
  }, [user]);

  const setGender = useCallback(async (form: GenderForm) => {
    setGenderState(form);
    await AsyncStorage.setItem(STORAGE_KEY, form);
    if (user) {
      updateGenderPreference(user.uid, form).catch(() => {});
    }
  }, [user]);

  const g = useCallback((forms: GenderedStrings): string => {
    return forms[gender];
  }, [gender]);

  return (
    <GenderContext.Provider value={{ gender, setGender, g }}>
      {children}
    </GenderContext.Provider>
  );
}

export function useGender() {
  return useContext(GenderContext);
}
