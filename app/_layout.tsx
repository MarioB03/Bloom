import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  DMSerifDisplay_400Regular,
} from '@expo-google-fonts/dm-serif-display';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { AuthProvider } from '@/contexts/AuthContext';
import { GenderProvider } from '@/contexts/GenderContext';
import { PremiumProvider } from '@/contexts/PremiumContext';
import { SharingProvider } from '@/contexts/SharingContext';
// Walkthrough disabled for now
// import { WalkthroughProvider } from '@/contexts/WalkthroughContext';
// import { WalkthroughOverlay } from '@/components/ui/WalkthroughOverlay';
import { colors } from '@/constants/theme';
import AnimatedSplash from '@/components/ui/AnimatedSplash';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSerifDisplay_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loading} />
    );
  }

  return (
    <AuthProvider>
      <GenderProvider>
      <PremiumProvider>
      <SharingProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="(auth)"
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="checkin/nuevo"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="checkin/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="registro-emocional/nuevo"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="registro-emocional/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="gratitud/nuevo"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="agenda"
          options={{
            presentation: 'transparentModal',
            animation: 'none',
            headerShown: false,
            gestureEnabled: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen
          name="logros"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="dia/[fecha]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="perfil"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="habilidad/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="jardin"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="compartido-view"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="insights"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="habilidades/categoria/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="habilidades/historial"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="plan-seguridad"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="premium"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="eliminar-cuenta"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="politica-privacidad"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ animation: 'fade' }}
        />
      </Stack>
      {!splashDone && (
        <AnimatedSplash
          isReady={fontsLoaded || !!fontError}
          onFinish={() => setSplashDone(true)}
        />
      )}
      </SharingProvider>
      </PremiumProvider>
      </GenderProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
