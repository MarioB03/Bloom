import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface SparklesProps {
  /** Number of sparkles */
  count?: number;
  /** Area width */
  width: number;
  /** Area height */
  height: number;
}

function Sparkle({ x, y, delay, size }: { x: number; y: number; delay: number; size: number }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 600, easing: Easing.in(Easing.ease) }),
          withTiming(0, { duration: 1500 + Math.random() * 2000 }) // pause
        ),
        -1,
        false
      )
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
          withTiming(0.3, { duration: 600, easing: Easing.in(Easing.ease) }),
          withTiming(0.3, { duration: 1500 + Math.random() * 2000 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.sparkle, { left: x, top: y }, animStyle]}>
      <Text style={[styles.sparkleText, { fontSize: size }]}>✦</Text>
    </Animated.View>
  );
}

export function Sparkles({ count = 6, width, height }: SparklesProps) {
  const sparkles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      key: `sparkle-${i}`,
      x: 10 + Math.random() * (width - 20),
      y: 5 + Math.random() * (height - 15),
      delay: i * 800 + Math.random() * 1200,
      size: 8 + Math.random() * 6,
    }));
  }, [count, width, height]);

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      {sparkles.map((s) => (
        <Sparkle key={s.key} x={s.x} y={s.y} delay={s.delay} size={s.size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleText: {
    color: '#F5D48A',
  },
});
