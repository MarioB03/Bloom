import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PurchasesPackage, PACKAGE_TYPE } from 'react-native-purchases';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/contexts/PremiumContext';
import { Button } from '@/components/ui/Button';
import { redeemPremiumCode, createPremiumCode, togglePremiumStatus } from '@/lib/firestore';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';
import * as ExpoClipboard from 'expo-clipboard';

const FEATURES = [
  { emoji: '📤', title: 'Exportar datos', desc: 'Descarga tus registros en PDF' },
  { emoji: '👥', title: 'Compartir', desc: 'Comparte tu bienestar con alguien de confianza' },
  { emoji: '🏪', title: 'Tienda del jardín', desc: 'Compra mascotas, decoraciones y más' },
  { emoji: '📊', title: 'Insights avanzados', desc: 'Promedios, calidad de sueño y consejos' },
];

export default function PremiumScreen() {
  const { user } = useAuth();
  const {
    isPremium,
    premiumStatus,
    refresh: refreshPremium,
    offerings,
    loadingOfferings,
    purchase,
    restore,
  } = usePremium();
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const isAdmin = user?.uid === 'IUrBhjLrTLZZkwuj8B8qSXRX7iH3';

  const monthlyPkg = offerings?.current?.availablePackages.find(
    (p) => p.packageType === PACKAGE_TYPE.MONTHLY,
  );
  const annualPkg = offerings?.current?.availablePackages.find(
    (p) => p.packageType === PACKAGE_TYPE.ANNUAL,
  );

  const selectedPkg: PurchasesPackage | undefined =
    selectedPlan === 'annual' ? annualPkg : monthlyPkg;

  const handlePurchase = async () => {
    if (!selectedPkg || purchasing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPurchasing(true);
    try {
      await purchase(selectedPkg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        strings.subscription.successTitle,
        strings.subscription.successMessage,
        [{ text: 'Genial', onPress: () => router.back() }],
      );
    } catch (error: any) {
      if (error?.userCancelled) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(strings.subscription.errorTitle, strings.subscription.errorPurchase);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (restoring) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRestoring(true);
    try {
      await restore();
      await refreshPremium();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(strings.subscription.restoreSuccess);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(strings.subscription.errorTitle, strings.subscription.errorRestore);
    } finally {
      setRestoring(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!user) return;
    setGeneratingCode(true);
    try {
      const newCode = await createPremiumCode(user.uid);
      await ExpoClipboard.setStringAsync(newCode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Código generado', `${newCode}\n\nCopiado al portapapeles.`);
    } catch {
      Alert.alert('Error', 'No se pudo generar el código.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleTogglePremium = async () => {
    if (!user) return;
    try {
      const newState = await togglePremiumStatus(user.uid);
      await refreshPremium();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Premium', newState ? 'Premium activado' : 'Premium desactivado');
    } catch {
      Alert.alert('Error', 'No se pudo cambiar el estado.');
    }
  };

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
        [{ text: 'Genial', onPress: () => router.back() }],
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

  // --- Already premium ---
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

            {premiumStatus?.source === 'subscription' && (
              <Text style={styles.managedNote}>{strings.subscription.managedByStore}</Text>
            )}

            <View style={styles.featureList}>
              {FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={styles.featureCheck}>✓</Text>
                  <Text style={styles.featureTextActive}>{f.title}</Text>
                </View>
              ))}
            </View>
            <Button title="Volver" onPress={() => router.back()} variant="outline" style={{ marginTop: spacing.lg }} />

            {isAdmin && (
              <View style={styles.adminSection}>
                <Text style={styles.adminTitle}>Admin / Testing</Text>
                <Button
                  title={generatingCode ? 'Generando...' : 'Generar código Premium'}
                  onPress={handleGenerateCode}
                  loading={generatingCode}
                  size="md"
                  style={{ marginBottom: spacing.sm }}
                />
                <Button
                  title="Toggle Premium (activar/desactivar)"
                  onPress={handleTogglePremium}
                  variant="outline"
                  size="md"
                />
              </View>
            )}
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // --- Paywall ---
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
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

          {/* Subscription pricing */}
          <Animated.View entering={FadeInDown.delay(650).duration(500)} style={styles.pricingSection}>
            {loadingOfferings ? (
              <ActivityIndicator color={colors.primary[500]} style={{ marginVertical: spacing.lg }} />
            ) : (
              <>
                {/* Pricing cards */}
                <View style={styles.pricingRow}>
                  {/* Annual */}
                  <TouchableOpacity
                    style={[
                      styles.pricingCard,
                      selectedPlan === 'annual' && styles.pricingCardSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedPlan('annual');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>{strings.subscription.popular}</Text>
                    </View>
                    <Text style={styles.pricingPlanName}>{strings.subscription.annualLabel}</Text>
                    <Text style={styles.pricingPrice}>
                      {annualPkg?.product.priceString ?? strings.subscription.annualPrice}
                    </Text>
                    <Text style={styles.pricingPeriod}>/año</Text>
                    <View style={styles.saveBadge}>
                      <Text style={styles.saveBadgeText}>{strings.subscription.annualSave}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Monthly */}
                  <TouchableOpacity
                    style={[
                      styles.pricingCard,
                      selectedPlan === 'monthly' && styles.pricingCardSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedPlan('monthly');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pricingPlanName}>{strings.subscription.monthlyLabel}</Text>
                    <Text style={styles.pricingPrice}>
                      {monthlyPkg?.product.priceString ?? strings.subscription.monthlyPrice}
                    </Text>
                    <Text style={styles.pricingPeriod}>/mes</Text>
                  </TouchableOpacity>
                </View>

                {/* Free trial badge */}
                <View style={styles.trialBadge}>
                  <Ionicons name="gift-outline" size={16} color={colors.primary[500]} />
                  <Text style={styles.trialBadgeText}>{strings.subscription.freeTrial}</Text>
                </View>

                {/* Subscribe button */}
                <Button
                  title={purchasing ? strings.subscription.subscribing : strings.subscription.subscribe}
                  onPress={handlePurchase}
                  loading={purchasing}
                  disabled={purchasing || !selectedPkg}
                  style={styles.subscribeButton}
                />

                {/* Fine print */}
                <Text style={styles.finePrint}>{strings.subscription.finePrint}</Text>

                {/* Restore */}
                <TouchableOpacity onPress={handleRestore} disabled={restoring} style={styles.restoreButton}>
                  <Text style={styles.restoreText}>
                    {restoring ? strings.subscription.restoring : strings.subscription.restore}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Gift code section */}
          <Animated.View entering={FadeInDown.delay(750).duration(500)} style={styles.redeemSection}>
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

          {isAdmin && (
            <Animated.View entering={FadeInDown.duration(300)} style={[styles.adminSection, { marginTop: spacing.lg }]}>
              <Text style={styles.adminTitle}>Admin / Testing</Text>
              <Button
                title={generatingCode ? 'Generando...' : 'Generar código Premium'}
                onPress={handleGenerateCode}
                loading={generatingCode}
                size="md"
                style={{ marginBottom: spacing.sm }}
              />
              <Button
                title="Toggle Premium (activar/desactivar)"
                onPress={handleTogglePremium}
                variant="outline"
                size="md"
              />
            </Animated.View>
          )}
        </ScrollView>
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
  // Pricing
  pricingSection: {
    marginTop: spacing.lg,
  },
  pricingRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pricingCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    paddingTop: spacing.lg + 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.neutral[200],
    position: 'relative',
    overflow: 'visible',
  },
  pricingCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  popularBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pricingPlanName: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  pricingPrice: {
    fontFamily: fonts.sansBold,
    fontSize: 22,
    color: colors.neutral[800],
  },
  pricingPeriod: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.neutral[400],
    marginBottom: spacing.xs,
  },
  saveBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  saveBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.success,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  trialBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.primary[500],
  },
  subscribeButton: {
    marginTop: spacing.xs,
  },
  finePrint: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.neutral[400],
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  restoreButton: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  restoreText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.neutral[500],
    textDecorationLine: 'underline',
  },
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  dividerText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.neutral[400],
  },
  // Redeem
  redeemSection: {
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
  managedNote: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.neutral[400],
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
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
  adminSection: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderStyle: 'dashed',
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  adminTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: colors.neutral[400],
    textAlign: 'center',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
