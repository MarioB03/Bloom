import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { strings } from '@/constants/strings';

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDisplayDate(date: Date): string {
  if (isToday(date)) return 'Hoy';
  if (isYesterday(date)) return 'Ayer';
  return format(date, "EEEE, d 'de' MMMM", { locale: es });
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

export function formatMonthYear(date: Date): string {
  return format(date, "MMMM 'de' yyyy", { locale: es });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return strings.greeting.morning;
  if (hour < 20) return strings.greeting.afternoon;
  return strings.greeting.evening;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  // Convert Sunday=0 to Monday-first: Mon=0, Sun=6
  return day === 0 ? 6 : day - 1;
}
