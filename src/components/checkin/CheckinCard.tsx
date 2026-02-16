import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { CheckinEntry } from '@/types/checkin';
import { emotionMap } from '@/constants/emotions';
import { Badge } from '@/components/ui/Badge';
import { strings } from '@/constants/strings';
import { formatTime } from '@/utils/date';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CheckinCardProps {
  checkin: CheckinEntry;
  onPress: () => void;
}

export function CheckinCard({ checkin, onPress }: CheckinCardProps) {
  const emotion = emotionMap[checkin.emotion];
  const time = checkin.createdAt?.toDate
    ? formatTime(checkin.createdAt.toDate())
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
      <View
        style={[
          styles.accentBar,
          { backgroundColor: emotion?.color || colors.neutral[300] },
        ]}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.emotionRow}>
            <View
              style={[
                styles.emojiContainer,
                { backgroundColor: (emotion?.color || colors.neutral[300]) + '12' },
              ]}
            >
              <Text style={styles.emoji}>{emotion?.emoji}</Text>
            </View>
            <View style={styles.emotionInfo}>
              <Text style={styles.emotionLabel}>{emotion?.label}</Text>
              <Text style={styles.intensity}>
                {strings.intensity[checkin.emotionIntensity as keyof typeof strings.intensity]}
              </Text>
            </View>
          </View>
          {time ? (
            <View style={styles.timeBadge}>
              <Text style={styles.time}>{time}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.badges}>
          <Badge
            label={`😴 ${strings.sleep[checkin.sleepQuality as keyof typeof strings.sleep]}`}
            color={colors.info}
          />
          <Badge
            label={`🍽️ ${strings.hunger[checkin.hungerLevel as keyof typeof strings.hunger]}`}
            color={colors.accent[500]}
          />
          {checkin.cyclePhase && checkin.cyclePhase !== 'no_aplica' && (
            <Badge
              label={strings.cycle[checkin.cyclePhase]}
              color={colors.primary[300]}
            />
          )}
        </View>

        {(checkin.events.length > 0 || checkin.notes) && (
          <View style={styles.footer}>
            {checkin.events.length > 0 && (
              <Text style={styles.eventsText}>
                📌 {checkin.events.length} evento{checkin.events.length > 1 ? 's' : ''}
              </Text>
            )}
            {checkin.notes ? (
              <Text style={styles.notes} numberOfLines={2}>
                {checkin.notes}
              </Text>
            ) : null}
          </View>
        )}
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
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs },
  footer: { paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.neutral[100], marginTop: spacing.xs },
  eventsText: { ...typography.caption, color: colors.neutral[500], marginBottom: spacing.xs },
  notes: { ...typography.caption, color: colors.neutral[500], fontStyle: 'italic', lineHeight: 18 },
});
