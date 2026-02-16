import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { MonthView } from '@/components/calendar/MonthView';
import { MonthNavigator } from '@/components/calendar/MonthNavigator';
import { getCheckinsByDateRange } from '@/lib/firestore';
import { CheckinEntry, EmotionId } from '@/types/checkin';
import { emotionMap } from '@/constants/emotions';
import { formatDate } from '@/utils/date';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

interface DayData {
  emotion?: EmotionId;
  count?: number;
}

export default function CalendarioScreen() {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [data, setData] = useState<Record<string, DayData>>({});

  const loadMonth = useCallback(async () => {
    if (!user) return;
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    try {
      const checkins = await getCheckinsByDateRange(user.uid, startDate, endDate);
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
      setData(dayData);
    } catch (error) {
      console.error('Error loading calendar:', error);
    }
  }, [user, year, month]);

  useFocusEffect(useCallback(() => { loadMonth(); }, [loadMonth]));

  const handlePrev = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const handleNext = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const today = formatDate(new Date());

  // Legend: show emotions that appear this month
  const usedEmotions = [...new Set(Object.values(data).map(d => d.emotion).filter(Boolean))] as EmotionId[];

  return (
    <ScreenWrapper>
      {/* Title */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <Text style={styles.title}>{strings.calendar.title}</Text>
        <Text style={styles.subtitle}>Tu mapa emocional mensual</Text>
      </Animated.View>

      {/* Month Navigator */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <MonthNavigator year={year} month={month} onPrev={handlePrev} onNext={handleNext} />
      </Animated.View>

      {/* Calendar Grid */}
      <Animated.View entering={FadeInDown.delay(300).duration(600)}>
        <MonthView year={year} month={month} data={data} onDayPress={(date) => router.push(`/dia/${date}`)} today={today} />
      </Animated.View>

      {/* Emotion Legend */}
      {usedEmotions.length > 0 && (
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.legend}>
          <Text style={styles.legendTitle}>Emociones del mes</Text>
          <View style={styles.legendItems}>
            {usedEmotions.map((emotionId) => {
              const emotion = emotionMap[emotionId];
              return (
                <View key={emotionId} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: emotion.color }]} />
                  <Text style={styles.legendLabel}>{emotion.emoji} {emotion.label}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.displayMedium,
    color: colors.neutral[800],
    paddingTop: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral[500],
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  legend: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  legendTitle: {
    fontFamily: fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    ...typography.small,
    color: colors.neutral[600],
  },
});
