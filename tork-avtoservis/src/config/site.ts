// ТОРК Автосервіс — fictional company, demo data.
// Everything a real client would change lives here; components and schema.org read from it.

export const site = {
  name: 'ТОРК Автосервіс',
  shortName: 'ТОРК',
  since: 2014,
  phone: { display: '+380 57 000-14-14', href: 'tel:+380570001414' }, // 000 — clearly not a real Kharkiv number
  email: 'servis@tork.example',
  address: {
    street: 'вул. Ремісна, 14', // fictional street (checked in OpenStreetMap 20.10.2026: no such street in Kharkiv)
    district: 'Салтівка',
    city: 'Харків',
    zip: '61000',
    metro: 'м. Студентська',
    walk: '7 хв пішки',
  },
  // Messenger buttons open the booking form with the reply channel preselected (no real accounts in the demo).
  // For a real client: replace with t.me/<username> and the manager's Viber chat link (see README).
  channels: {
    telegram: { label: 'Telegram', href: '?kanal=telegram#zapys' },
    viber: { label: 'Viber', href: '?kanal=viber#zapys' },
  },
  // Direct chats for the "could not send" fallback. Tied to the demo number, so they lead nowhere real.
  // Replace with the manager's accounts at launch (README → «Що змінюється для реального клієнта»).
  messengers: {
    telegram: 'https://t.me/+380570001414',
    viber: 'viber://chat?number=%2B380570001414',
  },
  warranty: { months: 12, km: 10000 }, // brief said 6 months — raised to market level by the client's decision (phase 0)
} as const;

// Opening hours, Europe/Kyiv. 0 = Sunday. Minutes after midnight.
export const hours = {
  tz: 'Europe/Kyiv',
  days: [
    { day: 1, short: 'Пн', open: 510, close: 1140 }, // 8:30–19:00
    { day: 2, short: 'Вт', open: 510, close: 1140 },
    { day: 3, short: 'Ср', open: 510, close: 1140 },
    { day: 4, short: 'Чт', open: 510, close: 1140 },
    { day: 5, short: 'Пт', open: 510, close: 1140 },
    { day: 6, short: 'Сб', open: 540, close: 960 },  // 9:00–16:00
  ],
  summary: 'Пн–Пт 8:30–19:00 · Сб 9:00–16:00 · Нд вихідний',
} as const;

// Car classes for prices and the calculator. Labour rate per norm-hour, UAH.
export const carClasses = [
  { id: 'A', label: 'A', examples: 'Lanos, Aveo, Logan', rate: 800 },
  { id: 'B', label: 'B', examples: 'Octavia, Camry, Elantra', rate: 950 },
  { id: 'C', label: 'C', examples: 'RAV4, Tucson, Sportage', rate: 1100 },
  { id: 'D', label: 'D', examples: 'Land Cruiser, Prado, Touareg', rate: 1300 },
] as const;

export const power = {
  short: 'Працюємо під час відключень: генератор + Starlink',
  works: ['Підйомники й компресор', 'Діагностичні сканери', 'Термінал для оплати карткою', 'Кошторис і фотозвіт у Telegram', 'Кава й теплий зал очікування'],
  alarm: 'Під час повітряної тривоги роботи на підйомнику призупиняємо, клієнтів проводимо в укриття поруч.',
} as const;

export const nav = [
  { label: 'Майстри', href: '/#maistry' },
  { label: 'Послуги', href: '/poslugy/' },
  { label: 'Ціни', href: '/tsiny/' },
  { label: 'Калькулятор', href: '/kalkulyator/' },
  { label: 'Як ми працюємо', href: '/yak-my-pratsyuyemo/' },
  { label: 'Контакти', href: '/kontakty/' },
] as const;

export const cta = {
  book: { label: 'Записатися', href: '#zapys' },
} as const;

// Analytics stub — off in the demo. Set provider to 'plausible' or 'ga4' and fill the id to switch on.
export const analytics = {
  provider: 'none' as 'none' | 'plausible' | 'ga4',
  plausibleDomain: 'tork.example',
  ga4Id: 'G-XXXXXXXXXX',
};
