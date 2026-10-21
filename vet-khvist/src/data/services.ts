// Four directions + «все включено» prices (phase 0, answer 4). Dog prices by four weight groups.
import { prices } from '../config/site.ts';
export interface Direction { id: string; title: string; reasons: string[]; from: number; fromNote?: string; href: string; photo: string; photoAlt: string; caption: string; position?: string }

export const directions: readonly Direction[] = [
  { id: 'terapiya', title: 'Терапія', reasons: ['не їсть, блює, млявий', 'кашляє, чхає', 'свербить, чухає вуха'], from: prices.exam, fromNote: 'огляд', href: '/poslugy/terapiya/',
    photo: 'cat-ear-exam', photoAlt: 'Рука лікаря відгортає вухо біло-сірого кота на синьому столі', caption: 'Огляд вуха кота', position: '40% 40%' },
  { id: 'khirurhiya', title: 'Хірургія', reasons: ['стерилізація й кастрація', 'рани, травми, переломи', 'зуби під наркозом'], from: prices.neuterCat, fromNote: 'кастрація кота, все включено', href: '/poslugy/khirurhiya/',
    photo: 'surgical-instruments', photoAlt: 'Стерильні хірургічні інструменти й серветка на синьому одноразовому покритті', caption: 'Стерильні інструменти перед операцією', position: '50% 50%' },
  { id: 'vaktsynatsiya', title: 'Вакцинація', reasons: ['перші щеплення кошенят і цуценят', 'щорічна ревакцинація', 'сказ і чіп для поїздок'], from: prices.vaccineCatFrom, fromNote: 'кіт, вакцина включена', href: '/poslugy/vaktsynatsiya/',
    photo: 'kitten-bodysuit-syringe', photoAlt: 'Черепахову кішку в синій попоні тримають на столі, поруч рука зі шприцом', caption: 'Кішка в попоні, поруч шприц', position: '50% 35%' },
  { id: 'diahnostyka', title: 'Діагностика', reasons: ['УЗД і рентген', 'аналізи за 30–60 хв', 'чекап після 8 років'], from: 700, fromNote: 'УЗД черевної порожнини', href: '/poslugy/diahnostyka/',
    photo: 'xray-pomeranian', photoAlt: 'Шпіц на столі рентгена, лікар налаштовує апарат', caption: 'Шпіц на столі рентгена', position: '50% 72%' },
];

export const weights = ['до 10 кг', '10–25 кг', '25–40 кг', '40+ кг'] as const;
export interface PriceRow { what: string; cat?: number; dog?: readonly number[]; note?: string }
export const allIn: readonly PriceRow[] = [
  { what: 'Стерилізація', cat: prices.spayCat, dog: [4800, 5900, 7200, 8600] },
  { what: 'Кастрація', cat: prices.neuterCat, dog: [3200, 3900, 4700, 5600] },
  { what: 'Комплексне щеплення', cat: prices.vaccineCatFrom, dog: [prices.vaccineDogFrom, prices.vaccineDogFrom, 950, 950], note: 'вакцина включена' },
  { what: 'Санація зубів під наркозом', cat: 2900, dog: [3100, 3600, 4200, 4800] },
];
export const allInIncludes = ['огляд і аналізи крові перед наркозом', 'наркоз з моніторингом серця й дихання', 'шви й знеболення', 'попона або комір', 'контрольний огляд через 10–14 днів'];
export const allInExcludes = 'Окремо — лише стаціонар, якщо він знадобиться, і ліки додому. Ціну плану лікування погоджуємо до процедур.';
