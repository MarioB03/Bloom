import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useSharing } from '@/contexts/SharingContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getEmotionalRegisterById, deleteEmotionalRegister, updateEmotionalRegister } from '@/lib/firestore';
import { EmotionalRegisterEntry } from '@/types/checkin';
import { emotionMap } from '@/constants/emotions';
import { strings } from '@/constants/strings';
import { formatDisplayDate, formatTime } from '@/utils/date';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

const s = strings.emotionalRegister;

interface DetailField {
  label: string;
  value: string;
}

export default function EmotionalRegisterDetailScreen() {
  const { id, owner } = useLocalSearchParams<{ id: string; owner?: string }>();
  const { user } = useAuth();
  const { viewer } = useSharing();
  const [register, setRegister] = useState<EmotionalRegisterEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharedVisible, setSharedVisible] = useState(false);

  const isSharedView = !!owner;
  const targetUserId = owner || user?.uid;

  useEffect(() => {
    if (!targetUserId || !id) return;
    getEmotionalRegisterById(targetUserId, id)
      .then((entry) => {
        setRegister(entry);
        if (entry) setSharedVisible(entry.sharedVisible ?? false);
      })
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
              await deleteEmotionalRegister(user.uid, id);
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
  if (!register) {
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

  const emotion = register.emotion ? emotionMap[register.emotion] : null;
  const emotionLabel = emotion?.label || register.emotionCustom || '';
  const emotionEmoji = emotion?.emoji || '🔍';
  const emotionColor = emotion?.color || colors.primary[400];
  const dateDisplay = register.createdAt?.toDate ? formatDisplayDate(register.createdAt.toDate()) : '';
  const timeDisplay = register.createdAt?.toDate ? formatTime(register.createdAt.toDate()) : '';

  const fields: DetailField[] = [
    { label: s.vulnerability, value: register.vulnerability },
    { label: s.trigger, value: register.trigger },
    { label: s.interpretations, value: register.interpretations },
    { label: s.internalSensations, value: register.internalSensations },
    { label: s.externalLanguage, value: register.externalLanguage },
    { label: s.impulses, value: register.impulses },
    { label: s.behavior, value: register.behavior },
    { label: s.consequences, value: register.consequences },
    { label: s.emotionFunction, value: register.emotionFunction },
  ].filter((f) => f.value);

  return (
    <ScreenWrapper>
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{s.detail}</Text>
        {isSharedView ? (
          <View style={{ width: 40 }} />
        ) : (
          <View style={styles.headerActions}>
            {viewer && (
              <TouchableOpacity
                onPress={async () => {
                  if (!user || !id) return;
                  const newVal = !sharedVisible;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSharedVisible(newVal);
                  try {
                    await updateEmotionalRegister(user.uid, id, { sharedVisible: newVal } as any);
                  } catch {
                    setSharedVisible(!newVal);
                  }
                }}
                style={[styles.editButton, sharedVisible && { backgroundColor: colors.secondary[50] }]}
              >
                <Ionicons
                  name={sharedVisible ? 'eye' : 'eye-off-outline'}
                  size={20}
                  color={sharedVisible ? colors.secondary[500] : colors.neutral[400]}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => router.push(`/registro-emocional/nuevo?editId=${id}`)} style={styles.editButton}>
              <Ionicons name="create-outline" size={20} color={colors.primary[400]} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* Hero Card */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <Card variant="elevated" style={styles.heroCard}>
          <View style={[styles.heroEmojiBg, { backgroundColor: emotionColor + '12' }]}>
            <Text style={styles.heroEmoji}>{emotionEmoji}</Text>
          </View>
          <Text style={[styles.heroLabel, { color: emotionColor }]}>{emotionLabel}</Text>
          <Text style={styles.heroIntensity}>
            {s.intensity}: {register.intensity}{s.intensityOf10}
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

      {/* Detail fields */}
      {fields.map((field, index) => (
        <Animated.View
          key={field.label}
          entering={FadeInDown.delay(350 + index * 100).duration(500)}
        >
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionTitle}>{field.label}</Text>
            <Text style={styles.fieldText}>{field.value}</Text>
          </Card>
        </Animated.View>
      ))}

      <Animated.View entering={FadeInUp.delay(350 + fields.length * 100 + 100).duration(400)}>
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
  sectionTitle: { ...typography.bodyBold, color: colors.neutral[700], marginBottom: spacing.sm },
  fieldText: { ...typography.body, color: colors.neutral[600], lineHeight: 24, backgroundColor: colors.neutral[50], padding: spacing.md, borderRadius: borderRadius.md },
  notFoundContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  notFoundEmoji: { fontSize: 48 },
  notFound: { ...typography.body, color: colors.neutral[500], textAlign: 'center' },
  backBtn: { marginTop: spacing.sm, marginBottom: spacing.lg },
});
