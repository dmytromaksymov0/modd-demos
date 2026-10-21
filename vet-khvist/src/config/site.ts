// Ветклініка «Хвіст» — fictional company, demo data.
// Everything a real client would change lives here; components and schema.org read from it.

export const site = {
  name: 'Ветклініка «Хвіст»',
  shortName: 'Хвіст',
  phone: { display: '057 000 24 24', intl: '+380 57 000 24 24', href: 'tel:+380570002424' }, // 000 — clearly not a real Kharkiv number
  email: 'likar@khvist.example',
  address: {
    street: 'вул. Ліхтарна, 9', // fictional: no «Ліхтарна» in Kharkiv (OpenStreetMap Overpass + Nominatim, 21.10.2026)
    city: 'Харків',
    zip: '61000',
    metro: 'м. «Пушкінська»',
    walk: '4 хв пішки',
    entrance: 'вхід з двору, дзвінок ліворуч',
  },
  doctors: 9,
} as const;

// Europe/Kyiv. The clinic never closes; what changes is who is on site and the night tariff.
export const time = {
  tz: 'Europe/Kyiv',
  nightFrom: 22 * 60, // 22:00 — night tariff on examinations, urgent door widens
  nightTo: 8 * 60, //    08:00
  curfewFrom: 0, //      00:00 — комендантська година (Харків, рішення Ради оборони області, 2025)
  curfewTo: 5 * 60, //   05:00
} as const;

// Approved copy (phase 0, answer 3). Never tell people they may drive during the curfew.
export const curfew = {
  title: 'Черговий лікар на телефоні',
  text: 'Зараз комендантська година до 05:00. Подзвоніть: опишіть, що сталося, — лікар скаже, що робити до ранку і чи можна дочекатися 05:00.',
} as const;

// Prices, UAH (phase 0, answer 4). Night ×1.5 on examinations only; surgery and lab tests without a night surcharge.
export const prices = {
  exam: 550,
  urgentExam: 600,
  specialist: 750,
  nightFactor: 1.5,
  vaccineCatFrom: 850,
  vaccineDogFrom: 900,
  spayCat: 3400, // «все включено»
  neuterCat: 2300,
} as const;
export const nightPrice = (n: number) => Math.round(n * prices.nightFactor);

export const power = {
  short: 'Операційна працює без світла',
  detail: 'генератор + Starlink',
  works: ['Операційна й наркозний апарат', 'Кисневі бокси стаціонару', 'Рентген і УЗД', 'Лабораторія', 'Термінал для оплати карткою', 'Зв’язок і Telegram-бот'],
  alarm: 'Під час тривоги операції не перериваємо: операційна й стаціонар у захищеній частині будівлі.',
} as const;

// Club (phase 0, answer 5)
export const club = {
  discount: 10,
  short: '−10 % на щеплення й огляди, нагадування в Telegram',
} as const;

// Reasons for a planned visit — plain words (One Medical, phase 0). Used by the plan door and the booking form.
export const planReasons = ['щеплення', 'стерилізацію', 'огляд', 'кігті й вуха', 'УЗД та аналізи', 'перед поїздкою за кордон'] as const;

export const nav = [
  { href: '/nevidkladna/', label: 'Невідкладна допомога' },
  { href: '/poslugy/', label: 'Послуги' },
  { href: '/tsiny/', label: 'Ціни' },
  { href: '/likari/', label: 'Лікарі' },
  { href: '/klub/', label: 'Клуб турботи' },
] as const;

// Analytics stub — off in the demo. For a real client: 'plausible' (cookieless, no banner) or 'ga4' with an id.
export const analytics = { provider: 'none' as 'none' | 'plausible' | 'ga4', plausibleDomain: 'vet-khvist.pages.dev', ga4Id: 'G-XXXXXXXXXX' };
