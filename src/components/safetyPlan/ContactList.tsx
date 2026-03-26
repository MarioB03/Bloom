import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { TrustedContact } from '@/types/safetyPlan';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius } from '@/constants/theme';

interface ContactListProps {
  contacts: TrustedContact[];
  onUpdate: (contacts: TrustedContact[]) => void;
}

export function ContactList({ contacts, onUpdate }: ContactListProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleAdd = () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName || !trimmedPhone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdate([...contacts, { name: trimmedName, phone: trimmedPhone }]);
    setName('');
    setPhone('');
  };

  const handleRemove = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdate(contacts.filter((_, i) => i !== index));
  };

  const handleCall = (contact: TrustedContact) => {
    Alert.alert(
      strings.safetyPlan.callConfirmTitle,
      strings.safetyPlan.callConfirmMessage.replace('{name}', contact.name),
      [
        { text: strings.common.cancel, style: 'cancel' },
        {
          text: strings.safetyPlan.call,
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Linking.openURL(`tel:${contact.phone}`);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {contacts.map((contact, index) => (
        <Animated.View
          key={`${index}-${contact.name}`}
          entering={FadeInDown.duration(300)}
          exiting={FadeOutUp.duration(200)}
          style={styles.contactRow}
        >
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{contact.name}</Text>
            <Text style={styles.contactPhone}>{contact.phone}</Text>
          </View>
          <View style={styles.contactActions}>
            <TouchableOpacity
              onPress={() => handleCall(contact)}
              style={styles.callButton}
            >
              <Ionicons name="call" size={16} color={colors.secondary[500]} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleRemove(index)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color={colors.neutral[300]} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      ))}
      <View style={styles.addSection}>
        <TextInput
          style={styles.input}
          placeholder={strings.safetyPlan.contactNamePlaceholder}
          placeholderTextColor={colors.neutral[300]}
          value={name}
          onChangeText={setName}
        />
        <View style={styles.phoneRow}>
          <TextInput
            style={[styles.input, styles.phoneInput]}
            placeholder={strings.safetyPlan.contactPhonePlaceholder}
            placeholderTextColor={colors.neutral[300]}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.addButton, (!name.trim() || !phone.trim()) && styles.addButtonDisabled]}
            disabled={!name.trim() || !phone.trim()}
          >
            <Ionicons name="add" size={20} color={(name.trim() && phone.trim()) ? colors.secondary[500] : colors.neutral[300]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondary[50],
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...typography.bodyBold,
    color: colors.neutral[700],
  },
  contactPhone: {
    ...typography.caption,
    color: colors.neutral[400],
    marginTop: 1,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  callButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSection: {
    gap: spacing.xs,
  },
  input: {
    ...typography.body,
    color: colors.neutral[700],
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  phoneInput: {
    flex: 1,
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
