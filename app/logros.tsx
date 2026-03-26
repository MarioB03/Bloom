import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { useGender } from '@/contexts/GenderContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  APP_ACHIEVEMENTS,
  AppAchievement,
  AchievementData,
  getUnlockedAppAchievements,
  getAchievementTimestamps,
  buildAchievementData,
  getAchievementProgress,
} from '@/lib/achievements';
import {
  ACHIEVEMENTS as GARDEN_ACHIEVEMENTS,
  Achievement as GardenAchievement,
  getUnlockedAchievements as getUnlockedGardenAchievements,
} from '@/components/garden/gardenAchievements';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

export default function LogrosScreen() {
  const { user } = useAuth();
  const { g } = useGender();
  const [loading, setLoading] = useState(true);
  const [appUnlocked, setAppUnlocked] = useState<string[]>([]);
  const [gardenUnlocked, setGardenUnlocked] = useState<string[]>([]);
  const [timestamps, setTimestamps] = useState<Record<string, string>>({});
  const [achievementData, setAchievementData] = useState<AchievementData | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      Promise.all([
        getUnlockedAppAchievements(),
        getUnlockedGardenAchievements(),
        getAchievementTimestamps(),
        buildAchievementData(user.uid),
      ])
        .then(([appU, gardenU, ts, data]) => {
          setAppUnlocked(appU);
          setGardenUnlocked(gardenU);
          setTimestamps(ts);
          setAchievementData(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [user])
  );

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  if (loading) return <LoadingSpinner />;

  const totalUnlocked = appUnlocked.length + gardenUnlocked.length;
  const totalAchievements = APP_ACHIEVEMENTS.length + GARDEN_ACHIEVEMENTS.length;

  return (
    <ScreenWrapper>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{strings.achievements.title}</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Summary */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryEmoji}>🏆</Text>
          <View>
            <Text style={styles.summaryCount}>{totalUnlocked} / {totalAchievements}</Text>
            <Text style={styles.summaryLabel}>{strings.achievements.subtitle}</Text>
          </View>
        </View>
      </Animated.View>

      {/* App Achievements Section */}
      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <Text style={styles.sectionTitle}>{strings.achievements.sectionApp}</Text>
        <View style={styles.grid}>
          {APP_ACHIEVEMENTS.map((achievement, index) => {
            const isUnlocked = appUnlocked.includes(achievement.id);
            const progress = achievementData
              ? getAchievementProgress(achievement, achievementData)
              : 0;
            const resolvedTitle = typeof achievement.title === 'string' ? achievement.title : g(achievement.title);
            return (
              <Animated.View
                key={achievement.id}
                entering={FadeInDown.delay(350 + index * 40).duration(400)}
                style={styles.gridItem}
              >
                <View style={[styles.achievementCard, isUnlocked && styles.achievementCardUnlocked]}>
                  <Text style={styles.achievementEmoji}>
                    {isUnlocked ? achievement.emoji : '🔒'}
                  </Text>
                  <Text style={[styles.achievementTitle, !isUnlocked && styles.achievementTitleLocked]}>
                    {resolvedTitle}
                  </Text>
                  {isUnlocked && timestamps[achievement.id] ? (
                    <Text style={styles.achievementDate}>
                      {formatTimestamp(timestamps[achievement.id])}
                    </Text>
                  ) : achievement.threshold ? (
                    <Text style={styles.achievementProgress}>
                      {progress}/{achievement.threshold}
                    </Text>
                  ) : null}
                </View>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>

      {/* Garden Achievements Section */}
      <Animated.View entering={FadeInDown.delay(600).duration(500)}>
        <Text style={styles.sectionTitle}>{strings.achievements.sectionGarden}</Text>
        <View style={styles.grid}>
          {GARDEN_ACHIEVEMENTS.map((achievement, index) => {
            const isUnlocked = gardenUnlocked.includes(achievement.id);
            return (
              <Animated.View
                key={achievement.id}
                entering={FadeInDown.delay(650 + index * 40).duration(400)}
                style={styles.gridItem}
              >
                <View style={[styles.achievementCard, isUnlocked && styles.achievementCardUnlocked]}>
                  <Text style={styles.achievementEmoji}>
                    {isUnlocked ? achievement.emoji : '🔒'}
                  </Text>
                  <Text style={[styles.achievementTitle, !isUnlocked && styles.achievementTitleLocked]}>
                    {achievement.title}
                  </Text>
                  <Text style={styles.achievementDesc} numberOfLines={2}>
                    {achievement.description}
                  </Text>
                </View>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>
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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.accent[50],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent[100],
  },
  summaryEmoji: {
    fontSize: 36,
  },
  summaryCount: {
    fontFamily: fonts.sansBold,
    fontSize: 22,
    color: colors.neutral[800],
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.neutral[500],
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.neutral[700],
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  gridItem: {
    width: '48%',
  },
  achievementCard: {
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  achievementCardUnlocked: {
    backgroundColor: colors.accent[50],
    borderWidth: 1,
    borderColor: colors.accent[200],
  },
  achievementEmoji: {
    fontSize: 28,
  },
  achievementTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  achievementTitleLocked: {
    color: colors.neutral[400],
  },
  achievementDate: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.accent[500],
  },
  achievementProgress: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.neutral[400],
  },
  achievementDesc: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 15,
  },
});
