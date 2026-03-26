import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import { useAuth } from './AuthContext';
import { getUserPremiumStatus } from '@/lib/firestore';
import {
  initializePurchases,
  checkSubscriptionStatus,
  getOfferings as fetchOfferings,
  purchasePackage as executePurchase,
  restorePurchases as executeRestore,
} from '@/lib/purchases';
import { PremiumStatus } from '@/types/premium';

interface PremiumContextType {
  isPremium: boolean;
  premiumStatus: PremiumStatus | null;
  loading: boolean;
  refresh: () => Promise<void>;
  // Subscription
  offerings: PurchasesOfferings | null;
  loadingOfferings: boolean;
  purchase: (pkg: PurchasesPackage) => Promise<void>;
  restore: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | null>(null);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [loadingOfferings, setLoadingOfferings] = useState(false);

  // Initialize RevenueCat when user authenticates
  useEffect(() => {
    if (authLoading || !user) return;
    initializePurchases(user.uid).catch(console.error);
  }, [user, authLoading]);

  // Load offerings once user is ready
  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;

    const load = async () => {
      setLoadingOfferings(true);
      try {
        const o = await fetchOfferings();
        if (!cancelled) setOfferings(o);
      } catch (error) {
        console.error('Error loading offerings:', error);
      } finally {
        if (!cancelled) setLoadingOfferings(false);
      }
    };

    // Small delay to let RevenueCat configure
    const timer = setTimeout(load, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user, authLoading]);

  const refresh = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setPremiumStatus(null);
      setLoading(false);
      return;
    }
    try {
      // Check both sources in parallel
      const [giftStatus, subStatus] = await Promise.all([
        getUserPremiumStatus(user.uid),
        checkSubscriptionStatus(),
      ]);

      if (subStatus.isSubscribed) {
        // Subscription takes priority for display
        setPremiumStatus({
          isActive: true,
          source: 'subscription',
          expiresAt: null, // managed by store
          giftCode: giftStatus?.giftCode ?? null,
          activatedAt: giftStatus?.activatedAt ?? null,
        });
      } else if (giftStatus?.isActive) {
        setPremiumStatus({ ...giftStatus, source: 'gift_code' });
      } else {
        setPremiumStatus(giftStatus ? { ...giftStatus, source: null } : null);
      }
    } catch (error) {
      console.error('Error loading premium status:', error);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    await executePurchase(pkg);
    await refresh();
  }, [refresh]);

  const restore = useCallback(async () => {
    await executeRestore();
    await refresh();
  }, [refresh]);

  const isPremium = premiumStatus?.isActive ?? false;

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        premiumStatus,
        loading,
        refresh,
        offerings,
        loadingOfferings,
        purchase,
        restore,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (!context) throw new Error('usePremium must be used within PremiumProvider');
  return context;
}
