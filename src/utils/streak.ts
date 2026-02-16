import { formatDate } from './date';

/**
 * Calculate the current streak (consecutive days with check-ins)
 * from a list of dates that have check-ins.
 */
export function calculateStreak(checkinDates: string[]): number {
  if (checkinDates.length === 0) return 0;

  // Get unique dates sorted descending
  const uniqueDates = [...new Set(checkinDates)].sort((a, b) => b.localeCompare(a));

  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));

  // Streak must include today or yesterday to be active
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i - 1]);
    const prevDate = new Date(uniqueDates[i]);
    const diffDays = Math.round(
      (currentDate.getTime() - prevDate.getTime()) / 86400000
    );

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get the streak emoji based on the streak length
 */
export function getStreakEmoji(streak: number): string {
  if (streak === 0) return '🌱';
  if (streak <= 3) return '🌿';
  if (streak <= 7) return '🌻';
  if (streak <= 14) return '🌳';
  if (streak <= 30) return '🌺';
  return '🏆';
}

/**
 * Get a motivational message based on streak
 */
export function getStreakMessage(streak: number): string {
  if (streak === 0) return 'Empieza tu racha hoy';
  if (streak === 1) return '¡Primer día! Sigue así';
  if (streak <= 3) return `${streak} días seguidos 🌿`;
  if (streak <= 7) return `${streak} días · ¡Vas genial!`;
  if (streak <= 14) return `${streak} días · ¡Increíble!`;
  if (streak <= 30) return `${streak} días · ¡Imparable!`;
  return `${streak} días · ¡Leyenda! 🏆`;
}
