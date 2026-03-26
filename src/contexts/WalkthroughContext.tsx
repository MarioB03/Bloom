import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WALKTHROUGH_STEPS, WalkthroughStep } from '@/constants/walkthrough';

const STORAGE_KEY = '@bloom_walkthrough_complete';

export interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WalkthroughContextValue {
  isActive: boolean;
  isPending: boolean;
  currentStepIndex: number;
  currentStep: WalkthroughStep | null;
  steps: WalkthroughStep[];
  targetRects: Record<string, TargetRect>;
  overlayRef: React.RefObject<View | null>;
  setPending: (pending: boolean) => void;
  startWalkthrough: () => void;
  nextStep: () => void;
  skipWalkthrough: () => void;
  completeWalkthrough: () => void;
  checkShouldShowWalkthrough: () => Promise<boolean>;
  setTargetRect: (key: string, rect: TargetRect) => void;
}

const defaultOverlayRef = { current: null };

const WalkthroughContext = createContext<WalkthroughContextValue>({
  isActive: false,
  isPending: false,
  currentStepIndex: 0,
  currentStep: null,
  steps: WALKTHROUGH_STEPS,
  targetRects: {},
  overlayRef: defaultOverlayRef,
  setPending: () => {},
  startWalkthrough: () => {},
  nextStep: () => {},
  skipWalkthrough: () => {},
  completeWalkthrough: () => {},
  checkShouldShowWalkthrough: async () => false,
  setTargetRect: () => {},
});

export function WalkthroughProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRects, setTargetRects] = useState<Record<string, TargetRect>>({});
  const overlayRef = useRef<View>(null);

  const currentStep = isActive ? WALKTHROUGH_STEPS[currentStepIndex] || null : null;

  const checkShouldShowWalkthrough = useCallback(async () => {
    const done = await AsyncStorage.getItem(STORAGE_KEY);
    return done !== 'true';
  }, []);

  const setPending = useCallback((pending: boolean) => {
    setIsPending(pending);
  }, []);

  const startWalkthrough = useCallback(() => {
    setCurrentStepIndex(0);
    setIsPending(false);
    setIsActive(true);
  }, []);

  const markComplete = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < WALKTHROUGH_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsActive(false);
      markComplete();
    }
  }, [currentStepIndex, markComplete]);

  const skipWalkthrough = useCallback(() => {
    setIsActive(false);
    setIsPending(false);
    markComplete();
  }, [markComplete]);

  const completeWalkthrough = useCallback(() => {
    setIsActive(false);
    setIsPending(false);
    markComplete();
  }, [markComplete]);

  const setTargetRect = useCallback((key: string, rect: TargetRect) => {
    setTargetRects((prev) => ({ ...prev, [key]: rect }));
  }, []);

  return (
    <WalkthroughContext.Provider
      value={{
        isActive,
        isPending,
        currentStepIndex,
        currentStep,
        steps: WALKTHROUGH_STEPS,
        targetRects,
        overlayRef,
        setPending,
        startWalkthrough,
        nextStep,
        skipWalkthrough,
        completeWalkthrough,
        checkShouldShowWalkthrough,
        setTargetRect,
      }}
    >
      {children}
    </WalkthroughContext.Provider>
  );
}

export function useWalkthrough() {
  return useContext(WalkthroughContext);
}
