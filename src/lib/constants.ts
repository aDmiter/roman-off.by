export const CLUB_NAME = 'ROMANOFF';
export const CLUB_SUBTITLE = 'FIGHT CLUB';
export const CLUB_PHONE = '+375 29 725-16-40';
export const CLUB_PHONE_RAW = '+375297251640';
export const CLUB_ADDRESS = 'г. Брест, ул. Янки Купалы, 13Б';
export const CLUB_CITY = 'Брест';
export const COACH_NAME = 'Сергей Романов';

export const SITE_TITLE =
  'Бойцовский клуб ROMANOFF FIGHT CLUB в Бресте | Единоборства, самооборона, ММА';
export const SITE_DESCRIPTION =
  'Тренировки по рукопашному бою, каратэ и ММА для детей и взрослых в Бресте. Тренер — чемпион мира Сергей Романов. Запишись на первую тренировку!';

export const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

export const WEEKDAYS_SHORT = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

export const CATEGORIES = ['ДЕТИ', 'ПОДРОСТКИ', 'ВЗРОСЛЫЕ', 'ЖЕНСКАЯ', 'ОПЫТНЫЕ'];

export const CATEGORY_COLORS: Record<string, string> = {
  ДЕТИ: '#D4AF37',
  ПОДРОСТКИ: '#E0913A',
  ВЗРОСЛЫЕ: '#D4AF37',
  ЖЕНСКАЯ: '#F0D97A',
  ОПЫТНЫЕ: '#B8860B'
};

export const COACH_COLORS = [
  '#D4AF37',
  '#4F9DA6',
  '#C06C84',
  '#6C5CE7',
  '#E17055',
  '#00B894',
  '#0984E3',
  '#E84393'
];

export const DEFAULT_TOTAL_SESSIONS = 4;

export const MEMBERSHIP_SESSIONS = [4, 8, 12];

// Каталог разделов админки = единицы прав (RBAC).
export const ADMIN_SECTIONS = [
  { key: 'dashboard', label: 'Обзор', href: '/admin', icon: '◈' },
  { key: 'coaches', label: 'Тренеры', href: '/admin/coaches', icon: '◉' },
  { key: 'clients', label: 'Клиенты', href: '/admin/clients', icon: '▣' },
  { key: 'calendar', label: 'Календарь', href: '/admin/calendar', icon: '▦' },
  { key: 'schedule', label: 'Расписание', href: '/admin/schedule', icon: '▤' },
  { key: 'bookings', label: 'Заявки', href: '/admin/bookings', icon: '✉' },
  { key: 'memberships', label: 'Абонементы', href: '/admin/memberships', icon: '☰' },
  { key: 'scan', label: 'Сканировать', href: '/admin/scan', icon: '▤' },
  { key: 'settings', label: 'Настройки', href: '/admin/settings', icon: '⚙' },
  { key: 'users', label: 'Пользователи', href: '/admin/users', icon: '👤' }
] as const;

export type PermissionKey = (typeof ADMIN_SECTIONS)[number]['key'];

export const ALL_PERMISSION_KEYS: PermissionKey[] = ADMIN_SECTIONS.map((s) => s.key);
