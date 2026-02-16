import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/contexts/PremiumContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonHomeRecords } from '@/components/ui/Skeleton';
import { CheckinCard } from '@/components/checkin/CheckinCard';
import { EmotionalRegisterCard } from '@/components/checkin/EmotionalRegisterCard';
import { getCheckinsByDate, getCheckinDatesLast30Days, getEmotionalRegistersByDate } from '@/lib/firestore';
import { CheckinEntry, EmotionalRegisterEntry } from '@/types/checkin';
import { getGreeting, formatDate } from '@/utils/date';
import { calculateStreak, getStreakEmoji, getStreakMessage } from '@/utils/streak';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

export default function CheckinHomeScreen() {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const [checkins, setCheckins] = useState<CheckinEntry[]>([]);
  const [registers, setRegisters] = useState<EmotionalRegisterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  // Floating CTA animation
  const floatingY = useSharedValue(0);

  useEffect(() => {
    floatingY.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
  }, []);

  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingY.value }],
  }));

  const loadTodayRecords = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const today = formatDate(new Date());
      const [todayCheckins, todayRegisters] = await Promise.all([
        getCheckinsByDate(user.uid, today),
        getEmotionalRegistersByDate(user.uid, today),
      ]);
      setCheckins(todayCheckins);
      setRegisters(todayRegisters);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadStreak = useCallback(async () => {
    if (!user) return;
    try {
      const dates = await getCheckinDatesLast30Days(user.uid);
      setStreak(calculateStreak(dates));
    } catch (error) {
      console.error('Error loading streak:', error);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadTodayRecords();
      loadStreak();
    }, [loadTodayRecords, loadStreak])
  );

  const handleNewCheckin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/checkin/nuevo');
  };

  const handleNewRegister = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/registro-emocional/nuevo');
  };

  const greeting = getGreeting();
  const displayName = user?.displayName || '';
  const streakEmoji = getStreakEmoji(streak);
  const streakMessage = getStreakMessage(streak);

  return (
    <ScreenWrapper>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.name}>{displayName}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => router.push('/perfil')}
        >
          <LinearGradient
            colors={[colors.primary[200], colors.primary[400]]}
            style={styles.avatar}
          >
            <Ionicons name="person" size={20} color={colors.surface} />
          </LinearGradient>
          {isPremium && (
            <View style={styles.premiumDot}>
              <Text style={styles.premiumDotText}>P</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Streak Badge — tap to open garden */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/jardin');
          }}
        >
          <View style={styles.streakCard}>
            <View style={styles.streakLeft}>
              <Text style={styles.streakEmoji}>{streakEmoji}</Text>
              <View>
                <Text style={styles.streakCount}>
                  {streak > 0 ? `${streak} día${streak > 1 ? 's' : ''}` : 'Sin racha'}
                </Text>
                <Text style={styles.streakMessage}>{streakMessage}</Text>
              </View>
            </View>
            <View style={styles.streakRight}>
              <Text style={styles.gardenLink}>{strings.garden.viewGarden}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Premium promo */}
      {!isPremium && (
        <Animated.View entering={FadeInDown.delay(280).duration(500)}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.premiumBanner}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/premium');
            }}
          >
            <View style={styles.premiumBannerLeft}>
              <Text style={styles.premiumBannerEmoji}>✨</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumBannerTitle}>Desbloquea Premium</Text>
                <Text style={styles.premiumBannerSub}>Exportar datos, compartir, tienda del jardín e insights avanzados</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.accent[400]} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Two CTA Cards */}
      <Animated.View entering={FadeInDown.delay(350).duration(600)} style={styles.ctaRow}>
        <Animated.View style={[styles.ctaWrapper, ctaStyle]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleNewCheckin}
            style={styles.ctaCardDaily}
          >
            <View style={styles.ctaIconSmall}>
              <Text style={styles.ctaEmojiSmall}>🌿</Text>
            </View>
            <Text style={styles.ctaTitleSmall}>{strings.checkin.newCheckin}</Text>
            <Text style={styles.ctaSubtitleSmall}>¿Cómo te has sentido hoy?</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.ctaWrapper, ctaStyle]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleNewRegister}
            style={styles.ctaCardObserve}
          >
            <View style={styles.ctaIconSmall}>
              <Text style={styles.ctaEmojiSmall}>🔍</Text>
            </View>
            <Text style={styles.ctaTitleSmall}>{strings.emotionalRegister.ctaTitle}</Text>
            <Text style={styles.ctaSubtitleSmall}>{strings.emotionalRegister.ctaSubtitle}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Today's records */}
      {loading ? (
        <SkeletonHomeRecords />
      ) : checkins.length === 0 && registers.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(550).duration(500)}>
          <Text style={styles.sectionTitle}>{strings.checkin.todayRecords}</Text>
          <EmptyState emoji="📝" message={strings.checkin.noRecordsToday} />
        </Animated.View>
      ) : (
        <>
          {/* Daily checkins */}
          {checkins.length > 0 && (
            <Animated.View entering={FadeInDown.delay(550).duration(500)}>
              <Text style={styles.sectionTitle}>{strings.checkin.sectionDaily}</Text>
              {checkins.map((item, index) => (
                <Animated.View key={item.id} entering={FadeInDown.delay(650 + index * 100).duration(400)}>
                  <CheckinCard
                    checkin={item}
                    onPress={() => router.push(`/checkin/${item.id}`)}
                  />
                </Animated.View>
              ))}
            </Animated.View>
          )}

          {/* Emotional registers */}
          {registers.length > 0 && (
            <Animated.View entering={FadeInDown.delay(checkins.length > 0 ? 750 : 550).duration(500)}>
              <Text style={styles.sectionTitle}>{strings.checkin.sectionEmotional}</Text>
              {registers.map((item, index) => (
                <Animated.View key={item.id} entering={FadeInDown.delay((checkins.length > 0 ? 850 : 650) + index * 100).duration(400)}>
                  <EmotionalRegisterCard
                    register={item}
                    onPress={() => router.push(`/registro-emocional/${item.id}`)}
                  />
                </Animated.View>
              ))}
            </Animated.View>
          )}
        </>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  greeting: {
    ...typography.body,
    color: colors.neutral[400],
  },
  name: {
    ...typography.displaySmall,
    color: colors.neutral[800],
    marginTop: 2,
  },
  avatarButton: {
    position: 'relative',
  },
  premiumDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent[400],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  premiumDotText: {
    fontFamily: fonts.sansBold,
    fontSize: 9,
    color: colors.surface,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Streak
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accent[50],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent[100],
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakEmoji: {
    fontSize: 28,
  },
  streakCount: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.neutral[700],
  },
  streakMessage: {
    ...typography.caption,
    color: colors.neutral[500],
    marginTop: 1,
  },
  streakRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gardenLink: {
    ...typography.caption,
    color: colors.accent[500],
  },
  // Premium banner
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accent[50],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent[100],
  },
  premiumBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  premiumBannerEmoji: {
    fontSize: 24,
  },
  premiumBannerTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.accent[500],
    marginBottom: 1,
  },
  premiumBannerSub: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 15,
    color: colors.neutral[500],
  },
  // Two CTAs side by side
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  ctaWrapper: {
    flex: 1,
  },
  ctaCardDaily: {
    backgroundColor: colors.secondary[400],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.md,
    minHeight: 140,
    justifyContent: 'center',
  },
  ctaCardObserve: {
    backgroundColor: colors.primary[400],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.md,
    minHeight: 140,
    justifyContent: 'center',
  },
  ctaIconSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  ctaEmojiSmall: {
    fontSize: 22,
  },
  ctaTitleSmall: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 2,
  },
  ctaSubtitleSmall: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.neutral[700],
    marginBottom: spacing.md,
  },
});
