import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { emotions, EmotionConfig } from '@/constants/emotions';
import { EmotionId } from '@/types/checkin';
import { colors, fonts, typography, borderRadius, spacing } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface EmotionPickerProps {
  selected: EmotionId | null;
  onSelect: (emotion: EmotionId) => void;
}

function EmotionButton({ item, isSelected, onPress, index }: {
  item: EmotionConfig;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 12, stiffness: 180 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(isSelected ? 1.04 : 1, { damping: 12, stiffness: 180 });
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 50).duration(400).springify()}
      style={styles.buttonWrapper}
    >
      <AnimatedPressable
        style={[
          animatedStyle,
          styles.emotionButton,
          isSelected && {
            backgroundColor: item.color + '20',
            borderColor: item.color,
            borderWidth: 2,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text style={[styles.emoji, isSelected && { fontSize: 34 }]}>{item.emoji}</Text>
        <Text
          style={[
            styles.label,
            isSelected && {
              color: item.color,
              fontFamily: fonts.rounded,
            },
          ]}
        >
          {item.label}
        </Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

export function EmotionPicker({ selected, onSelect }: EmotionPickerProps) {
  const handleSelect = (emotion: EmotionConfig) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(emotion.id);
  };

  // Render as rows of 3 columns
  const rows: EmotionConfig[][] = [];
  for (let i = 0; i < emotions.length; i += 3) {
    rows.push(emotions.slice(i, i + 3));
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((item, colIndex) => (
            <EmotionButton
              key={item.id}
              item={item}
              isSelected={selected === item.id}
              onPress={() => handleSelect(item)}
              index={rowIndex * 3 + colIndex}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  buttonWrapper: {
    flex: 1,
  },
  emotionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.surface,
  },
  emoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.neutral[600],
    textAlign: 'center',
  },
});
