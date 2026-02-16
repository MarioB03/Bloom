import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { EmotionId } from '@/types/checkin';
import { emotionMap } from '@/constants/emotions';
import { getDaysInMonth, getFirstDayOfMonth } from '@/utils/date';
import { colors, typography, fonts, borderRadius, spacing, shadows } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DAY_NAMES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface DayData {
  emotion?: EmotionId;
  count?: number;
}

interface MonthViewProps {
  year: number;
  month: number;
  data: Record<string, DayData>;
  onDayPress: (date: string) => void;
  today: string;
}

function DayCell({ day, dateKey, dayData, isToday, onPress }: {
  day: number;
  dateKey: string;
  dayData?: DayData;
  isToday: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const emotion = dayData?.emotion ? emotionMap[dayData.emotion] : null;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[animatedStyle, styles.cell]}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.92, { damping: 12, stiffness: 180 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 180 }); }}
    >
      <View style={[
        styles.dayInner,
        isToday && styles.todayInner,
      ]}>
        <Text style={[
          styles.dayText,
          isToday && styles.todayText,
        ]}>
          {day}
        </Text>
        {emotion && (
          <View style={[styles.emotionDot, { backgroundColor: emotion.color }]} />
        )}
      </View>
    </AnimatedPressable>
  );
}

export function MonthView({ year, month, data, onDayPress, today }: MonthViewProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  const getDateKey = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  return (
    <View style={styles.container}>
      {/* Weekday Headers */}
      <View style={styles.headerRow}>
        {DAY_NAMES.map((name) => (
          <View key={name} style={styles.headerCell}>
            <Text style={styles.headerText}>{name}</Text>
          </View>
        ))}
      </View>

      {/* Day Grid */}
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((day, colIndex) => {
            if (day === null) {
              return <View key={colIndex} style={styles.cell} />;
            }
            const dateKey = getDateKey(day);
            return (
              <DayCell
                key={colIndex}
                day={day}
                dateKey={dateKey}
                dayData={data[dateKey]}
                isToday={dateKey === today}
                onPress={() => onDayPress(dateKey)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  headerText: {
    fontFamily: fonts.rounded,
    fontSize: 12,
    lineHeight: 16,
    color: colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minHeight: 52,
  },
  dayInner: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  todayInner: {
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[400],
  },
  dayText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.neutral[700],
  },
  todayText: {
    color: colors.primary[600],
    fontFamily: fonts.sansBold,
  },
  emotionDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
