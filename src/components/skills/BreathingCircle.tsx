import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing } from '@/constants/theme';

interface BreathingCircleProps {
  pattern?: { inhale: number; hold: number; exhale: number };
  isRunning: boolean;
  remainingSeconds: number;
  durationSeconds: number;
  onToggle: () => void;
  color: string;
}

type BreathingPhase = 'inhale' | 'hold' | 'exhale';

export function BreathingCircle({
  pattern,
  isRunning,
  remainingSeconds,
  durationSeconds,
  onToggle,
  color,
}: BreathingCircleProps) {
  const scale = useSharedValue(0.5);
  const [phase, setPhase] = useState<BreathingPhase>('inhale');
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine if this is a full cycle pattern or a single-phase pattern
  const isFullCycle = pattern && pattern.inhale > 0 && pattern.exhale > 0;
  const isSinglePhase = pattern && !isFullCycle;

  useEffect(() => {
    if (!isRunning) {
      if (phaseTimer.current) clearTimeout(phaseTimer.current);
      return;
    }

    if (isFullCycle) {
      // Full cycle: inhale → hold → exhale → repeat
      const runCycle = () => {
        // Inhale
        setPhase('inhale');
        scale.value = withTiming(1, {
          duration: pattern!.inhale * 1000,
          easing: Easing.inOut(Easing.ease),
        });

        phaseTimer.current = setTimeout(() => {
          // Hold
          if (pattern!.hold > 0) {
            setPhase('hold');
            phaseTimer.current = setTimeout(() => {
              // Exhale
              setPhase('exhale');
              scale.value = withTiming(0.5, {
                duration: pattern!.exhale * 1000,
                easing: Easing.inOut(Easing.ease),
              });
              phaseTimer.current = setTimeout(runCycle, pattern!.exhale * 1000);
            }, pattern!.hold * 1000);
          } else {
            // No hold, go straight to exhale
            setPhase('exhale');
            scale.value = withTiming(0.5, {
              duration: pattern!.exhale * 1000,
              easing: Easing.inOut(Easing.ease),
            });
            phaseTimer.current = setTimeout(runCycle, pattern!.exhale * 1000);
          }
        }, pattern!.inhale * 1000);
      };

      runCycle();
    } else if (isSinglePhase) {
      // Single phase: just animate for the one phase
      if (pattern!.inhale > 0) {
        setPhase('inhale');
        scale.value = withTiming(1, {
          duration: pattern!.inhale * 1000,
          easing: Easing.inOut(Easing.ease),
        });
      } else if (pattern!.hold > 0) {
        setPhase('hold');
        // Keep at current scale during hold
        scale.value = withTiming(1, { duration: 300 });
      } else if (pattern!.exhale > 0) {
        setPhase('exhale');
        scale.value = withTiming(0.5, {
          duration: pattern!.exhale * 1000,
          easing: Easing.inOut(Easing.ease),
        });
      }
    } else {
      // No pattern (respiracion_consciente): gentle pulse
      setPhase('inhale');
      scale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.85, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }

    return () => {
      if (phaseTimer.current) clearTimeout(phaseTimer.current);
    };
  }, [isRunning, pattern?.inhale, pattern?.hold, pattern?.exhale]);

  // Reset scale when not running
  useEffect(() => {
    if (!isRunning) {
      scale.value = withTiming(0.5, { duration: 500 });
    }
  }, [isRunning]);

  const circleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const phaseLabel = (() => {
    if (!pattern) return strings.breathing.breathe;
    switch (phase) {
      case 'inhale': return strings.breathing.inhale;
      case 'hold': return strings.breathing.hold;
      case 'exhale': return strings.breathing.exhale;
    }
  })();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.circleContainer}>
        <Animated.View
          style={[
            styles.outerCircle,
            { borderColor: color + '30', backgroundColor: color + '15' },
            circleAnimStyle,
          ]}
        >
          <View style={[styles.innerCircle, { backgroundColor: color + '25' }]}>
            <Text style={[styles.phaseText, { color }]}>{phaseLabel}</Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={onToggle}
          style={[styles.playButton, { backgroundColor: color + '15' }]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isRunning ? 'pause' : 'play'}
            size={24}
            color={color}
          />
        </TouchableOpacity>
        <Text style={styles.timeText}>{formatTime(remainingSeconds)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  circleContainer: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseText: {
    fontFamily: fonts.serif,
    fontSize: 20,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: colors.neutral[600],
  },
});
