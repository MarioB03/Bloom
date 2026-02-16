import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CheckinCard } from '@/components/checkin/CheckinCard';
import { EmotionalRegisterCard } from '@/components/checkin/EmotionalRegisterCard';
import { getCheckinsByDate, getEmotionalRegistersByDate } from '@/lib/firestore';
import { CheckinEntry, EmotionalRegisterEntry } from '@/types/checkin';
import { formatDate, formatDisplayDate } from '@/utils/date';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius } from '@/constants/theme';

type DayRecord =
  | { type: 'checkin'; data: CheckinEntry }
  | { type: 'register'; data: EmotionalRegisterEntry };

export default function DayDetailScreen() {
  const { fecha, owner } = useLocalSearchParams<{ fecha: string; owner?: string }>();
  const { user } = useAuth();
  const [records, setRecords] = useState<DayRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const isSharedView = !!owner;
  const targetUserId = owner || user?.uid;

  useEffect(() => {
    if (!targetUserId || !fecha) return;
    Promise.all([
      getCheckinsByDate(targetUserId, fecha),
      getEmotionalRegistersByDate(targetUserId, fecha, isSharedView ? { sharedOnly: true } : undefined),
    ])
      .then(([checkins, registers]) => {
        const mixed: DayRecord[] = [
          ...checkins.map((c) => ({ type: 'checkin' as const, data: c })),
          ...registers.map((r) => ({ type: 'register' as const, data: r })),
        ];
        mixed.sort((a, b) => b.data.createdAt.seconds - a.data.createdAt.seconds);
        setRecords(mixed);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [targetUserId, fecha]);

  const dateDisplay = fecha ? formatDisplayDate(new Date(fecha + 'T12:00:00')) : '';

  if (loading) return <LoadingSpinner />;

  return (
    <ScreenWrapper scroll={false}>
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del día</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <View style={styles.dateBanner}>
          <Text style={styles.dateBannerEmoji}>📅</Text>
          <View>
            <Text style={styles.dateBannerText}>{dateDisplay}</Text>
            <Text style={styles.dateBannerCount}>
              {records.length} registro{records.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </Animated.View>

      {records.length === 0 ? (
        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.emptyContainer}>
          <EmptyState emoji="🌤️" message={'Tu jardín está esperando\n¡Añade tu primer registro del día!'} />
        </Animated.View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.data.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(300 + index * 80).duration(400)}>
              {item.type === 'checkin' ? (
                <CheckinCard
                  checkin={item.data}
                  onPress={() => router.push(
                    isSharedView ? `/checkin/${item.data.id}?owner=${owner}` : `/checkin/${item.data.id}`
                  )}
                />
              ) : (
                <EmotionalRegisterCard
                  register={item.data}
                  onPress={() => router.push(
                    isSharedView ? `/registro-emocional/${item.data.id}?owner=${owner}` : `/registro-emocional/${item.data.id}`
                  )}
                />
              )}
            </Animated.View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {!isSharedView && fecha === formatDate(new Date()) && (
        <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.footer}>
          <Button title={'🌿 ' + strings.calendar.addRecord} onPress={() => router.push('/checkin/nuevo')} size="lg" />
        </Animated.View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.heading3, color: colors.neutral[700] },
  dateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.secondary[50],
    borderWidth: 1,
    borderColor: colors.secondary[100],
  },
  dateBannerEmoji: { fontSize: 32 },
  dateBannerText: { fontFamily: fonts.sansSemiBold, fontSize: 17, color: colors.secondary[600], textTransform: 'capitalize' },
  dateBannerCount: { ...typography.caption, color: colors.secondary[400], marginTop: 2 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  list: { paddingHorizontal: spacing.md, paddingBottom: 100 },
  footer: { padding: spacing.md, paddingBottom: spacing.lg },
});
