import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PlantPlacement } from './gardenTypes';
import { emotionMap } from '@/constants/emotions';
import { plantMorphology, getEmotionColor } from '@/constants/garden';
import { formatDisplayDate } from '@/utils/date';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';
import { strings } from '@/constants/strings';

interface PlantInfoModalProps {
  plant: PlantPlacement;
  onClose: () => void;
  onWater: () => void;
}

const growthLabels = [
  'Semilla',
  'Brote',
  'Creciendo',
  'Floreciendo',
  'Casi lista',
  'Flor completa',
];

export function PlantInfoModal({ plant, onClose, onWater }: PlantInfoModalProps) {
  const emotionConfig = emotionMap[plant.emotion];
  const morph = plantMorphology[plant.emotion];
  const emotionColor = getEmotionColor(plant.emotion);
  const dateDisplay = formatDisplayDate(new Date(plant.date + 'T12:00:00'));

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View entering={FadeIn.delay(100).duration(200)} style={styles.modal}>
        {/* Color bar */}
        <View style={[styles.colorBar, { backgroundColor: emotionColor }]} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.emoji}>{emotionConfig.emoji}</Text>
              <View>
                <Text style={styles.plantName}>{morph.name}</Text>
                <Text style={styles.emotionLabel}>{emotionConfig.label}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.neutral[400]} />
            </TouchableOpacity>
          </View>

          {/* Info rows */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>{dateDisplay}</Text>
              <Text style={styles.infoLabel}>Plantada</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>
                {strings.intensity[plant.intensity as keyof typeof strings.intensity]}
              </Text>
              <Text style={styles.infoLabel}>Intensidad</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>
                {growthLabels[plant.growthStage] || 'Semilla'}
              </Text>
              <Text style={styles.infoLabel}>Crecimiento</Text>
            </View>
          </View>

          {/* Growth progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {
                width: `${(plant.growthStage / 5) * 100}%`,
                backgroundColor: emotionColor,
              }]} />
            </View>
          </View>

          {/* Water button */}
          {!plant.wateredToday && plant.growthStage < 5 && (
            <TouchableOpacity style={styles.waterButton} onPress={onWater} activeOpacity={0.8}>
              <Text style={styles.waterEmoji}>💧</Text>
              <View>
                <Text style={styles.waterText}>Regar planta</Text>
                <Text style={styles.waterHint}>+1 nivel de crecimiento</Text>
              </View>
            </TouchableOpacity>
          )}
          {!plant.wateredToday && plant.growthStage >= 5 && (
            <TouchableOpacity style={styles.waterButton} onPress={onWater} activeOpacity={0.8}>
              <Text style={styles.waterEmoji}>💧</Text>
              <Text style={styles.waterText}>Regar planta</Text>
            </TouchableOpacity>
          )}
          {plant.wateredToday && (
            <View style={styles.wateredBadge}>
              <Text style={styles.wateredText}>✓ Regada hoy</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  colorBar: {
    height: 4,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  emoji: {
    fontSize: 36,
  },
  plantName: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.neutral[700],
  },
  emotionLabel: {
    ...typography.caption,
    color: colors.neutral[500],
    marginTop: 1,
  },
  // Info grid
  infoGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  infoLabel: {
    ...typography.small,
    color: colors.neutral[400],
    marginTop: 2,
  },
  infoDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.neutral[200],
  },
  // Progress
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neutral[200],
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  // Water
  waterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.info,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
  },
  waterEmoji: {
    fontSize: 18,
  },
  waterText: {
    ...typography.bodyBold,
    color: colors.surface,
  },
  waterHint: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  wateredBadge: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  wateredText: {
    ...typography.caption,
    color: colors.secondary[500],
  },
});
