import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '@/constants/theme';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  color?: string;
}

export function StepIndicator({ currentStep, totalSteps, color = colors.primary[400] }: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < currentStep
              ? { backgroundColor: color, opacity: 0.4 }
              : i === currentStep
              ? { backgroundColor: color, width: 24 }
              : { backgroundColor: colors.neutral[200] },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral[200],
  },
});
