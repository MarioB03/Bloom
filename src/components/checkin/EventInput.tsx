import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ImportantEvent } from '@/types/checkin';
import { Input } from '@/components/ui/Input';
import { strings } from '@/constants/strings';
import { colors, typography, borderRadius, spacing } from '@/constants/theme';

interface EventInputProps {
  events: ImportantEvent[];
  onChange: (events: ImportantEvent[]) => void;
}

export function EventInput({ events, onChange }: EventInputProps) {
  const updateEvent = (index: number, field: keyof ImportantEvent, value: string) => {
    const updated = [...events];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addEvent = () => {
    onChange([...events, { title: '', description: '' }]);
  };

  const removeEvent = (index: number) => {
    onChange(events.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{strings.checkin.events}</Text>
      {events.map((event, index) => (
        <View key={index} style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventNumber}>Evento {index + 1}</Text>
            <TouchableOpacity onPress={() => removeEvent(index)}>
              <Ionicons
                name="close-circle"
                size={22}
                color={colors.neutral[400]}
              />
            </TouchableOpacity>
          </View>
          <Input
            placeholder={strings.checkin.eventTitle}
            value={event.title}
            onChangeText={(text) => updateEvent(index, 'title', text)}
            containerStyle={styles.inputSpacing}
          />
          <Input
            placeholder={strings.checkin.eventDescription}
            value={event.description}
            onChangeText={(text) => updateEvent(index, 'description', text)}
            multiline
            numberOfLines={3}
            style={styles.multiline}
            containerStyle={{ marginBottom: 0 }}
          />
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={addEvent}>
        <Ionicons name="add-circle-outline" size={20} color={colors.primary[500]} />
        <Text style={styles.addButtonText}>{strings.checkin.addEvent}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodyBold,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  eventCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  eventNumber: {
    ...typography.caption,
    color: colors.neutral[500],
    fontWeight: '600',
  },
  inputSpacing: {
    marginBottom: spacing.sm,
  },
  multiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  addButtonText: {
    ...typography.body,
    color: colors.primary[500],
    fontWeight: '600',
  },
});
