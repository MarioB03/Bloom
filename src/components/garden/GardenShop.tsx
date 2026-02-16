import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import Animated, { FadeIn, FadeOut, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import {
  getSeedBalance,
  getPurchasedItems,
  purchaseItem,
  getShopItemsByCategory,
  type SeedBalance,
  type ShopCategory,
  type ShopItem,
} from './gardenEconomy';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';
import { strings } from '@/constants/strings';

const TABS: { key: ShopCategory; label: string; emoji: string }[] = [
  { key: 'decorations', label: strings.shop.tabDecorations, emoji: '🌸' },
  { key: 'pets', label: strings.shop.tabPets, emoji: '🐾' },
  { key: 'cosmetics', label: strings.shop.tabCosmetics, emoji: '🎨' },
  { key: 'terrain', label: strings.shop.tabTerrain, emoji: '🗺️' },
];

interface GardenShopProps {
  visible: boolean;
  balance: number;
  isPremium?: boolean;
  onClose: () => void;
  onPurchase: (itemId: string, newBalance: SeedBalance) => void;
}

export function GardenShop({ visible, balance, isPremium = false, onClose, onPurchase }: GardenShopProps) {
  const [activeTab, setActiveTab] = useState<ShopCategory>('decorations');
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      getPurchasedItems().then(setPurchasedIds);
    }
  }, [visible]);

  const items = getShopItemsByCategory(activeTab);

  const handleBuy = useCallback(
    (item: ShopItem) => {
      if (purchasedIds.includes(item.id)) return;
      if (!isPremium) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Premium', 'La tienda del jardín es una función Premium. Ve a tu perfil y canjea un código de regalo para desbloquearla.');
        return;
      }
      if (balance < item.cost) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(strings.shop.insufficientTitle, strings.shop.insufficientMessage);
        return;
      }

      Alert.alert(
        strings.shop.confirmTitle,
        `${item.emoji} ${item.name}\n${item.cost} ${strings.shop.seedUnit}\n\n${item.description}`,
        [
          { text: strings.common.cancel, style: 'cancel' },
          {
            text: strings.shop.buyButton,
            onPress: async () => {
              const result = await purchaseItem(item.id);
              if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setPurchasedIds((prev) => [...prev, item.id]);
                onPurchase(item.id, result.balance);
              }
            },
          },
        ]
      );
    },
    [balance, purchasedIds, onPurchase, isPremium]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
        <Animated.View entering={FadeInDown.duration(300)} style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>{strings.shop.title}</Text>
              <View style={styles.balanceBadge}>
                <Text style={styles.balanceText}>{balance} {strings.shop.seedUnit}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close-circle" size={28} color={colors.neutral[400]} />
            </TouchableOpacity>
          </View>

          {!isPremium && (
            <View style={styles.premiumBanner}>
              <Text style={styles.premiumBannerText}>✨ Necesitas Premium para comprar</Text>
            </View>
          )}

          {/* Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab.key);
                }}
              >
                <Text style={styles.tabEmoji}>{tab.emoji}</Text>
                <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Item grid */}
          <ScrollView style={styles.itemList} showsVerticalScrollIndicator={false} contentContainerStyle={styles.itemGrid}>
            {items.map((item) => {
              const owned = purchasedIds.includes(item.id);
              const canAfford = balance >= item.cost;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card, owned && styles.cardOwned]}
                  onPress={() => handleBuy(item)}
                  disabled={owned}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cardEmoji}>{item.emoji}</Text>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  {owned ? (
                    <View style={styles.ownedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    </View>
                  ) : (
                    <View style={[styles.costBadge, !canAfford && styles.costBadgeDisabled]}>
                      <Text style={[styles.costText, !canAfford && styles.costTextDisabled]}>
                        {item.cost} {strings.shop.seedUnit}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl + 20,
    height: '70%',
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.heading3,
    color: colors.neutral[700],
  },
  balanceBadge: {
    backgroundColor: colors.accent[50],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  balanceText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: colors.accent[500],
  },
  // Tabs
  tabBar: {
    marginBottom: spacing.sm,
    maxHeight: 44,
  },
  tabBarContent: {
    gap: spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[100],
  },
  tabActive: {
    backgroundColor: colors.accent[400],
  },
  tabEmoji: {
    fontSize: 14,
  },
  tabLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.neutral[500],
  },
  tabLabelActive: {
    color: colors.surface,
  },
  // Items
  itemList: {
    flex: 1,
  },
  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  card: {
    width: '30%',
    minWidth: 90,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardOwned: {
    borderColor: colors.success,
    backgroundColor: 'rgba(107,139,106,0.06)',
  },
  cardEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  cardName: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: 4,
  },
  costBadge: {
    backgroundColor: colors.accent[50],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
  },
  costBadgeDisabled: {
    backgroundColor: colors.neutral[100],
  },
  costText: {
    fontFamily: fonts.rounded,
    fontSize: 11,
    color: colors.accent[500],
  },
  costTextDisabled: {
    color: colors.neutral[400],
  },
  ownedBadge: {
    paddingVertical: 2,
  },
  premiumBanner: {
    backgroundColor: colors.accent[50],
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent[100],
  },
  premiumBannerText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.accent[500],
    textAlign: 'center',
  },
});
