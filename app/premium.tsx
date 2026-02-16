import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/contexts/PremiumContext';
import { Button } from '@/components/ui/Button';
import { redeemPremiumCode } from '@/lib/firestore';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';
import { TouchableOpacity } from 'react-native';

const FEATURES = [
  { emoji: '📤', title: 'Exportar datos', desc: 'Descarga tus registros en CSV' },
  { emoji: '👥', title: 'Compartir', desc: 'Comparte tu bienestar con alguien de confianza' },
  { emoji: '🏪', title: 'Tienda del jardín', desc: 'Compra mascotas, decoraciones y más' },
  { emoji: '📊', title: 'Insights avanzados', desc: 'Promedios, calidad de sueño y consejos' },
];

export default function PremiumScreen() {
  const { user } = useAuth();
  const { isPremium, refresh: refreshPremium } = usePremium();
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const handleRedeem = async () => {
    if (!user || code.length < 6) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRedeeming(true);
    try {
      await redeemPremiumCode(code.toUpperCase(), user.uid);
      await refreshPremium();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        strings.premium.successRedeemed,
        'Ya tienes acceso a todas las funciones Premium.',
        [{ text: 'Genial', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = error?.message || '';
      if (msg === 'INVALID_CODE') Alert.alert('Error', strings.premium.errorInvalidCode);
      else if (msg === 'CODE_EXPIRED') Alert.alert('Error', strings.premium.errorExpiredCode);
      else if (msg === 'ALREADY_REDEEMED') Alert.alert('Error', strings.premium.errorAlreadyRedeemed);
      else Alert.alert(strings.common.error);
    } finally {
      setRedeeming(false);
    }
  };

  if (isPremium) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.screen}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
          </TouchableOpacity>

          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.activeContainer}>
            <Text style={styles.activeEmoji}>👑</Text>
            <Text style={styles.activeTitle}>Ya eres Premium</Text>
            <Text style={styles.activeDesc}>Tienes acceso a todas las funciones.</Text>
            <View style={styles.featureList}>
              {FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={styles.featureCheck}>✓</Text>
                  <Text style={styles.featureTextActive}>{f.title}</Text>
                </View>
              ))}
            </View>
            <Button title="Volver" onPress={() => router.back()} variant="outline" style={{ marginTop: spacing.lg }} />
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
        </TouchableOpacity>

        {/* Hero */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.hero}>
          <Text style={styles.heroEmoji}>✨</Text>
          <Text style={styles.heroTitle}>Bloom Premium</Text>
          <Text style={styles.heroDesc}>
            Desbloquea todo el potencial de tu bienestar emocional
          </Text>
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInDown.delay(250).duration(500)}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(300 + i * 80).duration(400)}
              style={styles.featureCard}
            >
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Redeem section */}
        <Animated.View entering={FadeInDown.delay(650).duration(500)} style={styles.redeemSection}>
          <Text style={styles.redeemLabel}>¿Tienes un código de regalo?</Text>
          <View style={styles.redeemRow}>
            <TextInput
              style={styles.redeemInput}
              placeholder={strings.premium.giftCodePlaceholder}
              placeholderTextColor={colors.neutral[300]}
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
            />
            <Button
              title={redeeming ? strings.premium.redeeming : strings.premium.redeem}
              onPress={handleRedeem}
              loading={redeeming}
              disabled={code.length < 6 || redeeming}
              size="md"
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    ...typography.displaySmall,
    color: colors.accent[500],
    marginBottom: spacing.xs,
  },
  heroDesc: {
    ...typography.body,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  // Features
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadows.sm,
  },
  featureEmoji: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.neutral[700],
    marginBottom: 2,
  },
  featureDesc: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.neutral[400],
    lineHeight: 18,
  },
  // Redeem
  redeemSection: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent[50],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent[100],
  },
  redeemLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  redeemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  redeemInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: colors.neutral[800],
    letterSpacing: 4,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  // Active state
  activeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  activeEmoji: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  activeTitle: {
    ...typography.displaySmall,
    color: colors.accent[500],
    marginBottom: spacing.xs,
  },
  activeDesc: {
    ...typography.body,
    color: colors.neutral[500],
    marginBottom: spacing.lg,
  },
  featureList: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  featureCheck: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.success,
  },
  featureTextActive: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.neutral[600],
  },
});
