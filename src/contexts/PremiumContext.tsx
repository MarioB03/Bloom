import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getUserPremiumStatus } from '@/lib/firestore';
import { PremiumStatus } from '@/types/premium';

interface PremiumContextType {
  isPremium: boolean;
  premiumStatus: PremiumStatus | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | null>(null);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setPremiumStatus(null);
      setLoading(false);
      return;
    }
    try {
      const status = await getUserPremiumStatus(user.uid);
      setPremiumStatus(status);
    } catch (error) {
      console.error('Error loading premium status:', error);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isPremium = premiumStatus?.isActive ?? false;

  return (
    <PremiumContext.Provider value={{ isPremium, premiumStatus, loading, refresh }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (!context) throw new Error('usePremium must be used within PremiumProvider');
  return context;
}
