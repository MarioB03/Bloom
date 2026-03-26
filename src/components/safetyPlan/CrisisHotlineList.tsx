import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CRISIS_HOTLINES } from '@/constants/crisisHotlines';
import { CrisisHotline } from '@/types/safetyPlan';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius } from '@/constants/theme';

export function CrisisHotlineList() {
  // Group by country
  const grouped = CRISIS_HOTLINES.reduce<Record<string, CrisisHotline[]>>((acc, h) => {
    if (!acc[h.country]) acc[h.country] = [];
    acc[h.country].push(h);
    return acc;
  }, {});

  const handleCall = (hotline: CrisisHotline) => {
    Alert.alert(
      strings.safetyPlan.callConfirmTitle,
      strings.safetyPlan.callHotlineMessage.replace('{name}', hotline.name),
      [
        { text: strings.common.cancel, style: 'cancel' },
        {
          text: strings.safetyPlan.call,
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Linking.openURL(`tel:${hotline.phone}`);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {Object.entries(grouped).map(([country, hotlines]) => (
        <View key={country} style={styles.countryGroup}>
          <Text style={styles.countryLabel}>
            {hotlines[0].emoji} {country}
          </Text>
          {hotlines.map((hotline, i) => (
            <TouchableOpacity
              key={i}
              style={styles.hotlineRow}
              activeOpacity={0.7}
              onPress={() => handleCall(hotline)}
            >
              <View style={styles.hotlineInfo}>
                <Text style={styles.hotlineName}>{hotline.name}</Text>
                <Text style={styles.hotlinePhone}>{hotline.phone}</Text>
              </View>
              <View style={styles.callIcon}>
                <Ionicons name="call" size={16} color={colors.secondary[500]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  countryGroup: {
    gap: spacing.xs,
  },
  countryLabel: {
    ...typography.bodyBold,
    color: colors.neutral[600],
    marginBottom: 2,
  },
  hotlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  hotlineInfo: {
    flex: 1,
  },
  hotlineName: {
    ...typography.body,
    color: colors.neutral[700],
  },
  hotlinePhone: {
    ...typography.caption,
    color: colors.neutral[400],
    marginTop: 1,
  },
  callIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
