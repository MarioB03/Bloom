import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, fonts, borderRadius, spacing } from '@/constants/theme';

interface IntensitySliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  labels?: Record<number, string>;
}

export function IntensitySlider({
  label,
  value,
  onChange,
  min = 1,
  max = 5,
  labels,
}: IntensitySliderProps) {
  const levels = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  const handleSelect = (level: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(level);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.levels}>
        {levels.map((level) => {
          const isSelected = value === level;
          const fillPercent = level / max;
          return (
            <TouchableOpacity
              key={level}
              style={[
                styles.level,
                isSelected && {
                  backgroundColor: colors.primary[500],
                  borderColor: colors.primary[500],
                },
              ]}
              onPress={() => handleSelect(level)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.levelText,
                  isSelected && styles.levelTextSelected,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {labels && labels[value] && (
        <Text style={styles.valueLabel}>{labels[value]}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodyBold,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  levels: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  level: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.surface,
  },
  levelText: {
    ...typography.bodyBold,
    color: colors.neutral[600],
  },
  levelTextSelected: {
    color: '#FFFFFF',
  },
  valueLabel: {
    ...typography.caption,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
