import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { useGender } from '@/contexts/GenderContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  getAuthProvider,
  reauthenticateWithPassword,
  reauthenticateWithAppleCredential,
  reauthenticateWithGoogleCredential,
  deleteUserAccount,
} from '@/lib/auth';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

export default function EliminarCuentaScreen() {
  const { user } = useAuth();
  const { g } = useGender();
  const [password, setPassword] = useState('');
  const [reAuthenticated, setReAuthenticated] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reAuthLoading, setReAuthLoading] = useState(false);

  const provider = getAuthProvider();

  const handlePasswordReAuth = async () => {
    if (!password.trim()) {
      Alert.alert('', 'Introduce tu contraseña');
      return;
    }
    setReAuthLoading(true);
    try {
      await reauthenticateWithPassword(password);
      setReAuthenticated(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', strings.deleteAccount.errorReAuth);
    } finally {
      setReAuthLoading(false);
    }
  };

  const handleAppleReAuth = async () => {
    setReAuthLoading(true);
    try {
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

      if (!appleCredential.identityToken) throw new Error('No token');

      await reauthenticateWithAppleCredential(appleCredential.identityToken, nonce);
      setReAuthenticated(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', strings.deleteAccount.errorReAuth);
      }
    } finally {
      setReAuthLoading(false);
    }
  };

  const handleGoogleReAuth = async () => {
    setReAuthLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (response.type === 'success' && response.data.idToken) {
        await reauthenticateWithGoogleCredential(response.data.idToken);
        setReAuthenticated(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', strings.deleteAccount.errorReAuth);
      }
    } finally {
      setReAuthLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    Alert.alert(
      strings.deleteAccount.title,
      g({ f: '¿Estás completamente segura? No hay vuelta atrás.', m: '¿Estás completamente seguro? No hay vuelta atrás.', n: '¿Completamente seguro/a? No hay vuelta atrás.' }),
      [
        { text: strings.common.cancel, style: 'cancel' },
        {
          text: strings.common.delete,
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setDeleting(true);
            try {
              await deleteUserAccount(user.uid);
              // Don't navigate — AuthContext will detect user=null and redirect to login
            } catch (error: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', error?.message || strings.deleteAccount.errorDelete);
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const deletionItems = [
    strings.deleteAccount.itemCheckins,
    strings.deleteAccount.itemGratitude,
    strings.deleteAccount.itemGarden,
    strings.deleteAccount.itemSafetyPlan,
    strings.deleteAccount.itemSharing,
    strings.deleteAccount.itemAccount,
  ];

  return (
    <ScreenWrapper>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{strings.deleteAccount.title}</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Warning */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Card variant="outlined" style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <View style={styles.warningIconContainer}>
              <Ionicons name="warning-outline" size={28} color={colors.error} />
            </View>
            <Text style={styles.warningText}>{strings.deleteAccount.warning}</Text>
          </View>
        </Card>
      </Animated.View>

      {/* What will be deleted */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)}>
        <Card variant="outlined" style={styles.listCard}>
          <Text style={styles.listTitle}>{strings.deleteAccount.whatDeleted}</Text>
          {deletionItems.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Ionicons name="close-circle" size={18} color={colors.error} />
              <Text style={styles.listItemText}>{item}</Text>
            </View>
          ))}
        </Card>
      </Animated.View>

      {/* Re-authentication */}
      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Card variant="outlined" style={styles.reAuthCard}>
          <Text style={styles.sectionTitle}>{strings.deleteAccount.reAuthTitle}</Text>

          {reAuthenticated ? (
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={styles.verifiedText}>Identidad verificada</Text>
            </View>
          ) : provider === 'password' ? (
            <View>
              <Text style={styles.reAuthDesc}>{strings.deleteAccount.reAuthPassword}</Text>
              <Input
                label={strings.auth.password}
                placeholder="Tu contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <Button
                title="Verificar"
                onPress={handlePasswordReAuth}
                loading={reAuthLoading}
                variant="outline"
                size="md"
                style={styles.reAuthButton}
              />
            </View>
          ) : provider === 'apple' ? (
            <Button
              title={strings.deleteAccount.reAuthApple}
              onPress={handleAppleReAuth}
              loading={reAuthLoading}
              variant="outline"
              size="md"
              icon={<Ionicons name="logo-apple" size={18} color={colors.neutral[700]} />}
            />
          ) : (
            <Button
              title={strings.deleteAccount.reAuthGoogle}
              onPress={handleGoogleReAuth}
              loading={reAuthLoading}
              variant="outline"
              size="md"
            />
          )}
        </Card>
      </Animated.View>

      {/* Delete button */}
      <Animated.View entering={FadeInDown.delay(500).duration(400)}>
        <TouchableOpacity
          style={[
            styles.deleteButton,
            (!reAuthenticated || deleting) && styles.deleteButtonDisabled,
          ]}
          activeOpacity={0.7}
          disabled={!reAuthenticated || deleting}
          onPress={handleDelete}
        >
          {deleting ? (
            <Text style={styles.deleteButtonText}>{strings.deleteAccount.deleting}</Text>
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>{strings.deleteAccount.confirmButton}</Text>
            </>
          )}
        </TouchableOpacity>
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
  warningCard: {
    marginBottom: spacing.md,
    borderColor: colors.error + '30',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  warningIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningText: {
    ...typography.body,
    color: colors.neutral[700],
    flex: 1,
  },
  listCard: {
    marginBottom: spacing.md,
  },
  listTitle: {
    ...typography.bodyBold,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  listItemText: {
    ...typography.body,
    color: colors.neutral[600],
    flex: 1,
  },
  reAuthCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  reAuthDesc: {
    ...typography.small,
    color: colors.neutral[500],
    marginBottom: spacing.sm,
  },
  reAuthButton: {
    marginTop: spacing.sm,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  verifiedText: {
    ...typography.body,
    color: colors.success,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
    paddingVertical: 16,
    gap: spacing.sm,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  deleteButtonDisabled: {
    opacity: 0.4,
  },
  deleteButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
