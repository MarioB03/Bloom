import React, { useCallback, useMemo, useState } from 'react';
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
import { strings } from '@/constants/strings';
import {
  analyzeSleepCorrelation,
  analyzeCyclePatterns,
  analyzeDayOfWeek,
  analyzeWeeklyTrend,
  analyzeHungerCorrelation,
  hasEnoughData,
  hasCycleData,
} from '@/lib/correlations';
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

  // Correlations (memoized)
  const enoughData = hasEnoughData(checkins);
  const sleepCorr = useMemo(() => enoughData ? analyzeSleepCorrelation(checkins) : null, [checkins, enoughData]);
  const cyclePatterns = useMemo(() => enoughData && hasCycleData(checkins) ? analyzeCyclePatterns(checkins) : [], [checkins, enoughData]);
  const dayPatterns = useMemo(() => enoughData ? analyzeDayOfWeek(checkins) : [], [checkins, enoughData]);
  const weeklyTrend = useMemo(() => enoughData ? analyzeWeeklyTrend(checkins) : null, [checkins, enoughData]);
  const hungerCorr = useMemo(() => enoughData ? analyzeHungerCorrelation(checkins) : null, [checkins, enoughData]);

  // Best/hardest day
  const bestDay = dayPatterns.length > 0
    ? dayPatterns.reduce((best, d) => (d.count > 0 && d.topEmotion && ['alegria', 'calma', 'gratitud'].includes(d.topEmotion.id) && d.count > (best?.count || 0)) ? d : best, dayPatterns[0])
    : null;
  const hardestDay = dayPatterns.length > 0
    ? dayPatterns.reduce((worst, d) => (d.count > 0 && d.avgIntensity > (worst?.avgIntensity || 0)) ? d : worst, dayPatterns[0])
    : null;

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

          {/* ── Correlations ── */}
          {enoughData ? (
            <>
              <Animated.View entering={FadeInDown.delay(700).duration(500)}>
                <Text style={styles.corrSectionHeader}>🔗 {strings.insights.correlations}</Text>
              </Animated.View>

              {/* Sleep × Emotion */}
              {sleepCorr && (sleepCorr.badSleepEmotion || sleepCorr.goodSleepEmotion) && (
                <Animated.View entering={FadeInDown.delay(750).duration(500)}>
                  <Card variant="outlined" style={styles.section}>
                    <Text style={styles.sectionTitle}>😴 {strings.insights.sleepCorrelation}</Text>
                    {sleepCorr.badSleepEmotion && (
                      <View style={styles.corrRow}>
                        <Text style={styles.corrLabel}>{strings.insights.whenSleepBad}:</Text>
                        <View style={styles.corrChip}>
                          <Text style={styles.corrEmoji}>{emotionMap[sleepCorr.badSleepEmotion.id]?.emoji}</Text>
                          <Text style={styles.corrValue}>{emotionMap[sleepCorr.badSleepEmotion.id]?.label} ({sleepCorr.badSleepEmotion.percentage}%)</Text>
                        </View>
                      </View>
                    )}
                    {sleepCorr.goodSleepEmotion && (
                      <View style={styles.corrRow}>
                        <Text style={styles.corrLabel}>{strings.insights.whenSleepGood}:</Text>
                        <View style={styles.corrChip}>
                          <Text style={styles.corrEmoji}>{emotionMap[sleepCorr.goodSleepEmotion.id]?.emoji}</Text>
                          <Text style={styles.corrValue}>{emotionMap[sleepCorr.goodSleepEmotion.id]?.label} ({sleepCorr.goodSleepEmotion.percentage}%)</Text>
                        </View>
                      </View>
                    )}
                  </Card>
                </Animated.View>
              )}

              {/* Hunger × Emotion */}
              {hungerCorr && (hungerCorr.hungryEmotion || hungerCorr.fedEmotion) && (
                <Animated.View entering={FadeInDown.delay(800).duration(500)}>
                  <Card variant="outlined" style={styles.section}>
                    <Text style={styles.sectionTitle}>🍽️ {strings.insights.hungerCorrelation}</Text>
                    {hungerCorr.hungryEmotion && (
                      <View style={styles.corrRow}>
                        <Text style={styles.corrLabel}>{strings.insights.whenHungry}:</Text>
                        <View style={styles.corrChip}>
                          <Text style={styles.corrEmoji}>{emotionMap[hungerCorr.hungryEmotion.id]?.emoji}</Text>
                          <Text style={styles.corrValue}>{emotionMap[hungerCorr.hungryEmotion.id]?.label} ({hungerCorr.hungryEmotion.percentage}%)</Text>
                        </View>
                      </View>
                    )}
                    {hungerCorr.fedEmotion && (
                      <View style={styles.corrRow}>
                        <Text style={styles.corrLabel}>{strings.insights.whenFed}:</Text>
                        <View style={styles.corrChip}>
                          <Text style={styles.corrEmoji}>{emotionMap[hungerCorr.fedEmotion.id]?.emoji}</Text>
                          <Text style={styles.corrValue}>{emotionMap[hungerCorr.fedEmotion.id]?.label} ({hungerCorr.fedEmotion.percentage}%)</Text>
                        </View>
                      </View>
                    )}
                  </Card>
                </Animated.View>
              )}

              {/* Cycle × Emotion */}
              {cyclePatterns.length > 0 && (
                <Animated.View entering={FadeInDown.delay(850).duration(500)}>
                  <Card variant="outlined" style={styles.section}>
                    <Text style={styles.sectionTitle}>🌙 {strings.insights.cyclePatterns}</Text>
                    {cyclePatterns.map((cp) => cp.topEmotion && (
                      <View key={cp.phase} style={styles.corrRow}>
                        <Text style={styles.corrLabel}>{strings.cycle[cp.phase]}:</Text>
                        <View style={styles.corrChip}>
                          <Text style={styles.corrEmoji}>{emotionMap[cp.topEmotion.id]?.emoji}</Text>
                          <Text style={styles.corrValue}>{emotionMap[cp.topEmotion.id]?.label} ({cp.topEmotion.percentage}%)</Text>
                        </View>
                      </View>
                    ))}
                  </Card>
                </Animated.View>
              )}

              {/* Day of week */}
              {bestDay && hardestDay && (
                <Animated.View entering={FadeInDown.delay(900).duration(500)}>
                  <Card variant="outlined" style={styles.section}>
                    <Text style={styles.sectionTitle}>📆 {strings.insights.dayOfWeek}</Text>
                    <View style={styles.dayGrid}>
                      {dayPatterns.map((d) => {
                        const emo = d.topEmotion ? emotionMap[d.topEmotion.id] : null;
                        return (
                          <View key={d.dayIndex} style={styles.dayCell}>
                            <Text style={styles.dayCellLabel}>{d.label.substring(0, 3)}</Text>
                            <Text style={styles.dayCellEmoji}>{emo?.emoji || '·'}</Text>
                            <Text style={styles.dayCellCount}>{d.count}</Text>
                          </View>
                        );
                      })}
                    </View>
                    <View style={styles.dayInsightRow}>
                      {bestDay.topEmotion && (
                        <View style={styles.dayInsightChip}>
                          <Text style={styles.dayInsightLabel}>{strings.insights.bestDay}</Text>
                          <Text style={styles.dayInsightValue}>{bestDay.label} {emotionMap[bestDay.topEmotion.id]?.emoji}</Text>
                        </View>
                      )}
                      {hardestDay.topEmotion && (
                        <View style={styles.dayInsightChip}>
                          <Text style={styles.dayInsightLabel}>{strings.insights.hardestDay}</Text>
                          <Text style={styles.dayInsightValue}>{hardestDay.label} {emotionMap[hardestDay.topEmotion.id]?.emoji}</Text>
                        </View>
                      )}
                    </View>
                  </Card>
                </Animated.View>
              )}

              {/* Weekly trend */}
              {weeklyTrend && (weeklyTrend.moreOf || weeklyTrend.lessOf) && (
                <Animated.View entering={FadeInDown.delay(950).duration(500)}>
                  <Card variant="outlined" style={styles.section}>
                    <Text style={styles.sectionTitle}>📈 {strings.insights.weeklyTrend}</Text>
                    {weeklyTrend.moreOf && (
                      <View style={styles.corrRow}>
                        <Text style={styles.corrLabel}>{strings.insights.moreOf}:</Text>
                        <View style={[styles.corrChip, { backgroundColor: colors.accent[50] }]}>
                          <Text style={styles.corrEmoji}>{emotionMap[weeklyTrend.moreOf.id]?.emoji}</Text>
                          <Text style={styles.corrValue}>{emotionMap[weeklyTrend.moreOf.id]?.label} ↑</Text>
                        </View>
                      </View>
                    )}
                    {weeklyTrend.lessOf && (
                      <View style={styles.corrRow}>
                        <Text style={styles.corrLabel}>{strings.insights.lessOf}:</Text>
                        <View style={[styles.corrChip, { backgroundColor: colors.secondary[50] }]}>
                          <Text style={styles.corrEmoji}>{emotionMap[weeklyTrend.lessOf.id]?.emoji}</Text>
                          <Text style={styles.corrValue}>{emotionMap[weeklyTrend.lessOf.id]?.label} ↓</Text>
                        </View>
                      </View>
                    )}
                    <Text style={styles.corrSubtext}>{strings.insights.vsLastWeek}</Text>
                  </Card>
                </Animated.View>
              )}
            </>
          ) : (
            <Animated.View entering={FadeInDown.delay(700).duration(500)}>
              <View style={styles.tipBanner}>
                <Text style={styles.tipEmoji}>📊</Text>
                <Text style={styles.tipText}>{strings.insights.needMoreData}</Text>
              </View>
            </Animated.View>
          )}
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
  // Correlation styles
  corrSectionHeader: {
    ...typography.heading3,
    color: colors.neutral[700],
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  corrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  corrLabel: {
    ...typography.body,
    color: colors.neutral[500],
    flex: 1,
  },
  corrChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  corrEmoji: {
    fontSize: 18,
  },
  corrValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.neutral[700],
  },
  corrSubtext: {
    ...typography.caption,
    color: colors.neutral[400],
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  dayGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dayCell: {
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  dayCellLabel: {
    fontFamily: fonts.rounded,
    fontSize: 10,
    color: colors.neutral[400],
    textTransform: 'uppercase',
  },
  dayCellEmoji: {
    fontSize: 18,
  },
  dayCellCount: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.neutral[400],
  },
  dayInsightRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dayInsightChip: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  dayInsightLabel: {
    ...typography.caption,
    color: colors.neutral[400],
    marginBottom: 2,
  },
  dayInsightValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.neutral[700],
  },
});
