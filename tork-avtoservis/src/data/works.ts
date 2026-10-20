// Labour norms for the calculator and price tables. Price of labour = class rate × norm hours, rounded to 10 ₴.
// Parts are never included — ours or the client's. Fixed-price items ignore the class rate.
export type Work = {
  id: string;
  label: string;
  service: 'diagnostyka' | 'khodova' | 'to' | 'halma' | 'kondytsioner';
  hours: number;          // norm hours
  minutes: number;        // typical time on the lift, shown to the client
  fixed?: number;         // fixed price, ₴ (class-independent)
  note?: string;
};

export const works: Work[] = [
  // Діагностика
  { id: 'diag-khodova', label: 'Діагностика ходової', service: 'diagnostyka', hours: 0.5, minutes: 30, fixed: 450, note: 'безкоштовно, якщо ремонт у нас' },
  { id: 'diag-comp', label: 'Комп’ютерна діагностика', service: 'diagnostyka', hours: 0.5, minutes: 30, fixed: 500 },
  { id: 'diag-full', label: 'Комплексна діагностика перед покупкою', service: 'diagnostyka', hours: 1.5, minutes: 90, fixed: 1500 },
  // ТО
  { id: 'oil', label: 'Мастило + фільтр', service: 'to', hours: 0.6, minutes: 40 },
  { id: 'filters', label: 'Повітряний і салонний фільтри', service: 'to', hours: 0.3, minutes: 20 },
  { id: 'spark-plugs', label: 'Свічки запалювання (4 шт.)', service: 'to', hours: 0.6, minutes: 40 },
  { id: 'coolant', label: 'Заміна антифризу', service: 'to', hours: 0.8, minutes: 50 },
  // Гальма
  { id: 'pads-front', label: 'Колодки передні', service: 'halma', hours: 0.75, minutes: 45 },
  { id: 'discs-front', label: 'Диски передні', service: 'halma', hours: 1.0, minutes: 60 },
  { id: 'pads-rear', label: 'Колодки задні', service: 'halma', hours: 0.8, minutes: 50 },
  { id: 'brake-fluid', label: 'Гальмівна рідина', service: 'halma', hours: 0.8, minutes: 45 },
  { id: 'caliper-service', label: 'Профілактика супортів (вісь)', service: 'halma', hours: 1.0, minutes: 60 },
  // Ходова
  { id: 'links-front', label: 'Стійки стабілізатора (пара)', service: 'khodova', hours: 0.6, minutes: 40 },
  { id: 'bushings-front', label: 'Втулки стабілізатора (пара)', service: 'khodova', hours: 0.7, minutes: 45 },
  { id: 'shocks-front', label: 'Амортизатори передні (пара)', service: 'khodova', hours: 2.2, minutes: 150 },
  { id: 'ball-joint', label: 'Кульова опора (1 шт.)', service: 'khodova', hours: 1.0, minutes: 60 },
  { id: 'tie-rod-end', label: 'Кермовий наконечник (1 шт.)', service: 'khodova', hours: 0.5, minutes: 30 },
  { id: 'alignment', label: 'Розвал-сходження', service: 'khodova', hours: 1.0, minutes: 50 },
  // Кондиціонер
  { id: 'ac-check', label: 'Кондиціонер: перевірка й заправка', service: 'kondytsioner', hours: 0.8, minutes: 50, note: 'фреон окремо' },
  { id: 'ac-clean', label: 'Антибактеріальна обробка', service: 'kondytsioner', hours: 0.5, minutes: 30 },
  { id: 'ac-leak', label: 'Пошук витоку (УФ-барвник)', service: 'kondytsioner', hours: 1.0, minutes: 60 },
];

// Jobs done together share disassembly — labour and time drop.
export const combos = [
  { ids: ['pads-front', 'discs-front'], hours: 0.4, minutes: 25, label: 'Колодки + диски разом' },
  { ids: ['shocks-front', 'links-front'], hours: 0.3, minutes: 20, label: 'Амортизатори + стійки разом' },
  { ids: ['ball-joint', 'alignment'], hours: 0.3, minutes: 15, label: 'Кульова + розвал разом' },
  { ids: ['oil', 'filters'], hours: 0.15, minutes: 10, label: 'Мастило + фільтри разом' },
  { ids: ['ac-check', 'ac-clean'], hours: 0.2, minutes: 10, label: 'Заправка + обробка разом' },
];

export const serviceLabels: Record<Work['service'], string> = {
  diagnostyka: 'Діагностика', khodova: 'Ходова', to: 'ТО та заміна мастила', halma: 'Гальма', kondytsioner: 'Кондиціонер',
};

export const homeWorks = ['pads-front', 'discs-front', 'oil', 'diag-khodova'];
