import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { SkillCard } from '@/components/skills/SkillCard';
import { getSkillsByCategory, getCategoryMeta } from '@/constants/skills';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius } from '@/constants/theme';
import { SkillCategory, SkillType } from '@/types/skill';

type FilterType = 'all' | SkillType;

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [filter, setFilter] = useState<FilterType>('all');

  const category = getCategoryMeta(id as SkillCategory);
  const allSkills = getSkillsByCategory(id as SkillCategory);
  const filteredSkills = filter === 'all'
    ? allSkills
    : allSkills.filter((s) => s.type === filter);

  if (!category) return null;

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: strings.skills.allTypes },
    { key: 'exercise', label: strings.skills.exercises },
    { key: 'article', label: strings.skills.articles },
  ];

  return (
    <ScreenWrapper>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.title}</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Category info */}
      <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.categoryInfo}>
        <Text style={styles.emoji}>{category.emoji}</Text>
        <Text style={styles.categoryTitle}>{category.title}</Text>
        <Text style={styles.categoryDesc}>{category.description}</Text>
      </Animated.View>

      {/* Filter tabs */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.filterRow}>
        {filters.map((f) => {
          const isActive = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.selectionAsync();
                setFilter(f.key);
              }}
              style={[styles.filterTab, isActive && { backgroundColor: category.color + '15', borderColor: category.color }]}
            >
              <Text style={[styles.filterLabel, isActive && { color: category.color }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* Skills list */}
      {filteredSkills.map((skill, index) => (
        <Animated.View key={skill.id} entering={FadeInDown.delay(250 + index * 80).duration(400)}>
          <SkillCard
            skill={skill}
            onPress={() => router.push(`/habilidad/${skill.id}`)}
          />
        </Animated.View>
      ))}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.heading3,
    color: colors.neutral[700],
  },
  categoryInfo: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  categoryTitle: {
    ...typography.displaySmall,
    color: colors.neutral[800],
    textAlign: 'center',
  },
  categoryDesc: {
    ...typography.body,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.surface,
  },
  filterLabel: {
    fontFamily: fonts.rounded,
    fontSize: 13,
    color: colors.neutral[500],
  },
});
