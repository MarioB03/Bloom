import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius } from '@/constants/theme';

const categories = [
  {
    emoji: '🛡️',
    title: 'Tolerancia al malestar',
    description: 'Técnicas para momentos difíciles',
    color: colors.primary[400],
  },
  {
    emoji: '🎭',
    title: 'Regulación emocional',
    description: 'Aprende a gestionar tus emociones',
    color: colors.accent[400],
  },
  {
    emoji: '🧘',
    title: 'Mindfulness',
    description: 'Conciencia plena y presencia',
    color: colors.secondary[400],
  },
  {
    emoji: '🤝',
    title: 'Relaciones interpersonales',
    description: 'Comunicación y conexión',
    color: colors.info,
  },
  {
    emoji: '💆',
    title: 'Autocuidado',
    description: 'Rutinas de bienestar personal',
    color: '#B58B9E',
  },
];

export default function HabilidadesStandaloneScreen() {
  return (
    <ScreenWrapper>
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{strings.skills.title}</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(500)}>
        <Text style={styles.title}>{strings.skills.title}</Text>
        <Text style={styles.subtitle}>{strings.skills.subtitle}</Text>
      </Animated.View>

      {categories.map((cat, index) => (
        <Animated.View
          key={index}
          entering={FadeInDown.delay(200 + index * 100).duration(500)}
        >
          <Card style={styles.categoryCard}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBg, { backgroundColor: cat.color + '12' }]}>
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
              </View>
              <View style={styles.textArea}>
                <Text style={styles.catTitle}>{cat.title}</Text>
                <Text style={styles.catDesc}>{cat.description}</Text>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Pronto</Text>
              </View>
            </View>
          </Card>
        </Animated.View>
      ))}

      <Animated.View entering={FadeInDown.delay(800).duration(500)}>
        <View style={styles.infoBanner}>
          <Text style={styles.infoEmoji}>💡</Text>
          <Text style={styles.infoText}>
            Las habilidades estarán organizadas por emoción e intensidad para ayudarte en cada momento.
          </Text>
        </View>
      </Animated.View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.sm, marginBottom: spacing.md },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.heading3, color: colors.neutral[700] },
  title: {
    ...typography.displaySmall,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral[500],
    marginBottom: spacing.lg,
  },
  categoryCard: {
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catEmoji: {
    fontSize: 24,
  },
  textArea: {
    flex: 1,
  },
  catTitle: {
    ...typography.bodyBold,
    color: colors.neutral[700],
  },
  catDesc: {
    ...typography.caption,
    color: colors.neutral[500],
    marginTop: 2,
  },
  comingSoonBadge: {
    backgroundColor: colors.accent[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  comingSoonText: {
    fontFamily: fonts.rounded,
    fontSize: 11,
    color: colors.accent[500],
  },
  infoBanner: {
    backgroundColor: colors.accent[50],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent[100],
  },
  infoEmoji: {
    fontSize: 32,
  },
  infoText: {
    ...typography.body,
    color: colors.accent[600],
    flex: 1,
    lineHeight: 22,
  },
});
