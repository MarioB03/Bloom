import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useGender } from '@/contexts/GenderContext';
import { createGratitude, getGratitudeByDate, updateGratitude } from '@/lib/firestore';
import { checkAndUnlockAchievements } from '@/lib/achievements';
import { formatDate, formatDisplayDate } from '@/utils/date';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

export default function NuevaGratitudScreen() {
  const { user } = useAuth();
  const { g } = useGender();
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  const [items, setItems] = useState(['', '', '']);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingId, setExistingId] = useState<string | null>(null);

  const today = formatDate(new Date());
  const targetDate = dateParam || today;
  const isReadOnly = targetDate !== today;

  useEffect(() => {
    if (!user) return;
    getGratitudeByDate(user.uid, targetDate)
      .then((entry) => {
        if (entry) {
          setExistingId(entry.id);
          const loaded = [...entry.items];
          while (loaded.length < 3) loaded.push('');
          setItems(loaded);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, targetDate]);

  const updateItem = (index: number, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSave = async () => {
    const filledItems = items.filter((i) => i.trim());
    if (filledItems.length === 0) {
      Alert.alert('', g({ f: 'Escribe al menos una cosa por la que estés agradecida', m: 'Escribe al menos una cosa por la que estés agradecido', n: 'Escribe al menos una cosa por la que estés agradecido/a' }));
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      if (existingId) {
        await updateGratitude(user.uid, existingId, { items: filledItems });
      } else {
        await createGratitude(user.uid, { items: filledItems });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Fire-and-forget achievement check
      checkAndUnlockAchievements(user.uid).catch(() => {});
      Alert.alert(strings.gratitude.saved, '', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving gratitude:', error);
      Alert.alert(strings.common.error, 'No se pudo guardar la gratitud');
    } finally {
      setSaving(false);
    }
  };

  const isEditing = !!existingId;
  const placeholders = [
    g(strings.gratitude.placeholder1),
    g(strings.gratitude.placeholder2),
    g(strings.gratitude.placeholder3),
  ];

  const displayDate = isReadOnly
    ? formatDisplayDate(new Date(targetDate + 'T12:00:00'))
    : null;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{strings.common.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isReadOnly ? strings.gratitude.sectionTitle : isEditing ? strings.gratitude.edit : strings.gratitude.title}
          </Text>
          {displayDate && (
            <Text style={styles.headerDate}>{displayDate}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={22} color={colors.accent[500]} />
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
          <Text style={styles.emoji}>🙏</Text>
          <Text style={styles.title}>{strings.gratitude.subtitle}</Text>
          {!isReadOnly && (
            <Text style={styles.subtitle}>{g({ f: 'Escribe tres cosas por las que te sientas agradecida hoy', m: 'Escribe tres cosas por las que te sientas agradecido hoy', n: 'Escribe tres cosas por las que sientas gratitud hoy' })}</Text>
          )}
        </Animated.View>

        {/* Gratitude items */}
        {items.filter((item) => isReadOnly ? item.trim() : true).map((item, index) => (
          <Animated.View
            key={index}
            entering={FadeInDown.delay(150 + index * 100).duration(500)}
          >
            <View style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemNumber}>
                  <Text style={styles.itemNumberText}>{index + 1}</Text>
                </View>
              </View>
              {isReadOnly ? (
                <Text style={styles.itemText}>{item}</Text>
              ) : (
                <TextInput
                  style={styles.itemInput}
                  placeholder={placeholders[index]}
                  placeholderTextColor={colors.neutral[400]}
                  value={item}
                  onChangeText={(v) => updateItem(index, v)}
                  multiline
                  textAlignVertical="top"
                />
              )}
            </View>
          </Animated.View>
        ))}

        {/* Save Button — only in edit mode */}
        {!isReadOnly && (
          <Animated.View entering={FadeInUp.delay(550).duration(500)}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>
                {saving ? strings.common.loading : isEditing ? 'Guardar cambios' : strings.gratitude.save}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.neutral[400],
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
  headerDate: {
    ...typography.small,
    color: colors.neutral[400],
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent[50],
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
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 42,
    marginBottom: spacing.sm,
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
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemNumberText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.accent[500],
  },
  itemInput: {
    ...typography.body,
    color: colors.neutral[700],
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 70,
  },
  itemText: {
    ...typography.body,
    color: colors.neutral[700],
    lineHeight: 22,
  },
  saveButton: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.accent[400],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.warm,
    shadowColor: colors.accent[400],
  },
  saveButtonDisabled: {
    backgroundColor: colors.accent[200],
  },
  saveButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.surface,
  },
});
