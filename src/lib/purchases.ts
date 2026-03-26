import { Platform } from 'react-native';
import Purchases, {
  PurchasesOfferings,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';

const API_KEY = Platform.select({
  ios: 'appl_fzgSKrPIpEavNCnJpZlLDulBVFN',
  android: 'goog_xxxxx',
}) ?? '';

let isConfigured = false;

export async function initializePurchases(userId?: string): Promise<void> {
  if (!API_KEY) {
    console.warn('[Purchases] No API key configured for', Platform.OS);
    return;
  }

  if (!isConfigured) {
    Purchases.configure({ apiKey: API_KEY });
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    isConfigured = true;
  }

  if (userId) {
    await Purchases.logIn(userId);
  }
}

export interface SubscriptionStatus {
  isSubscribed: boolean;
  expiresAt: Date | null;
  productId: string | null;
}

export async function checkSubscriptionStatus(): Promise<SubscriptionStatus> {
  if (!isConfigured) {
    return { isSubscribed: false, expiresAt: null, productId: null };
  }

  try {
    const info: CustomerInfo = await Purchases.getCustomerInfo();
    const entitlement = info.entitlements.active['premium'];

    if (entitlement) {
      return {
        isSubscribed: true,
        expiresAt: entitlement.expirationDate
          ? new Date(entitlement.expirationDate)
          : null,
        productId: entitlement.productIdentifier,
      };
    }
  } catch (error) {
    console.error('[Purchases] Error checking subscription:', error);
  }

  return { isSubscribed: false, expiresAt: null, productId: null };
}

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!isConfigured) return null;

  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    console.error('[Purchases] Error fetching offerings:', error);
    return null;
  }
}

export async function purchasePackage(
  pkg: PurchasesPackage,
): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}
