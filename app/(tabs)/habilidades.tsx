import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { CategoryCard } from '@/components/skills/CategoryCard';
import { SkillCard } from '@/components/skills/SkillCard';
import { SKILL_CATEGORIES, getSkillsByCategory, getSkillsByEmotion } from '@/constants/skills';
import { emotions } from '@/constants/emotions';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius } from '@/constants/theme';
import { EmotionId } from '@/types/checkin';

export default function HabilidadesScreen() {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionId | null>(null);

  const filteredSkills = selectedEmotion ? getSkillsByEmotion(selectedEmotion) : null;

  return (
    <ScreenWrapper>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
        <View>
          <Text style={styles.title}>{strings.skills.title}</Text>
          <Text style={styles.subtitle}>{strings.skills.subtitle}</Text>
        </View>
      </Animated.View>

      {/* Emotion filter chips */}
      <Animated.View entering={FadeInDown.delay(150).duration(400)}>
        <Text style={styles.sectionTitle}>{strings.skills.filterByEmotion}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {emotions.map((emo) => {
            const isSelected = selectedEmotion === emo.id;
            return (
              <TouchableOpacity
                key={emo.id}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedEmotion(isSelected ? null : emo.id);
                }}
                style={[styles.chip, isSelected && { backgroundColor: emo.color + '20', borderColor: emo.color }]}
              >
                <Text style={styles.chipEmoji}>{emo.emoji}</Text>
                <Text style={[styles.chipLabel, isSelected && { color: emo.color }]}>{emo.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Filtered skills by emotion OR categories */}
      {selectedEmotion && filteredSkills ? (
        <Animated.View entering={FadeInDown.duration(300)}>
          <Text style={styles.sectionTitle}>
            {strings.skills.suggestedForYou}
          </Text>
          {filteredSkills.map((skill, index) => (
            <Animated.View key={skill.id} entering={FadeInDown.delay(index * 80).duration(400)}>
              <SkillCard
                skill={skill}
                onPress={() => router.push(`/habilidad/${skill.id}`)}
              />
            </Animated.View>
          ))}
        </Animated.View>
      ) : (
        <>
          {SKILL_CATEGORIES.map((cat, index) => (
            <Animated.View key={cat.id} entering={FadeInDown.delay(200 + index * 80).duration(400)}>
              <CategoryCard
                category={cat}
                skillCount={getSkillsByCategory(cat.id).length}
                onPress={() => router.push(`/habilidades/categoria/${cat.id}` as any)}
              />
            </Animated.View>
          ))}
        </>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.displaySmall,
    color: colors.neutral[800],
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral[500],
    marginTop: 4,
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  chipRow: {
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.surface,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    fontFamily: fonts.rounded,
    fontSize: 12,
    color: colors.neutral[600],
  },
});
