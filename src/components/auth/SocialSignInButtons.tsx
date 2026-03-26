import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { signInWithApple, signInWithGoogle } from '@/lib/auth';
import { strings } from '@/constants/strings';
import { colors, typography, spacing, borderRadius, shadows, fonts } from '@/constants/theme';

// Configure Google Sign-In on module load
GoogleSignin.configure({
  iosClientId: '873083945404-32291l9qg9lp7fkrufp34mb2e39fiale.apps.googleusercontent.com',
  webClientId: '873083945404-aqr5c7rrmrlftntqjq7q1h5o9t4e9lmg.apps.googleusercontent.com',
});

interface SocialSignInButtonsProps {
  onSuccess: () => void;
  onError?: (error: string) => void;
}

export function SocialSignInButtons({ onSuccess, onError }: SocialSignInButtonsProps) {
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);

  const handleAppleSignIn = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoading('apple');

      const nonce = Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce
      );

      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!appleCredential.identityToken) {
        throw new Error('No identity token received');
      }

      await signInWithApple(
        appleCredential.identityToken,
        nonce,
        appleCredential.fullName
          ? {
              givenName: appleCredential.fullName.givenName,
              familyName: appleCredential.fullName.familyName,
            }
          : undefined
      );

      onSuccess();
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        onError?.(error.message || 'Error al iniciar sesión con Apple');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoading('google');

      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (response.type === 'success' && response.data.idToken) {
        await signInWithGoogle(response.data.idToken, response.data.user.email);
        onSuccess();
      }
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        onError?.(error.message || 'Error al iniciar sesión con Google');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(800).duration(500)} style={styles.container}>
      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{strings.socialAuth.divider}</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.buttons}>
        {/* Apple button — iOS only */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={styles.appleButton}
            activeOpacity={0.7}
            onPress={handleAppleSignIn}
            disabled={loading !== null}
          >
            <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
            <Text style={styles.appleButtonText}>
              {loading === 'apple' ? '...' : strings.socialAuth.apple}
            </Text>
          </TouchableOpacity>
        )}

        {/* Google button */}
        <TouchableOpacity
          style={styles.googleButton}
          activeOpacity={0.7}
          onPress={handleGoogleSignIn}
          disabled={loading !== null}
        >
          <Text style={styles.googleG}>G</Text>
          <Text style={styles.googleButtonText}>
            {loading === 'google' ? '...' : strings.socialAuth.google}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  buttons: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  dividerText: {
    ...typography.small,
    color: colors.neutral[400],
    marginHorizontal: spacing.md,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    gap: spacing.sm,
    ...shadows.sm,
  },
  appleButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  googleG: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: '#4285F4',
  },
  googleButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.neutral[700],
  },
});
