import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { EmotionalRegisterEntry } from '@/types/checkin';
import { emotionMap } from '@/constants/emotions';
import { formatTime } from '@/utils/date';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface EmotionalRegisterCardProps {
  register: EmotionalRegisterEntry;
  onPress: () => void;
}

export function EmotionalRegisterCard({ register, onPress }: EmotionalRegisterCardProps) {
  const emotion = register.emotion ? emotionMap[register.emotion] : null;
  const emotionLabel = emotion?.label || register.emotionCustom || '';
  const emotionEmoji = emotion?.emoji || '🔍';
  const emotionColor = emotion?.color || colors.primary[400];
  const time = register.createdAt?.toDate
    ? formatTime(register.createdAt.toDate())
    : '';
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.card, animatedStyle]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
    >
      <View style={[styles.accentBar, { backgroundColor: emotionColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.emotionRow}>
            <View style={[styles.emojiContainer, { backgroundColor: emotionColor + '12' }]}>
              <Text style={styles.emoji}>{emotionEmoji}</Text>
            </View>
            <View style={styles.emotionInfo}>
              <Text style={styles.emotionLabel}>{emotionLabel}</Text>
              <Text style={styles.intensity}>{register.intensity}/10</Text>
            </View>
          </View>
          {time ? (
            <View style={styles.timeBadge}>
              <Text style={styles.time}>{time}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>Observar y describir</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    ...shadows.sm,
    overflow: 'hidden',
  },
  accentBar: { width: 4 },
  content: { flex: 1, padding: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emotionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  emojiContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22 },
  emotionInfo: { flex: 1 },
  emotionLabel: { ...typography.bodyBold, color: colors.neutral[800] },
  intensity: { ...typography.caption, color: colors.neutral[400], marginTop: 1 },
  timeBadge: { backgroundColor: colors.neutral[100], paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  time: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.neutral[500] },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  typeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.primary[400],
  },
});
