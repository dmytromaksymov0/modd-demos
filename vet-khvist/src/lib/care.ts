// «Календар турботи» (moment 4.3) — pure logic, unit-tested in tests/care.test.ts.
// A conservative, typical schedule to show what the club bot will remind about. The UI always adds
// «Схему щеплень визначає лікар на огляді» — this is a reminder plan, not a vaccination protocol.

export type Species = 'cat' | 'dog';
export type CareAge = 'baby' | 'young' | 'adult' | 'senior'; // до 4 міс · 4–12 міс · 1–8 років · 8+ років
export interface CareInput { species: Species; age: CareAge; lastVaccine?: string /* YYYY-MM */; today: Date }
export interface CareEvent { date: Date; title: string; note: string; kind: 'vaccine' | 'parasites' | 'checkup' }

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), 28));
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Next tick season start (1 March) or the 1st of next month inside the season (March–October). */
function nextTickDate(today: Date): Date {
  const m = today.getMonth(); // 0 = Jan
  if (m >= 2 && m <= 8) return new Date(today.getFullYear(), m + 1, 1); // Mar–Sep → next month's 1st
  return new Date(today.getFullYear() + (m >= 9 ? 1 : 0), 2, 1);         // Oct–Feb → 1 March
}

export function careEvents({ species, age, lastVaccine, today }: CareInput): CareEvent[] {
  const t0 = startOfDay(today);
  const complex = species === 'cat' ? 'від панлейкопенії, каліцивірозу й ринотрахеїту' : 'від чуми, парвовірусу, гепатиту й лептоспірозу';
  const ev: CareEvent[] = [];

  if (age === 'baby') {
    ev.push({ date: addDays(t0, 11), title: 'Обробка від глистів', note: 'за 10 днів до щеплення', kind: 'parasites' });
    ev.push({ date: addDays(t0, 21), title: 'Друге щеплення комплексною вакциною', note: complex, kind: 'vaccine' });
    ev.push({ date: addDays(t0, 42), title: 'Щеплення від сказу', note: 'потрібне й для поїздок', kind: 'vaccine' });
    ev.push({ date: addMonths(t0, 12), title: 'Перша щорічна ревакцинація', note: `${complex}, а також від сказу`, kind: 'vaccine' });
  } else {
    let next: Date;
    if (lastVaccine && /^\d{4}-\d{2}$/.test(lastVaccine)) {
      const [y, m] = lastVaccine.split('-').map(Number);
      next = new Date(y, m - 1 + 12, 1);
      if (next < t0) next = addDays(t0, 14); // overdue → as soon as possible
    } else next = addDays(t0, 14); // unknown date → check the passport soon
    ev.push({ date: addDays(next, -10), title: 'Обробка від глистів', note: 'за 10 днів до щеплення', kind: 'parasites' });
    ev.push({ date: next, title: 'Щорічна ревакцинація', note: `${complex}, а також від сказу`, kind: 'vaccine' });
    ev.push({ date: nextTickDate(t0), title: 'Обробка від кліщів і бліх', note: 'сезон — березень–жовтень, щомісяця', kind: 'parasites' });
    if (age === 'senior') ev.push({ date: addMonths(t0, 1), title: 'Чекап: аналізи крові й УЗД', note: 'після 8 років — двічі на рік', kind: 'checkup' });
    else ev.push({ date: addMonths(next, 0), title: 'Щорічний огляд', note: 'разом із щепленням', kind: 'checkup' });
  }
  return ev.filter((e) => e.date >= t0).sort((a, b) => +a.date - +b.date);
}

export const fmtDate = (d: Date) => new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' }).format(d);
export const daysUntil = (d: Date, today: Date) => Math.round((+startOfDay(d) - +startOfDay(today)) / 86400000);
export function inDays(n: number): string {
  if (n === 0) return 'сьогодні';
  if (n === 1) return 'завтра';
  const mod10 = n % 10, mod100 = n % 100;
  const w = mod10 === 1 && mod100 !== 11 ? 'день' : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'дні' : 'днів';
  return `через ${n} ${w}`;
}

/** A full year of reminders for the Club page: the key events + deworming every 3 months + monthly tick
 *  treatment in season (March–October). Sorted, de-duplicated by month+title, within 12 months from today. */
export function careYear(input: CareInput): CareEvent[] {
  const t0 = startOfDay(input.today);
  const end = addMonths(t0, 12);
  const ev = careEvents(input);
  const has = (title: string, d: Date) => ev.some((e) => e.title === title && e.date.getFullYear() === d.getFullYear() && e.date.getMonth() === d.getMonth());
  const firstWorm = ev.find((e) => e.title === 'Обробка від глистів')?.date ?? addDays(t0, 7);
  // Quarterly deworming anchored on the pre-vaccine one — both before and after it, inside the 12 months.
  for (let k = -4; k <= 4; k++) {
    if (k === 0) continue;
    const d = addMonths(firstWorm, 3 * k);
    if (d >= t0 && d < end && !has('Обробка від глистів', d)) ev.push({ date: d, title: 'Обробка від глистів', note: 'раз на 3 місяці', kind: 'parasites' });
  }
  for (let m = 0; m < 12; m++) {
    const d = new Date(t0.getFullYear(), t0.getMonth() + m + 1, 1);
    if (d.getMonth() >= 2 && d.getMonth() <= 9 && d < end && !has('Обробка від кліщів і бліх', d))
      ev.push({ date: d, title: 'Обробка від кліщів і бліх', note: 'сезон — березень–жовтень', kind: 'parasites' });
  }
  return ev.filter((e) => e.date >= t0 && e.date < end).sort((a, b) => +a.date - +b.date);
}
