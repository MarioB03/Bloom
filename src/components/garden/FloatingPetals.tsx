import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { EmotionId } from '@/types/checkin';
import { getEmotionColor, lightenColor } from '@/constants/garden';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FloatingPetalsProps {
  /** Emotions to pick petal colors from */
  emotions: EmotionId[];
  /** Number of petals (3-8) */
  count?: number;
  /** Height of the area where petals float */
  areaHeight: number;
}

function FloatingPetal({
  color,
  startX,
  areaHeight,
  delay,
  duration,
  size,
}: {
  color: string;
  startX: number;
  areaHeight: number;
  delay: number;
  duration: number;
  size: number;
}) {
  const y = useSharedValue(-20);
  const x = useSharedValue(startX);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Fall down
    y.value = withDelay(
      delay,
      withRepeat(
        withTiming(areaHeight + 20, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );
    // Drift horizontally
    x.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(startX + 30, { duration: duration * 0.4, easing: Easing.inOut(Easing.ease) }),
          withTiming(startX - 20, { duration: duration * 0.35, easing: Easing.inOut(Easing.ease) }),
          withTiming(startX + 10, { duration: duration * 0.25, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    // Rotate
    rotation.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: duration * 0.7, easing: Easing.linear }),
        -1,
        false
      )
    );
    // Fade in/out
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: duration * 0.15 }),
          withTiming(0.7, { duration: duration * 0.6 }),
          withTiming(0, { duration: duration * 0.25 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.petal,
        animStyle,
        {
          width: size * 1.4,
          height: size,
          backgroundColor: color,
          borderTopLeftRadius: size * 0.8,
          borderTopRightRadius: size * 0.3,
          borderBottomLeftRadius: size * 0.3,
          borderBottomRightRadius: size * 0.8,
        },
      ]}
    />
  );
}

export function FloatingPetals({ emotions, count = 5, areaHeight }: FloatingPetalsProps) {
  const petals = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const emotion = emotions[i % emotions.length];
      const color = lightenColor(getEmotionColor(emotion), 0.2);
      return {
        key: `petal-${i}`,
        color,
        startX: 20 + Math.random() * (SCREEN_WIDTH - 80),
        delay: i * 2000 + Math.random() * 1500,
        duration: 8000 + Math.random() * 4000,
        size: 5 + Math.random() * 4,
      };
    });
  }, [emotions, count]);

  return (
    <View style={[styles.container, { height: areaHeight }]} pointerEvents="none">
      {petals.map((p) => (
        <FloatingPetal
          key={p.key}
          color={p.color}
          startX={p.startX}
          areaHeight={areaHeight}
          delay={p.delay}
          duration={p.duration}
          size={p.size}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  petal: {
    position: 'absolute',
  },
});
