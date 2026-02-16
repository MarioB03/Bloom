import { useEffect } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { migrateUserEncryption } from '@/lib/crypto';
import { strings } from '@/constants/strings';
import { colors, typography, fonts } from '@/constants/theme';

export default function TabLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      migrateUserEncryption(user.uid);
    }
  }, [user]);

  if (loading) return <LoadingSpinner />;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary[400],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.neutral[200],
          height: 85,
          paddingBottom: 28,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.sansMedium,
          fontSize: typography.small.fontSize,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          ...typography.heading3,
          color: colors.neutral[800],
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: strings.tabs.checkin,
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="registros"
        options={{
          title: strings.tabs.registers,
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: strings.tabs.calendar,
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tu"
        options={{
          title: strings.tabs.profile,
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Hidden tabs — kept as redirects to prevent broken deep links */}
      <Tabs.Screen
        name="notas"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="compartido"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="habilidades"
        options={{ href: null }}
      />
    </Tabs>
  );
}
