import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  runOnJS,
  useAnimatedReaction,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors, fonts } from '@/constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Flower geometry
const PETAL_COUNT = 5;
const PETAL_ANGLES = [-90, -18, 54, 126, 198]; // degrees
const PETAL_W = 22;
const PETAL_H = 50;
const PETAL_SPREAD = 28;
const CENTER_R = 14;
const STEM_H = 80;
const STEM_W = 3;
const LEAF_W = 20;
const LEAF_H = 36;

const MIN_DISPLAY_MS = 1600;

// ─── Sub-components (so they can use hooks) ────────────────────

interface PetalProps {
  angleDeg: number;
  index: number;
}

function SplashPetal({ angleDeg, index }: PetalProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const stagger = 200 + index * 70;
    progress.value = withDelay(
      stagger,
      withSpring(1, { damping: 8, stiffness: 120 }),
    );
  }, []);

  const angleRad = (angleDeg * Math.PI) / 180;
  const tx = Math.cos(angleRad) * PETAL_SPREAD;
  const ty = Math.sin(angleRad) * PETAL_SPREAD;

  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateX: tx * progress.value },
      { translateY: ty * progress.value },
      { rotate: `${angleDeg + 90}deg` },
      { scale: progress.value },
    ],
  }));

  return (
    <Animated.View style={[styles.petal, animStyle]} />
  );
}

function SplashStem() {
  const scaleY = useSharedValue(0);

  useEffect(() => {
    scaleY.value = withTiming(1, {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  return <Animated.View style={[styles.stem, animStyle]} />;
}

function SplashLeaf() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      150,
      withSpring(1, { damping: 10, stiffness: 130 }),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: progress.value },
      { rotate: `${interpolate(progress.value, [0, 1], [-20, 35])}deg` },
    ],
  }));

  return <Animated.View style={[styles.leaf, animStyle]} />;
}

function SplashCenter() {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      500,
      withSpring(1, { damping: 6, stiffness: 120 }),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.center, animStyle]} />;
}

// ─── Main component ────────────────────────────────────────────

interface AnimatedSplashProps {
  isReady: boolean;
  onFinish: () => void;
}

export default function AnimatedSplash({ isReady, onFinish }: AnimatedSplashProps) {
  const containerOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);

  const startTime = useRef(Date.now());
  const exiting = useRef(false);

  // Title + subtitle entrance
  useEffect(() => {
    titleOpacity.value = withDelay(
      650,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
    titleTranslateY.value = withDelay(
      650,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
    subtitleOpacity.value = withDelay(
      850,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
    subtitleTranslateY.value = withDelay(
      850,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  // Exit animation
  useEffect(() => {
    if (!isReady || exiting.current) return;

    const elapsed = Date.now() - startTime.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    const timer = setTimeout(() => {
      exiting.current = true;
      containerOpacity.value = withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) });
      containerScale.value = withTiming(1.05, { duration: 400, easing: Easing.in(Easing.cubic) }, () => {
        runOnJS(onFinish)();
      });
    }, remaining);

    return () => clearTimeout(timer);
  }, [isReady]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      {/* Flower assembly */}
      <View style={styles.flowerWrap}>
        {/* Stem */}
        <View style={styles.stemWrap}>
          <SplashStem />
        </View>

        {/* Leaf */}
        <View style={styles.leafWrap}>
          <SplashLeaf />
        </View>

        {/* Petals */}
        <View style={styles.petalsWrap}>
          {PETAL_ANGLES.map((angle, i) => (
            <SplashPetal key={i} angleDeg={angle} index={i} />
          ))}
        </View>

        {/* Center */}
        <View style={styles.centerWrap}>
          <SplashCenter />
        </View>
      </View>

      {/* Title */}
      <Animated.Text style={[styles.title, titleStyle]}>Bloom</Animated.Text>
      <Animated.Text style={[styles.subtitle, subtitleStyle]}>
        Tu jardín de bienestar
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  flowerWrap: {
    width: 140,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Stem
  stemWrap: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  stem: {
    width: STEM_W,
    height: STEM_H,
    backgroundColor: '#8B7A6B',
    borderRadius: STEM_W / 2,
    transformOrigin: 'bottom',
  },
  // Leaf
  leafWrap: {
    position: 'absolute',
    bottom: 30,
    left: '50%',
    marginLeft: 2,
  },
  leaf: {
    width: LEAF_W,
    height: LEAF_H,
    backgroundColor: colors.secondary[300],
    borderTopLeftRadius: LEAF_H * 0.8,
    borderTopRightRadius: LEAF_H * 0.15,
    borderBottomLeftRadius: LEAF_H * 0.15,
    borderBottomRightRadius: LEAF_H * 0.8,
    transformOrigin: 'bottom left',
  },
  // Petals
  petalsWrap: {
    position: 'absolute',
    top: 20,
    width: PETAL_SPREAD * 2 + PETAL_W,
    height: PETAL_SPREAD * 2 + PETAL_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petal: {
    position: 'absolute',
    width: PETAL_W,
    height: PETAL_H,
    backgroundColor: '#F0B8B8',
    borderTopLeftRadius: PETAL_H * 0.8,
    borderTopRightRadius: PETAL_H * 0.8,
    borderBottomLeftRadius: PETAL_H * 0.15,
    borderBottomRightRadius: PETAL_H * 0.15,
  },
  // Center
  centerWrap: {
    position: 'absolute',
    top: 20 + PETAL_SPREAD + PETAL_H / 2 - CENTER_R,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    width: CENTER_R * 2,
    height: CENTER_R * 2,
    borderRadius: CENTER_R,
    backgroundColor: colors.accent[400],
  },
  // Text
  title: {
    fontFamily: fonts.serif,
    fontSize: 36,
    color: colors.primary[400],
    marginTop: 20,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.neutral[400],
    marginTop: 6,
  },
});
