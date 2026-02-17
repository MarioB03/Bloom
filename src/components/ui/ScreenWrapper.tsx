import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  scrollRef?: React.RefObject<ScrollView | null>;
}

export function ScreenWrapper({
  children,
  scroll = true,
  style,
  scrollRef,
}: ScreenWrapperProps) {
  const Container = scroll ? ScrollView : View;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Container
        ref={scroll ? scrollRef : undefined}
        style={[styles.container, style]}
        contentContainerStyle={scroll ? styles.scrollContent : undefined}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
});
