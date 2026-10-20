// Calculator: class × works → labour sum + time, minus combo savings. Pure — unit-tested in phase 5.
import type { Work } from '../data/works.ts';

export type Saving = { label: string; money: number; minutes: number };
export type CalcResult = { total: number; minutes: number; saving: number; savedMinutes: number; comboLabels: string[]; savings: Saving[] };

export const roundTo10 = (n: number) => Math.round(n / 10) * 10;

export function workPrice(w: Work, rate: number): number {
  return w.fixed ?? roundTo10(w.hours * rate);
}

export function calculate(selected: string[], rate: number, all: Work[], combos: { ids: string[]; hours: number; minutes: number; label: string }[]): CalcResult {
  const picked = all.filter((w) => selected.includes(w.id));
  // Paid diagnostics is free when a repair is booked together with it.
  const repairs = picked.filter((w) => w.service !== 'diagnostyka');
  let total = picked.reduce((s, w) => s + (w.id === 'diag-khodova' && repairs.length ? 0 : workPrice(w, rate)), 0);
  let minutes = picked.reduce((s, w) => s + w.minutes, 0);
  const freeDiag = picked.find((w) => w.id === 'diag-khodova');
  let saving = freeDiag && repairs.length ? freeDiag.fixed! : 0;
  let savedMinutes = 0;
  const comboLabels: string[] = [];
  const savings: Saving[] = [];
  for (const c of combos) {
    if (c.ids.every((id) => selected.includes(id))) {
      const s = roundTo10(c.hours * rate);
      total -= s; saving += s; minutes -= c.minutes; savedMinutes += c.minutes; comboLabels.push(c.label);
      savings.push({ label: c.label, money: s, minutes: c.minutes });
    }
  }
  if (freeDiag && repairs.length) savings.push({ label: 'Діагностика ходової при ремонті', money: freeDiag.fixed!, minutes: 0 });
  return { total, minutes, saving, savedMinutes, comboLabels, savings };
}

export function fmtMoney(n: number): string {
  return n.toLocaleString('uk-UA').replace(/\s/g, ' ') + ' ₴';
}

export function fmtTime(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  if (!h) return `${m} хв`;
  return m ? `${h} год ${m} хв` : `${h} год`;
}
