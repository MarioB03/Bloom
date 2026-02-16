import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fonts, spacing, borderRadius, shadows, typography } from '@/constants/theme';

interface DatePickerFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  maximumDate?: Date;
  placeholder?: string;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function formatDisplayDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

export function DatePickerField({
  label,
  value,
  onChange,
  maximumDate,
  placeholder = 'Seleccionar fecha',
}: DatePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [viewYear, setViewYear] = useState(() => (value || new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (value || new Date()).getMonth());

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value) {
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
    } else {
      const now = new Date();
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    }
    setShowPicker(true);
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(null);
  };

  const handleSelectDay = (day: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const selected = new Date(viewYear, viewMonth, day);
    onChange(selected);
    setShowPicker(false);
  };

  const handlePrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    return days;
  }, [viewYear, viewMonth]);

  const isSelected = (day: number) => {
    if (!value) return false;
    return value.getFullYear() === viewYear && value.getMonth() === viewMonth && value.getDate() === day;
  };

  const isDisabled = (day: number) => {
    if (!maximumDate) return false;
    const date = new Date(viewYear, viewMonth, day);
    return date > maximumDate;
  };

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.field} onPress={handlePress} activeOpacity={0.7}>
        <Ionicons name="calendar-outline" size={16} color={colors.neutral[400]} />
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
        {value && (
          <TouchableOpacity onPress={handleClear} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.neutral[400]} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Modal visible={showPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modal}>
            {/* Month navigation */}
            <View style={styles.navRow}>
              <TouchableOpacity onPress={handlePrev} hitSlop={12}>
                <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
              </TouchableOpacity>
              <Text style={styles.navTitle}>
                {MONTHS[viewMonth]} {viewYear}
              </Text>
              <TouchableOpacity onPress={handleNext} hitSlop={12}>
                <Ionicons name="chevron-forward" size={22} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            {/* Weekday headers */}
            <View style={styles.weekRow}>
              {WEEKDAYS.map((w) => (
                <Text key={w} style={styles.weekDay}>{w}</Text>
              ))}
            </View>

            {/* Days grid */}
            <View style={styles.daysGrid}>
              {calendarDays.map((day, i) => (
                <View key={i} style={styles.dayCell}>
                  {day !== null ? (
                    <TouchableOpacity
                      style={[
                        styles.dayButton,
                        isSelected(day) && styles.daySelected,
                        isToday(day) && !isSelected(day) && styles.dayToday,
                      ]}
                      onPress={() => handleSelectDay(day)}
                      disabled={isDisabled(day)}
                      activeOpacity={0.6}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected(day) && styles.dayTextSelected,
                          isDisabled(day) && styles.dayTextDisabled,
                          isToday(day) && !isSelected(day) && styles.dayTextToday,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>

            {/* Close */}
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowPicker(false)}>
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const DAY_SIZE = 38;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.neutral[700],
    marginBottom: spacing.xs + 2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 4,
    gap: spacing.sm,
  },
  fieldText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.neutral[800],
  },
  placeholder: {
    color: colors.neutral[400],
  },
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    width: 320,
    ...shadows.lg,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  navTitle: {
    ...typography.heading3,
    color: colors.neutral[700],
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.neutral[400],
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    marginBottom: 4,
  },
  dayButton: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    borderRadius: DAY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: colors.primary[400],
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: colors.primary[200],
  },
  dayText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.neutral[700],
  },
  dayTextSelected: {
    color: colors.surface,
    fontFamily: fonts.sansBold,
  },
  dayTextDisabled: {
    color: colors.neutral[300],
  },
  dayTextToday: {
    color: colors.primary[400],
    fontFamily: fonts.sansBold,
  },
  closeButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  closeText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.primary[400],
  },
});
