import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { strings } from '@/constants/strings';
import { colors, typography, spacing } from '@/constants/theme';

export default function HabilidadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Button
          title={strings.common.back}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />
      </View>
      <EmptyState
        emoji="💡"
        message="Detalle de habilidad próximamente"
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
});
