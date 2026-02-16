import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { borderRadius, spacing, fonts } from '@/constants/theme';

interface BadgeProps {
  label: string;
  color: string;
  style?: ViewStyle;
}

export function Badge({ label, color, style }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '18' }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fonts.rounded,
    fontSize: 12,
    lineHeight: 16,
  },
});
