import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/contexts/PremiumContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { getAllCheckins } from '@/lib/firestore';
import { CheckinEntry, EmotionId } from '@/types/checkin';
import { emotionMap } from '@/constants/emotions';
import { calculateStreak, getStreakEmoji } from '@/utils/streak';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

interface EmotionStat {
  id: EmotionId;
  count: number;
  percentage: number;
}

export default function InsightsStandaloneScreen() {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const [checkins, setCheckins] = useState<CheckinEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      (async () => {
        setLoading(true);
        try {
          const data = await getAllCheckins(user.uid);
          setCheckins(data);
        } catch (error) {
          console.error('Error loading insights:', error);
        } finally {
          setLoading(false);
        }
      })();
    }, [user])
  );

  if (!loading && checkins.length === 0) {
    return (
      <ScreenWrapper>
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Insights</Text>
          <View style={{ width: 40 }} />
        </Animated.View>
        <EmptyState emoji="📊" message="Haz algunos check-ins para ver tus estadísticas" />
      </ScreenWrapper>
    );
  }

  // --- Calculate stats ---
  const totalCheckins = checkins.length;
  const uniqueDays = new Set(checkins.map((c) => c.date)).size;
  const dates = checkins.map((c) => c.date);
  const streak = calculateStreak(dates);
  const streakEmoji = getStreakEmoji(streak);

  // Top emotions
  const emotionCounts: Record<string, number> = {};
  checkins.forEach((c) => {
    emotionCounts[c.emotion] = (emotionCounts[c.emotion] || 0) + 1;
  });
  const topEmotions: EmotionStat[] = Object.entries(emotionCounts)
    .map(([id, count]) => ({
      id: id as EmotionId,
      count,
      percentage: Math.round((count / totalCheckins) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Average intensity & sleep
  const avgIntensity = checkins.reduce((sum, c) => sum + c.emotionIntensity, 0) / totalCheckins;
  const avgSleep = checkins.reduce((sum, c) => sum + c.sleepQuality, 0) / totalCheckins;

  // Last 7 days activity
  const last7Days: Record<string, CheckinEntry[]> = {};
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const key = d.toISOString().split('T')[0];
    last7Days[key] = [];
  }
  checkins.forEach((c) => {
    if (last7Days[c.date]) {
      last7Days[c.date].push(c);
    }
  });

  const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const weekActivity = Object.entries(last7Days).map(([date, entries]) => {
    const d = new Date(date);
    const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
    return {
      label: dayLabels[dayIndex],
      count: entries.length,
      date,
    };
  });
  const maxWeekCount = Math.max(...weekActivity.map((w) => w.count), 1);

  return (
    <ScreenWrapper>
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insights</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(500)}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Tu resumen emocional</Text>
      </Animated.View>

      {/* Stats overview */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalCheckins}</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{uniqueDays}</Text>
            <Text style={styles.statLabel}>Días activos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{streakEmoji} {streak}</Text>
            <Text style={styles.statLabel}>Racha</Text>
          </View>
        </View>
      </Animated.View>

      {/* Weekly activity */}
      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <Card variant="outlined" style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Actividad semanal</Text>
          <View style={styles.weekChart}>
            {weekActivity.map((day, i) => (
              <View key={i} style={styles.weekDay}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: day.count > 0 ? Math.max((day.count / maxWeekCount) * 80, 12) : 4,
                        backgroundColor: day.count > 0 ? colors.secondary[400] : colors.neutral[200],
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.weekLabel, day.date === today.toISOString().split('T')[0] && styles.weekLabelToday]}>
                  {day.label}
                </Text>
                {day.count > 0 && (
                  <Text style={styles.weekCount}>{day.count}</Text>
                )}
              </View>
            ))}
          </View>
        </Card>
      </Animated.View>

      {/* Top emotions */}
      <Animated.View entering={FadeInDown.delay(400).duration(500)}>
        <Card variant="outlined" style={styles.section}>
          <Text style={styles.sectionTitle}>🌿 Emociones más frecuentes</Text>
          {topEmotions.map((stat) => {
            const emotion = emotionMap[stat.id];
            return (
              <View key={stat.id} style={styles.emotionRow}>
                <View style={styles.emotionLeft}>
                  <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
                  <Text style={styles.emotionName}>{emotion.label}</Text>
                </View>
                <View style={styles.emotionRight}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${stat.percentage}%`,
                          backgroundColor: emotion.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.emotionPercent}>{stat.percentage}%</Text>
                </View>
              </View>
            );
          })}
        </Card>
      </Animated.View>

      {/* Premium-gated sections */}
      {isPremium ? (
        <>
          {/* Averages */}
          <Animated.View entering={FadeInDown.delay(500).duration(500)}>
            <View style={styles.avgRow}>
              <Card variant="outlined" style={styles.avgCard}>
                <Text style={styles.avgEmoji}>⚡</Text>
                <Text style={styles.avgValue}>{avgIntensity.toFixed(1)}</Text>
                <Text style={styles.avgLabel}>Intensidad media</Text>
              </Card>
              <Card variant="outlined" style={styles.avgCard}>
                <Text style={styles.avgEmoji}>😴</Text>
                <Text style={styles.avgValue}>{avgSleep.toFixed(1)}</Text>
                <Text style={styles.avgLabel}>Calidad de sueño</Text>
              </Card>
            </View>
          </Animated.View>

          {/* Insight tip */}
          <Animated.View entering={FadeInDown.delay(600).duration(500)}>
            <View style={styles.tipBanner}>
              <Text style={styles.tipEmoji}>💡</Text>
              <Text style={styles.tipText}>
                {topEmotions[0] && avgSleep < 3
                  ? `Tu emoción más frecuente es ${emotionMap[topEmotions[0].id].label.toLowerCase()} y tu sueño es bajo. Intenta mejorar tu descanso.`
                  : topEmotions[0]
                    ? `Tu emoción más frecuente es ${emotionMap[topEmotions[0].id].label.toLowerCase()}. ¡Sigue registrando para descubrir más patrones!`
                    : 'Sigue registrando para descubrir patrones en tu bienestar.'}
              </Text>
            </View>
          </Animated.View>
        </>
      ) : (
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <TouchableOpacity
            style={styles.premiumLock}
            activeOpacity={0.8}
            onPress={() => router.push('/premium')}
          >
            <Ionicons name="lock-closed" size={24} color={colors.accent[400]} />
            <Text style={styles.premiumLockTitle}>Promedios e insights</Text>
            <Text style={styles.premiumLockText}>
              Desbloquea intensidad media, calidad de sueño y consejos personalizados con Premium.
            </Text>
            <View style={styles.premiumLockBadge}>
              <Text style={styles.premiumLockBadgeText}>Ver Premium</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.sm, marginBottom: spacing.md },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.heading3, color: colors.neutral[700] },
  title: {
    ...typography.displaySmall,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral[500],
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadows.sm,
  },
  statNumber: {
    fontFamily: fonts.sansBold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.neutral[800],
  },
  statLabel: {
    ...typography.caption,
    color: colors.neutral[400],
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.neutral[700],
    marginBottom: spacing.md,
  },
  weekChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barContainer: {
    height: 84,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    minWidth: 20,
    borderRadius: borderRadius.sm,
  },
  weekLabel: {
    fontFamily: fonts.rounded,
    fontSize: 11,
    color: colors.neutral[400],
    textTransform: 'uppercase',
  },
  weekLabelToday: {
    color: colors.primary[400],
    fontFamily: fonts.roundedBold,
  },
  weekCount: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.secondary[500],
  },
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm + 2,
  },
  emotionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: 110,
  },
  emotionEmoji: {
    fontSize: 20,
  },
  emotionName: {
    ...typography.body,
    color: colors.neutral[700],
  },
  emotionRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: colors.neutral[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  emotionPercent: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.neutral[500],
    width: 36,
    textAlign: 'right',
  },
  avgRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  avgCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avgEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  avgValue: {
    fontFamily: fonts.sansBold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.neutral[800],
  },
  avgLabel: {
    ...typography.caption,
    color: colors.neutral[400],
    marginTop: spacing.xs,
  },
  tipBanner: {
    backgroundColor: colors.accent[50],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent[100],
    marginBottom: spacing.xl,
  },
  tipEmoji: {
    fontSize: 28,
  },
  tipText: {
    ...typography.body,
    color: colors.neutral[600],
    flex: 1,
    lineHeight: 22,
  },
  premiumLock: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent[100],
    marginBottom: spacing.xl,
  },
  premiumLockTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.neutral[700],
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  premiumLockText: {
    ...typography.body,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  premiumLockBadge: {
    backgroundColor: colors.accent[50],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.accent[200],
  },
  premiumLockBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: colors.accent[500],
  },
});
