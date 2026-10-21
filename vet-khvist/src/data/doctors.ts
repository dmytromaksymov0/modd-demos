// 9 fictional doctors. Photos only for people from consistent Pexels series (CREDITS.md); the others get an honest
// typographic card (name, specialty, years, shifts) — no silhouettes, initials in circles or grey placeholders.
export type Shift = 'день' | 'ніч';
export type Area = 'ter' | 'khir' | 'diag' | 'vuz';
export interface Doctor { id: string; areas: Area[]; name: string; role: string; plain: string; years: number; photo?: string; photoAlt?: string; caption?: string }

export const doctors: readonly Doctor[] = [
  { id: 'savchuk', areas: ['khir'], name: 'Дмитро Савчук', role: 'Хірург, анестезіолог', plain: 'операції, наркоз, травми', years: 11, 
    photo: 'doctor-male-pomeranian', photoAlt: 'Лікар у темно-синій формі зі стетоскопом тримає шпіца на руках', caption: 'Дмитро Савчук тримає шпіца' },
  { id: 'okonkwo', areas: ['ter', 'diag'], name: 'Ада Оконкво', role: 'Терапевт, лікарка УЗД', plain: 'огляди, УЗД, хронічні хвороби', years: 8, 
    photo: 'doctor-female-pomeranian', photoAlt: 'Лікарка в білому халаті стоїть за столом, на столі шпіц', caption: 'Ада Оконкво на прийомі' },
  { id: 'hnatenko', areas: ['ter'], name: 'Олексій Гнатенко', role: 'Черговий терапевт', plain: 'невідкладні випадки, нічні прийоми', years: 6, 
    photo: 'doctor-blue-shepherd', photoAlt: 'Лікар у блакитній формі зі стетоскопом сидить на краю столу й тримає руку на вівчарці', caption: 'Олексій Гнатенко з пацієнтом' },
  { id: 'kovalchuk', areas: ['vuz'], name: 'Ірина Ковальчук', role: 'Дерматолог', plain: 'шкіра, вуха, алергії', years: 9 },
  { id: 'lysenko', areas: ['khir'], name: 'Марко Лисенко', role: 'Хірург-ортопед', plain: 'переломи, суглоби, кульгавість', years: 12 },
  { id: 'moroz', areas: ['vuz', 'diag'], name: 'Тетяна Мороз', role: 'Кардіолог', plain: 'серце, ЕХО, задишка', years: 10 },
  { id: 'bondar', areas: ['khir'], name: 'Вікторія Бондар', role: 'Анестезіолог-реаніматолог', plain: 'стаціонар, кисневі бокси, інтенсивна терапія', years: 7 },
  { id: 'petrenko', areas: ['ter'], name: 'Сергій Петренко', role: 'Терапевт', plain: 'щеплення, огляди, кошенята й цуценята', years: 5 },
  { id: 'tkach', areas: ['khir', 'vuz'], name: 'Олена Ткач', role: 'Стоматолог', plain: 'зуби, санація під наркозом', years: 8 },
];

export const areas: readonly { id: Area; label: string }[] = [
  { id: 'ter', label: 'Терапія' }, { id: 'khir', label: 'Хірургія й наркоз' }, { id: 'diag', label: 'УЗД і ЕХО' }, { id: 'vuz', label: 'Вузькі спеціалісти' },
];

// Typical weekly duty roster (the clinic updates it every Monday). Night = 20:00–09:00.
export const roster: readonly { day: string; dayIds: string[]; nightIds: string[] }[] = [
  { day: 'Пн', dayIds: ['okonkwo', 'petrenko', 'lysenko', 'tkach'], nightIds: ['savchuk', 'bondar'] },
  { day: 'Вт', dayIds: ['okonkwo', 'petrenko', 'kovalchuk'], nightIds: ['hnatenko', 'bondar'] },
  { day: 'Ср', dayIds: ['okonkwo', 'petrenko', 'lysenko', 'moroz'], nightIds: ['hnatenko', 'savchuk'] },
  { day: 'Чт', dayIds: ['okonkwo', 'petrenko', 'kovalchuk', 'tkach'], nightIds: ['savchuk', 'bondar'] },
  { day: 'Пт', dayIds: ['okonkwo', 'petrenko', 'lysenko'], nightIds: ['hnatenko', 'bondar'] },
  { day: 'Сб', dayIds: ['okonkwo', 'petrenko', 'kovalchuk', 'moroz'], nightIds: ['hnatenko', 'savchuk'] },
  { day: 'Нд', dayIds: ['petrenko', 'hnatenko'], nightIds: ['savchuk', 'bondar'] },
];

/** «Удень: пн, ср · Уночі: вт, чт» — computed from the roster so cards never contradict the schedule. */
export function shiftsOf(id: string): string {
  const days = roster.filter((r) => r.dayIds.includes(id)).map((r) => r.day.toLowerCase());
  const nights = roster.filter((r) => r.nightIds.includes(id)).map((r) => r.day.toLowerCase());
  const part = (label: string, d: string[]) => (d.length === 7 ? `${label} щодня` : d.length ? `${label}: ${d.join(', ')}` : '');
  return [part('Удень', days), part('Уночі', nights)].filter(Boolean).join(' · ');
}
export const nightThisWeek = (): string[] => [...new Set(roster.flatMap((r) => r.nightIds))];
