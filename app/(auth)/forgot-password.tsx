import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { resetPassword } from '@/lib/auth';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // --- Stagger animations ---
  const logoScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const formOpacity = useSharedValue(0);
  const formY = useSharedValue(30);
  const linksOpacity = useSharedValue(0);
  const floatingY = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withDelay(
      200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.5)) }),
    );
    titleOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
    titleY.value = withDelay(
      500,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    formOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    formY.value = withDelay(
      700,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    linksOpacity.value = withDelay(900, withTiming(1, { duration: 400 }));
    floatingY.value = withDelay(
      1200,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }, { translateY: floatingY.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formY.value }],
  }));
  const linksStyle = useAnimatedStyle(() => ({
    opacity: linksOpacity.value,
  }));

  // --- Auth logic ---
  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('', 'Introduce tu email');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch {
      Alert.alert('Error', 'No se pudo enviar el enlace. Verifica el email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.primary[50], colors.background]}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          {/* --- Header: icon + title --- */}
          <View style={styles.header}>
            <Animated.View style={[styles.logoContainer, logoStyle]}>
              <View style={styles.logoBg}>
                <Text style={styles.logoEmoji}>{sent ? '✉️' : '🔑'}</Text>
              </View>
            </Animated.View>

            <Animated.View style={titleStyle}>
              <Text style={styles.title}>
                {sent ? 'Enlace enviado' : strings.auth.forgotPassword}
              </Text>
              <Text style={styles.subtitle}>
                {sent
                  ? 'Revisa tu bandeja de entrada'
                  : 'Te enviaremos un enlace para restablecer tu contraseña'}
              </Text>
            </Animated.View>
          </View>

          {/* --- Form or confirmation card --- */}
          {sent ? (
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
              <View style={styles.sentCard}>
                <Text style={styles.sentEmoji}>📬</Text>
                <Text style={styles.sentText}>
                  Hemos enviado un enlace a{' '}
                  <Text style={styles.sentEmail}>{email}</Text> para
                  restablecer tu contraseña.
                </Text>
                <Text style={styles.sentHint}>
                  Si no lo encuentras, revisa tu carpeta de spam.
                </Text>
              </View>
            </Animated.View>
          ) : (
            <Animated.View style={[styles.formWrapper, formStyle]}>
              <View style={styles.formCard}>
                <Input
                  label={strings.auth.email}
                  placeholder="tu@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Button
                  title={strings.auth.forgotPasswordButton}
                  onPress={handleReset}
                  loading={loading}
                  size="lg"
                  style={styles.button}
                />
              </View>
            </Animated.View>
          )}

          {/* --- Links --- */}
          <Animated.View style={[styles.links, linksStyle]}>
            <Link href="/(auth)/login" style={styles.link}>
              ← {strings.auth.backToLogin}
            </Link>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    marginBottom: spacing.md,
  },
  logoBg: {
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.warm,
  },
  logoEmoji: { fontSize: 40 },
  title: {
    ...typography.displayMedium,
    color: colors.neutral[800],
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral[500],
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },

  // Form
  formWrapper: { marginBottom: spacing.lg },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  button: { marginTop: spacing.sm },

  // Sent confirmation card
  sentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
    marginBottom: spacing.lg,
  },
  sentEmoji: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  sentText: {
    ...typography.body,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  sentEmail: {
    fontFamily: fonts.sansBold,
    color: colors.primary[400],
  },
  sentHint: {
    ...typography.caption,
    color: colors.neutral[400],
    textAlign: 'center',
  },

  // Links
  links: { alignItems: 'center' },
  link: {
    ...typography.bodyBold,
    color: colors.primary[400],
  },
});
