import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CyclePhase } from '@/types/checkin';
import { strings } from '@/constants/strings';
import { colors, typography, borderRadius, spacing } from '@/constants/theme';

interface CycleTrackerProps {
  value: CyclePhase | null;
  onChange: (phase: CyclePhase | null) => void;
}

const phases: { id: CyclePhase; emoji: string }[] = [
  { id: 'menstruacion', emoji: '🔴' },
  { id: 'folicular', emoji: '🌱' },
  { id: 'ovulacion', emoji: '🌸' },
  { id: 'lutea', emoji: '🌙' },
  { id: 'no_aplica', emoji: '➖' },
];

export function CycleTracker({ value, onChange }: CycleTrackerProps) {
  const handleSelect = (phase: CyclePhase) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(phase === value ? null : phase);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{strings.checkin.cycle}</Text>
      <View style={styles.phases}>
        {phases.map((phase) => {
          const isSelected = value === phase.id;
          return (
            <TouchableOpacity
              key={phase.id}
              style={[styles.phase, isSelected && styles.phaseSelected]}
              onPress={() => handleSelect(phase.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{phase.emoji}</Text>
              <Text
                style={[
                  styles.phaseLabel,
                  isSelected && styles.phaseLabelSelected,
                ]}
                numberOfLines={1}
              >
                {strings.cycle[phase.id]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  phases: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  phase: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.surface,
  },
  phaseSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  emoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  phaseLabel: {
    ...typography.small,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  phaseLabelSelected: {
    color: colors.primary[500],
    fontWeight: '600',
  },
});
