import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, fonts, borderRadius, shadows, spacing } from '@/constants/theme';
import { Achievement } from './gardenAchievements';

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const translateY = useSharedValue(-100);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Slide in + scale up
    translateY.value = withSequence(
      withTiming(20, { duration: 500, easing: Easing.out(Easing.back(1.2)) }),
      withDelay(2500, withTiming(-100, { duration: 400, easing: Easing.in(Easing.ease) }))
    );
    scale.value = withSequence(
      withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.2)) }),
      withDelay(2500, withTiming(0.8, { duration: 400 }))
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(2600, withTiming(0, { duration: 400 }))
    );

    const timer = setTimeout(onDismiss, 3400);
    return () => clearTimeout(timer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <View style={styles.card}>
        <Text style={styles.emoji}>{achievement.emoji}</Text>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.description}>{achievement.description}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 999,
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.accent[200],
  },
  emoji: {
    fontSize: 28,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.neutral[700],
  },
  description: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 1,
  },
});
