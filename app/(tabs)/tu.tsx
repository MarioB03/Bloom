import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useSharing } from '@/contexts/SharingContext';
import { usePremium } from '@/contexts/PremiumContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonProfile } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { logoutUser } from '@/lib/auth';
import { getAllCheckins } from '@/lib/firestore';
import { exportCheckins } from '@/lib/export';
import {
  getReminderSettings,
  saveReminderSettings,
  scheduleReminder,
  ReminderSettings,
} from '@/lib/notifications';
import { calculateStreak, getStreakEmoji } from '@/utils/streak';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

interface NavItem {
  icon: string;
  label: string;
  description: string;
  route: string;
  badge?: string;
  badgeColor?: string;
}

export default function TuScreen() {
  const { user } = useAuth();
  const { viewer, sharedAccount } = useSharing();
  const { isPremium } = usePremium();
  const [totalCheckins, setTotalCheckins] = useState(0);
  const [uniqueDays, setUniqueDays] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enabled: false,
    hour: 20,
    minute: 0,
  });
  const [exporting, setExporting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      const checkins = await getAllCheckins(user.uid);
      setTotalCheckins(checkins.length);
      const dates = checkins.map((c) => c.date);
      setUniqueDays(new Set(dates).size);
      setStreak(calculateStreak(dates));
    } catch {}
  }, [user]);

  const loadSettings = useCallback(async () => {
    const settings = await getReminderSettings();
    setReminderSettings(settings);
    setReminderEnabled(settings.enabled);
  }, []);

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadStats(), loadSettings()]).finally(() => setInitialLoading(false));
    }, [loadStats, loadSettings])
  );

  const handleToggleReminder = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReminderEnabled(value);
    const newSettings = { ...reminderSettings, enabled: value };
    setReminderSettings(newSettings);
    await saveReminderSettings(newSettings);
    await scheduleReminder(newSettings);
  };

  const handleExport = async () => {
    if (!user) return;
    if (!isPremium) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Premium', 'La exportación de datos es una función Premium. Canjea un código de regalo para activarla.');
      return;
    }
    setExporting(true);
    try {
      const checkins = await getAllCheckins(user.uid);
      if (checkins.length === 0) {
        Alert.alert('', 'No hay check-ins para exportar');
        return;
      }
      await exportCheckins(checkins);
    } catch {
      Alert.alert('Error', 'No se pudieron exportar los datos');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      strings.auth.logout,
      '¿Estás segura de que quieres cerrar sesión?',
      [
        { text: strings.common.cancel, style: 'cancel' },
        {
          text: strings.auth.logout,
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await logoutUser();
              router.replace('/(auth)/login');
            } catch {
              Alert.alert(strings.common.error);
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const displayName = user?.displayName || 'Usuario';
  const email = user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();
  const streakEmoji = getStreakEmoji(streak);

  const navItems: NavItem[] = [
    {
      icon: 'stats-chart-outline',
      label: strings.tu.insights,
      description: strings.tu.insightsDesc,
      route: '/insights',
    },
    ...(sharedAccount ? [{
      icon: 'people-outline',
      label: strings.tu.compartido,
      description: strings.tu.compartidoDesc,
      route: '/compartido-view',
    }] : []),
    {
      icon: 'bulb-outline',
      label: strings.tu.habilidades,
      description: strings.tu.habilidadesDesc,
      route: '/habilidades-view',
      badge: 'Pronto',
      badgeColor: colors.accent[400],
    },
    {
      icon: 'link-outline',
      label: strings.tu.compartirDatos,
      description: strings.tu.compartirDatosDesc,
      route: '/perfil',
      ...(viewer ? { badge: viewer.viewerDisplayName, badgeColor: colors.secondary[400] } : {}),
    },
    {
      icon: 'star-outline',
      label: strings.tu.premium,
      description: strings.tu.premiumDesc,
      route: '/premium',
      ...(isPremium ? { badge: 'Premium', badgeColor: colors.accent[400] } : {}),
    },
  ];

  if (initialLoading) {
    return (
      <ScreenWrapper>
        <SkeletonProfile />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      {/* Profile header */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.profileSection}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
        <Text style={styles.displayName}>{displayName}</Text>
        <Text style={styles.email}>{email}</Text>
      </Animated.View>

      {/* Quick stats */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalCheckins}</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{uniqueDays}</Text>
            <Text style={styles.statLabel}>Días activos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{streakEmoji} {streak}</Text>
            <Text style={styles.statLabel}>Racha</Text>
          </View>
        </View>
      </Animated.View>

      {/* Navigation cards */}
      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <Card variant="outlined" style={styles.navCard}>
          {navItems.map((item, index) => (
            <React.Fragment key={item.route}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={styles.navItem}
                activeOpacity={0.6}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(item.route as any);
                }}
              >
                <View style={styles.navLeft}>
                  <View style={[styles.navIcon, { backgroundColor: colors.primary[50] }]}>
                    <Ionicons name={item.icon as any} size={18} color={colors.primary[400]} />
                  </View>
                  <View>
                    <Text style={styles.navLabel}>{item.label}</Text>
                    <Text style={styles.navDesc}>{item.description}</Text>
                  </View>
                </View>
                <View style={styles.navRight}>
                  {item.badge && (
                    <Badge label={item.badge} color={item.badgeColor || colors.neutral[400]} />
                  )}
                  <Ionicons name="chevron-forward" size={18} color={colors.neutral[300]} />
                </View>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </Card>
      </Animated.View>

      {/* Settings */}
      <Animated.View entering={FadeInDown.delay(400).duration(500)}>
        <Card variant="outlined" style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>{strings.tu.settings}</Text>

          <View style={styles.settingsItem}>
            <View style={styles.settingsLeft}>
              <View style={[styles.navIcon, { backgroundColor: colors.primary[50] }]}>
                <Ionicons name="notifications-outline" size={18} color={colors.primary[400]} />
              </View>
              <View>
                <Text style={styles.navLabel}>Recordatorio diario</Text>
                <Text style={styles.navDesc}>
                  {reminderEnabled ? `Cada día a las ${reminderSettings.hour}:${String(reminderSettings.minute).padStart(2, '0')}` : 'Desactivado'}
                </Text>
              </View>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: colors.neutral[200], true: colors.primary[200] }}
              thumbColor={reminderEnabled ? colors.primary[400] : colors.neutral[300]}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingsItem}
            activeOpacity={0.6}
            onPress={handleExport}
            disabled={exporting}
          >
            <View style={styles.settingsLeft}>
              <View style={[styles.navIcon, { backgroundColor: colors.secondary[50] }]}>
                <Ionicons name="download-outline" size={18} color={colors.secondary[500]} />
              </View>
              <View>
                <Text style={styles.navLabel}>Exportar datos</Text>
                <Text style={styles.navDesc}>Descargar CSV con tus check-ins</Text>
              </View>
            </View>
            <View style={styles.navRight}>
              {!isPremium && <Badge label="Premium" color={colors.accent[400]} />}
              <Ionicons name="chevron-forward" size={18} color={colors.neutral[300]} />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.settingsItem}>
            <View style={styles.settingsLeft}>
              <View style={[styles.navIcon, { backgroundColor: colors.accent[50] }]}>
                <Ionicons name="moon-outline" size={18} color={colors.accent[500]} />
              </View>
              <Text style={styles.navLabel}>Ciclo menstrual</Text>
            </View>
            <Text style={styles.settingsValue}>Activo</Text>
          </View>
        </Card>
      </Animated.View>

      {/* About */}
      <Animated.View entering={FadeInDown.delay(500).duration(500)}>
        <Card variant="outlined" style={styles.aboutCard}>
          <Text style={styles.sectionTitle}>{strings.tu.about}</Text>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>{strings.tu.version}</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Hecho con</Text>
            <Text style={styles.aboutValue}>🌿 y React Native</Text>
          </View>
        </Card>
      </Animated.View>

      {/* Logout */}
      <Animated.View entering={FadeInUp.delay(600).duration(400)}>
        <Button
          title={loggingOut ? 'Cerrando sesión...' : strings.auth.logout}
          onPress={handleLogout}
          variant="outline"
          size="lg"
          loading={loggingOut}
          icon={!loggingOut ? <Ionicons name="log-out-outline" size={18} color={colors.error} /> : undefined}
          style={styles.logoutButton}
          textStyle={{ color: colors.error }}
        />
      </Animated.View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.warm,
  },
  avatarInitial: { fontSize: 34, fontFamily: fonts.serif, color: colors.neutral[50] },
  displayName: { ...typography.displaySmall, color: colors.neutral[800], marginBottom: spacing.xs },
  email: { ...typography.body, color: colors.neutral[400] },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadows.sm,
  },
  statNumber: {
    fontFamily: fonts.sansBold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.neutral[800],
  },
  statLabel: {
    ...typography.caption,
    color: colors.neutral[400],
    marginTop: 2,
  },
  // Nav
  navCard: { marginBottom: spacing.md },
  navItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  navIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: { ...typography.body, color: colors.neutral[700] },
  navDesc: { ...typography.small, color: colors.neutral[400], marginTop: 1 },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  divider: { height: 1, backgroundColor: colors.neutral[100] },
  // Settings
  settingsCard: { marginBottom: spacing.md },
  sectionTitle: { ...typography.bodyBold, color: colors.neutral[700], marginBottom: spacing.md },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  settingsValue: { ...typography.caption, color: colors.neutral[400] },
  // About
  aboutCard: { marginBottom: spacing.md },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  aboutLabel: { ...typography.body, color: colors.neutral[600] },
  aboutValue: { ...typography.body, color: colors.neutral[400] },
  // Logout
  logoutButton: { marginTop: spacing.sm, marginBottom: spacing.xl, borderColor: colors.error + '30' },
});
