export interface TrustedContact {
  name: string;
  phone: string;
}

export interface SafetyPlan {
  warningSigns: string[];
  copingStrategies: string[];
  trustedContacts: TrustedContact[];
  personalSteps: string[];
  updatedAt?: any; // Firestore Timestamp
}

export interface CrisisHotline {
  name: string;
  phone: string;
  country: string;
  emoji: string;
}
