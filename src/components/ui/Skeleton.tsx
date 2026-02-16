import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, borderRadius, spacing } from '@/constants/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function SkeletonBox({ width = '100%', height = 16, borderRadius: br = 8, style }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: br,
          backgroundColor: colors.neutral[200],
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** Skeleton for a card-like item (e.g. CheckinCard / RegisterCard) */
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <SkeletonBox width={44} height={44} borderRadius={14} />
        <View style={styles.cardText}>
          <SkeletonBox width="60%" height={14} />
          <SkeletonBox width="40%" height={12} style={{ marginTop: 6 }} />
        </View>
        <SkeletonBox width={50} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

/** Skeleton for stats row (3 boxes) */
export function SkeletonStats() {
  return (
    <View style={styles.statsRow}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.statBox}>
          <SkeletonBox width={48} height={28} borderRadius={6} />
          <SkeletonBox width={56} height={10} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  );
}

/** Skeleton for the Registros hub screen */
export function SkeletonRegistros() {
  return (
    <View style={styles.container}>
      {/* Title */}
      <SkeletonBox width="50%" height={24} style={{ marginBottom: 8 }} />
      <SkeletonBox width="70%" height={14} style={{ marginBottom: 16 }} />
      {/* Search bar */}
      <SkeletonBox height={44} borderRadius={borderRadius.md} style={{ marginBottom: 12 }} />
      {/* Segments */}
      <SkeletonBox height={40} borderRadius={borderRadius.lg} style={{ marginBottom: 16 }} />
      {/* Cards */}
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

/** Skeleton for the Tu/Profile screen */
export function SkeletonProfile() {
  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.profileCenter}>
        <SkeletonBox width={80} height={80} borderRadius={40} />
        <SkeletonBox width={120} height={20} style={{ marginTop: 12 }} />
        <SkeletonBox width={160} height={14} style={{ marginTop: 6 }} />
      </View>
      {/* Stats */}
      <SkeletonStats />
      {/* Nav items */}
      <View style={styles.navSkeleton}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i}>
            {i > 0 && <View style={styles.divider} />}
            <View style={styles.navRow}>
              <SkeletonBox width={34} height={34} borderRadius={10} />
              <View style={{ flex: 1 }}>
                <SkeletonBox width="60%" height={14} />
                <SkeletonBox width="40%" height={10} style={{ marginTop: 4 }} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Skeleton for the Home screen records section */
export function SkeletonHomeRecords() {
  return (
    <View>
      <SkeletonBox width="45%" height={18} style={{ marginBottom: 12 }} />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardText: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  profileCenter: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  navSkeleton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
  },
});

export { SkeletonBox };
