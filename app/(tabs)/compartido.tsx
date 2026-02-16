import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

export default function CompartidoRedirect() {
  useEffect(() => {
    router.replace('/compartido-view' as any);
  }, []);
  return <View />;
}
