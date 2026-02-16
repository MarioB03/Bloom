import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useSharing } from '@/contexts/SharingContext';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { EmotionPicker } from '@/components/checkin/EmotionPicker';
import { IntensitySlider } from '@/components/checkin/IntensitySlider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { createEmotionalRegister, getEmotionalRegisterById, updateEmotionalRegister } from '@/lib/firestore';
import { EmotionId } from '@/types/checkin';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

const s = strings.emotionalRegister;

export default function NuevoRegistroEmocionalScreen() {
  const { user } = useAuth();
  const { viewer } = useSharing();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditing = !!editId;

  const [emotion, setEmotion] = useState<EmotionId | null>(null);
  const [sharedVisible, setSharedVisible] = useState(false);
  const [emotionCustom, setEmotionCustom] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [vulnerability, setVulnerability] = useState('');
  const [trigger, setTrigger] = useState('');
  const [interpretations, setInterpretations] = useState('');
  const [internalSensations, setInternalSensations] = useState('');
  const [externalLanguage, setExternalLanguage] = useState('');
  const [impulses, setImpulses] = useState('');
  const [behavior, setBehavior] = useState('');
  const [consequences, setConsequences] = useState('');
  const [emotionFunction, setEmotionFunction] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEditing);

  useEffect(() => {
    if (!isEditing || !user) return;
    getEmotionalRegisterById(user.uid, editId)
      .then((entry) => {
        if (entry) {
          setEmotion(entry.emotion);
          setEmotionCustom(entry.emotionCustom || '');
          setIntensity(entry.intensity);
          setVulnerability(entry.vulnerability || '');
          setTrigger(entry.trigger || '');
          setInterpretations(entry.interpretations || '');
          setInternalSensations(entry.internalSensations || '');
          setExternalLanguage(entry.externalLanguage || '');
          setImpulses(entry.impulses || '');
          setBehavior(entry.behavior || '');
          setConsequences(entry.consequences || '');
          setEmotionFunction(entry.emotionFunction || '');
          setSharedVisible(entry.sharedVisible ?? false);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingEdit(false));
  }, [editId, user]);

  const handleEmotionSelect = (id: EmotionId) => {
    setEmotion(id);
    setEmotionCustom('');
  };

  const handleCustomChange = (text: string) => {
    setEmotionCustom(text);
    if (text.trim()) setEmotion(null);
  };

  const handleSave = async () => {
    if (!emotion && !emotionCustom.trim()) {
      Alert.alert('', 'Selecciona o escribe una emoción');
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const formData = {
        emotion,
        emotionCustom: emotionCustom.trim(),
        intensity,
        vulnerability: vulnerability.trim(),
        trigger: trigger.trim(),
        interpretations: interpretations.trim(),
        internalSensations: internalSensations.trim(),
        externalLanguage: externalLanguage.trim(),
        impulses: impulses.trim(),
        behavior: behavior.trim(),
        consequences: consequences.trim(),
        emotionFunction: emotionFunction.trim(),
        sharedVisible,
      };
      if (isEditing) {
        await updateEmotionalRegister(user.uid, editId, formData);
      } else {
        await createEmotionalRegister(user.uid, formData);
      }
      Alert.alert(s.saved, 'Tu registro ha sido guardado', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving register:', error);
      Alert.alert(strings.common.error, 'No se pudo guardar el registro');
    } finally {
      setSaving(false);
    }
  };

  const textFields = [
    { label: s.vulnerability, placeholder: s.vulnerabilityPlaceholder, value: vulnerability, onChange: setVulnerability },
    { label: s.trigger, placeholder: s.triggerPlaceholder, value: trigger, onChange: setTrigger },
    { label: s.interpretations, placeholder: s.interpretationsPlaceholder, value: interpretations, onChange: setInterpretations },
    { label: s.internalSensations, placeholder: s.internalSensationsPlaceholder, value: internalSensations, onChange: setInternalSensations },
    { label: s.externalLanguage, placeholder: s.externalLanguagePlaceholder, value: externalLanguage, onChange: setExternalLanguage },
    { label: s.impulses, placeholder: s.impulsesPlaceholder, value: impulses, onChange: setImpulses },
    { label: s.behavior, placeholder: s.behaviorPlaceholder, value: behavior, onChange: setBehavior },
    { label: s.consequences, placeholder: s.consequencesPlaceholder, value: consequences, onChange: setConsequences },
    { label: s.emotionFunction, placeholder: s.emotionFunctionPlaceholder, value: emotionFunction, onChange: setEmotionFunction },
  ];

  if (loadingEdit) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{isEditing ? strings.common.edit + ' registro' : s.title}</Text>
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
          <Text style={styles.title}>{s.subtitle}</Text>
          <Text style={styles.subtitle}>Observa lo que sientes sin juzgar</Text>
        </Animated.View>

        {/* Emotion Picker */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionTitle}>{s.emotion}</Text>
            <EmotionPicker selected={emotion} onSelect={handleEmotionSelect} />
            <Input
              placeholder={s.emotionCustomPlaceholder}
              value={emotionCustom}
              onChangeText={handleCustomChange}
              containerStyle={styles.customInput}
            />
          </Card>
        </Animated.View>

        {/* Intensity 1-10 */}
        <Animated.View entering={FadeInDown.delay(250).duration(500)}>
          <Card variant="outlined" style={styles.section}>
            <IntensitySlider
              label={s.intensity}
              value={intensity}
              onChange={setIntensity}
              min={1}
              max={10}
            />
          </Card>
        </Animated.View>

        {/* Sharing visibility toggle */}
        {viewer && (
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Card variant="outlined" style={styles.section}>
              <View style={styles.visibilityRow}>
                <View style={styles.visibilityLeft}>
                  <Ionicons
                    name={sharedVisible ? 'eye' : 'eye-off-outline'}
                    size={20}
                    color={sharedVisible ? colors.secondary[500] : colors.neutral[400]}
                  />
                  <View>
                    <Text style={styles.visibilityLabel}>Visible al compartir</Text>
                    <Text style={styles.visibilityHint}>
                      {viewer.viewerDisplayName} podrá ver este registro
                    </Text>
                  </View>
                </View>
                <Switch
                  value={sharedVisible}
                  onValueChange={(val) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSharedVisible(val);
                  }}
                  trackColor={{ false: colors.neutral[200], true: colors.secondary[200] }}
                  thumbColor={sharedVisible ? colors.secondary[400] : colors.neutral[300]}
                />
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Text fields */}
        {textFields.map((field, index) => (
          <Animated.View
            key={field.label}
            entering={FadeInDown.delay(350 + index * 80).duration(500)}
          >
            <Card variant="outlined" style={styles.section}>
              <Input
                label={field.label}
                placeholder={field.placeholder}
                value={field.value}
                onChangeText={field.onChange}
                multiline
                numberOfLines={3}
                style={styles.textInput}
              />
            </Card>
          </Animated.View>
        ))}

        {/* Save Button */}
        <Animated.View entering={FadeInUp.delay(350 + textFields.length * 80 + 100).duration(500)}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>
              {saving ? strings.common.loading : isEditing ? 'Guardar cambios' : s.save}
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
  customInput: {
    marginTop: spacing.md,
    marginBottom: 0,
  },
  textInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  visibilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visibilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  visibilityLabel: {
    ...typography.bodyBold,
    color: colors.neutral[700],
  },
  visibilityHint: {
    ...typography.small,
    color: colors.neutral[400],
    marginTop: 1,
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
