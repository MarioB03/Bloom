import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { DECORATIONS, DecorationType, DecorationConfig } from './gardenTypes';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';
import { strings } from '@/constants/strings';

interface DecorationPickerProps {
  streak: number;
  seedBalance: number;
  purchasedIds: string[];
  selectedType: DecorationType | null;
  onSelect: (type: DecorationType) => void;
  onPurchaseDecoration: (type: DecorationType, cost: number) => void;
  onClose: () => void;
}

export function DecorationPicker({
  streak,
  seedBalance,
  purchasedIds,
  selectedType,
  onSelect,
  onPurchaseDecoration,
  onClose,
}: DecorationPickerProps) {
  const handleSelect = (config: DecorationConfig) => {
    // Premium item (has cost)
    if (config.cost && config.cost > 0) {
      const owned = purchasedIds.includes(config.type);
      if (owned) {
        // Already purchased — just select it
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect(config.type);
        return;
      }
      // Not purchased — offer to buy
      if (seedBalance < config.cost) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(strings.shop.insufficientTitle, strings.shop.insufficientMessage);
        return;
      }
      Alert.alert(
        strings.shop.confirmTitle,
        `${config.emoji} ${config.label}\n${config.cost} ${strings.shop.seedUnit}`,
        [
          { text: strings.common.cancel, style: 'cancel' },
          {
            text: strings.shop.buyButton,
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onPurchaseDecoration(config.type, config.cost!);
            },
          },
        ]
      );
      return;
    }

    // Free item — streak-locked
    if (streak < config.unlockStreak) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(config.type);
  };

  return (
    <Animated.View entering={FadeInDown.duration(300)} exiting={FadeOutDown.duration(200)} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Decoraciones</Text>
        <View style={styles.headerRight}>
          <View style={styles.balancePill}>
            <Text style={styles.balanceText}>{seedBalance} {strings.shop.seedUnit}</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.hint}>Toca una decoración y luego toca una celda vacía del jardín</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {DECORATIONS.map((config) => {
          const isPremium = config.cost != null && config.cost > 0;
          const isOwned = isPremium && purchasedIds.includes(config.type);
          const streakLocked = !isPremium && streak < config.unlockStreak;
          const premiumLocked = isPremium && !isOwned && seedBalance < (config.cost ?? 0);
          const locked = streakLocked;
          const selected = selectedType === config.type;

          return (
            <TouchableOpacity
              key={config.type}
              style={[
                styles.item,
                selected && styles.itemSelected,
                locked && styles.itemLocked,
                isPremium && !isOwned && styles.itemPremium,
                isOwned && styles.itemOwned,
              ]}
              onPress={() => handleSelect(config)}
              disabled={streakLocked}
              activeOpacity={0.7}
            >
              <Text style={styles.itemEmoji}>
                {streakLocked ? '🔒' : config.emoji}
              </Text>
              <Text style={[styles.itemLabel, locked && styles.itemLabelLocked]}>
                {config.label}
              </Text>
              {streakLocked && (
                <Text style={styles.unlockText}>{config.unlockStreak}d</Text>
              )}
              {isPremium && !isOwned && (
                <Text style={[styles.costLabel, premiumLocked && styles.costLabelDisabled]}>
                  {config.cost}{strings.shop.seedUnit}
                </Text>
              )}
              {isOwned && (
                <Text style={styles.ownedLabel}>✓</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  balancePill: {
    backgroundColor: colors.accent[50],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  balanceText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.accent[500],
  },
  title: {
    ...typography.heading3,
    color: colors.neutral[700],
  },
  closeButton: {
    fontSize: 18,
    color: colors.neutral[500],
    padding: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.neutral[400],
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  item: {
    width: 72,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.neutral[50],
  },
  itemSelected: {
    borderColor: colors.accent[400],
    backgroundColor: colors.accent[50],
  },
  itemLocked: {
    opacity: 0.5,
  },
  itemPremium: {
    borderColor: colors.accent[200],
    backgroundColor: colors.accent[50],
  },
  itemOwned: {
    borderColor: colors.success,
    backgroundColor: 'rgba(107,139,106,0.06)',
  },
  itemEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  itemLabel: {
    ...typography.small,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  itemLabelLocked: {
    color: colors.neutral[400],
  },
  unlockText: {
    fontFamily: fonts.rounded,
    fontSize: 10,
    color: colors.accent[500],
    marginTop: 2,
  },
  costLabel: {
    fontFamily: fonts.rounded,
    fontSize: 10,
    color: colors.accent[500],
    marginTop: 2,
  },
  costLabelDisabled: {
    color: colors.neutral[400],
  },
  ownedLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: colors.success,
    marginTop: 2,
  },
});
