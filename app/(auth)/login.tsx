import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
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
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SocialSignInButtons } from '@/components/auth/SocialSignInButtons';
import { loginUser } from '@/lib/auth';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

const ONBOARDING_KEY = '@bloom_onboarding_complete';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Check onboarding on first load
  useEffect(() => {
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (seen !== 'true') {
          router.replace('/onboarding');
        }
      } catch {}
    })();
  }, []);

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
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('', 'Rellena todos los campos');
      return;
    }
    setLoading(true);
    try {
      await loginUser(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error: any) {
      const message =
        error.code === 'auth/invalid-credential'
          ? 'Email o contraseña incorrectos'
          : error.code === 'auth/too-many-requests'
            ? 'Demasiados intentos. Intenta más tarde'
            : 'Error al iniciar sesión';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.secondary[50], colors.background]}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* --- Header: logo + title --- */}
          <View style={styles.header}>
            <Animated.View style={[styles.logoContainer, logoStyle]}>
              <View style={styles.logoBg}>
                <Text style={styles.logoEmoji}>🌿</Text>
              </View>
            </Animated.View>

            <Animated.View style={titleStyle}>
              <Text style={styles.title}>{strings.app.name}</Text>
              <Text style={styles.subtitle}>Tu jardín de bienestar emocional</Text>
            </Animated.View>
          </View>

          {/* --- Form card --- */}
          <Animated.View style={[styles.form, formStyle]}>
            <View style={styles.formCard}>
              <Input
                label={strings.auth.email}
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Input
                label={strings.auth.password}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <Button
                title={strings.auth.loginButton}
                onPress={handleLogin}
                loading={loading}
                size="lg"
                style={styles.button}
              />
            </View>
          </Animated.View>

          {/* --- Social sign-in --- */}
          <SocialSignInButtons
            onSuccess={() => router.replace('/(tabs)')}
            onError={(msg) => Alert.alert('Error', msg)}
          />

          {/* --- Links --- */}
          <Animated.View style={[styles.links, linksStyle]}>
            <Link href="/(auth)/forgot-password" style={styles.link}>
              {strings.auth.forgotPasswordLink}
            </Link>
            <View style={styles.registerRow}>
              <Text style={styles.linkText}>{strings.auth.noAccount} </Text>
              <Link href="/(auth)/register" style={styles.linkBold}>
                {strings.auth.register}
              </Link>
            </View>
            <Link href="/politica-privacidad" style={styles.privacyLink}>
              {strings.privacyPolicy.link}
            </Link>
          </Animated.View>
        </KeyboardAvoidingView>
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
    marginBottom: spacing.xl + 8,
  },
  logoContainer: {
    marginBottom: spacing.md,
  },
  logoBg: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.warm,
  },
  logoEmoji: { fontSize: 42 },
  title: {
    ...typography.displayLarge,
    color: colors.neutral[800],
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral[500],
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Form
  form: { marginBottom: spacing.lg },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  button: { marginTop: spacing.sm },

  // Links
  links: { alignItems: 'center', gap: spacing.md },
  link: {
    ...typography.body,
    color: colors.primary[400],
  },
  registerRow: { flexDirection: 'row', alignItems: 'center' },
  linkText: {
    ...typography.body,
    color: colors.neutral[400],
  },
  linkBold: {
    ...typography.bodyBold,
    color: colors.primary[400],
  },
  privacyLink: {
    ...typography.small,
    color: colors.neutral[400],
  },
});
