// The five service pages (phase 4) and their cards on the home page.
import type { ImageMetadata } from 'astro';
import oilPhoto from '../assets/photos/oleg-engine.jpg';
import wheelPhoto from '../assets/photos/oleg-wheel.jpg';
import acPhoto from '../assets/photos/ac-panel.jpg';
import brakesPhoto from '../assets/photos/andrii-brakes.jpg';
import tabletPhoto from '../assets/photos/andrii-tablet.jpg';

export type Service = {
  slug: string; title: string; symptom: string; works: string[]; time: string;
  photo?: { src: ImageMetadata; alt: string; position: string };
  includes?: string[];
  note?: string;
};

export const services: Service[] = [
  { slug: 'diagnostyka', title: 'Діагностика', symptom: 'Горить «Check», троїть, дивний звук — спершу причина', works: ['diag-khodova', 'diag-comp'], time: '30 хв',
    photo: { src: tabletPhoto, alt: 'Андрій, діагност, біля авто в цеху', position: '50% 20%' }, note: 'Діагностика ходової безкоштовна, якщо ремонт у нас',
    includes: ['сканування всіх блоків, коди помилок', 'ходова й кермо на підйомнику', 'гальма: колодки, диски, рідина', 'кошторис із фото в Telegram'] },
  { slug: 'khodova', title: 'Ходова', symptom: 'Стукає спереду на ямах, тягне вбік, гуде на швидкості', works: ['links-front', 'shocks-front'], time: 'від 40 хв',
    photo: { src: wheelPhoto, alt: 'Олег знімає колесо з позашляховика на підйомнику — видно амортизатор і пружину', position: '55% 45%' },
    includes: ['стійки й втулки стабілізатора', 'амортизатори', 'кульові, сайлентблоки', 'кермові наконечники'] },
  { slug: 'to-ta-zamina-olyvy', title: 'ТО та заміна мастила', symptom: 'Пробіг 10–15 тис. км або рік від останньої заміни', works: ['oil'], time: '40 хв',
    photo: { src: oilPhoto, alt: 'Майстер у синьому комбінезоні біля відкритого капота', position: '40% 50%' }, note: 'Можна своє мастило й фільтри',
    includes: ['мастило й масляний фільтр', 'повітряний і салонний фільтри', 'огляд рідин і ременів'] },
  { slug: 'halma', title: 'Гальма', symptom: 'Скрипить, педаль провалюється, б’є в кермо при гальмуванні', works: ['pads-front', 'discs-front'], time: 'від 45 хв',
    photo: { src: brakesPhoto, alt: 'Андрій із лампою оглядає гальмівний супорт і диск на підйомнику', position: '62% 45%' },
    includes: ['колодки й диски', 'профілактика супортів', 'гальмівна рідина'] },
  { slug: 'kondytsioner', title: 'Кондиціонер', symptom: 'Дме тепле, пахне сирістю, клацає компресор', works: ['ac-check'], time: '50 хв', note: 'Фреон R134a / R1234yf — окремо, за вагою',
    photo: { src: acPhoto, alt: 'Панель клімат-контролю в салоні: A/C увімкнено, 23 °C', position: '50% 50%' },
    includes: ['перевірка тиску й витоків', 'заправка за вагою', 'антибактеріальна обробка'] },
];
