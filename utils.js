import crypto from 'node:crypto';

export function makeId(bytes = 12) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function truncate(value, max) {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function parseUserId(value = '') {
  return String(value).replace(/[<@!>]/g, '').trim();
}

export function brazilTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date);
  return Object.fromEntries(parts.map(part => [part.type, part.value]));
}

export function cgexIsOpen(now = new Date()) {
  const parts = brazilTimeParts(now);
  const day = parts.weekday;
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(day);
  const start = isWeekday ? 10 * 60 : 8 * 60 + 30;
  const end = isWeekday ? 21 * 60 + 30 : 23 * 60;
  return minutes >= start && minutes < end;
}

export function cgexHoursText() {
  return 'Segunda a sexta: 10:00 às 21:30\nSábado e domingo: 08:30 às 23:00 (horário de Brasília)';
}

export function shortDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}
