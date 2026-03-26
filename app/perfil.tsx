import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '@/contexts/AuthContext';
import { useGender } from '@/contexts/GenderContext';
import { useSharing } from '@/contexts/SharingContext';
import { usePremium } from '@/contexts/PremiumContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  createSharingCode,
  redeemSharingCode,
  revokeAccess,
} from '@/lib/firestore';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius } from '@/constants/theme';

export default function PerfilScreen() {
  const { user } = useAuth();
  const { g } = useGender();
  const { viewer, sharedAccount, refresh: refreshSharing } = useSharing();
  const { isPremium } = usePremium();

  // Sharing state
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const handleGenerateCode = async () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGeneratingCode(true);
    try {
      const code = await createSharingCode(user.uid, user.displayName || 'Usuario');
      setActiveCode(code);
    } catch {
      Alert.alert(strings.common.error);
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopyCode = async () => {
    if (!activeCode) return;
    await Clipboard.setStringAsync(activeCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('', strings.sharing.codeCopied);
  };

  const handleRedeemCode = async () => {
    if (!user || codeInput.length < 6) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRedeeming(true);
    try {
      await redeemSharingCode(codeInput.toUpperCase(), user.uid, user.displayName || 'Usuario');
      Alert.alert('', strings.sharing.successLinked);
      setCodeInput('');
      await refreshSharing();
    } catch (error: any) {
      const errorMessages: Record<string, string> = {
        INVALID_CODE: strings.sharing.errorInvalidCode,
        CODE_EXPIRED: strings.sharing.errorExpiredCode,
        CANNOT_LINK_SELF: strings.sharing.errorSelfLink,
        ALREADY_LINKED: g(strings.sharing.errorAlreadyLinked),
        LINK_REVOKED: strings.sharing.errorLinkRevoked,
      };
      Alert.alert('', errorMessages[error.message] || strings.common.error);
      if (error.message === 'ALREADY_LINKED') {
        await refreshSharing();
      }
    } finally {
      setRedeeming(false);
    }
  };

  const handleRevoke = () => {
    if (!user || !viewer) return;
    Alert.alert(
      strings.sharing.revokeConfirmTitle,
      g(strings.sharing.revokeConfirmMessage),
      [
        { text: strings.common.cancel, style: 'cancel' },
        {
          text: strings.sharing.revokeAccess,
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              await revokeAccess(user.uid, viewer.viewerId);
              await refreshSharing();
            } catch {
              Alert.alert(strings.common.error);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{strings.sharing.title}</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <Text style={styles.title}>{strings.sharing.subtitle}</Text>
      </Animated.View>

      {/* Sharing */}
      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <Card variant="outlined" style={styles.card}>
          <View style={styles.premiumHeader}>
            <Text style={styles.sectionTitle}>🔗 Invitar a alguien</Text>
            {!isPremium && <Badge label="Premium" color={colors.accent[400]} />}
          </View>

          {/* Generate code */}
          <TouchableOpacity
            style={styles.settingsItem}
            activeOpacity={0.6}
            onPress={() => {
              if (!isPremium) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                Alert.alert('Premium', 'Compartir tu jardín es una función Premium. Canjea un código de regalo para activarla.');
                return;
              }
              handleGenerateCode();
            }}
            disabled={generatingCode}
          >
            <View style={styles.settingsLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: colors.primary[50] }]}>
                <Ionicons name="key-outline" size={18} color={colors.primary[400]} />
              </View>
              <View>
                <Text style={styles.settingsLabel}>{strings.sharing.generateCode}</Text>
                <Text style={styles.settingsHint}>{strings.sharing.codeExpiry}</Text>
              </View>
            </View>
            {generatingCode ? (
              <Text style={styles.settingsHint}>...</Text>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.neutral[300]} />
            )}
          </TouchableOpacity>

          {activeCode && (
            <TouchableOpacity onPress={handleCopyCode} activeOpacity={0.7} style={styles.codeDisplay}>
              <Text style={styles.codeText}>{activeCode}</Text>
              <Ionicons name="copy-outline" size={20} color={colors.primary[400]} />
            </TouchableOpacity>
          )}
        </Card>
      </Animated.View>

      {/* Enter code */}
      <Animated.View entering={FadeInDown.delay(400).duration(500)}>
        <Card variant="outlined" style={styles.card}>
          <Text style={styles.sectionTitle}>🔑 {strings.sharing.enterCode}</Text>
          <Text style={[styles.settingsHint, { marginBottom: spacing.sm }]}>
            {strings.sharing.enterCodeHint}
          </Text>
          <View style={styles.codeInputRow}>
            <TextInput
              style={styles.codeInput}
              placeholder={strings.sharing.enterCodePlaceholder}
              placeholderTextColor={colors.neutral[300]}
              value={codeInput}
              onChangeText={(t) => setCodeInput(t.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
              editable={isPremium}
            />
            <Button
              title={redeeming ? strings.sharing.linking : strings.sharing.link}
              onPress={() => {
                if (!isPremium) {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  Alert.alert('Premium', 'Compartir tu jardín es una función Premium.');
                  return;
                }
                handleRedeemCode();
              }}
              loading={redeeming}
              disabled={codeInput.length < 6 || redeeming}
              size="sm"
              style={styles.linkButton}
            />
          </View>
        </Card>
      </Animated.View>

      {/* My viewer */}
      <Animated.View entering={FadeInDown.delay(500).duration(500)}>
        <Card variant="outlined" style={styles.card}>
          <Text style={styles.sectionTitle}>👁️ {strings.sharing.viewer}</Text>
          {viewer ? (
            <View style={styles.linkedUserRow}>
              <View style={styles.linkedUserInfo}>
                <View style={styles.linkedUserAvatar}>
                  <Text style={styles.linkedUserAvatarText}>
                    {viewer.viewerDisplayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.linkedUserName}>{viewer.viewerDisplayName}</Text>
              </View>
              <TouchableOpacity onPress={handleRevoke} hitSlop={8}>
                <Ionicons name="close-circle-outline" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.settingsHint}>{strings.sharing.noViewer}</Text>
          )}
        </Card>
      </Animated.View>

      {/* Shared with me */}
      <Animated.View entering={FadeInDown.delay(600).duration(500)}>
        <Card variant="outlined" style={styles.card}>
          <Text style={styles.sectionTitle}>🌿 {strings.sharing.sharedWith}</Text>
          {sharedAccount ? (
            <View style={styles.linkedUserRow}>
              <View style={styles.linkedUserInfo}>
                <View style={[styles.linkedUserAvatar, { backgroundColor: colors.secondary[400] }]}>
                  <Text style={styles.linkedUserAvatarText}>
                    {sharedAccount.ownerDisplayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.linkedUserName}>{sharedAccount.ownerDisplayName}</Text>
              </View>
              <Badge label={strings.sharing.readOnly} color={colors.info} />
            </View>
          ) : (
            <Text style={styles.settingsHint}>{strings.sharing.noShared}</Text>
          )}
        </Card>
      </Animated.View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.sm, marginBottom: spacing.md },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.heading3, color: colors.neutral[700] },
  title: {
    ...typography.body,
    color: colors.neutral[500],
    marginBottom: spacing.lg,
  },
  card: { marginBottom: spacing.md },
  sectionTitle: { ...typography.bodyBold, color: colors.neutral[700], marginBottom: spacing.md },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  settingsItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm + 2 },
  settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  settingsIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { ...typography.body, color: colors.neutral[700] },
  settingsHint: { ...typography.small, color: colors.neutral[400], marginTop: 1 },
  codeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary[100],
    borderStyle: 'dashed',
  },
  codeText: {
    fontFamily: fonts.sansBold,
    fontSize: 28,
    letterSpacing: 6,
    color: colors.primary[500],
  },
  codeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  codeInput: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.sansBold,
    fontSize: 18,
    letterSpacing: 4,
    color: colors.neutral[700],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    textAlign: 'center',
  },
  linkButton: {
    minWidth: 90,
  },
  linkedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  linkedUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedUserAvatarText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.neutral[50],
  },
  linkedUserName: {
    ...typography.body,
    color: colors.neutral[700],
  },
});
