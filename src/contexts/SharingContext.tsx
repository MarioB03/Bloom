import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getMyViewer, getMySharedAccount } from '@/lib/firestore';
import { SharingLink } from '@/types/sharing';

interface SharingContextType {
  /** The person viewing my data (I am the owner) */
  viewer: SharingLink | null;
  /** The person whose data I can view (I am the viewer) */
  sharedAccount: SharingLink | null;
  /** Whether data is still loading */
  loading: boolean;
  /** Refresh sharing state */
  refresh: () => Promise<void>;
}

const SharingContext = createContext<SharingContextType | null>(null);

export function SharingProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [viewer, setViewer] = useState<SharingLink | null>(null);
  const [sharedAccount, setSharedAccount] = useState<SharingLink | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    // Don't clear state while auth is still loading
    if (authLoading) return;
    if (!user) {
      setViewer(null);
      setSharedAccount(null);
      setLoading(false);
      return;
    }
    const results = await Promise.allSettled([
      getMyViewer(user.uid),
      getMySharedAccount(user.uid),
    ]);

    if (results[0].status === 'fulfilled') {
      setViewer(results[0].value);
    } else {
      console.error('Error loading viewer:', results[0].reason);
    }

    if (results[1].status === 'fulfilled') {
      setSharedAccount(results[1].value);
    } else {
      console.error('Error loading shared account:', results[1].reason);
    }

    setLoading(false);
  }, [user, authLoading]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SharingContext.Provider value={{ viewer, sharedAccount, loading, refresh }}>
      {children}
    </SharingContext.Provider>
  );
}

export function useSharing() {
  const context = useContext(SharingContext);
  if (!context) throw new Error('useSharing must be used within SharingProvider');
  return context;
}
