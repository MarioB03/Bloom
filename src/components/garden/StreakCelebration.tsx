import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, fonts, typography, spacing, borderRadius, shadows } from '@/constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Milestone data ──

interface MilestoneInfo {
  emoji: string;
  title: string;
  unlocks: string;
}

const MILESTONES: Record<number, MilestoneInfo> = {
  3:  { emoji: '🌿', title: '¡3 días seguidos!',  unlocks: 'Grid 4×4, seta y +10 semillas' },
  7:  { emoji: '🔥', title: '¡Una semana!',       unlocks: 'Banco y +25 semillas' },
  14: { emoji: '⭐', title: '¡Dos semanas!',      unlocks: 'Casa mariposas y +50 semillas' },
  21: { emoji: '🌈', title: '¡Tres semanas!',     unlocks: 'Fuente y arcoíris' },
  30: { emoji: '👑', title: '¡Un mes!',           unlocks: 'Grid 8×8, gnomo y +100 semillas' },
};

// ── Confetti colors ──

const CONFETTI_COLORS = [
  colors.accent[300],
  colors.accent[400],
  colors.primary[300],
  colors.secondary[300],
  colors.secondary[400],
  '#F9CB76',
  '#E8A4B8',
  '#A3D9A5',
];

// ── Confetti piece ──

const PIECE_SIZE = 10;

function ConfettiPiece({ index }: { index: number }) {
  const startX = Math.random() * SCREEN_W;
  const drift = (Math.random() - 0.5) * 80;
  const duration = 1800 + Math.random() * 1200;
  const rotEnd = 360 + Math.random() * 360;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const delay = index * 60;

  const translateY = useSharedValue(-40);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(withTiming(SCREEN_H + 40, { duration, easing: Easing.linear }), -1)
    );
    translateX.value = withDelay(
      delay,
      withRepeat(withTiming(drift, { duration, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
    rotate.value = withDelay(
      delay,
      withRepeat(withTiming(rotEnd, { duration, easing: Easing.linear }), -1)
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: -20,
          width: PIECE_SIZE,
          height: PIECE_SIZE * 0.6,
          borderRadius: 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

// ── Main component ──

interface StreakCelebrationProps {
  milestone: number;
  seedsEarned: number;
  onDismiss: () => void;
}

export function StreakCelebration({ milestone, seedsEarned, onDismiss }: StreakCelebrationProps) {
  const info = MILESTONES[milestone];
  if (!info) return null;

  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const emojiScale = useSharedValue(0);

  useEffect(() => {
    // 1. Backdrop fade in
    backdropOpacity.value = withTiming(1, { duration: 200 });
    // 2. Card scale in
    cardOpacity.value = withTiming(1, { duration: 200 });
    cardScale.value = withSpring(1, { damping: 12, stiffness: 180 });
    // 3. Emoji bounce
    emojiScale.value = withDelay(
      200,
      withSpring(1, { damping: 8, stiffness: 200, overshootClamping: false })
    );
    // 4. Haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleDismiss = () => {
    cardScale.value = withTiming(0.9, { duration: 250 });
    cardOpacity.value = withTiming(0, { duration: 250 });
    backdropOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(onDismiss)();
    });
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Confetti layer */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 12 }).map((_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </View>

      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="auto">
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={handleDismiss}>
          {/* Card */}
          <Animated.View style={[styles.card, cardStyle]}>
            <TouchableOpacity activeOpacity={1}>
              {/* Emoji */}
              <Animated.View style={[styles.emojiWrap, emojiStyle]}>
                <Text style={styles.emoji}>{info.emoji}</Text>
              </Animated.View>

              {/* Title */}
              <Text style={styles.title}>{info.title}</Text>

              {/* Unlocks */}
              <Text style={styles.unlocks}>{info.unlocks}</Text>

              {/* Seeds badge */}
              {seedsEarned > 0 && (
                <View style={styles.seedsBadge}>
                  <Text style={styles.seedsText}>+{seedsEarned} 🌱</Text>
                </View>
              )}

              {/* Dismiss button */}
              <TouchableOpacity style={styles.button} onPress={handleDismiss}>
                <Text style={styles.buttonText}>¡Genial!</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouch: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.accent[200],
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    width: SCREEN_W * 0.8,
    maxWidth: 320,
    ...shadows.warm,
  },
  emojiWrap: {
    marginBottom: spacing.md,
  },
  emoji: {
    fontSize: 60,
    textAlign: 'center',
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 26,
    lineHeight: 34,
    color: colors.accent[500],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  unlocks: {
    ...typography.body,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  seedsBadge: {
    backgroundColor: colors.accent[50],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.lg,
  },
  seedsText: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: colors.accent[500],
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.secondary[400],
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xl + spacing.md,
  },
  buttonText: {
    ...typography.bodyBold,
    color: colors.surface,
    textAlign: 'center',
  },
});
