import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  FadeInDown,
  FadeInUp,
  interpolateColor,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

interface Slide {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  bgColors: [string, string, string];
}

const slides: Slide[] = [
  {
    id: '1',
    emoji: '🌱',
    title: 'Bienvenida a Bloom',
    subtitle: 'Tu jardín personal de bienestar emocional. Un espacio seguro para cultivar tu mundo interior.',
    bgColors: [colors.background, colors.secondary[50], colors.background],
  },
  {
    id: '2',
    emoji: '🌿',
    title: 'Registra cómo te sientes',
    subtitle: 'Haz check-ins diarios de tus emociones, sueño y energía. Observa tus patrones y crece con cada registro.',
    bgColors: [colors.background, colors.primary[50], colors.background],
  },
  {
    id: '3',
    emoji: '🌸',
    title: 'Observa tu crecimiento',
    subtitle: 'Visualiza tu calendario emocional, descubre insights y aprende habilidades para tu bienestar.',
    bgColors: [colors.background, colors.accent[50], colors.background],
  },
];

const ONBOARDING_KEY = '@bloom_onboarding_complete';

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch {}
}

function SlideItem({ item, index }: { item: Slide; index: number }) {
  const floatingY = useSharedValue(0);

  React.useEffect(() => {
    floatingY.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(8, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingY.value }],
  }));

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={[styles.emojiContainer, emojiStyle]}>
        <View style={[styles.emojiBg, { backgroundColor: item.id === '1' ? colors.secondary[100] : item.id === '2' ? colors.primary[100] : colors.accent[100] }]}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
      </Animated.View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );
}

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    await markOnboardingComplete();
    router.replace('/(auth)/login');
  };

  const isLast = currentIndex === slides.length - 1;

  return (
    <LinearGradient
      colors={slides[currentIndex].bgColors}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        {/* Skip button */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.skipContainer}>
          {!isLast && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Omitir</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={({ item, index }) => <SlideItem item={item} index={index} />}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          bounces={false}
        />

        {/* Bottom controls */}
        <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.controls}>
          {/* Dots */}
          <View style={styles.dots}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* Button */}
          <TouchableOpacity
            style={[styles.nextButton, isLast && styles.nextButtonLast]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {isLast ? 'Comenzar' : 'Siguiente'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  skipContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    minHeight: 44,
  },
  skipButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    ...typography.body,
    color: colors.neutral[400],
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl + 8,
  },
  emojiContainer: {
    marginBottom: spacing.xl,
  },
  emojiBg: {
    width: 120,
    height: 120,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.warm,
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    ...typography.displayLarge,
    color: colors.neutral[800],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
  },
  controls: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral[200],
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary[400],
  },
  nextButton: {
    backgroundColor: colors.primary[400],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.warm,
  },
  nextButtonLast: {
    backgroundColor: colors.secondary[400],
  },
  nextButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
  },
});
