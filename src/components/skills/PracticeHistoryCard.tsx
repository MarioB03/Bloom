import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SkillPractice } from '@/types/skill';
import { getCategoryMeta } from '@/constants/skills';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

interface PracticeHistoryCardProps {
  practice: SkillPractice;
}

export function PracticeHistoryCard({ practice }: PracticeHistoryCardProps) {
  const category = getCategoryMeta(practice.category);
  const mins = Math.floor(practice.durationSeconds / 60);
  const secs = practice.durationSeconds % 60;
  const timeLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  const date = practice.completedAt?.toDate?.();
  const timeStr = date
    ? date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>{category?.emoji || '📝'}</Text>
      <View style={styles.content}>
        <Text style={styles.title}>{practice.skillTitle}</Text>
        <Text style={styles.meta}>
          {category?.title || practice.category}
          {practice.durationSeconds > 0 ? ` · ${timeLabel}` : ''}
        </Text>
      </View>
      <Text style={styles.time}>{timeStr}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    ...shadows.sm,
  },
  emoji: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.bodyBold,
    color: colors.neutral[700],
  },
  meta: {
    ...typography.caption,
    color: colors.neutral[500],
    marginTop: 2,
  },
  time: {
    ...typography.caption,
    color: colors.neutral[400],
  },
});
