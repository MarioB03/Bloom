import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { EmotionId, IntensityLevel } from '@/types/checkin';
import { getSkyColors } from '@/constants/garden';
import { strings } from '@/constants/strings';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { PlantVisual } from './PlantVisual';
import { FloatingPetals } from './FloatingPetals';
import { Sparkles } from './Sparkles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCENE_HEIGHT = 440;
const GROUND_HEIGHT = 200;
const SKY_HEIGHT = SCENE_HEIGHT - GROUND_HEIGHT;

// ── Data types ──

export interface GardenPlant {
  emotion: EmotionId;
  intensity: IntensityLevel;
  date: string;
}

interface GardenSceneProps {
  streak: number;
  plants: GardenPlant[];
  hasCheckinToday: boolean;
}

// ── Atmospheric elements ──

function Sun({ streak }: { streak: number }) {
  const rotation = useSharedValue(0);
  const glow = useSharedValue(0.6);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 40000, easing: Easing.linear }),
      -1, false
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
  }, []);

  const rotStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  if (streak < 3) return null;

  const sunSize = 32 + Math.min(streak, 20) * 1.5;

  return (
    <Animated.View entering={FadeIn.delay(300).duration(800)} style={styles.sun}>
      {/* Glow ring */}
      <Animated.View style={[styles.sunGlow, glowStyle, {
        width: sunSize + 20,
        height: sunSize + 20,
        borderRadius: (sunSize + 20) / 2,
      }]} />
      <Animated.View style={[styles.sunBody, rotStyle, {
        width: sunSize,
        height: sunSize,
        borderRadius: sunSize / 2,
      }]}>
        {/* Sun rays */}
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.sunRay,
              {
                transform: [{ rotate: `${i * 45}deg` }],
                height: sunSize + 8,
              },
            ]}
          />
        ))}
        <View style={[styles.sunCenter, {
          width: sunSize * 0.7,
          height: sunSize * 0.7,
          borderRadius: sunSize * 0.35,
        }]} />
      </Animated.View>
    </Animated.View>
  );
}

function Cloud({ delay, top, startX, size }: { delay: number; top: number; startX: number; size: number }) {
  const translateX = useSharedValue(startX);

  useEffect(() => {
    translateX.value = withDelay(delay,
      withRepeat(
        withSequence(
          withTiming(startX + 50, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
          withTiming(startX, { duration: 10000, easing: Easing.inOut(Easing.ease) })
        ),
        -1, true
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(500).duration(600)}
      style={[styles.cloud, { top }, animStyle]}
    >
      {/* Cloud built from Views */}
      <View style={[styles.cloudPuff, { width: size * 1.6, height: size, borderRadius: size / 2 }]} />
      <View style={[styles.cloudPuff, styles.cloudPuffTop, {
        width: size * 1.1,
        height: size * 0.9,
        borderRadius: size * 0.45,
        bottom: size * 0.35,
        left: size * 0.2,
      }]} />
      <View style={[styles.cloudPuff, styles.cloudPuffSmall, {
        width: size * 0.8,
        height: size * 0.65,
        borderRadius: size * 0.33,
        bottom: size * 0.2,
        right: -size * 0.05,
      }]} />
    </Animated.View>
  );
}

function Butterfly({ delay, startX, startY }: { delay: number; startX: number; startY: number }) {
  const x = useSharedValue(startX);
  const y = useSharedValue(startY);
  const wingFlap = useSharedValue(1);

  useEffect(() => {
    x.value = withDelay(delay,
      withRepeat(
        withSequence(
          withTiming(startX + 50, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(startX - 30, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(startX, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1, false
      )
    );
    y.value = withDelay(delay,
      withRepeat(
        withSequence(
          withTiming(startY - 18, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(startY + 12, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(startY, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1, false
      )
    );
    wingFlap.value = withDelay(delay,
      withRepeat(
        withSequence(
          withTiming(0.3, { duration: 150 }),
          withTiming(1, { duration: 150 })
        ),
        -1, true
      )
    );
  }, []);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));
  const wingStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: wingFlap.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(800).duration(500)}
      style={[styles.butterfly, bodyStyle]}
    >
      <Animated.View style={[styles.butterflyWing, styles.wingLeft, wingStyle]} />
      <View style={styles.butterflyBody} />
      <Animated.View style={[styles.butterflyWing, styles.wingRight, wingStyle]} />
    </Animated.View>
  );
}

function Rainbow() {
  return (
    <Animated.View entering={FadeIn.delay(600).duration(1200)} style={styles.rainbow}>
      <View style={[styles.rainbowArc, { borderColor: '#E8A948' }]} />
      <View style={[styles.rainbowArc, styles.rainbowArc2, { borderColor: '#D4937E' }]} />
      <View style={[styles.rainbowArc, styles.rainbowArc3, { borderColor: '#8BA888' }]} />
      <View style={[styles.rainbowArc, styles.rainbowArc4, { borderColor: '#7E9EB5' }]} />
      <View style={[styles.rainbowArc, styles.rainbowArc5, { borderColor: '#8B7EB5' }]} />
    </Animated.View>
  );
}

// ── Background hills ──

function Hills({ streak }: { streak: number }) {
  if (streak < 7) return null;
  return (
    <Animated.View entering={FadeIn.delay(200).duration(800)} style={styles.hills}>
      <View style={[styles.hill, styles.hillFar]} />
      <View style={[styles.hill, styles.hillMid]} />
      {streak >= 14 && <View style={[styles.hill, styles.hillNear]} />}
    </Animated.View>
  );
}

// ── Fence ──

function Fence() {
  return (
    <View style={styles.fence}>
      <View style={styles.fenceRail} />
      <View style={styles.fenceRailBottom} />
      <View style={styles.fencePostsRow}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={i} style={styles.fencePost}>
            <View style={styles.fencePostCap} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Today pulsing indicator ──

function TodayIndicator() {
  const opacity = useSharedValue(0.4);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.todayIndicator, animStyle]}>
      <View style={styles.todayDot} />
      <View style={styles.todaySprout} />
      <Text style={styles.todayEmoji}>🌱</Text>
    </Animated.View>
  );
}

// ── Ground details ──

function GroundDetails() {
  const pebbles = useMemo(() =>
    Array.from({ length: 8 }).map((_, i) => ({
      key: `pebble-${i}`,
      left: 15 + Math.random() * (SCREEN_WIDTH - 70),
      top: 8 + Math.random() * (GROUND_HEIGHT - 40),
      size: 3 + Math.random() * 4,
      color: i % 2 === 0 ? colors.neutral[400] : colors.neutral[300],
    }))
  , []);

  return (
    <>
      {pebbles.map((p) => (
        <View
          key={p.key}
          style={[
            styles.pebble,
            {
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size * 0.7,
              borderRadius: p.size * 0.35,
              backgroundColor: p.color,
            },
          ]}
        />
      ))}
    </>
  );
}

// ── Grass tufts ──

function GrassTufts() {
  const tufts = useMemo(() =>
    Array.from({ length: 12 }).map((_, i) => ({
      key: `tuft-${i}`,
      left: 8 + (i / 12) * (SCREEN_WIDTH - 56) + Math.random() * 12,
      height: 6 + Math.random() * 8,
    }))
  , []);

  return (
    <View style={styles.grassTufts}>
      {tufts.map((t) => (
        <View key={t.key} style={[styles.grassBlade, { left: t.left, height: t.height }]} />
      ))}
    </View>
  );
}

// ── Main Scene ──

export function GardenScene({ streak, plants, hasCheckinToday }: GardenSceneProps) {
  const skyColors = getSkyColors(streak);
  const allEmotions = useMemo(() => plants.map((p) => p.emotion), [plants]);
  const totalPlants = plants.length;

  // Layout plants organically: slight random offsets, grouped in "beds"
  const plantLayout = useMemo(() => {
    const gardenWidth = SCREEN_WIDTH - spacing.lg * 2;
    const maxPerRow = Math.max(3, Math.min(6, Math.ceil(gardenWidth / 55)));

    const items: Array<{
      plant: GardenPlant;
      x: number;
      y: number;
      growthStage: number;
      size: number;
    }> = [];

    plants.forEach((plant, i) => {
      const row = Math.floor(i / maxPerRow);
      const col = i % maxPerRow;
      const colWidth = gardenWidth / maxPerRow;

      // Organic offset
      const xJitter = (Math.random() - 0.5) * 12;
      const yJitter = (Math.random() - 0.5) * 8;
      const x = col * colWidth + colWidth / 2 + xJitter;
      const y = row * 90 + 15 + yJitter;

      // Growth: oldest plants are most grown
      const age = totalPlants - i;
      let growthStage = Math.min(5, age);
      // Size variation
      const sizeFactor = 0.7 + Math.random() * 0.3;

      items.push({ plant, x, y, growthStage, size: sizeFactor });
    });

    return items;
  }, [plants, totalPlants]);

  const gardenContentHeight = Math.max(
    GROUND_HEIGHT - 40,
    Math.ceil(plants.length / 5) * 90 + 100
  );
  const needsScroll = gardenContentHeight > GROUND_HEIGHT;

  return (
    <View style={styles.sceneContainer}>
      {/* ── Sky ── */}
      <LinearGradient
        colors={skyColors}
        style={styles.sky}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <Hills streak={streak} />
        <Sun streak={streak} />
        {streak >= 5 && <Cloud delay={0} top={15} startX={20} size={24} />}
        {streak >= 7 && <Cloud delay={3000} top={40} startX={SCREEN_WIDTH - 110} size={20} />}
        {streak >= 12 && <Cloud delay={5000} top={8} startX={SCREEN_WIDTH / 2 - 30} size={16} />}
        {streak >= 10 && <Butterfly delay={500} startX={50} startY={60} />}
        {streak >= 14 && <Butterfly delay={2000} startX={SCREEN_WIDTH - 80} startY={45} />}
        {streak >= 21 && <Rainbow />}

        {/* Floating petals for 14+ streak */}
        {streak >= 14 && allEmotions.length > 0 && (
          <FloatingPetals
            emotions={allEmotions}
            count={Math.min(streak >= 21 ? 8 : 5, 8)}
            areaHeight={SKY_HEIGHT}
          />
        )}

        {/* Sparkles for 21+ streak */}
        {streak >= 21 && (
          <Sparkles count={8} width={SCREEN_WIDTH - 40} height={SKY_HEIGHT} />
        )}
      </LinearGradient>

      {/* ── Garden ground ── */}
      <View style={styles.gardenGround}>
        <Fence />

        <View style={styles.groundSurface}>
          <GrassTufts />
          <GroundDetails />

          {/* Plants area */}
          {needsScroll ? (
            <ScrollView
              style={styles.plantsScroll}
              contentContainerStyle={[styles.plantsArea, { height: gardenContentHeight }]}
              showsVerticalScrollIndicator={false}
            >
              {plantLayout.map((item, i) => (
                <View
                  key={`plant-${i}`}
                  style={[styles.plantSlot, { left: item.x - 25, top: item.y }]}
                >
                  <PlantVisual
                    emotion={item.plant.emotion}
                    intensity={item.plant.intensity}
                    growthStage={item.growthStage}
                    index={i}
                    size={item.size}
                  />
                </View>
              ))}
              {!hasCheckinToday && (
                <View style={[styles.plantSlot, {
                  left: (SCREEN_WIDTH - spacing.lg * 2) / 2 - 25,
                  top: plantLayout.length > 0
                    ? (plantLayout[plantLayout.length - 1]?.y ?? 0) + 90
                    : 15,
                }]}>
                  <TodayIndicator />
                </View>
              )}
            </ScrollView>
          ) : (
            <View style={[styles.plantsArea, { height: GROUND_HEIGHT - 40 }]}>
              {plantLayout.map((item, i) => (
                <View
                  key={`plant-${i}`}
                  style={[styles.plantSlot, { left: item.x - 25, top: item.y }]}
                >
                  <PlantVisual
                    emotion={item.plant.emotion}
                    intensity={item.plant.intensity}
                    growthStage={item.growthStage}
                    index={i}
                    size={item.size}
                  />
                </View>
              ))}
              {!hasCheckinToday && (
                <View style={[styles.plantSlot, {
                  left: (SCREEN_WIDTH - spacing.lg * 2) / 2 - 25,
                  top: plantLayout.length > 0
                    ? Math.min(
                        (plantLayout[plantLayout.length - 1]?.y ?? 0) + 50,
                        GROUND_HEIGHT - 80
                      )
                    : 40,
                }]}>
                  <TodayIndicator />
                </View>
              )}
            </View>
          )}
        </View>

        {/* Bottom grass strip */}
        <LinearGradient
          colors={[colors.secondary[300], colors.secondary[200]]}
          style={styles.grassStrip}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sceneContainer: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    height: SCENE_HEIGHT,
  },
  // ── Sky ──
  sky: {
    height: SKY_HEIGHT,
    position: 'relative',
  },
  // Sun
  sun: {
    position: 'absolute',
    top: 10,
    right: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(248, 200, 80, 0.15)',
  },
  sunBody: {
    backgroundColor: '#F5D48A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sunCenter: {
    backgroundColor: '#FCEBC4',
    position: 'absolute',
  },
  sunRay: {
    position: 'absolute',
    width: 2,
    backgroundColor: 'rgba(248, 200, 80, 0.3)',
    alignSelf: 'center',
  },
  // Clouds
  cloud: {
    position: 'absolute',
  },
  cloudPuff: {
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  cloudPuffTop: {
    position: 'absolute',
  },
  cloudPuffSmall: {
    position: 'absolute',
  },
  // Butterfly
  butterfly: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  butterflyBody: {
    width: 3,
    height: 8,
    backgroundColor: colors.neutral[600],
    borderRadius: 1.5,
  },
  butterflyWing: {
    width: 8,
    height: 6,
    borderRadius: 4,
  },
  wingLeft: {
    backgroundColor: colors.accent[300],
    marginRight: -1,
  },
  wingRight: {
    backgroundColor: colors.accent[200],
    marginLeft: -1,
  },
  // Rainbow
  rainbow: {
    position: 'absolute',
    top: -20,
    left: 10,
    width: 100,
    height: 50,
  },
  rainbowArc: {
    position: 'absolute',
    width: 100,
    height: 50,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderWidth: 2,
    borderBottomWidth: 0,
    opacity: 0.4,
  },
  rainbowArc2: { width: 90, height: 45, left: 5, top: 5 },
  rainbowArc3: { width: 80, height: 40, left: 10, top: 10 },
  rainbowArc4: { width: 70, height: 35, left: 15, top: 15 },
  rainbowArc5: { width: 60, height: 30, left: 20, top: 20 },
  // Hills
  hills: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  hill: {
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  hillFar: {
    left: -30,
    width: SCREEN_WIDTH * 0.6,
    height: 50,
    backgroundColor: 'rgba(139, 168, 136, 0.15)',
  },
  hillMid: {
    right: -20,
    width: SCREEN_WIDTH * 0.5,
    height: 40,
    backgroundColor: 'rgba(139, 168, 136, 0.12)',
  },
  hillNear: {
    left: SCREEN_WIDTH * 0.3,
    width: SCREEN_WIDTH * 0.4,
    height: 35,
    backgroundColor: 'rgba(139, 168, 136, 0.08)',
  },
  // ── Garden ground ──
  gardenGround: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: GROUND_HEIGHT + 50,
  },
  // Fence
  fence: {
    height: 36,
    position: 'relative',
    marginHorizontal: spacing.sm,
    zIndex: 5,
  },
  fenceRail: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.primary[200],
    borderRadius: 2,
  },
  fenceRailBottom: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.primary[200],
    borderRadius: 2,
  },
  fencePostsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    height: 36,
  },
  fencePost: {
    width: 7,
    height: 36,
    backgroundColor: colors.primary[300],
    borderRadius: 2,
  },
  fencePostCap: {
    width: 11,
    height: 5,
    backgroundColor: colors.primary[400],
    borderRadius: 3,
    marginLeft: -2,
    marginTop: -1,
  },
  // Ground surface
  groundSurface: {
    flex: 1,
    backgroundColor: '#C9B896',
    position: 'relative',
    overflow: 'hidden',
  },
  // Grass
  grassTufts: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    zIndex: 1,
  },
  grassBlade: {
    position: 'absolute',
    width: 2,
    backgroundColor: colors.secondary[400],
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    bottom: 0,
  },
  grassStrip: {
    height: 14,
  },
  // Pebbles
  pebble: {
    position: 'absolute',
    opacity: 0.4,
  },
  // Plants
  plantsScroll: {
    flex: 1,
  },
  plantsArea: {
    position: 'relative',
  },
  plantSlot: {
    position: 'absolute',
    width: 50,
    zIndex: 2,
  },
  // Today indicator
  todayIndicator: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 40,
  },
  todayDot: {
    width: 10,
    height: 8,
    borderRadius: 5,
    backgroundColor: '#A08060',
    marginBottom: 2,
  },
  todaySprout: {
    width: 2,
    height: 8,
    backgroundColor: colors.secondary[400],
    borderRadius: 1,
    marginBottom: -2,
  },
  todayEmoji: {
    fontSize: 16,
    marginTop: -4,
  },
});
