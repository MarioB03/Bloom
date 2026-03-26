import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
import { useGender } from '@/contexts/GenderContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonHomeRecords } from '@/components/ui/Skeleton';
import { CheckinCard } from '@/components/checkin/CheckinCard';
import { EmotionalRegisterCard } from '@/components/checkin/EmotionalRegisterCard';
import { getCheckinsByDate, getCheckinDatesLast30Days, getEmotionalRegistersByDate, getGratitudeByDate } from '@/lib/firestore';
import { CheckinEntry, EmotionalRegisterEntry, GratitudeEntry } from '@/types/checkin';
import { getGreeting, formatDate } from '@/utils/date';
import { calculateStreak, getStreakEmoji, getStreakMessage } from '@/utils/streak';
import { getPendingToasts, clearPendingToasts, getAppAchievementById } from '@/lib/achievements';
import { AppAchievementToast } from '@/components/ui/AchievementToast';
// import { useWalkthrough } from '@/contexts/WalkthroughContext';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

export default function CheckinHomeScreen() {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const { g } = useGender();
  const headerRef = useRef<View>(null);
  const ctasRef = useRef<View>(null);
  const [checkins, setCheckins] = useState<CheckinEntry[]>([]);
  const [registers, setRegisters] = useState<EmotionalRegisterEntry[]>([]);
  const [gratitude, setGratitude] = useState<GratitudeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [toastAchievement, setToastAchievement] = useState<{ emoji: string; title: string; description: string } | null>(null);
  const toastQueue = useRef<string[]>([]);

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

  const isFirstLoad = useRef(true);

  const loadTodayRecords = useCallback(async () => {
    if (!user) return;
    if (isFirstLoad.current) setLoading(true);
    try {
      const today = formatDate(new Date());
      const [todayCheckins, todayRegisters, todayGratitude] = await Promise.all([
        getCheckinsByDate(user.uid, today),
        getEmotionalRegistersByDate(user.uid, today),
        getGratitudeByDate(user.uid, today).catch(() => null),
      ]);
      setCheckins(todayCheckins);
      setRegisters(todayRegisters);
      setGratitude(todayGratitude);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
      isFirstLoad.current = false;
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

  const showNextToast = useCallback(() => {
    if (toastQueue.current.length === 0) return;
    const nextId = toastQueue.current.shift()!;
    const achievement = getAppAchievementById(nextId);
    if (achievement) {
      const resolvedTitle = typeof achievement.title === 'string' ? achievement.title : g(achievement.title);
      setToastAchievement({ emoji: achievement.emoji, title: resolvedTitle, description: achievement.description });
    }
  }, [g]);

  const loadPendingToasts = useCallback(async () => {
    const pending = await getPendingToasts();
    if (pending.length > 0) {
      await clearPendingToasts();
      toastQueue.current = pending;
      showNextToast();
    }
  }, [showNextToast]);

  // Streak only on mount
  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  // Reload records on focus (silently after first load)
  useFocusEffect(
    useCallback(() => {
      loadTodayRecords();
      loadPendingToasts();
    }, [loadTodayRecords, loadPendingToasts])
  );

  const handleNewCheckin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/checkin/nuevo');
  };

  const handleNewRegister = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/registro-emocional/nuevo');
  };

  const handleGratitude = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/gratitud/nuevo');
  };

  const greeting = getGreeting();
  const displayName = user?.displayName || '';
  const streakEmoji = getStreakEmoji(streak);
  const streakMessage = getStreakMessage(streak);

  const miniBookRef = useRef<View>(null);
  const miniBookOpacity = useSharedValue(1);

  const miniBookAnimStyle = useAnimatedStyle(() => ({
    opacity: miniBookOpacity.value,
  }));

  // Show mini book again when screen regains focus (returning from agenda)
  useFocusEffect(
    useCallback(() => {
      miniBookOpacity.value = withTiming(1, { duration: 200 });
    }, [])
  );

  const handleOpenAgenda = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    miniBookRef.current?.measureInWindow((x, y, w, h) => {
      // Hide mini book immediately so it doesn't show behind the transparent modal
      miniBookOpacity.value = 0;
      router.push({
        pathname: '/agenda',
        params: { ox: String(Math.round(x)), oy: String(Math.round(y)), ow: String(Math.round(w)), oh: String(Math.round(h)) },
      });
    });
  };

  return (
    <View style={{ flex: 1 }}>
    <ScreenWrapper>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
        <View ref={headerRef}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.name}>{displayName}</Text>
        </View>
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
      <Animated.View ref={ctasRef} entering={FadeInDown.delay(350).duration(600)} style={styles.ctaRow}>
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

      {/* Gratitude CTA */}
      <Animated.View entering={FadeInDown.delay(420).duration(500)}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleGratitude}
          style={styles.gratitudeCta}
        >
          <View style={styles.gratitudeCtaLeft}>
            <Text style={styles.gratitudeCtaEmoji}>{gratitude ? '✅' : '🙏'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.gratitudeCtaTitle}>
                {gratitude ? strings.gratitude.ctaDone : strings.gratitude.ctaTitle}
              </Text>
              <Text style={styles.gratitudeCtaSub}>
                {gratitude ? strings.gratitude.edit : strings.gratitude.ctaSubtitle}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.accent[400]} />
        </TouchableOpacity>
      </Animated.View>

      {/* Today's records */}
      {loading ? (
        <SkeletonHomeRecords />
      ) : checkins.length === 0 && registers.length === 0 && !gratitude ? (
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

          {/* Gratitude */}
          {gratitude && (
            <Animated.View entering={FadeInDown.delay(850).duration(500)}>
              <Text style={styles.sectionTitle}>{strings.gratitude.sectionTitle}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleGratitude}
                style={styles.gratitudeCard}
              >
                <Text style={styles.gratitudeCardEmoji}>🙏</Text>
                <View style={styles.gratitudeCardContent}>
                  {gratitude.items.map((item, i) => (
                    <Text key={i} style={styles.gratitudeCardItem}>
                      {i + 1}. {item}
                    </Text>
                  ))}
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
        </>
      )}
      {/* Achievement Toast */}
      {toastAchievement && (
        <AppAchievementToast
          emoji={toastAchievement.emoji}
          title={toastAchievement.title}
          description={toastAchievement.description}
          onDismiss={() => {
            setToastAchievement(null);
            // Show next in queue after a brief delay
            setTimeout(showNextToast, 300);
          }}
        />
      )}
    </ScreenWrapper>

    {/* Floating mini diary — always visible, overlay lands on top */}
    <Animated.View
      entering={FadeInDown.delay(900).duration(600)}
      style={[styles.miniBookContainer, miniBookAnimStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleOpenAgenda}
      >
        <View ref={miniBookRef} style={styles.miniBook}>
        {/* Spine */}
        <View style={styles.miniBookSpine} />
        {/* Cover content */}
        <View style={styles.miniBookContent}>
          <Text style={styles.miniBookEmoji}>📓</Text>
          <Text style={styles.miniBookTitle}>Mi Diario</Text>
        </View>
        {/* Page edges (right side) */}
        <View style={styles.miniBookPages}>
          <View style={styles.miniBookPageLine} />
          <View style={[styles.miniBookPageLine, { right: 1.5 }]} />
        </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
    </View>
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
  // Gratitude CTA
  gratitudeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accent[50],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent[100],
  },
  gratitudeCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  gratitudeCtaEmoji: {
    fontSize: 24,
  },
  gratitudeCtaTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.accent[500],
    marginBottom: 1,
  },
  gratitudeCtaSub: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 15,
    color: colors.neutral[500],
  },
  // Gratitude card in today's records
  gratitudeCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent[100],
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  gratitudeCardEmoji: {
    fontSize: 24,
    marginTop: 2,
  },
  gratitudeCardContent: {
    flex: 1,
    gap: spacing.xs,
  },
  gratitudeCardItem: {
    ...typography.body,
    color: colors.neutral[600],
    lineHeight: 22,
  },
  // Floating mini diary book
  miniBookContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
  },
  miniBook: {
    width: 64,
    height: 82,
    borderRadius: 6,
    backgroundColor: colors.primary[600],
    overflow: 'hidden',
    ...shadows.warm,
  },
  miniBookSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary[700],
    zIndex: 1,
  },
  miniBookContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  miniBookEmoji: {
    fontSize: 22,
  },
  miniBookTitle: {
    fontFamily: fonts.serif,
    fontSize: 9,
    color: colors.neutral[50],
  },
  miniBookPages: {
    position: 'absolute',
    right: 0,
    top: 4,
    bottom: 4,
    width: 4,
  },
  miniBookPageLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
});
