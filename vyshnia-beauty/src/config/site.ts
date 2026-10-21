// Concept site · fictional company. Phone is a demo number; the street does not exist in Kharkiv
// (checked in Nominatim 21.10.2026), the metro station does.
export const site = {
  name: 'Вишня, студія краси',
  short: 'Вишня',
  city: 'Харків',
  phone: '057 000 21 21',
  phoneHref: 'tel:+380570002121',
  telegram: 'https://t.me/vyshnia_demo',
  viber: 'viber://chat?number=%2B380570002121',
  instagram: 'https://www.instagram.com/vyshnia.demo/',
  address: 'вул. Фарфорова, 7',
  addressNote: '4 хв пішки від м. «Архітектора Бекетова» · 2 поверх, вхід з двору',
  hours: 'щодня 9:00–21:00',
  opensAt: '09:00',
  closesAt: '21:00',
  guaranteeDays: 21,
  topMarkup: 0.2,
} as const;

export const nav = [
  { href: '/poslugy/', label: 'Послуги та ціни' },
  { href: '/maistry/', label: 'Майстри' },
  { href: '/roboty/', label: 'Роботи' },
  { href: '/sterylnist/', label: 'Стерильність' },
  { href: '/sertyfikaty/', label: 'Сертифікати' },
  { href: '/kontakty/', label: 'Контакти' },
] as const;
