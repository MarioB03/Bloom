import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, TouchableWithoutFeedback } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  FadeIn,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useWalkthrough } from '@/contexts/WalkthroughContext';
import { WALKTHROUGH_STEPS } from '@/constants/walkthrough';
import { strings } from '@/constants/strings';
import { colors, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SPOTLIGHT_PADDING = 10;
const MOVE_MS = 500;
const FADE_OUT_MS = 300;
const FADE_IN_MS = 350;
const SPRING_CONFIG = { damping: 18, stiffness: 120, mass: 0.8 };

const easeSmooth = Easing.bezier(0.4, 0, 0.2, 1);

export function WalkthroughOverlay() {
  const {
    isActive,
    isPending,
    currentStep,
    currentStepIndex,
    steps,
    targetRects,
    overlayRef,
    nextStep,
    skipWalkthrough,
  } = useWalkthrough();

  // Block all touches while waiting for walkthrough to start
  // Always render with overlayRef so measureLayout works during pending phase
  if (isPending && !isActive) {
    return (
      <View ref={overlayRef} style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.01)' }]} />
        </TouchableWithoutFeedback>
      </View>
    );
  }

  // Spotlight shared values
  const spotX = useSharedValue(SCREEN_W * 0.1);
  const spotY = useSharedValue(SCREEN_H * 0.35);
  const spotW = useSharedValue(SCREEN_W * 0.8);
  const spotH = useSharedValue(100);
  const borderOpacity = useSharedValue(0);

  // Tooltip shared values — full control over position + appearance
  const tooltipOpacity = useSharedValue(0);
  const tooltipScale = useSharedValue(0.95);
  const tooltipY = useSharedValue(0); // absolute Y position
  const isTooltipBelow = useSharedValue(1); // 1 = below, 0 = above

  // Track which content to show (swap text mid-transition)
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const isTransitioning = useRef(false);

  // Compute target spotlight rect for a given step
  // Rects are already in overlay-relative coordinates (measured via measureLayout)
  const getSpotForStep = (stepIdx: number) => {
    const step = WALKTHROUGH_STEPS[stepIdx];
    if (!step) return { x: SCREEN_W * 0.1, y: SCREEN_H * 0.35, w: SCREEN_W * 0.8, h: 100 };
    const rect = targetRects[step.targetKey];
    return {
      x: rect ? rect.x - SPOTLIGHT_PADDING : SCREEN_W * 0.1,
      y: rect ? rect.y - SPOTLIGHT_PADDING : SCREEN_H * 0.35,
      w: rect ? rect.width + SPOTLIGHT_PADDING * 2 : SCREEN_W * 0.8,
      h: rect ? rect.height + SPOTLIGHT_PADDING * 2 : 100,
    };
  };

  // Compute tooltip Y for a given step
  const getTooltipYForStep = (stepIdx: number) => {
    const step = WALKTHROUGH_STEPS[stepIdx];
    if (!step) return SCREEN_H * 0.5;
    const spot = getSpotForStep(stepIdx);
    const below = step.tooltipPosition === 'below';
    if (below) {
      return spot.y + spot.h + 20;
    } else {
      // Position above: estimate tooltip height ~200px, clamp to minimum 10px from top
      const ty = spot.y - 200 - 16;
      return Math.max(10, ty);
    }
  };

  useEffect(() => {
    if (!isActive || !currentStep) return;
    if (isTransitioning.current) return;

    const spot = getSpotForStep(currentStepIndex);
    const newTooltipY = getTooltipYForStep(currentStepIndex);
    const below = currentStep.tooltipPosition === 'below';

    if (currentStepIndex === 0) {
      // First step: set position instantly, fade in gracefully
      spotX.value = spot.x;
      spotY.value = spot.y;
      spotW.value = spot.w;
      spotH.value = spot.h;
      tooltipY.value = newTooltipY;
      isTooltipBelow.value = below ? 1 : 0;
      setDisplayedIndex(0);

      // Fade in after overlay appears
      borderOpacity.value = withDelay(350, withTiming(1, { duration: 400 }));
      tooltipOpacity.value = withDelay(450, withTiming(1, { duration: FADE_IN_MS }));
      tooltipScale.value = withDelay(450, withSpring(1, SPRING_CONFIG));
    } else {
      isTransitioning.current = true;

      // Phase 1: Fade out tooltip (scale down + fade)
      tooltipOpacity.value = withTiming(0, { duration: FADE_OUT_MS, easing: easeSmooth });
      tooltipScale.value = withTiming(0.92, { duration: FADE_OUT_MS, easing: easeSmooth });
      borderOpacity.value = withTiming(0.2, { duration: 200 });

      // Phase 2: Move spotlight (starts after tooltip fades)
      const moveDelay = FADE_OUT_MS;
      spotX.value = withDelay(moveDelay, withTiming(spot.x, { duration: MOVE_MS, easing: easeSmooth }));
      spotY.value = withDelay(moveDelay, withTiming(spot.y, { duration: MOVE_MS, easing: easeSmooth }));
      spotW.value = withDelay(moveDelay, withTiming(spot.w, { duration: MOVE_MS, easing: easeSmooth }));
      spotH.value = withDelay(moveDelay, withTiming(spot.h, { duration: MOVE_MS, easing: easeSmooth }));

      // Slide tooltip position to new target during the move
      tooltipY.value = withDelay(moveDelay, withTiming(newTooltipY, { duration: MOVE_MS, easing: easeSmooth }));
      isTooltipBelow.value = withDelay(moveDelay, withTiming(below ? 1 : 0, { duration: MOVE_MS }));

      // Phase 3: Update content & fade in tooltip after move completes
      const revealDelay = moveDelay + MOVE_MS - 100; // slight overlap
      setTimeout(() => {
        setDisplayedIndex(currentStepIndex);
      }, revealDelay);

      borderOpacity.value = withDelay(revealDelay, withTiming(1, { duration: 300 }));
      tooltipOpacity.value = withDelay(revealDelay + 50, withTiming(1, { duration: FADE_IN_MS, easing: easeSmooth }));
      tooltipScale.value = withDelay(revealDelay + 50, withSpring(1, SPRING_CONFIG));

      setTimeout(() => {
        isTransitioning.current = false;
      }, revealDelay + FADE_IN_MS + 50);
    }
  }, [currentStepIndex, isActive, currentStep?.targetKey]);

  // --- Animated styles ---

  const topOverlay = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: 0, left: 0, right: 0,
    height: Math.max(0, spotY.value),
    backgroundColor: 'rgba(0,0,0,0.6)',
  }));

  const bottomOverlay = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: spotY.value + spotH.value,
    left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  }));

  const leftOverlay = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: spotY.value, left: 0,
    width: Math.max(0, spotX.value),
    height: spotH.value,
    backgroundColor: 'rgba(0,0,0,0.6)',
  }));

  const rightOverlay = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: spotY.value,
    left: spotX.value + spotW.value,
    right: 0,
    height: spotH.value,
    backgroundColor: 'rgba(0,0,0,0.6)',
  }));

  const borderStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: spotY.value - 2,
    left: spotX.value - 2,
    width: spotW.value + 4,
    height: spotH.value + 4,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: `rgba(255,255,255,${borderOpacity.value * 0.6})`,
  }));

  // Tooltip: position + opacity + scale all animated
  const tooltipAnimStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: 24,
    right: 24,
    top: tooltipY.value,
    opacity: tooltipOpacity.value,
    transform: [
      { scale: tooltipScale.value },
      // Slight slide direction based on position
      { translateY: interpolate(tooltipOpacity.value, [0, 1], [8, 0]) },
    ],
  }));

  if (!isActive || !currentStep) return null;

  const displayedStep = steps[displayedIndex] || currentStep;
  const isLast = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isTransitioning.current) return; // prevent spam
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    nextStep();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    skipWalkthrough();
  };

  return (
    <View ref={overlayRef} style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Animated overlay rects */}
      <TouchableWithoutFeedback onPress={handleNext}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View entering={FadeIn.duration(400)} style={topOverlay} />
          <Animated.View entering={FadeIn.duration(400)} style={bottomOverlay} />
          <Animated.View entering={FadeIn.duration(400)} style={leftOverlay} />
          <Animated.View entering={FadeIn.duration(400)} style={rightOverlay} />
          <Animated.View style={borderStyle} />
        </View>
      </TouchableWithoutFeedback>

      {/* Tooltip — fully animated position, opacity, scale */}
      <Animated.View style={[styles.tooltip, tooltipAnimStyle]} pointerEvents="box-none">
        <Text style={styles.tooltipEmoji}>{displayedStep.emoji}</Text>
        <Text style={styles.tooltipTitle}>{displayedStep.title}</Text>
        <Text style={styles.tooltipText}>{displayedStep.text}</Text>

        <View style={styles.tooltipButtons}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton} activeOpacity={0.7}>
            <Text style={styles.skipText}>{strings.walkthrough.skip}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} style={styles.nextButton} activeOpacity={0.8}>
            <Text style={styles.nextText}>
              {isLast ? strings.walkthrough.done : strings.walkthrough.next}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentStepIndex ? styles.dotActive : styles.dotInactive,
                i === currentStepIndex && styles.dotActiveLarge,
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.lg,
  },
  tooltipEmoji: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  tooltipTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  tooltipText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  tooltipButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginBottom: spacing.sm,
  },
  skipButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
  },
  skipText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.neutral[400],
  },
  nextButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: colors.primary[400],
  },
  nextText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.primary[400],
  },
  dotActiveLarge: {
    width: 20,
    borderRadius: 10,
  },
  dotInactive: {
    backgroundColor: colors.neutral[200],
  },
});
