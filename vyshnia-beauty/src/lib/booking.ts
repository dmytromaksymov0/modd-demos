// Booking logic for «Запис за 4 кроки». Pure and deterministic — shared by the page (booking-ui.ts),
// the Pages Function (lead.ts) and tests/. Demo slots come from a hash of master + date + time, so the same day
// always looks the same, and «today» never offers a time that has already passed.
import { site } from '../config/site.ts';
import { services, groups, topPrice, type Group, type Service } from '../data/services.ts';
import { masters, type Master } from '../data/masters.ts';
import { shades } from '../data/shades.ts';

export const OPEN = 9 * 60;            // 09:00
export const CLOSE = 21 * 60;          // 21:00 — the last service must end by then
export const STEP = 30;                // slot grid, minutes
export const HORIZON = 14;             // days offered in the strip
export const ANY = 'any';

/** Weekly day off per master (0 = Sunday). Nobody is off on Saturday. */
export const DAY_OFF: Record<string, number> = { olena: 1, daryna: 0, sofiia: 3, marta: 2, iryna: 0, alina: 4 };

export const serviceById = (id: string): Service | undefined => services.find((s) => s.id === id);
export const masterById = (id: string): Master | undefined => masters.find((m) => m.id === id);
export const groupOf = (id: string): Group | undefined => (groups.some((g) => g.id === id) ? (id as Group) : serviceById(id)?.group);
export const servicesIn = (g: Group) => services.filter((s) => s.group === g);
export const defaultService = (g: Group) => servicesIn(g)[0];
export const mastersFor = (g: Group) => masters.filter((m) => m.groups.includes(g));
export const isShade = (id: string) => shades.some((s) => s.id === id) || id === 'na-mistsi';

/** Price for a service with a master; «any» = regular price (the studio assigns a free master, top surcharge never applies). */
export function priceFor(serviceId: string, masterId: string = ANY): number | null {
  const s = serviceById(serviceId); if (!s) return null;
  const m = masterId === ANY ? undefined : masterById(masterId);
  return m?.top ? topPrice(s.price) : s.price;
}

// ── dates (local calendar dates as YYYY-MM-DD, no time zone drift) ───────────────────────────────────────────────
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseIso = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDaysIso = (s: string, n: number) => { const d = parseIso(s); d.setDate(d.getDate() + n); return iso(d); };
export const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
export const toMin = (t: string) => { const m = /^(\d{2}):(\d{2})$/.exec(t); return m ? +m[1] * 60 + +m[2] : NaN; };

/** «Today» and minutes since midnight in Kyiv — the studio's clock, not the visitor's or the server's. */
export function kyivNow(now: Date): { today: string; nowMin: number } {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now).map((x) => [x.type, x.value]));
  return { today: `${p.year}-${p.month}-${p.day}`, nowMin: +p.hour * 60 + +p.minute };
}

/** Guarantee end date for coated services: visit + 21 days. */
export const guaranteeIso = (visitIso: string) => addDaysIso(visitIso, site.guaranteeDays);

// ── slots ────────────────────────────────────────────────────────────────────────────────────────────────────────
/** FNV-1a → [0, 1). */
function rand(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return ((h >>> 0) % 10000) / 10000;
}

export const worksOn = (masterId: string, dateIso: string) => DAY_OFF[masterId] !== parseIso(dateIso).getDay();

/** Is the master busy at minute `t` on `dateIso`? Busier in the evening and on Saturday — like a real studio. */
function busyAt(masterId: string, dateIso: string, t: number): boolean {
  const evening = t >= 17 * 60 ? 0.15 : 0;
  const saturday = parseIso(dateIso).getDay() === 6 ? 0.12 : 0;
  return rand(`${masterId}|${dateIso}|${t}`) < 0.42 + evening + saturday;
}

export interface Slot { t: string; free: boolean; master?: string }

/**
 * Slots for one master (or ANY within a group) on a date: start times on a 30-minute grid that let the service end by
 * closing time; a start is free or taken (demo hash). `nowMin` (minutes since midnight, Kyiv) hides past times today.
 */
export function slotsFor(opts: { service: string; master: string; date: string; today: string; nowMin: number }): Slot[] {
  const s = serviceById(opts.service); if (!s) return [];
  const g = s.group;
  const pool = opts.master === ANY ? mastersFor(g).map((m) => m.id) : [opts.master];
  const out: Slot[] = [];
  const minStart = opts.date === opts.today ? Math.ceil((opts.nowMin + 60) / STEP) * STEP : OPEN; // book ≥ 1 h ahead
  for (let t = OPEN; t + s.minutes <= CLOSE; t += STEP) {
    if (t < minStart) continue;
    const who = pool.find((m) => worksOn(m, opts.date) && !busyAt(m, opts.date, t));
    out.push({ t: hhmm(t), free: !!who, master: who });
  }
  return out;
}

/** The first free slot within HORIZON days — «найближче вікно». */
export function nearest(opts: { service: string; master: string; today: string; nowMin: number }): { date: string; t: string; master: string } | null {
  for (let i = 0; i < HORIZON; i++) {
    const date = addDaysIso(opts.today, i);
    const hit = slotsFor({ ...opts, date }).find((x) => x.free);
    if (hit) return { date, t: hit.t, master: hit.master! };
  }
  return null;
}

/** Group slots for display: Ранок < 12:00 ≤ День < 17:00 ≤ Вечір. */
export function partsOfDay(slots: Slot[]) {
  const parts = [{ label: 'Ранок', slots: [] as Slot[] }, { label: 'День', slots: [] as Slot[] }, { label: 'Вечір', slots: [] as Slot[] }];
  for (const s of slots) { const m = toMin(s.t); parts[m < 720 ? 0 : m < 1020 ? 1 : 2].slots.push(s); }
  return parts.filter((p) => p.slots.length);
}

/** Server-side check of a requested booking: the slot must exist and be free for that master (or ANY). */
export function isBookable(opts: { service: string; master: string; date: string; t: string; today: string; nowMin: number }): boolean {
  const d = parseIso(opts.date); if (Number.isNaN(d.getTime())) return false;
  const diff = Math.round((d.getTime() - parseIso(opts.today).getTime()) / 864e5);
  if (diff < 0 || diff >= HORIZON) return false;
  return slotsFor(opts).some((x) => x.t === opts.t && x.free);
}
