import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { EmotionPicker } from '@/components/checkin/EmotionPicker';
import { IntensitySlider } from '@/components/checkin/IntensitySlider';
import { CycleTracker } from '@/components/checkin/CycleTracker';
import { EventInput } from '@/components/checkin/EventInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { createCheckin, getCheckinById, updateCheckin } from '@/lib/firestore';
import {
  EmotionId,
  IntensityLevel,
  SleepQuality,
  HungerLevel,
  CyclePhase,
  ImportantEvent,
} from '@/types/checkin';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

export default function NuevoCheckinScreen() {
  const { user } = useAuth();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditing = !!editId;

  const [emotion, setEmotion] = useState<EmotionId | null>(null);
  const [emotionIntensity, setEmotionIntensity] = useState<IntensityLevel>(3);
  const [sleepQuality, setSleepQuality] = useState<SleepQuality>(3);
  const [hungerLevel, setHungerLevel] = useState<HungerLevel>(3);
  const [cyclePhase, setCyclePhase] = useState<CyclePhase | null>(null);
  const [events, setEvents] = useState<ImportantEvent[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEditing);

  useEffect(() => {
    if (!isEditing || !user) return;
    getCheckinById(user.uid, editId)
      .then((entry) => {
        if (entry) {
          setEmotion(entry.emotion);
          setEmotionIntensity(entry.emotionIntensity);
          setSleepQuality(entry.sleepQuality);
          setHungerLevel(entry.hungerLevel);
          setCyclePhase(entry.cyclePhase);
          setEvents(entry.events || []);
          setNotes(entry.notes || '');
        }
      })
      .catch(console.error)
      .finally(() => setLoadingEdit(false));
  }, [editId, user]);

  const handleSave = async () => {
    if (!emotion) {
      Alert.alert('', 'Selecciona una emocion');
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const formData = {
        emotion,
        emotionIntensity,
        sleepQuality,
        hungerLevel,
        cyclePhase,
        events: events.filter((e) => e.title.trim()),
        notes: notes.trim(),
      };
      if (isEditing) {
        await updateCheckin(user.uid, editId, formData);
      } else {
        await createCheckin(user.uid, formData);
      }
      Alert.alert(strings.checkin.saved, 'Tu registro ha sido guardado', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving checkin:', error);
      Alert.alert(strings.common.error, 'No se pudo guardar el registro');
    } finally {
      setSaving(false);
    }
  };

  if (loadingEdit) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{isEditing ? strings.common.edit + ' registro' : strings.checkin.newCheckin}</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={22} color={colors.primary[400]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title Section */}
        <Animated.View entering={FadeInDown.delay(50).duration(500)} style={styles.titleSection}>
          <Text style={styles.title}>Como te sientes?</Text>
          <Text style={styles.subtitle}>Un momento para ti</Text>
        </Animated.View>

        {/* Emotion Section */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionEmoji}>{'  '}</Text>
              {strings.checkin.emotion}
            </Text>
            <EmotionPicker selected={emotion} onSelect={setEmotion} />
          </Card>
        </Animated.View>

        {/* Intensity */}
        <Animated.View entering={FadeInDown.delay(250).duration(500)}>
          <Card variant="outlined" style={styles.section}>
            <IntensitySlider
              label={'  ' + strings.checkin.intensity}
              value={emotionIntensity}
              onChange={(v) => setEmotionIntensity(v as IntensityLevel)}
              labels={strings.intensity}
            />
          </Card>
        </Animated.View>

        {/* Physical State */}
        <Animated.View entering={FadeInDown.delay(350).duration(500)}>
          <Card variant="outlined" style={styles.section}>
            <IntensitySlider
              label={'  ' + strings.checkin.sleep}
              value={sleepQuality}
              onChange={(v) => setSleepQuality(v as SleepQuality)}
              labels={strings.sleep}
            />
            <View style={styles.divider} />
            <IntensitySlider
              label={'  ' + strings.checkin.hunger}
              value={hungerLevel}
              onChange={(v) => setHungerLevel(v as HungerLevel)}
              labels={strings.hunger}
            />
          </Card>
        </Animated.View>

        {/* Cycle */}
        <Animated.View entering={FadeInDown.delay(450).duration(500)}>
          <Card variant="outlined" style={styles.section}>
            <CycleTracker value={cyclePhase} onChange={setCyclePhase} />
          </Card>
        </Animated.View>

        {/* Events */}
        <Animated.View entering={FadeInDown.delay(550).duration(500)}>
          <Card variant="outlined" style={styles.section}>
            <EventInput events={events} onChange={setEvents} />
          </Card>
        </Animated.View>

        {/* Notes */}
        <Animated.View entering={FadeInDown.delay(650).duration(500)}>
          <Card variant="outlined" style={styles.section}>
            <Input
              label={'  ' + strings.checkin.notes}
              placeholder={strings.checkin.notesPlaceholder}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              style={styles.notesInput}
            />
          </Card>
        </Animated.View>

        {/* Save Button */}
        <Animated.View entering={FadeInUp.delay(750).duration(500)}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>
              {saving ? strings.common.loading : isEditing ? 'Guardar cambios' : strings.checkin.save}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.heading3,
    color: colors.neutral[700],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
  },
  titleSection: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  title: {
    ...typography.displaySmall,
    color: colors.neutral[800],
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral[500],
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.neutral[700],
    marginBottom: spacing.md,
  },
  sectionEmoji: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: spacing.md,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.primary[400],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.warm,
  },
  saveButtonDisabled: {
    backgroundColor: colors.primary[200],
  },
  saveButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.surface,
  },
});
