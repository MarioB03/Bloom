import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { CheckinEntry } from '@/types/checkin';
import { emotionMap } from '@/constants/emotions';
import { strings } from '@/constants/strings';

function formatTimestamp(ts: { seconds: number }): string {
  const date = new Date(ts.seconds * 1000);
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportCheckins(checkins: CheckinEntry[]): Promise<void> {
  if (checkins.length === 0) return;

  const headers = [
    'Fecha',
    'Hora',
    'Emoción',
    'Intensidad',
    'Calidad sueño',
    'Hambre',
    'Fase ciclo',
    'Eventos',
    'Notas',
  ];

  const rows = checkins.map((c) => {
    const emotion = emotionMap[c.emotion];
    const events = c.events
      .filter((e) => e.title.trim())
      .map((e) => `${e.title}${e.description ? ': ' + e.description : ''}`)
      .join('; ');

    const cycleLabel = c.cyclePhase
      ? strings.cycle[c.cyclePhase] || c.cyclePhase
      : '';

    return [
      c.date,
      formatTimestamp(c.createdAt),
      emotion ? `${emotion.emoji} ${emotion.label}` : c.emotion,
      `${c.emotionIntensity}/5`,
      `${c.sleepQuality}/5`,
      `${c.hungerLevel}/5`,
      cycleLabel,
      escapeCSV(events),
      escapeCSV(c.notes || ''),
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');

  const filename = `bloom-checkins-${new Date().toISOString().split('T')[0]}.csv`;
  const filePath = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(filePath, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Exportar check-ins',
      UTI: 'public.comma-separated-values-text',
    });
  }
}
