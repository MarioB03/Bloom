import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSharing } from '@/contexts/SharingContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CheckinCard } from '@/components/checkin/CheckinCard';
import { EmotionalRegisterCard } from '@/components/checkin/EmotionalRegisterCard';
import { MonthView } from '@/components/calendar/MonthView';
import { MonthNavigator } from '@/components/calendar/MonthNavigator';
import {
  getCheckinsByDate,
  getCheckinsByDateRange,
  getAllCheckins,
  getEmotionalRegistersByDate,
} from '@/lib/firestore';
import { CheckinEntry, EmotionalRegisterEntry, EmotionId } from '@/types/checkin';
import { emotionMap } from '@/constants/emotions';
import { formatDate } from '@/utils/date';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

type Section = 'hoy' | 'calendario' | 'resumen';

interface DayData {
  emotion?: EmotionId;
  count?: number;
}

export default function CompartidoStandaloneScreen() {
  const { sharedAccount } = useSharing();
  const [section, setSection] = useState<Section>('hoy');

  // Hoy state
  const [todayCheckins, setTodayCheckins] = useState<CheckinEntry[]>([]);
  const [todayRegisters, setTodayRegisters] = useState<EmotionalRegisterEntry[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);

  // Calendar state
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [calData, setCalData] = useState<Record<string, DayData>>({});

  // Summary state
  const [allCheckins, setAllCheckins] = useState<CheckinEntry[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const ownerId = sharedAccount?.ownerId;

  const loadToday = useCallback(async () => {
    if (!ownerId) return;
    setLoadingToday(true);
    try {
      const today = formatDate(new Date());
      const [checkins, registers] = await Promise.all([
        getCheckinsByDate(ownerId, today),
        getEmotionalRegistersByDate(ownerId, today, { sharedOnly: true }),
      ]);
      setTodayCheckins(checkins);
      setTodayRegisters(registers);
    } catch (error) {
      console.error('Error loading shared records:', error);
    } finally {
      setLoadingToday(false);
    }
  }, [ownerId]);

  const loadCalendar = useCallback(async () => {
    if (!ownerId) return;
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    try {
      const checkins = await getCheckinsByDateRange(ownerId, startDate, endDate);
      const grouped: Record<string, CheckinEntry[]> = {};
      for (const c of checkins) {
        if (!grouped[c.date]) grouped[c.date] = [];
        grouped[c.date].push(c);
      }

      const dayData: Record<string, DayData> = {};
      for (const [date, entries] of Object.entries(grouped)) {
        const emotionCounts: Record<string, number> = {};
        for (const e of entries) {
          emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
        }
        const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
        dayData[date] = {
          emotion: (sorted[0]?.[0] as EmotionId) || undefined,
          count: entries.length,
        };
      }
      setCalData(dayData);
    } catch (error) {
      console.error('Error loading shared calendar:', error);
    }
  }, [ownerId, year, month]);

  const loadSummary = useCallback(async () => {
    if (!ownerId) return;
    setLoadingSummary(true);
    try {
      const data = await getAllCheckins(ownerId);
      setAllCheckins(data);
    } catch (error) {
      console.error('Error loading shared summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  }, [ownerId]);

  useFocusEffect(
    useCallback(() => {
      if (!ownerId) return;
      if (section === 'hoy') loadToday();
      else if (section === 'calendario') loadCalendar();
      else if (section === 'resumen') loadSummary();
    }, [ownerId, section, loadToday, loadCalendar, loadSummary])
  );

  if (!sharedAccount) {
    return (
      <ScreenWrapper>
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{strings.sharing.tabTitle}</Text>
          <View style={{ width: 40 }} />
        </Animated.View>
        <View style={styles.emptyContainer}>
          <EmptyState
            emoji="🔗"
            message={strings.sharing.noLink + '\n' + strings.sharing.noLinkHint}
          />
        </View>
      </ScreenWrapper>
    );
  }

  const ownerName = sharedAccount.ownerDisplayName;
  const today = formatDate(new Date());

  // Summary calculations
  const totalCheckins = allCheckins.length;
  const uniqueDays = new Set(allCheckins.map(c => c.date)).size;
  const emotionCounts: Record<string, number> = {};
  for (const c of allCheckins) {
    emotionCounts[c.emotion] = (emotionCounts[c.emotion] || 0) + 1;
  }
  const topEmotionId = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as EmotionId | undefined;
  const topEmotion = topEmotionId ? emotionMap[topEmotionId] : null;

  const handlePrev = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const handleNext = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const switchSection = (s: Section) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSection(s);
  };

  return (
    <ScreenWrapper>
      {/* Header with back button */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{strings.sharing.tabTitle}</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Owner info */}
      <Animated.View entering={FadeInDown.delay(150).duration(500)}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{strings.sharing.viewingGarden}</Text>
            <Text style={styles.ownerName}>{ownerName}</Text>
          </View>
          <Badge label={strings.sharing.readOnly} color={colors.info} />
        </View>
      </Animated.View>

      {/* Section tabs */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <View style={styles.tabs}>
          {(['hoy', 'calendario', 'resumen'] as Section[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.tab, section === s && styles.tabActive]}
              onPress={() => switchSection(s)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, section === s && styles.tabTextActive]}>
                {s === 'hoy' ? strings.sharing.todaySection
                  : s === 'calendario' ? strings.sharing.calendarSection
                  : strings.sharing.summarySection}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Section content */}
      {section === 'hoy' && (
        <>
          {!loadingToday && todayCheckins.length === 0 && todayRegisters.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
              <EmptyState emoji="🌤️" message="Sin registros hoy" />
            </Animated.View>
          ) : (
            <>
              {todayCheckins.length > 0 && (
                <Animated.View entering={FadeInDown.delay(300).duration(500)}>
                  <Text style={styles.sectionTitle}>{strings.checkin.sectionDaily}</Text>
                  {todayCheckins.map((item, index) => (
                    <Animated.View key={item.id} entering={FadeInDown.delay(400 + index * 100).duration(400)}>
                      <CheckinCard
                        checkin={item}
                        onPress={() => router.push(`/checkin/${item.id}?owner=${ownerId}`)}
                      />
                    </Animated.View>
                  ))}
                </Animated.View>
              )}

              {todayRegisters.length > 0 && (
                <Animated.View entering={FadeInDown.delay(todayCheckins.length > 0 ? 500 : 300).duration(500)}>
                  <Text style={styles.sectionTitle}>{strings.checkin.sectionEmotional}</Text>
                  {todayRegisters.map((item, index) => (
                    <Animated.View key={item.id} entering={FadeInDown.delay((todayCheckins.length > 0 ? 600 : 400) + index * 100).duration(400)}>
                      <EmotionalRegisterCard
                        register={item}
                        onPress={() => router.push(`/registro-emocional/${item.id}?owner=${ownerId}`)}
                      />
                    </Animated.View>
                  ))}
                </Animated.View>
              )}
            </>
          )}
        </>
      )}

      {section === 'calendario' && (
        <>
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <MonthNavigator year={year} month={month} onPrev={handlePrev} onNext={handleNext} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <MonthView
              year={year}
              month={month}
              data={calData}
              onDayPress={(date) => router.push(`/dia/${date}?owner=${ownerId}`)}
              today={today}
            />
          </Animated.View>
        </>
      )}

      {section === 'resumen' && (
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Card variant="outlined" style={styles.summaryCard}>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{totalCheckins}</Text>
                <Text style={styles.summaryLabel}>{strings.sharing.totalCheckins}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{uniqueDays}</Text>
                <Text style={styles.summaryLabel}>{strings.sharing.uniqueDays}</Text>
              </View>
            </View>
          </Card>

          {topEmotion && (
            <Card variant="outlined" style={styles.summaryCard}>
              <Text style={styles.summarySubtitle}>{strings.sharing.topEmotion}</Text>
              <View style={styles.topEmotionRow}>
                <Text style={styles.topEmotionEmoji}>{topEmotion.emoji}</Text>
                <Text style={[styles.topEmotionLabel, { color: topEmotion.color }]}>
                  {topEmotion.label}
                </Text>
              </View>
            </Card>
          )}

          {/* Top 5 emotions */}
          {allCheckins.length > 0 && (
            <Card variant="outlined" style={styles.summaryCard}>
              <Text style={styles.summarySubtitle}>Emociones frecuentes</Text>
              {Object.entries(emotionCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([emotionId, count]) => {
                  const emotion = emotionMap[emotionId as EmotionId];
                  if (!emotion) return null;
                  const pct = Math.round((count / totalCheckins) * 100);
                  return (
                    <View key={emotionId} style={styles.emotionBarRow}>
                      <Text style={styles.emotionBarEmoji}>{emotion.emoji}</Text>
                      <Text style={styles.emotionBarLabel}>{emotion.label}</Text>
                      <View style={styles.emotionBarTrack}>
                        <View style={[styles.emotionBarFill, { width: `${pct}%`, backgroundColor: emotion.color }]} />
                      </View>
                      <Text style={styles.emotionBarPct}>{pct}%</Text>
                    </View>
                  );
                })}
            </Card>
          )}
        </Animated.View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.sm, marginBottom: spacing.md },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.heading3, color: colors.neutral[700] },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.body,
    color: colors.neutral[400],
  },
  ownerName: {
    ...typography.displaySmall,
    color: colors.neutral[800],
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    padding: 3,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tabText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.neutral[400],
  },
  tabTextActive: {
    color: colors.neutral[700],
    fontFamily: fonts.sansBold,
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  // Summary
  summaryCard: { marginBottom: spacing.md },
  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.neutral[200],
  },
  summaryNumber: {
    fontFamily: fonts.sansBold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.neutral[800],
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.neutral[400],
    marginTop: spacing.xs,
  },
  summarySubtitle: {
    ...typography.bodyBold,
    color: colors.neutral[700],
    marginBottom: spacing.md,
  },
  topEmotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topEmotionEmoji: { fontSize: 36 },
  topEmotionLabel: {
    ...typography.displaySmall,
  },
  emotionBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  emotionBarEmoji: { fontSize: 18, width: 24, textAlign: 'center' },
  emotionBarLabel: {
    ...typography.small,
    color: colors.neutral[600],
    width: 80,
  },
  emotionBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.neutral[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  emotionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  emotionBarPct: {
    ...typography.caption,
    color: colors.neutral[400],
    width: 36,
    textAlign: 'right',
  },
});
