import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getCheckinById, deleteCheckin } from '@/lib/firestore';
import { CheckinEntry } from '@/types/checkin';
import { emotionMap } from '@/constants/emotions';
import { strings } from '@/constants/strings';
import { formatDisplayDate, formatTime } from '@/utils/date';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

export default function CheckinDetailScreen() {
  const { id, owner } = useLocalSearchParams<{ id: string; owner?: string }>();
  const { user } = useAuth();
  const [checkin, setCheckin] = useState<CheckinEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const isSharedView = !!owner;
  const targetUserId = owner || user?.uid;

  useEffect(() => {
    if (!targetUserId || !id) return;
    getCheckinById(targetUserId, id)
      .then(setCheckin)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [targetUserId, id]);

  const handleDelete = () => {
    Alert.alert(
      'Eliminar registro',
      '¿Estás segura de que quieres eliminar este registro?',
      [
        { text: strings.common.cancel, style: 'cancel' },
        {
          text: strings.common.delete,
          style: 'destructive',
          onPress: async () => {
            if (!user || !id) return;
            try {
              await deleteCheckin(user.uid, id);
              router.back();
            } catch {
              Alert.alert(strings.common.error);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingSpinner />;
  if (!checkin) {
    return (
      <ScreenWrapper>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundEmoji}>🔍</Text>
          <Text style={styles.notFound}>Registro no encontrado</Text>
          <Button title={strings.common.back} onPress={() => router.back()} variant="outline" />
        </View>
      </ScreenWrapper>
    );
  }

  const emotion = emotionMap[checkin.emotion];
  const dateDisplay = checkin.createdAt?.toDate ? formatDisplayDate(checkin.createdAt.toDate()) : '';
  const timeDisplay = checkin.createdAt?.toDate ? formatTime(checkin.createdAt.toDate()) : '';

  return (
    <ScreenWrapper>
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle</Text>
        {isSharedView ? (
          <View style={{ width: 40 }} />
        ) : (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push(`/checkin/nuevo?editId=${id}`)} style={styles.editButton}>
              <Ionicons name="create-outline" size={20} color={colors.primary[400]} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <Card variant="elevated" style={styles.heroCard}>
          <View style={[styles.heroEmojiBg, { backgroundColor: (emotion?.color || colors.neutral[300]) + '12' }]}>
            <Text style={styles.heroEmoji}>{emotion?.emoji}</Text>
          </View>
          <Text style={[styles.heroLabel, { color: emotion?.color || colors.neutral[700] }]}>{emotion?.label}</Text>
          <Text style={styles.heroIntensity}>
            {strings.checkin.intensity}: {strings.intensity[checkin.emotionIntensity as keyof typeof strings.intensity]}
          </Text>
          <View style={styles.dateRow}>
            <View style={styles.dateBadge}>
              <Ionicons name="calendar-outline" size={14} color={colors.neutral[400]} />
              <Text style={styles.dateText}>{dateDisplay}</Text>
            </View>
            {timeDisplay ? (
              <View style={styles.dateBadge}>
                <Ionicons name="time-outline" size={14} color={colors.neutral[400]} />
                <Text style={styles.dateText}>{timeDisplay}</Text>
              </View>
            ) : null}
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(350).duration(500)}>
        <Card variant="outlined" style={styles.section}>
          <Text style={styles.sectionTitle}>🏃 Estado físico</Text>
          <View style={styles.stateRow}>
            <View style={styles.stateItem}>
              <Text style={styles.stateEmoji}>😴</Text>
              <Text style={styles.stateLabel}>{strings.checkin.sleep}</Text>
              <Badge label={strings.sleep[checkin.sleepQuality as keyof typeof strings.sleep]} color={colors.info} />
            </View>
            <View style={styles.stateDivider} />
            <View style={styles.stateItem}>
              <Text style={styles.stateEmoji}>🍽️</Text>
              <Text style={styles.stateLabel}>{strings.checkin.hunger}</Text>
              <Badge label={strings.hunger[checkin.hungerLevel as keyof typeof strings.hunger]} color={colors.accent[500]} />
            </View>
            {checkin.cyclePhase && checkin.cyclePhase !== 'no_aplica' && (
              <>
                <View style={styles.stateDivider} />
                <View style={styles.stateItem}>
                  <Text style={styles.stateEmoji}>🌙</Text>
                  <Text style={styles.stateLabel}>{strings.checkin.cycle}</Text>
                  <Badge label={strings.cycle[checkin.cyclePhase]} color={colors.primary[300]} />
                </View>
              </>
            )}
          </View>
        </Card>
      </Animated.View>

      {checkin.events.length > 0 && (
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionTitle}>📌 {strings.checkin.events}</Text>
            {checkin.events.map((event, i) => (
              <View key={i} style={[styles.eventItem, i < checkin.events.length - 1 && styles.eventBorder]}>
                <View style={styles.eventDot} />
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {event.description ? <Text style={styles.eventDesc}>{event.description}</Text> : null}
                </View>
              </View>
            ))}
          </Card>
        </Animated.View>
      )}

      {checkin.notes ? (
        <Animated.View entering={FadeInDown.delay(650).duration(500)}>
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionTitle}>✏️ {strings.checkin.notes}</Text>
            <Text style={styles.notesText}>{checkin.notes}</Text>
          </Card>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInUp.delay(800).duration(400)}>
        <Button title="← Volver" onPress={() => router.back()} variant="ghost" style={styles.backBtn} />
      </Animated.View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.sm, marginBottom: spacing.md },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.heading3, color: colors.neutral[700] },
  headerActions: { flexDirection: 'row', gap: spacing.xs },
  editButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  deleteButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  heroCard: { alignItems: 'center', paddingVertical: spacing.xl, marginBottom: spacing.md },
  heroEmojiBg: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  heroEmoji: { fontSize: 42 },
  heroLabel: { ...typography.displaySmall, marginBottom: spacing.xs },
  heroIntensity: { ...typography.body, color: colors.neutral[500], marginBottom: spacing.md },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.neutral[100], paddingHorizontal: spacing.sm + 2, paddingVertical: 4, borderRadius: borderRadius.full },
  dateText: { ...typography.caption, color: colors.neutral[500], textTransform: 'capitalize' },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.bodyBold, color: colors.neutral[700], marginBottom: spacing.md },
  stateRow: { flexDirection: 'row', alignItems: 'center' },
  stateItem: { flex: 1, alignItems: 'center', gap: spacing.xs },
  stateEmoji: { fontSize: 24 },
  stateLabel: { ...typography.caption, color: colors.neutral[400] },
  stateDivider: { width: 1, height: 50, backgroundColor: colors.neutral[200] },
  eventItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm },
  eventBorder: { borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
  eventDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary[400], marginTop: 6 },
  eventContent: { flex: 1 },
  eventTitle: { ...typography.bodyBold, color: colors.neutral[700] },
  eventDesc: { ...typography.body, color: colors.neutral[500], marginTop: spacing.xs, lineHeight: 22 },
  notesText: { ...typography.body, color: colors.neutral[600], lineHeight: 24, backgroundColor: colors.neutral[50], padding: spacing.md, borderRadius: borderRadius.md },
  notFoundContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  notFoundEmoji: { fontSize: 48 },
  notFound: { ...typography.body, color: colors.neutral[500], textAlign: 'center' },
  backBtn: { marginTop: spacing.sm, marginBottom: spacing.lg },
});
