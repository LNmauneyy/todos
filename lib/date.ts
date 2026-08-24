// Minimal date helpers (yyyy-mm-dd ISO strings, local time) — no extra dependency needed.

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function today(): string {
  return toISODate(new Date());
}

export function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// 0 (Sun) .. 6 (Sat) for the 1st of the given month.
export function firstWeekday(year: number, month: number): number {
  return startOfMonth(year, month).getDay();
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export { MONTH_LABELS, WEEKDAY_LABELS };

export function formatFriendlyDate(iso: string): string {
  const d = fromISODate(iso);
  const todayIso = today();
  const tomorrowIso = addDays(todayIso, 1);
  if (iso === todayIso) return 'Today';
  if (iso === tomorrowIso) return 'Tomorrow';
  return `${MONTH_LABELS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

export function daysUntil(iso: string): number {
  const d = fromISODate(iso);
  const t = fromISODate(today());
  return Math.round((d.getTime() - t.getTime()) / 86400000);
}
