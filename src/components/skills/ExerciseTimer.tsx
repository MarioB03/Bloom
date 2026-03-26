import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { colors, typography, fonts, spacing, borderRadius } from '@/constants/theme';
import { strings } from '@/constants/strings';

interface ExerciseTimerProps {
  durationSeconds: number;
  isRunning: boolean;
  remainingSeconds: number;
  onToggle: () => void;
  color?: string;
}

export function ExerciseTimer({
  durationSeconds,
  isRunning,
  remainingSeconds,
  onToggle,
  color = colors.primary[400],
}: ExerciseTimerProps) {
  const progress = durationSeconds > 0 ? (durationSeconds - remainingSeconds) / durationSeconds : 0;
  const animatedProgress = useSharedValue(progress);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 300, easing: Easing.linear });
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%` as any,
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.timerRow}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggle();
          }}
          style={[styles.playButton, { backgroundColor: color }]}
        >
          <Ionicons
            name={isRunning ? 'pause' : 'play'}
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        <Text style={styles.time}>{formatTime(remainingSeconds)}</Text>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { backgroundColor: color }, progressStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontFamily: fonts.sansBold,
    fontSize: 28,
    color: colors.neutral[700],
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.neutral[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
