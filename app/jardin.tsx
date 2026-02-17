import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { makeImageFromView } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/contexts/PremiumContext';
import { GardenCanvas } from '@/components/garden/GardenCanvas';
import { GardenStats } from '@/components/garden/GardenStats';
import { DecorationPicker } from '@/components/garden/DecorationPicker';
import { PlantInfoModal } from '@/components/garden/PlantInfoModal';
import { AchievementToast } from '@/components/garden/AchievementToast';
import { GardenShop } from '@/components/garden/GardenShop';
import { StreakCelebration } from '@/components/garden/StreakCelebration';
import { useGardenState } from '@/components/garden/gardenState';
import { DecorationType, InteractionMode, PetType, getActiveGridSize, getGardenLevel, getNextGardenLevel } from '@/components/garden/gardenTypes';
import { inBounds } from '@/components/garden/gardenUtils';
import {
  checkAchievements,
  getUnlockedAchievements,
  unlockAchievement,
  getAchievementById,
  type Achievement,
} from '@/components/garden/gardenAchievements';
import { getCurrentSeason, getSeasonEmoji, getSeasonLabel } from '@/components/garden/gardenSeasons';
import {
  getSeedBalance,
  addSeeds,
  getPurchasedItems,
  purchaseItem,
  awardDailyCheckin,
  getCelebratedMilestones,
  markMilestoneCelebrated,
  EARNING_RATES,
  STREAK_BONUS_THRESHOLDS,
  type SeedBalance,
} from '@/components/garden/gardenEconomy';
import { getCheckinsByDateRange } from '@/lib/firestore';
import { calculateStreak, getStreakEmoji, getStreakMessage } from '@/utils/streak';
import { formatDate } from '@/utils/date';
import { EmotionId } from '@/types/checkin';
import { syncWidgetData } from '@/lib/widget-sync';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

const MODE_ICONS: Record<InteractionMode, string> = {
  view: 'eye-outline',
  move: 'move-outline',
  decorate: 'color-palette-outline',
  water: 'water-outline',
};

const MODE_LABELS: Record<InteractionMode, string> = {
  view: strings.garden.modeView,
  move: strings.garden.modeMove,
  decorate: strings.garden.modeDecorate,
  water: strings.garden.modeWater,
};

const MODE_HINTS: Record<InteractionMode, string> = {
  view: 'Toca una planta para ver su info',
  move: 'Mantén pulsada una planta para moverla',
  decorate: 'Elige decoración y toca una celda. Toca una decoración existente para quitarla.',
  water: 'Toca una planta para regarla y acelerar su crecimiento',
};

// ── Seed toast component ──
function SeedToast({ amount, onDone }: { amount: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)} style={seedToastStyles.container}>
      <Text style={seedToastStyles.text}>+{amount} {strings.shop.seedUnit}</Text>
    </Animated.View>
  );
}

const seedToastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 90,
    alignSelf: 'center',
    backgroundColor: colors.accent[400],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    ...shadows.md,
  },
  text: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.surface,
  },
});

// ── Pet IDs that correspond to shop pet items ──
const PET_SHOP_IDS: Record<string, PetType> = {
  bunny: 'bunny',
  bird: 'bird',
  golden_butterfly: 'golden_butterfly',
  hedgehog: 'hedgehog',
};

export default function JardinScreen() {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [allEmotions, setAllEmotions] = useState<EmotionId[]>([]);
  const [selectedDecoType, setSelectedDecoType] = useState<DecorationType | null>(null);
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);
  const achievementQueue = useRef<Achievement[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  // ── Seed economy state ──
  const [seedBalance, setSeedBalance] = useState(0);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [shopVisible, setShopVisible] = useState(false);
  const [seedToast, setSeedToast] = useState<number | null>(null);
  const [activePets, setActivePets] = useState<PetType[]>([]);
  const [celebration, setCelebration] = useState<{ milestone: number; seeds: number } | null>(null);
  const gardenViewRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const wateredThisSessionRef = useRef(new Set<string>());
  const allWateredBonusGivenRef = useRef(false);

  const garden = useGardenState();
  const season = getCurrentSeason();

  // ── Load purchased pets from purchasedIds ──
  const refreshActivePets = useCallback((ids: string[]) => {
    const pets: PetType[] = [];
    for (const [shopId, petType] of Object.entries(PET_SHOP_IDS)) {
      if (ids.includes(shopId)) pets.push(petType);
    }
    setActivePets(pets);
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const today = new Date();
      const rangeStart = new Date(today.getTime() - 36 * 86400000);
      const checkins = await getCheckinsByDateRange(
        user.uid,
        formatDate(rangeStart),
        formatDate(today)
      );

      const dates = checkins.map((c) => c.date);
      const currentStreak = calculateStreak(dates);
      setStreak(currentStreak);

      garden.refreshFromCheckins(checkins, currentStreak);
      setAllEmotions(checkins.map((c) => c.emotion));

      // Load economy data
      const [bal, purchased] = await Promise.all([
        getSeedBalance(),
        getPurchasedItems(),
      ]);
      setSeedBalance(bal.total);
      setPurchasedIds(purchased);
      refreshActivePets(purchased);

      // Award daily check-in reward
      if (currentStreak > 0) {
        const reward = await awardDailyCheckin(currentStreak);
        if (reward) {
          setSeedBalance((prev) => prev + reward.seeds);
          setSeedToast(reward.seeds);
        }
      }

      // Sync widget data (best-effort)
      syncWidgetData({
        streak: currentStreak,
        streakEmoji: getStreakEmoji(currentStreak),
        streakMessage: getStreakMessage(currentStreak),
        gardenLevel: getGardenLevel(currentStreak).level,
        gardenName: getGardenLevel(currentStreak).name,
        seedBalance: bal.total,
        totalPlants: garden.layout.plants.length,
        lastCheckinDate: checkins[0]?.date || '',
        updatedAt: '',
      }).catch(() => {});

      // Check for uncelebrated milestone
      const CELEBRATION_MILESTONES = [3, 7, 14, 21, 30];
      const celebrated = await getCelebratedMilestones();
      for (const ms of CELEBRATION_MILESTONES) {
        if (currentStreak >= ms && !celebrated.includes(ms)) {
          const bonus = STREAK_BONUS_THRESHOLDS.find((t) => t.streak === ms);
          setCelebration({ milestone: ms, seeds: bonus?.seeds ?? 0 });
          break; // show one at a time
        }
      }
    } catch (error) {
      console.error('Error loading garden data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      getUnlockedAchievements().then(setUnlockedIds);
      // Reset session refs
      wateredThisSessionRef.current = new Set();
      allWateredBonusGivenRef.current = false;
    }, [loadData])
  );

  // ── Achievement checking ──
  const showNextToast = useCallback(() => {
    if (achievementQueue.current.length > 0) {
      setAchievementToast(achievementQueue.current.shift()!);
    }
  }, []);

  // Check achievements whenever garden state changes
  useEffect(() => {
    if (loading || streak === 0) return;
    const newIds = checkAchievements(
      garden.layout.plants,
      garden.layout.decorations,
      streak,
      unlockedIds
    );
    if (newIds.length === 0) return;

    // Unlock and queue toasts
    (async () => {
      for (const id of newIds) {
        const wasNew = await unlockAchievement(id);
        if (wasNew) {
          const achievement = getAchievementById(id);
          if (achievement) achievementQueue.current.push(achievement);
          // Award seeds for achievement
          const bal = await addSeeds(EARNING_RATES.achievementUnlocked);
          setSeedBalance(bal.total);
          setSeedToast(EARNING_RATES.achievementUnlocked);
        }
      }
      setUnlockedIds((prev) => [...prev, ...newIds]);
      if (!achievementToast && achievementQueue.current.length > 0) {
        showNextToast();
      }
    })();
  }, [garden.layout.plants, garden.layout.decorations, streak, loading]);

  // ── Grid & level info ──
  const activeSize = getActiveGridSize(streak);
  const gardenLevel = getGardenLevel(streak);
  const nextLevel = getNextGardenLevel(streak);

  // ── Seed earning: water plant ──
  const handleWaterSeeds = useCallback(async (gx: number, gy: number) => {
    const key = `${gx},${gy}`;
    if (wateredThisSessionRef.current.has(key)) return;
    wateredThisSessionRef.current.add(key);

    // +1 seed per plant watered
    const bal = await addSeeds(EARNING_RATES.waterPlant);
    setSeedBalance(bal.total);
    setSeedToast(EARNING_RATES.waterPlant);

    // Check if ALL plants are now watered → bonus
    const allWatered = garden.layout.plants.every(
      (p) => p.wateredToday || (p.gx === gx && p.gy === gy)
    );
    if (allWatered && !allWateredBonusGivenRef.current && garden.layout.plants.length > 1) {
      allWateredBonusGivenRef.current = true;
      const bonusBal = await addSeeds(EARNING_RATES.waterAllBonus);
      setSeedBalance(bonusBal.total);
      setTimeout(() => setSeedToast(EARNING_RATES.waterAllBonus), 800);
    }
  }, [garden.layout.plants]);

  // ── Interaction handlers ──

  const handleTapCell = useCallback(
    (gx: number, gy: number) => {
      if (!inBounds(gx, gy, activeSize)) return;

      if (garden.mode === 'view') {
        const plant = garden.layout.plants.find((p) => p.gx === gx && p.gy === gy);
        if (plant) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          garden.selectPlant(plant);
        }
        return;
      }

      if (garden.mode === 'water') {
        const plant = garden.layout.plants.find((p) => p.gx === gx && p.gy === gy);
        if (plant && !plant.wateredToday) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          garden.waterPlant(gx, gy);
          handleWaterSeeds(gx, gy);
        }
        return;
      }

      if (garden.mode === 'decorate') {
        // Tap existing decoration → remove it
        const existingDec = garden.layout.decorations.find((d) => d.gx === gx && d.gy === gy);
        if (existingDec) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          garden.removeDecoration(gx, gy);
          return;
        }

        // Tap empty cell with selected type → place
        if (selectedDecoType) {
          const hasPlant = garden.layout.plants.some((p) => p.gx === gx && p.gy === gy);
          if (!hasPlant) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            garden.addDecoration(gx, gy, selectedDecoType);
          }
        }
        return;
      }
    },
    [garden, selectedDecoType, activeSize, handleWaterSeeds]
  );

  const handleLongPressCell = useCallback(
    (gx: number, gy: number) => {
      if (!inBounds(gx, gy, activeSize)) return;

      // Long press on decoration → confirm remove
      const dec = garden.layout.decorations.find((d) => d.gx === gx && d.gy === gy);
      if (dec) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Alert.alert(
          'Quitar decoración',
          '¿Quieres quitar esta decoración?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Quitar', style: 'destructive', onPress: () => garden.removeDecoration(gx, gy) },
          ]
        );
      }
    },
    [garden, activeSize]
  );

  const handleNewCheckin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/checkin/nuevo');
  };

  // ── Shop handlers ──
  const handleShopPurchase = useCallback((itemId: string, newBalance: SeedBalance) => {
    setSeedBalance(newBalance.total);
    setPurchasedIds((prev) => {
      const updated = [...prev, itemId];
      refreshActivePets(updated);
      return updated;
    });
  }, [refreshActivePets]);

  const handlePurchaseDecoration = useCallback(async (type: DecorationType, cost: number) => {
    const result = await purchaseItem(type);
    if (result.success) {
      setSeedBalance(result.balance.total);
      setPurchasedIds((prev) => [...prev, type]);
      setSelectedDecoType(type);
    }
  }, []);

  const handleShareGarden = useCallback(async () => {
    if (!gardenViewRef.current || isSharing) return;
    setIsSharing(true);
    try {
      const image = await makeImageFromView(gardenViewRef);
      if (!image) throw new Error('capture failed');
      const bytes = image.encodeToBytes();
      const base64 = btoa(String.fromCharCode(...bytes));
      const filePath = `${FileSystem.cacheDirectory}bloom-garden-${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(filePath, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'image/png',
          dialogTitle: strings.garden.shareTitle,
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert(strings.garden.shareError);
    } finally {
      setIsSharing(false);
    }
  }, [isSharing]);

  const streakEmoji = getStreakEmoji(streak);
  const streakMessage = getStreakMessage(streak);

  // Count watered today
  const wateredCount = garden.layout.plants.filter((p) => p.wateredToday).length;
  const totalPlants = garden.layout.plants.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.screen}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={24} color={colors.neutral[600]} />
          </TouchableOpacity>
          <Text style={styles.title}>{strings.garden.title}</Text>
          <View style={styles.headerActions}>
            {/* Seed balance */}
            <View style={styles.seedBadge}>
              <Text style={styles.seedText}>{seedBalance} {strings.shop.seedUnit}</Text>
            </View>
            {/* Share button */}
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleShareGarden();
              }}
              hitSlop={8}
              disabled={isSharing}
            >
              <Ionicons name="share-outline" size={20} color={isSharing ? colors.neutral[300] : colors.accent[500]} />
            </TouchableOpacity>
            {/* Shop button */}
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShopVisible(true);
              }}
              hitSlop={8}
            >
              <Ionicons name="storefront-outline" size={20} color={colors.accent[500]} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Streak info */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.streakRow}>
          <Text style={styles.streakNumber}>{streak}</Text>
          <View style={styles.streakInfo}>
            <Text style={styles.streakLabel}>
              {streakEmoji} {streak > 0 ? `día${streak > 1 ? 's' : ''} de racha` : 'Sin racha'}
            </Text>
            <Text style={styles.streakSub}>{streakMessage}</Text>
          </View>
          {/* Garden level badge */}
          <View style={styles.terrainBadge}>
            <Text style={styles.terrainLevel}>Nv.{gardenLevel.level}</Text>
            <Text style={styles.terrainText}>{gardenLevel.name}</Text>
            {nextLevel && (
              <Text style={styles.terrainNext}>{activeSize}×{activeSize} → {nextLevel.minStreak}d</Text>
            )}
            {!nextLevel && (
              <Text style={styles.terrainNext}>{activeSize}×{activeSize} MAX</Text>
            )}
            <Text style={styles.terrainSeason}>{getSeasonEmoji(season)} {getSeasonLabel(season)}</Text>
          </View>
        </Animated.View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[400]} />
          </View>
        ) : streak === 0 ? (
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTitle}>{strings.garden.emptyTitle}</Text>
              <Text style={styles.emptyMessage}>{strings.garden.emptyMessage}</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleNewCheckin}>
                <Text style={styles.emptyButtonText}>{strings.garden.emptyButton}</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.surface} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
          <>
            {/* Mode toolbar */}
            <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.toolbar}>
              {(['view', 'water', 'decorate'] as InteractionMode[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.toolButton, garden.mode === m && styles.toolButtonActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    garden.setMode(m);
                    if (m !== 'decorate') setSelectedDecoType(null);
                  }}
                >
                  <Ionicons
                    name={MODE_ICONS[m] as any}
                    size={18}
                    color={garden.mode === m ? colors.surface : colors.neutral[500]}
                  />
                  <Text style={[styles.toolLabel, garden.mode === m && styles.toolLabelActive]}>
                    {MODE_LABELS[m]}
                  </Text>
                  {/* Water count badge */}
                  {m === 'water' && totalPlants > 0 && (
                    <View style={styles.waterBadge}>
                      <Text style={styles.waterBadgeText}>{wateredCount}/{totalPlants}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </Animated.View>

            {/* Mode hint */}
            <Animated.View entering={FadeInDown.delay(280).duration(300)}>
              <Text style={styles.modeHint}>{MODE_HINTS[garden.mode]}</Text>
            </Animated.View>

            {/* Garden Canvas */}
            <Animated.View entering={FadeInDown.delay(350).duration(600)} style={{ flex: 1 }}>
              <View ref={gardenViewRef} collapsable={false} style={styles.canvasContainer}>
                <GardenCanvas
                  plants={garden.layout.plants}
                  decorations={garden.layout.decorations}
                  streak={streak}
                  mode={garden.mode}
                  waterEffects={garden.waterEffects}
                  activePets={activePets}
                  onTapCell={handleTapCell}
                  onLongPressCell={handleLongPressCell}
                />
              </View>
            </Animated.View>

            {/* Stats */}
            <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.statsWrap}>
              <GardenStats plantedEmotions={allEmotions} wateredCount={wateredCount} totalPlants={totalPlants} />
            </Animated.View>
          </>
        )}

        {/* Decoration picker */}
        {garden.mode === 'decorate' && (
          <View style={styles.pickerWrap}>
            <DecorationPicker
              streak={streak}
              seedBalance={seedBalance}
              purchasedIds={purchasedIds}
              selectedType={selectedDecoType}
              onSelect={setSelectedDecoType}
              onPurchaseDecoration={handlePurchaseDecoration}
              onClose={() => {
                garden.setMode('view');
                setSelectedDecoType(null);
              }}
            />
          </View>
        )}

        {/* Plant info modal */}
        {garden.selectedPlant && (
          <PlantInfoModal
            plant={garden.selectedPlant}
            onClose={() => garden.selectPlant(null)}
            onWater={() => {
              const p = garden.selectedPlant!;
              garden.waterPlant(p.gx, p.gy);
              handleWaterSeeds(p.gx, p.gy);
              garden.selectPlant(null);
            }}
          />
        )}

        {/* Achievement toast */}
        {achievementToast && (
          <AchievementToast
            achievement={achievementToast}
            onDismiss={() => {
              setAchievementToast(null);
              // Show next queued achievement after a brief pause
              setTimeout(showNextToast, 300);
            }}
          />
        )}

        {/* Seed toast */}
        {seedToast !== null && (
          <SeedToast amount={seedToast} onDone={() => setSeedToast(null)} />
        )}

        {/* Streak celebration overlay */}
        {celebration && (
          <StreakCelebration
            milestone={celebration.milestone}
            seedsEarned={celebration.seeds}
            onDismiss={async () => {
              await markMilestoneCelebrated(celebration.milestone);
              setCelebration(null);
            }}
          />
        )}

        {/* Shop modal */}
        {shopVisible && (
          <GardenShop
            visible={shopVisible}
            balance={seedBalance}
            isPremium={isPremium}
            onClose={() => setShopVisible(false)}
            onPurchase={handleShopPurchase}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.displaySmall,
    color: colors.neutral[800],
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  seedBadge: {
    backgroundColor: colors.accent[50],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  seedText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: colors.accent[500],
  },
  shopButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Streak
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  streakNumber: {
    fontFamily: fonts.serif,
    fontSize: 40,
    lineHeight: 48,
    color: colors.accent[400],
  },
  streakInfo: {
    flex: 1,
  },
  streakLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.neutral[700],
  },
  streakSub: {
    ...typography.caption,
    color: colors.neutral[500],
    marginTop: 1,
  },
  terrainBadge: {
    backgroundColor: colors.secondary[100],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 64,
  },
  terrainLevel: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.secondary[500],
  },
  terrainText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.secondary[600],
    marginTop: 1,
  },
  terrainNext: {
    fontFamily: fonts.sans,
    fontSize: 9,
    color: colors.secondary[400],
    marginTop: 1,
  },
  terrainSeason: {
    fontFamily: fonts.sans,
    fontSize: 9,
    color: colors.secondary[500],
    marginTop: 2,
  },
  // Toolbar
  toolbar: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: 4,
  },
  toolButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[100],
  },
  toolButtonActive: {
    backgroundColor: colors.secondary[400],
  },
  toolLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.neutral[500],
  },
  toolLabelActive: {
    color: colors.surface,
  },
  waterBadge: {
    backgroundColor: 'rgba(126,180,220,0.2)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 2,
  },
  waterBadgeText: {
    fontFamily: fonts.rounded,
    fontSize: 9,
    color: colors.info,
  },
  // Mode hint
  modeHint: {
    ...typography.small,
    color: colors.neutral[400],
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  // Canvas
  canvasContainer: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#B8D8A0',
    ...shadows.md,
  },
  // Stats
  statsWrap: {
    paddingBottom: spacing.md,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.sm,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.heading2,
    color: colors.neutral[700],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    ...typography.body,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary[400],
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  emptyButtonText: {
    ...typography.bodyBold,
    color: colors.surface,
  },
  // Picker
  pickerWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
