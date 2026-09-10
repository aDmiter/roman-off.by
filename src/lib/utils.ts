export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function toDateKey(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromDateKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

export function parseDateInput(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

const MONTHS = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
];

export function formatDateRu(date: Date): string {
  const d = new Date(date);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function todayKey(): string {
  const d = new Date();
  return toDateKey(d);
}

export function generateMembershipCode(): string {
  const digits = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
  return `RFC-${digits}`;
}

export function normalizeBarcode(raw: string): string {
  return raw.replace(/[^0-9A-Za-z-]/g, '').toUpperCase();
}

export function formatTime(t: string): string {
  return t;
}
