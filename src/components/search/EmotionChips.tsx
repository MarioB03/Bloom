import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { emotions } from '@/constants/emotions';
import { EmotionId } from '@/types/checkin';
import { colors, fonts, spacing, borderRadius } from '@/constants/theme';

interface EmotionChipsProps {
  selectedEmotions: EmotionId[];
  onToggle: (id: EmotionId) => void;
}

export function EmotionChips({ selectedEmotions, onToggle }: EmotionChipsProps) {
  const handlePress = (id: EmotionId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(id);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {emotions.map((emotion) => {
        const selected = selectedEmotions.includes(emotion.id);
        return (
          <TouchableOpacity
            key={emotion.id}
            style={[
              styles.chip,
              selected
                ? { backgroundColor: emotion.color + '20', borderColor: emotion.color }
                : styles.chipInactive,
            ]}
            onPress={() => handlePress(emotion.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipEmoji}>{emotion.emoji}</Text>
            <Text
              style={[
                styles.chipLabel,
                selected ? { color: emotion.color } : styles.chipLabelInactive,
              ]}
            >
              {emotion.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    gap: 4,
  },
  chipInactive: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[200],
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
  chipLabelInactive: {
    color: colors.neutral[500],
  },
});
