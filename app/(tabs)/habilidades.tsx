import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

export default function HabilidadesRedirect() {
  useEffect(() => {
    router.replace('/habilidades-view' as any);
  }, []);
  return <View />;
}
