import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { PracticeHistoryCard } from '@/components/skills/PracticeHistoryCard';
import { getSkillPracticeHistory, getUniquePracticedSkillIds } from '@/lib/firestore';
import { SkillPractice } from '@/types/skill';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

export default function PracticeHistoryScreen() {
  const { user } = useAuth();
  const [practices, setPractices] = useState<SkillPractice[]>([]);
  const [uniqueCount, setUniqueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      Promise.all([
        getSkillPracticeHistory(user.uid),
        getUniquePracticedSkillIds(user.uid),
      ])
        .then(([history, unique]) => {
          setPractices(history);
          setUniqueCount(unique.length);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [user])
  );

  const totalTime = practices.reduce((sum, p) => sum + (p.durationSeconds || 0), 0);
  const totalMins = Math.floor(totalTime / 60);

  // Group by date
  const grouped: Record<string, SkillPractice[]> = {};
  practices.forEach((p) => {
    const date = p.completedAt?.toDate?.();
    const key = date
      ? date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Sin fecha';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  });

  return (
    <ScreenWrapper>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{strings.skills.practiceHistory}</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Summary cards */}
      <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{practices.length}</Text>
          <Text style={styles.summaryLabel}>{strings.skills.totalPractices}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{uniqueCount}</Text>
          <Text style={styles.summaryLabel}>{strings.skills.uniqueSkills}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalMins}</Text>
          <Text style={styles.summaryLabel}>{strings.skills.totalTime} ({strings.skills.minutes})</Text>
        </View>
      </Animated.View>

      {/* Practice list */}
      {practices.length === 0 && !loading ? (
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <EmptyState
            emoji="🧘"
            message={strings.skills.noPractices}
          />
        </Animated.View>
      ) : (
        Object.entries(grouped).map(([dateLabel, items], groupIndex) => (
          <Animated.View
            key={dateLabel}
            entering={FadeInDown.delay(200 + groupIndex * 80).duration(400)}
          >
            <Text style={styles.dateLabel}>{dateLabel}</Text>
            {items.map((practice) => (
              <PracticeHistoryCard key={practice.id} practice={practice} />
            ))}
          </Animated.View>
        ))
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    marginBottom: spacing.lg,
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
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  summaryNumber: {
    fontFamily: fonts.sansBold,
    fontSize: 24,
    color: colors.neutral[800],
  },
  summaryLabel: {
    ...typography.small,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: 4,
  },
  dateLabel: {
    ...typography.caption,
    color: colors.neutral[500],
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
});
