import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { colors, typography, fonts, spacing, borderRadius } from '@/constants/theme';

interface EditableListProps {
  items: string[];
  placeholder: string;
  onUpdate: (items: string[]) => void;
}

export function EditableList({ items, placeholder, onUpdate }: EditableListProps) {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdate([...items, trimmed]);
    setNewItem('');
  };

  const handleRemove = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdate(items.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <Animated.View
          key={`${index}-${item}`}
          entering={FadeInDown.duration(300)}
          exiting={FadeOutUp.duration(200)}
          style={styles.itemRow}
        >
          <Text style={styles.itemText}>{item}</Text>
          <TouchableOpacity
            onPress={() => handleRemove(index)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color={colors.neutral[300]} />
          </TouchableOpacity>
        </Animated.View>
      ))}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.neutral[300]}
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={handleAdd}
          style={[styles.addButton, !newItem.trim() && styles.addButtonDisabled]}
          disabled={!newItem.trim()}
        >
          <Ionicons name="add" size={20} color={newItem.trim() ? colors.secondary[500] : colors.neutral[300]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondary[50],
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  itemText: {
    ...typography.body,
    color: colors.neutral[700],
    flex: 1,
    marginRight: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.neutral[700],
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: colors.neutral[50],
  },
});
