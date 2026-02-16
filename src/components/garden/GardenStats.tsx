import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { EmotionId } from '@/types/checkin';
import { emotionMap } from '@/constants/emotions';
import { plantMorphology, getEmotionColor } from '@/constants/garden';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

interface GardenStatsProps {
  plantedEmotions: EmotionId[];
  wateredCount?: number;
  totalPlants?: number;
}

export function GardenStats({ plantedEmotions, wateredCount = 0, totalPlants = 0 }: GardenStatsProps) {
  if (plantedEmotions.length === 0) return null;

  // Find most frequent emotion
  const counts: Partial<Record<EmotionId, number>> = {};
  for (const e of plantedEmotions) {
    counts[e] = (counts[e] || 0) + 1;
  }
  const topEmotion = Object.entries(counts).sort(
    (a, b) => (b[1] as number) - (a[1] as number)
  )[0][0] as EmotionId;

  const topEmotionConfig = emotionMap[topEmotion];
  const topPlantName = plantMorphology[topEmotion].name;

  // Garden vitality
  const vitality = totalPlants > 0 ? Math.round((wateredCount / totalPlants) * 100) : 0;
  const vitalityColor = vitality >= 80 ? colors.secondary[500] : vitality >= 40 ? colors.accent[400] : colors.neutral[400];
  const vitalityLabel =
    vitality === 100 ? '¡Plena forma!' :
    vitality >= 80 ? 'Muy sano' :
    vitality >= 40 ? 'Necesita agua' :
    totalPlants > 0 ? 'Sediento' : '';

  return (
    <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{plantedEmotions.length}</Text>
          <Text style={styles.statLabel}>{strings.garden.flowersPlanted}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <View style={styles.topEmotionRow}>
            <View style={[styles.topEmotionDot, { backgroundColor: getEmotionColor(topEmotion) }]} />
            <Text style={styles.topEmotionEmoji}>{topEmotionConfig.emoji}</Text>
          </View>
          <Text style={styles.statLabel}>{topPlantName}</Text>
        </View>
        {totalPlants > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: vitalityColor }]}>{vitality}%</Text>
              <Text style={styles.statLabel}>{vitalityLabel}</Text>
            </View>
          </>
        )}
      </View>
      {/* Vitality bar */}
      {totalPlants > 0 && (
        <View style={styles.vitalityBar}>
          <View style={[styles.vitalityFill, { width: `${vitality}%`, backgroundColor: vitalityColor }]} />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.sansBold,
    fontSize: 20,
    lineHeight: 28,
    color: colors.neutral[700],
  },
  statLabel: {
    ...typography.caption,
    color: colors.neutral[500],
    marginTop: 2,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: colors.neutral[200],
  },
  topEmotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topEmotionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  topEmotionEmoji: {
    fontSize: 18,
  },
  vitalityBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[200],
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  vitalityFill: {
    height: 4,
    borderRadius: 2,
  },
});
