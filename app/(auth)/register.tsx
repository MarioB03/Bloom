import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
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
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { registerUser } from '@/lib/auth';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('', 'Rellena todos los campos');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('', 'Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      Alert.alert('', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await registerUser(email.trim(), password, displayName.trim());
      router.replace('/(tabs)');
    } catch (error: any) {
      const message =
        error.code === 'auth/email-already-in-use'
          ? 'Este email ya está registrado'
          : error.code === 'auth/weak-password'
            ? 'La contraseña es demasiado débil'
            : 'Error al crear la cuenta';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.secondary[50], colors.background, colors.secondary[50]]}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* --- Header: logo + title --- */}
            <View style={styles.header}>
              <Animated.View style={[styles.logoContainer, logoStyle]}>
                <View style={styles.logoBg}>
                  <Text style={styles.logoEmoji}>🌱</Text>
                </View>
              </Animated.View>

              <Animated.View style={titleStyle}>
                <Text style={styles.title}>Crear cuenta</Text>
                <Text style={styles.subtitle}>Comienza tu viaje de bienestar</Text>
              </Animated.View>
            </View>

            {/* --- Form card --- */}
            <Animated.View style={[styles.formWrapper, formStyle]}>
              <View style={styles.formCard}>
                <Input
                  label={strings.auth.displayName}
                  placeholder="Tu nombre"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                />
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
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <Input
                  label={strings.auth.confirmPassword}
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
                <Button
                  title={strings.auth.registerButton}
                  onPress={handleRegister}
                  loading={loading}
                  size="lg"
                  style={styles.button}
                />
              </View>
            </Animated.View>

            {/* --- Links --- */}
            <Animated.View style={[styles.links, linksStyle]}>
              <View style={styles.loginRow}>
                <Text style={styles.linkText}>{strings.auth.hasAccount} </Text>
                <Link href="/(auth)/login" style={styles.linkBold}>
                  {strings.auth.login}
                </Link>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
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
    backgroundColor: colors.secondary[400],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.secondary[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
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

  // Links
  links: { alignItems: 'center', gap: spacing.md },
  loginRow: { flexDirection: 'row', alignItems: 'center' },
  linkText: {
    ...typography.body,
    color: colors.neutral[400],
  },
  linkBold: {
    ...typography.bodyBold,
    color: colors.primary[400],
  },
});
