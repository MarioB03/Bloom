import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatMonthYear } from '@/utils/date';
import { colors, typography, fonts, spacing } from '@/constants/theme';

interface MonthNavigatorProps {
  year: number;
  month: number; // 0-indexed
  onPrev: () => void;
  onNext: () => void;
}

export function MonthNavigator({ year, month, onPrev, onNext }: MonthNavigatorProps) {
  const date = new Date(year, month, 1);
  const label = formatMonthYear(date);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPrev} style={styles.button}>
        <Ionicons name="chevron-back" size={24} color={colors.neutral[600]} />
      </TouchableOpacity>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={onNext} style={styles.button}>
        <Ionicons name="chevron-forward" size={24} color={colors.neutral[600]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  button: {
    padding: spacing.sm,
  },
  label: {
    ...typography.displaySmall,
    color: colors.neutral[800],
    textTransform: 'capitalize',
  },
});
