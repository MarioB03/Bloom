import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  FadeIn,
  Easing,
} from 'react-native-reanimated';
import { EmotionId, IntensityLevel } from '@/types/checkin';
import {
  plantMorphology,
  getEmotionColor,
  lightenColor,
  darkenColor,
} from '@/constants/garden';
import { colors } from '@/constants/theme';

interface PlantVisualProps {
  emotion: EmotionId;
  intensity?: IntensityLevel;
  /** 0 = seed, 5 = full bloom */
  growthStage: number;
  /** Index for staggered animations */
  index: number;
  /** Plant size multiplier (0.6 - 1.0) */
  size?: number;
}

const STEM_COLOR = colors.secondary[500];
const STEM_COLOR_DARK = colors.secondary[700];

// ── Petal ──

function Petal({
  color,
  angle,
  spread,
  size,
  shape,
  delay,
}: {
  color: string;
  angle: number;
  spread: number;
  size: number;
  shape: 'round' | 'elongated' | 'pointed';
  delay: number;
}) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * spread;
  const y = Math.sin(rad) * spread;

  const width = shape === 'elongated' ? size * 1.6 : shape === 'pointed' ? size * 1.3 : size;
  const height = size;
  const borderRadius = shape === 'pointed'
    ? { borderTopLeftRadius: size, borderTopRightRadius: size, borderBottomLeftRadius: size / 4, borderBottomRightRadius: size / 4 }
    : { borderRadius: size / 2 };

  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(400)}
      style={[
        styles.petal,
        {
          width,
          height,
          backgroundColor: color,
          transform: [
            { translateX: x - width / 2 },
            { translateY: y - height / 2 },
            { rotate: `${angle + 90}deg` },
          ],
          ...borderRadius,
        },
      ]}
    />
  );
}

// ── Leaf ──

function Leaf({
  color,
  side,
  yPos,
  leafWidth,
  leafHeight,
  delay,
}: {
  color: string;
  side: 'left' | 'right';
  yPos: number;
  leafWidth: number;
  leafHeight: number;
  delay: number;
}) {
  const angle = side === 'left' ? -35 : 35;
  const xOffset = side === 'left' ? -leafWidth * 0.7 : leafWidth * 0.1;

  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(300)}
      style={[
        styles.leaf,
        {
          width: leafWidth,
          height: leafHeight,
          backgroundColor: color,
          borderTopLeftRadius: leafHeight * 0.8,
          borderTopRightRadius: leafHeight * 0.3,
          borderBottomLeftRadius: leafHeight * 0.3,
          borderBottomRightRadius: leafHeight * 0.8,
          bottom: yPos,
          left: xOffset,
          transform: [{ rotate: `${angle}deg` }],
        },
      ]}
    />
  );
}

// ── Main Plant ──

export function PlantVisual({
  emotion,
  intensity = 3,
  growthStage,
  index,
  size = 1,
}: PlantVisualProps) {
  const morph = plantMorphology[emotion];
  const emotionColor = getEmotionColor(emotion);
  const lightColor = lightenColor(emotionColor, 0.3);
  const leafColor = lightenColor(STEM_COLOR, 0.15);
  const baseDelay = 200 + index * 150;

  // Sway animation
  const sway = useSharedValue(0);
  useEffect(() => {
    sway.value = withDelay(
      index * 200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2500 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-1, { duration: 2500 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const swayStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${sway.value * 1.5}deg` },
      { translateX: sway.value * 0.8 },
    ],
  }));

  // Stem height based on growth & morphology
  const stemHeight = useMemo(() => {
    const [min, max] = morph.stemHeight;
    const progress = Math.min(growthStage / 5, 1);
    return (min + (max - min) * progress) * size;
  }, [growthStage, morph, size]);

  // How many petals to show based on growth
  const visiblePetals = useMemo(() => {
    if (growthStage < 3) return 0;
    if (growthStage === 3) return Math.ceil(morph.petalCount * 0.4);
    if (growthStage === 4) return Math.ceil(morph.petalCount * 0.7);
    return morph.petalCount;
  }, [growthStage, morph]);

  // Visible leaves based on growth
  const visibleLeaves = useMemo(() => {
    if (growthStage < 1) return 0;
    if (growthStage === 1) return 1;
    if (growthStage === 2) return Math.min(2, morph.leafCount);
    return morph.leafCount;
  }, [growthStage, morph]);

  const petalSize = morph.petalSize * size * (0.7 + intensity * 0.06);
  const petalSpread = morph.petalSpread * size;
  const leafW = morph.leafSize[0] * size;
  const leafH = morph.leafSize[1] * size;

  // Generate petal angles
  const petalAngles = useMemo(() => {
    const angles: number[] = [];
    for (let i = 0; i < morph.petalCount; i++) {
      angles.push((360 / morph.petalCount) * i - 90); // start from top
    }
    return angles;
  }, [morph]);

  // Generate leaf positions
  const leafPositions = useMemo(() => {
    const positions: { side: 'left' | 'right'; yPos: number }[] = [];
    for (let i = 0; i < morph.leafCount; i++) {
      const side = i % 2 === 0 ? 'left' : 'right';
      const yFraction = 0.25 + (i / morph.leafCount) * 0.5;
      positions.push({ side, yPos: stemHeight * yFraction });
    }
    return positions;
  }, [morph, stemHeight]);

  return (
    <Animated.View style={[styles.container, swayStyle, { width: 50 * size, height: (stemHeight + 40) * size }]}>
      {/* Stem */}
      {growthStage >= 1 && (
        <Animated.View
          entering={FadeIn.delay(baseDelay).duration(500)}
          style={[
            styles.stem,
            {
              height: stemHeight,
              backgroundColor: STEM_COLOR,
              bottom: 0,
            },
          ]}
        >
          {/* Stem highlight */}
          <View style={[styles.stemHighlight, { backgroundColor: lightenColor(STEM_COLOR, 0.3) }]} />
        </Animated.View>
      )}

      {/* Seed (always visible at growth 0) */}
      {growthStage === 0 && (
        <Animated.View
          entering={FadeIn.delay(baseDelay).duration(400)}
          style={styles.seed}
        >
          <View style={[styles.seedDot, { backgroundColor: darkenColor(emotionColor, 0.3) }]} />
        </Animated.View>
      )}

      {/* Leaves */}
      {leafPositions.slice(0, visibleLeaves).map((pos, i) => (
        <Leaf
          key={`leaf-${i}`}
          color={i % 2 === 0 ? leafColor : lightenColor(leafColor, 0.15)}
          side={pos.side}
          yPos={pos.yPos}
          leafWidth={leafW}
          leafHeight={leafH}
          delay={baseDelay + 200 + i * 100}
        />
      ))}

      {/* Bloom */}
      {visiblePetals > 0 && (
        <Animated.View
          entering={FadeIn.delay(baseDelay + 400).duration(300)}
          style={[
            styles.bloomContainer,
            { bottom: stemHeight - 4 },
          ]}
        >
          {/* Petals */}
          {petalAngles.slice(0, visiblePetals).map((angle, i) => (
            <Petal
              key={`petal-${i}`}
              color={i % 2 === 0 ? emotionColor : lightColor}
              angle={angle}
              spread={petalSpread}
              size={petalSize}
              shape={morph.petalShape}
              delay={baseDelay + 500 + i * 60}
            />
          ))}

          {/* Center */}
          <Animated.View
            entering={FadeIn.delay(baseDelay + 700).duration(300)}
            style={[
              styles.bloomCenter,
              {
                width: petalSize * 1.2,
                height: petalSize * 1.2,
                borderRadius: petalSize * 0.6,
                backgroundColor: darkenColor(emotionColor, 0.25),
              },
            ]}
          >
            {morph.centerEmoji && growthStage >= 5 && (
              <Text style={styles.centerEmoji}>{morph.centerEmoji}</Text>
            )}
          </Animated.View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  // Stem
  stem: {
    width: 3,
    borderRadius: 1.5,
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 1,
  },
  stemHighlight: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 1,
    borderRadius: 0.5,
    opacity: 0.5,
  },
  // Seed
  seed: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
  },
  seedDot: {
    width: 8,
    height: 6,
    borderRadius: 4,
  },
  // Leaves
  leaf: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 2,
  },
  // Bloom
  bloomContainer: {
    position: 'absolute',
    alignSelf: 'center',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  petal: {
    position: 'absolute',
    zIndex: 3,
  },
  bloomCenter: {
    zIndex: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerEmoji: {
    fontSize: 8,
    lineHeight: 12,
  },
});
