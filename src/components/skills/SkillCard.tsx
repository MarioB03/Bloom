import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Skill } from '@/types/skill';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

interface SkillCardProps {
  skill: Skill;
  onPress: () => void;
}

export function SkillCard({ skill, onPress }: SkillCardProps) {
  const isExercise = skill.type === 'exercise';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <Text style={styles.icon}>{skill.icon}</Text>
        <View style={styles.badges}>
          <View style={[styles.typeBadge, isExercise ? styles.exerciseBadge : styles.articleBadge]}>
            <Ionicons
              name={isExercise ? 'fitness-outline' : 'book-outline'}
              size={12}
              color={isExercise ? colors.secondary[500] : colors.accent[500]}
            />
            <Text style={[styles.typeText, isExercise ? styles.exerciseText : styles.articleText]}>
              {isExercise ? strings.skills.exercise : strings.skills.article}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.title}>{skill.title}</Text>
      <Text style={styles.description} numberOfLines={2}>{skill.description}</Text>
      <View style={styles.footer}>
        <View style={styles.durationRow}>
          <Ionicons name="time-outline" size={14} color={colors.neutral[400]} />
          <Text style={styles.duration}>{skill.durationLabel}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.neutral[400]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 28,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  exerciseBadge: {
    backgroundColor: colors.secondary[50],
  },
  articleBadge: {
    backgroundColor: colors.accent[50],
  },
  typeText: {
    fontFamily: fonts.rounded,
    fontSize: 11,
  },
  exerciseText: {
    color: colors.secondary[500],
  },
  articleText: {
    color: colors.accent[500],
  },
  title: {
    ...typography.bodyBold,
    color: colors.neutral[700],
    marginBottom: 4,
  },
  description: {
    ...typography.caption,
    color: colors.neutral[500],
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  duration: {
    ...typography.small,
    color: colors.neutral[400],
  },
});
