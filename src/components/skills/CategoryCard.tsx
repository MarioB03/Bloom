import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SkillCategoryMeta } from '@/types/skill';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

interface CategoryCardProps {
  category: SkillCategoryMeta;
  skillCount: number;
  onPress: () => void;
}

export function CategoryCard({ category, skillCount, onPress }: CategoryCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={styles.card}
    >
      <View style={[styles.iconBg, { backgroundColor: category.color + '15' }]}>
        <Text style={styles.emoji}>{category.emoji}</Text>
      </View>
      <View style={styles.textArea}>
        <Text style={styles.title}>{category.title}</Text>
        <Text style={styles.description}>{category.description}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.count}>{skillCount}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.neutral[400]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.sm,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  textArea: {
    flex: 1,
  },
  title: {
    ...typography.bodyBold,
    color: colors.neutral[700],
  },
  description: {
    ...typography.caption,
    color: colors.neutral[500],
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  count: {
    ...typography.caption,
    color: colors.neutral[400],
  },
});
