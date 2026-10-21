// Prices: centre of Kharkiv, October 2026. Top master = ×1.2, rounded to 10 ₴ (topPrice()).
// `coat: true` — a gel / gel-polish coating: the shade sub-step and the 21-day guarantee apply.
import { site } from '../config/site.ts';

export type Group = 'manicure' | 'pedicure' | 'brows' | 'lashes';
export interface Service { id: string; group: Group; name: string; short: string; minutes: number; price: number; coat: boolean; note?: string; includes?: string; lasts?: string }

export const groups: { id: Group; name: string; photo: string; from: number; minutes: number; lead: string }[] = [
  { id: 'manicure', name: 'Манікюр з покриттям', photo: 'svc-manicure', from: 750, minutes: 105, lead: 'зняття, манікюр, гель-лак' },
  { id: 'pedicure', name: 'Педикюр з покриттям', photo: 'svc-pedicure', from: 950, minutes: 120, lead: 'стопи й пальчики, гель-лак' },
  { id: 'brows', name: 'Брови', photo: 'svc-brows', from: 450, minutes: 45, lead: 'форма й колір, ламінування' },
  { id: 'lashes', name: 'Вії', photo: 'svc-lashes', from: 800, minutes: 75, lead: 'ламінування, нарощування' },
];

export const services: Service[] = [
  { id: 'mani-coat', group: 'manicure', name: 'Манікюр з покриттям гель-лаком', short: 'Манікюр з покриттям', minutes: 105, price: 750, coat: true, note: 'зняття старого покриття входить', includes: 'зняття, апаратний або комбінований манікюр, форма, гель-лак в один тон', lasts: '3–4 тижні' },
  { id: 'mani-strong', group: 'manicure', name: 'Манікюр зі зміцненням і покриттям', short: 'Манікюр зі зміцненням', minutes: 120, price: 850, coat: true, includes: 'усе з манікюру з покриттям + вирівнювання й зміцнення гелем', lasts: '3–4 тижні, для тонких і ламких нігтів' },
  { id: 'mani-clean', group: 'manicure', name: 'Манікюр без покриття', short: 'Манікюр без покриття', minutes: 60, price: 450, coat: false, includes: 'форма, кутикула, догляд олійкою; можна з чоловічим манікюром', lasts: 'до наступного візиту через 2–3 тижні' },
  { id: 'mani-ext', group: 'manicure', name: 'Нарощування нігтів з покриттям', short: 'Нарощування', minutes: 165, price: 1300, coat: true, includes: 'манікюр, нарощування гелем на форми, архітектура, покриття', lasts: 'корекція через 3–4 тижні' },
  { id: 'pedi-coat', group: 'pedicure', name: 'Педикюр з покриттям гель-лаком', short: 'Педикюр з покриттям', minutes: 120, price: 950, coat: true, includes: 'зняття, обробка стоп і пальчиків апаратом, гель-лак', lasts: '4–5 тижнів' },
  { id: 'pedi-toes', group: 'pedicure', name: 'Пальчики з покриттям', short: 'Пальчики з покриттям', minutes: 75, price: 650, coat: true, includes: 'зняття, обробка пальчиків без стоп, гель-лак', lasts: '4–5 тижнів' },
  { id: 'pedi-clean', group: 'pedicure', name: 'Педикюр без покриття', short: 'Педикюр без покриття', minutes: 75, price: 700, coat: false, includes: 'обробка стоп і пальчиків, тріщини й натоптиші, догляд', lasts: 'раз на 4–6 тижнів' },
  { id: 'brows-shape', group: 'brows', name: 'Корекція й фарбування брів', short: 'Брови: форма й колір', minutes: 45, price: 450, coat: false, includes: 'підбір форми під обличчя, корекція пінцетом, фарба або хна', lasts: 'фарба 3–4 тижні' },
  { id: 'brows-lam', group: 'brows', name: 'Ламінування брів з фарбуванням', short: 'Ламінування брів', minutes: 75, price: 750, coat: false, includes: 'ламінування, фарбування, корекція форми, догляд', lasts: '5–6 тижнів' },
  { id: 'lash-lam', group: 'lashes', name: 'Ламінування вій з фарбуванням', short: 'Ламінування вій', minutes: 75, price: 800, coat: false, includes: 'підкручування, фарбування, ботокс-догляд', lasts: '6–8 тижнів' },
  { id: 'lash-2d', group: 'lashes', name: 'Нарощування вій 2D', short: 'Нарощування 2D', minutes: 150, price: 1100, coat: false, includes: 'підбір вигину й довжини, легкий обʼєм 2D, гіпоалергенний клей', lasts: 'корекція через 2–3 тижні' },
];

export const topPrice = (price: number) => Math.round((price * (1 + site.topMarkup)) / 10) * 10;
export const duration = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60;
  return [h && `${h} год`, m && `${m} хв`].filter(Boolean).join(' ');
};
export const uah = (n: number) => `${n.toLocaleString('uk-UA').replace(/\s/g, ' ')} ₴`;
