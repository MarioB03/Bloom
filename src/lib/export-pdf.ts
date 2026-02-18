import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { CheckinEntry } from '@/types/checkin';
import { emotionMap, emotions } from '@/constants/emotions';
import { strings } from '@/constants/strings';

// --- Helpers ---

function ts(entry: CheckinEntry): number {
  return entry.createdAt?.seconds
    ? entry.createdAt.seconds * 1000
    : new Date(entry.date).getTime();
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function formatTime(entry: CheckinEntry): string {
  if (!entry.createdAt?.seconds) return '';
  const d = new Date(entry.createdAt.seconds * 1000);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function groupByMonth(checkins: CheckinEntry[]): Record<string, CheckinEntry[]> {
  const groups: Record<string, CheckinEntry[]> = {};
  for (const c of checkins) {
    const key = c.date.substring(0, 7); // "YYYY-MM"
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }
  return groups;
}

function getMonthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const d = new Date(parseInt(y), parseInt(m) - 1, 1);
  const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function buildEmotionStats(checkins: CheckinEntry[]) {
  const counts: Record<string, number> = {};
  for (const c of checkins) {
    counts[c.emotion] = (counts[c.emotion] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([id, count]) => ({ id, count, pct: Math.round((count / checkins.length) * 100) }))
    .sort((a, b) => b.count - a.count);
}

function buildDayOfWeekStats(checkins: CheckinEntry[]) {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const counts = new Array(7).fill(0);
  for (const c of checkins) {
    const d = new Date(c.date + 'T12:00:00');
    counts[d.getDay()]++;
  }
  const max = Math.max(...counts, 1);
  return days.map((label, i) => ({ label, count: counts[i], pct: Math.round((counts[i] / max) * 100) }));
}

function avgValue(checkins: CheckinEntry[], field: 'emotionIntensity' | 'sleepQuality' | 'hungerLevel'): string {
  if (checkins.length === 0) return '—';
  const sum = checkins.reduce((acc, c) => acc + c[field], 0);
  return (sum / checkins.length).toFixed(1);
}

function intensityDots(value: number, max: number = 5): string {
  let html = '';
  for (let i = 1; i <= max; i++) {
    const filled = i <= value;
    html += `<span class="dot ${filled ? 'filled' : ''}" style="${filled ? 'background:#C4725A;' : ''}"></span>`;
  }
  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- Calendar grid for a month ---

function buildMonthCalendarHtml(ym: string, checkins: CheckinEntry[]): string {
  const [y, m] = ym.split('-').map(Number);
  const firstDay = new Date(y, m - 1, 1);
  const lastDay = new Date(y, m, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay(); // 0=Sun

  // Map date -> predominant emotion
  const dateEmotionMap: Record<number, string> = {};
  const dateCounts: Record<number, Record<string, number>> = {};
  for (const c of checkins) {
    const day = parseInt(c.date.split('-')[2]);
    if (!dateCounts[day]) dateCounts[day] = {};
    dateCounts[day][c.emotion] = (dateCounts[day][c.emotion] || 0) + 1;
  }
  for (const [day, emotions] of Object.entries(dateCounts)) {
    const top = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0];
    dateEmotionMap[parseInt(day)] = top[0];
  }

  const dayNames = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  let html = '<div class="cal-grid">';
  // Header
  for (const d of dayNames) {
    html += `<div class="cal-header">${d}</div>`;
  }
  // Empty cells before first day
  for (let i = 0; i < startWeekday; i++) {
    html += '<div class="cal-cell empty"></div>';
  }
  // Days
  for (let day = 1; day <= daysInMonth; day++) {
    const emotionId = dateEmotionMap[day];
    const emotion = emotionId ? emotionMap[emotionId as keyof typeof emotionMap] : null;
    const bgColor = emotion ? emotion.color + '25' : 'transparent';
    const borderColor = emotion ? emotion.color : 'transparent';
    html += `<div class="cal-cell" style="background:${bgColor};border-color:${borderColor}">`;
    html += `<span class="cal-day">${day}</span>`;
    if (emotion) {
      html += `<span class="cal-emoji">${emotion.emoji}</span>`;
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

// --- Main HTML builder ---

function buildHtml(checkins: CheckinEntry[], userName: string): string {
  const sorted = [...checkins].sort((a, b) => ts(b) - ts(a));
  const dateRange = sorted.length > 0
    ? `${formatDateShort(sorted[sorted.length - 1].date)} — ${formatDateShort(sorted[0].date)}`
    : '';
  const uniqueDays = new Set(sorted.map((c) => c.date)).size;
  const emotionStats = buildEmotionStats(sorted);
  const dowStats = buildDayOfWeekStats(sorted);
  const monthGroups = groupByMonth(sorted);
  const monthKeys = Object.keys(monthGroups).sort().reverse();

  const avgIntensity = avgValue(sorted, 'emotionIntensity');
  const avgSleep = avgValue(sorted, 'sleepQuality');

  // Streak
  const todayStr = new Date().toISOString().split('T')[0];
  const allDates = new Set(sorted.map((c) => c.date));
  let streak = 0;
  const d = new Date(todayStr + 'T12:00:00');
  while (allDates.has(d.toISOString().split('T')[0])) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @page {
    margin: 40px 36px;
    size: A4;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #2D2926;
    background: #FAF6F0;
    font-size: 11px;
    line-height: 1.5;
  }

  /* --- Cover --- */
  .cover {
    text-align: center;
    padding: 60px 40px 40px;
    page-break-after: always;
  }
  .cover-logo {
    font-size: 48px;
    font-weight: 300;
    color: #C4725A;
    letter-spacing: 6px;
    margin-bottom: 6px;
    font-family: Georgia, 'Times New Roman', serif;
  }
  .cover-tagline {
    font-size: 13px;
    color: #7A7570;
    letter-spacing: 2px;
    margin-bottom: 40px;
  }
  .cover-divider {
    width: 60px;
    height: 2px;
    background: linear-gradient(90deg, #C4725A, #E8A948, #8BA888);
    margin: 0 auto 40px;
    border-radius: 2px;
  }
  .cover-name {
    font-size: 22px;
    color: #44403C;
    font-family: Georgia, 'Times New Roman', serif;
    margin-bottom: 8px;
  }
  .cover-range {
    font-size: 13px;
    color: #7A7570;
    margin-bottom: 6px;
  }
  .cover-generated {
    font-size: 10px;
    color: #B8AFA6;
    margin-top: 40px;
  }
  .cover-plant {
    font-size: 56px;
    margin-bottom: 24px;
  }

  /* --- Summary stats --- */
  .stats-grid {
    display: flex;
    gap: 10px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .stat-box {
    flex: 1;
    min-width: 100px;
    background: #FFFFFF;
    border: 1px solid #E8E0D8;
    border-radius: 12px;
    padding: 14px 10px;
    text-align: center;
  }
  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #C4725A;
    font-family: Georgia, 'Times New Roman', serif;
  }
  .stat-label {
    font-size: 9px;
    color: #7A7570;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 4px;
  }

  /* --- Section --- */
  .section {
    margin-bottom: 28px;
  }
  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #44403C;
    font-family: Georgia, 'Times New Roman', serif;
    margin-bottom: 14px;
    padding-bottom: 6px;
    border-bottom: 2px solid #E8E0D8;
  }
  .section-title .icon { margin-right: 6px; }

  /* --- Emotion bars --- */
  .emotion-bar-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    gap: 8px;
  }
  .emotion-bar-emoji { font-size: 16px; width: 24px; text-align: center; }
  .emotion-bar-label {
    font-size: 11px;
    color: #44403C;
    width: 80px;
    font-weight: 500;
  }
  .emotion-bar-track {
    flex: 1;
    height: 16px;
    background: #F3EDE6;
    border-radius: 8px;
    overflow: hidden;
  }
  .emotion-bar-fill {
    height: 100%;
    border-radius: 8px;
    min-width: 2px;
  }
  .emotion-bar-pct {
    font-size: 10px;
    color: #7A7570;
    width: 32px;
    text-align: right;
    font-weight: 600;
  }

  /* --- Day-of-week chart --- */
  .dow-chart {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    height: 80px;
    gap: 6px;
    padding: 0 20px;
  }
  .dow-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
  }
  .dow-bar {
    width: 100%;
    max-width: 28px;
    background: linear-gradient(180deg, #C4725A, #D4937E);
    border-radius: 6px 6px 2px 2px;
    min-height: 4px;
  }
  .dow-label {
    font-size: 9px;
    color: #7A7570;
    margin-top: 4px;
    font-weight: 600;
  }
  .dow-count {
    font-size: 9px;
    color: #C4725A;
    margin-bottom: 3px;
    font-weight: 700;
  }

  /* --- Calendar --- */
  .month-section {
    margin-bottom: 24px;
    page-break-inside: avoid;
  }
  .month-title {
    font-size: 14px;
    font-weight: 600;
    color: #C4725A;
    font-family: Georgia, 'Times New Roman', serif;
    margin-bottom: 8px;
  }
  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 3px;
  }
  .cal-header {
    text-align: center;
    font-size: 9px;
    font-weight: 700;
    color: #7A7570;
    padding: 4px 0;
    text-transform: uppercase;
  }
  .cal-cell {
    text-align: center;
    padding: 4px 2px;
    border-radius: 6px;
    border: 1.5px solid transparent;
    min-height: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .cal-cell.empty { border: none; }
  .cal-day { font-size: 9px; color: #44403C; font-weight: 600; }
  .cal-emoji { font-size: 12px; line-height: 1.2; }

  /* --- Entry cards --- */
  .entries-month-title {
    font-size: 13px;
    font-weight: 600;
    color: #C4725A;
    margin: 20px 0 10px;
    font-family: Georgia, 'Times New Roman', serif;
  }
  .entry-card {
    background: #FFFFFF;
    border: 1px solid #E8E0D8;
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 10px;
    page-break-inside: avoid;
  }
  .entry-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #F3EDE6;
  }
  .entry-date {
    font-size: 11px;
    color: #7A7570;
    font-weight: 500;
  }
  .entry-emotion {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .entry-emotion-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 20px;
    color: #FFFFFF;
  }
  .entry-metrics {
    display: flex;
    gap: 16px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }
  .entry-metric {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .entry-metric-label {
    font-size: 9px;
    color: #7A7570;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #E8E0D8;
    margin: 0 1px;
  }
  .dot.filled { background: #C4725A; }
  .entry-events {
    margin-bottom: 8px;
  }
  .entry-event-tag {
    display: inline-block;
    font-size: 10px;
    background: #FEF7E8;
    color: #B57A20;
    padding: 2px 8px;
    border-radius: 10px;
    margin-right: 4px;
    margin-bottom: 3px;
    font-weight: 500;
  }
  .entry-notes {
    font-size: 11px;
    color: #5C5752;
    font-style: italic;
    background: #FAF6F0;
    padding: 8px 12px;
    border-radius: 8px;
    border-left: 3px solid #E8A948;
    line-height: 1.6;
  }
  .entry-cycle {
    font-size: 10px;
    color: #B58B9E;
    font-weight: 500;
  }

  /* --- Averages row --- */
  .avg-grid {
    display: flex;
    gap: 10px;
    margin-bottom: 24px;
  }
  .avg-box {
    flex: 1;
    background: #FFFFFF;
    border: 1px solid #E8E0D8;
    border-radius: 12px;
    padding: 12px;
    text-align: center;
  }
  .avg-label {
    font-size: 9px;
    color: #7A7570;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }
  .avg-value {
    font-size: 20px;
    font-weight: 700;
    color: #8BA888;
    font-family: Georgia, 'Times New Roman', serif;
  }
  .avg-scale {
    font-size: 9px;
    color: #B8AFA6;
  }

  /* --- Footer --- */
  .page-footer {
    text-align: center;
    font-size: 9px;
    color: #B8AFA6;
    margin-top: 30px;
    padding-top: 14px;
    border-top: 1px solid #E8E0D8;
  }

  /* --- Compost badge --- */
  .compost-badge {
    display: inline-block;
    font-size: 9px;
    background: #F0F5EF;
    color: #557055;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 600;
    margin-left: 6px;
  }
  .compost-reflection {
    font-size: 10px;
    color: #557055;
    background: #F0F5EF;
    padding: 6px 10px;
    border-radius: 6px;
    margin-top: 6px;
    border-left: 3px solid #8BA888;
  }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-plant">🌱</div>
  <div class="cover-logo">BLOOM</div>
  <div class="cover-tagline">TU JARDÍN DE BIENESTAR</div>
  <div class="cover-divider"></div>
  <div class="cover-name">${escapeHtml(userName)}</div>
  <div class="cover-range">${dateRange}</div>
  <div class="cover-range">${sorted.length} registros · ${uniqueDays} días activos</div>
  <div class="cover-generated">Generado el ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
</div>

<!-- SUMMARY PAGE -->
<div class="section">
  <div class="section-title">Resumen general</div>
  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-value">${sorted.length}</div>
      <div class="stat-label">Check-ins</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${uniqueDays}</div>
      <div class="stat-label">Días activos</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${streak}</div>
      <div class="stat-label">Racha actual</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${emotionStats.length > 0 ? (emotionMap[emotionStats[0].id as keyof typeof emotionMap]?.emoji || '') : '—'}</div>
      <div class="stat-label">Más frecuente</div>
    </div>
  </div>
</div>

<!-- AVERAGES -->
<div class="section">
  <div class="section-title">Promedios</div>
  <div class="avg-grid">
    <div class="avg-box">
      <div class="avg-label">Intensidad emocional</div>
      <div class="avg-value">${avgIntensity}</div>
      <div class="avg-scale">de 5</div>
    </div>
    <div class="avg-box">
      <div class="avg-label">Calidad de sueño</div>
      <div class="avg-value">${avgSleep}</div>
      <div class="avg-scale">de 5</div>
    </div>
    <div class="avg-box">
      <div class="avg-label">Nivel de hambre</div>
      <div class="avg-value">${avgValue(sorted, 'hungerLevel')}</div>
      <div class="avg-scale">de 5</div>
    </div>
  </div>
</div>

<!-- EMOTION DISTRIBUTION -->
<div class="section">
  <div class="section-title">Distribución emocional</div>
  ${emotionStats.map((s) => {
    const em = emotionMap[s.id as keyof typeof emotionMap];
    if (!em) return '';
    return `<div class="emotion-bar-row">
      <span class="emotion-bar-emoji">${em.emoji}</span>
      <span class="emotion-bar-label">${em.label}</span>
      <div class="emotion-bar-track">
        <div class="emotion-bar-fill" style="width:${Math.max(s.pct, 3)}%;background:${em.color};"></div>
      </div>
      <span class="emotion-bar-pct">${s.pct}%</span>
    </div>`;
  }).join('\n')}
</div>

<!-- DAY OF WEEK -->
<div class="section">
  <div class="section-title">Registros por día de la semana</div>
  <div class="dow-chart">
    ${dowStats.map((d) => `<div class="dow-col">
      <span class="dow-count">${d.count}</span>
      <div class="dow-bar" style="height:${Math.max(d.pct * 0.6, 4)}px;"></div>
      <span class="dow-label">${d.label}</span>
    </div>`).join('\n')}
  </div>
</div>

<!-- CALENDAR OVERVIEW -->
<div class="section">
  <div class="section-title">Calendario emocional</div>
  ${monthKeys.map((ym) => `<div class="month-section">
    <div class="month-title">${getMonthLabel(ym)}</div>
    ${buildMonthCalendarHtml(ym, monthGroups[ym])}
  </div>`).join('\n')}
</div>

<!-- DETAILED ENTRIES -->
<div class="section">
  <div class="section-title">Detalle de registros</div>
  ${monthKeys.map((ym) => {
    const entries = monthGroups[ym].sort((a, b) => ts(b) - ts(a));
    return `<div class="entries-month-title">${getMonthLabel(ym)}</div>
    ${entries.map((c) => {
      const em = emotionMap[c.emotion];
      const bgColor = em ? em.color : '#B8AFA6';
      const time = formatTime(c);
      const cycleLabel = c.cyclePhase && c.cyclePhase !== 'no_aplica'
        ? strings.cycle[c.cyclePhase]
        : '';
      const events = c.events.filter((e) => e.title.trim());

      return `<div class="entry-card">
        <div class="entry-header">
          <div>
            <span class="entry-date">${formatDateLong(c.date)}${time ? ` · ${time}` : ''}</span>
            ${c.composted ? '<span class="compost-badge">Compostado</span>' : ''}
          </div>
          <div class="entry-emotion">
            <span class="entry-emotion-badge" style="background:${bgColor};">
              ${em ? em.emoji : ''} ${em ? em.label : c.emotion}
            </span>
          </div>
        </div>
        <div class="entry-metrics">
          <div class="entry-metric">
            <span class="entry-metric-label">Intensidad</span>
            ${intensityDots(c.emotionIntensity)}
          </div>
          <div class="entry-metric">
            <span class="entry-metric-label">Sueño</span>
            ${intensityDots(c.sleepQuality)}
          </div>
          <div class="entry-metric">
            <span class="entry-metric-label">Hambre</span>
            ${intensityDots(c.hungerLevel)}
          </div>
          ${cycleLabel ? `<span class="entry-cycle">${cycleLabel}</span>` : ''}
        </div>
        ${events.length > 0 ? `<div class="entry-events">
          ${events.map((e) => `<span class="entry-event-tag">${escapeHtml(e.title)}</span>`).join('')}
        </div>` : ''}
        ${c.notes ? `<div class="entry-notes">${escapeHtml(c.notes)}</div>` : ''}
        ${c.compostReflection ? `<div class="compost-reflection">${escapeHtml(c.compostReflection)}</div>` : ''}
      </div>`;
    }).join('\n')}`;
  }).join('\n')}
</div>

<div class="page-footer">
  Bloom · Tu jardín de bienestar · ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
</div>

</body>
</html>`;
}

// --- Public API ---

export async function exportCheckinsPdf(
  checkins: CheckinEntry[],
  userName: string = 'Usuario'
): Promise<void> {
  if (checkins.length === 0) return;

  const html = buildHtml(checkins, userName);

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  // Rename to a friendlier filename
  const filename = `bloom-reporte-${new Date().toISOString().split('T')[0]}.pdf`;
  const destination = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.moveAsync({ from: uri, to: destination });

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(destination, {
      mimeType: 'application/pdf',
      dialogTitle: 'Exportar reporte Bloom',
      UTI: 'com.adobe.pdf',
    });
  }
}
