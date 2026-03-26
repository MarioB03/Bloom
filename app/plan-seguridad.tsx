import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { EditableList } from '@/components/safetyPlan/EditableList';
import { ContactList } from '@/components/safetyPlan/ContactList';
import { CrisisHotlineList } from '@/components/safetyPlan/CrisisHotlineList';
import { getSafetyPlan, saveSafetyPlan } from '@/lib/firestore';
import { SafetyPlan, TrustedContact } from '@/types/safetyPlan';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

const EMPTY_PLAN: SafetyPlan = {
  warningSigns: [],
  copingStrategies: [],
  trustedContacts: [],
  personalSteps: [],
};

interface Section {
  key: keyof typeof sectionConfig;
  icon: string;
  title: string;
  description: string;
}

const sectionConfig = {
  warningSigns: { icon: 'alert-circle-outline', title: strings.safetyPlan.warningSigns, description: strings.safetyPlan.warningSignsDesc },
  copingStrategies: { icon: 'bulb-outline', title: strings.safetyPlan.copingStrategies, description: strings.safetyPlan.copingStrategiesDesc },
  trustedContacts: { icon: 'people-outline', title: strings.safetyPlan.trustedContacts, description: strings.safetyPlan.trustedContactsDesc },
  personalSteps: { icon: 'list-outline', title: strings.safetyPlan.personalSteps, description: strings.safetyPlan.personalStepsDesc },
  crisisHotlines: { icon: 'call-outline', title: strings.safetyPlan.crisisHotlines, description: strings.safetyPlan.crisisHotlinesDesc },
};

export default function PlanSeguridadScreen() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<SafetyPlan>(EMPTY_PLAN);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['warningSigns']));
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      getSafetyPlan(user.uid)
        .then((data) => {
          if (data) setPlan(data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [user])
  );

  const debouncedSave = useCallback(
    (updated: SafetyPlan) => {
      if (!user) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveSafetyPlan(user.uid, updated).catch(() => {});
      }, 1500);
    },
    [user]
  );

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const updateField = <K extends keyof SafetyPlan>(key: K, value: SafetyPlan[K]) => {
    const updated = { ...plan, [key]: value };
    setPlan(updated);
    debouncedSave(updated);
  };

  const toggleSection = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const sections = Object.entries(sectionConfig) as [keyof typeof sectionConfig, typeof sectionConfig[keyof typeof sectionConfig]][];

  return (
    <ScreenWrapper>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{strings.safetyPlan.title}</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.heroSection}>
        <Text style={styles.heroEmoji}>🛡️</Text>
        <Text style={styles.heroSubtitle}>{strings.safetyPlan.subtitle}</Text>
      </Animated.View>

      {/* Sections */}
      {sections.map(([key, config], index) => (
        <Animated.View
          key={key}
          entering={FadeInDown.delay(200 + index * 80).duration(400)}
        >
          <Card variant="outlined" style={styles.sectionCard}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => toggleSection(key)}
              style={styles.sectionHeader}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.secondary[50] }]}>
                  <Ionicons name={config.icon as any} size={18} color={colors.secondary[500]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>{config.title}</Text>
                  <Text style={styles.sectionDesc}>{config.description}</Text>
                </View>
              </View>
              <Ionicons
                name={expandedSections.has(key) ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.neutral[400]}
              />
            </TouchableOpacity>

            {expandedSections.has(key) && (
              <View style={styles.sectionContent}>
                {key === 'warningSigns' && (
                  <EditableList
                    items={plan.warningSigns}
                    placeholder={strings.safetyPlan.warningSignPlaceholder}
                    onUpdate={(items) => updateField('warningSigns', items)}
                  />
                )}
                {key === 'copingStrategies' && (
                  <EditableList
                    items={plan.copingStrategies}
                    placeholder={strings.safetyPlan.copingStrategyPlaceholder}
                    onUpdate={(items) => updateField('copingStrategies', items)}
                  />
                )}
                {key === 'trustedContacts' && (
                  <ContactList
                    contacts={plan.trustedContacts}
                    onUpdate={(contacts) => updateField('trustedContacts', contacts)}
                  />
                )}
                {key === 'personalSteps' && (
                  <EditableList
                    items={plan.personalSteps}
                    placeholder={strings.safetyPlan.personalStepPlaceholder}
                    onUpdate={(items) => updateField('personalSteps', items)}
                  />
                )}
                {key === 'crisisHotlines' && (
                  <CrisisHotlineList />
                )}
              </View>
            )}
          </Card>
        </Animated.View>
      ))}

      {/* Disclaimer */}
      <Animated.View entering={FadeInDown.delay(600).duration(400)}>
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={16} color={colors.neutral[400]} />
          <Text style={styles.disclaimerText}>{strings.safetyPlan.disclaimer}</Text>
        </View>
      </Animated.View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: {
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
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  sectionCard: {
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.neutral[700],
  },
  sectionDesc: {
    ...typography.small,
    color: colors.neutral[400],
    marginTop: 1,
  },
  sectionContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },
  disclaimerText: {
    ...typography.small,
    color: colors.neutral[400],
    flex: 1,
    lineHeight: 18,
  },
});
