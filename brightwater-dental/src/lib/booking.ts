// Booking logic (signature moment A): visit types, open days, side-by-side slots for a family.
// Pure and deterministic — demo availability is derived from a hash of date + chair + time,
// so every visitor sees the same calendar and tests are stable. A real practice swaps
// `isTaken` for its scheduling API (NexHealth / Dentrix / Open Dental).
import { hours } from '../config/site.ts';
import { fmt } from './hours.ts';

export type VisitId = 'new' | 'cleaning' | 'kids' | 'emergency' | 'aligners' | 'crown';
export const visitTypes: { id: VisitId; label: string; minutes: number; note: string }[] = [
  { id: 'new', label: 'New patient · $99', minutes: 60, note: 'Exam, cleaning, X-rays' },
  { id: 'cleaning', label: 'Cleaning & exam', minutes: 60, note: 'Existing patients' },
  { id: 'kids', label: "Kids' cleaning", minutes: 30, note: 'Under 14' },
  { id: 'emergency', label: 'Toothache / emergency', minutes: 30, note: '$59 exam + X-ray' },
  { id: 'aligners', label: 'Clear aligner consult', minutes: 30, note: 'Free 3D scan' },
  { id: 'crown', label: 'Crown / broken tooth', minutes: 60, note: 'Same-day crowns' },
];
export const CHAIRS = 3;
export const STEP = 30; // minutes

export type Day = { iso: string; weekday: number; label: string; short: string; open: number; close: number };

/** Next `count` open days starting from `from` (YYYY-MM-DD, practice time zone). Sundays are skipped. */
export function openDays(from: string, count = 12): Day[] {
  const out: Day[] = [];
  const d = new Date(`${from}T12:00:00Z`);
  for (let i = 0; out.length < count && i < count * 2; i++) {
    const cur = new Date(d.getTime() + i * 86400000);
    const weekday = cur.getUTCDay();
    const h = hours.days.find((x) => x.day === weekday);
    if (!h) continue;
    const iso = cur.toISOString().slice(0, 10);
    out.push({
      iso, weekday, open: h.open, close: h.close,
      label: cur.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' }),
      short: cur.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }),
    });
  }
  return out;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}
/** Demo occupancy: ~45% of chair half-hours are taken, a little busier on Saturdays and evenings. */
export function isTaken(iso: string, chair: number, min: number, weekday: number): boolean {
  const busy = 0.34 + (weekday === 6 ? 0.1 : 0) + (min >= 960 ? 0.08 : 0);
  return hash(`${iso}|${chair}|${min}`) < busy;
}

function chairFree(day: Day, chair: number, start: number, minutes: number): boolean {
  if (start + minutes > day.close) return false;
  for (let m = start; m < start + minutes; m += STEP) if (isTaken(day.iso, chair, m, day.weekday)) return false;
  return true;
}

export type Slot = { start: number; label: string; evening: boolean; mode: 'side-by-side' | 'back-to-back'; chairs: number[]; doneBy: number; starts: number[] };

/**
 * Start times where the whole group fits.
 * Up to 3 people: side by side, each in their own chair at the same time.
 * 4–5 people (or when side by side is impossible): back-to-back in pairs of chairs.
 */
export function slotsFor(day: Day, visits: VisitId[], nowMin = -1): Slot[] {
  const mins = visits.map((v) => visitTypes.find((t) => t.id === v)!.minutes);
  const out: Slot[] = [];
  for (let start = day.open; start < day.close; start += STEP) {
    if (start <= nowMin + 60) continue; // need an hour's notice today
    if (mins.length <= CHAIRS) {
      // greedy: longest visit first into the first free chair
      const order = mins.map((m, i) => [m, i] as const).sort((a, b) => b[0] - a[0]);
      const used = new Set<number>(); const chairs: number[] = [];
      let ok = true;
      for (const [m, i] of order) {
        const c = [0, 1, 2].find((ch) => !used.has(ch) && chairFree(day, ch, start, m));
        if (c === undefined) { ok = false; break; }
        used.add(c); chairs[i] = c;
      }
      if (ok) { out.push({ start, label: fmt(start), evening: start >= 990, mode: 'side-by-side', chairs, doneBy: start + Math.max(...mins), starts: mins.map(() => start) }); continue; }
    }
    // back-to-back: fill two chairs in sequence
    const lanes = [start, start]; const chairs: number[] = []; const starts: number[] = [];
    let ok = true;
    mins.forEach((m, i) => {
      if (!ok) return;
      const lane = lanes[0] <= lanes[1] ? 0 : 1;
      const t = lanes[lane];
      const c = [lane, 2].find((ch) => chairFree(day, ch, t, m));
      if (c === undefined) { ok = false; return; }
      chairs[i] = c; starts[i] = t; lanes[lane] += m;
    });
    if (ok && mins.length > 1) out.push({ start, label: fmt(start), evening: start >= 990, mode: 'back-to-back', chairs, doneBy: Math.max(...lanes), starts });
    else if (ok && mins.length === 1) out.push({ start, label: fmt(start), evening: start >= 990, mode: 'side-by-side', chairs, doneBy: start + mins[0], starts });
  }
  return out;
}

/** Read prefill hints from the URL: crew, day, comfort, insurance, doctor, visit. */
export function prefill(search: string) {
  const p = new URLSearchParams(search);
  const crew = p.get('crew');
  const visit = (p.get('visit') as VisitId) || null;
  const people: { who: string; visit: VisitId }[] =
    crew === 'family' ? [{ who: 'Adult', visit: 'cleaning' }, { who: 'Kid', visit: 'kids' }, { who: 'Kid', visit: 'kids' }]
    : crew === 'kids' ? [{ who: 'Adult', visit: 'cleaning' }, { who: 'Kid', visit: 'kids' }]
    : [{ who: 'Me', visit: visit ?? 'new' }];
  return {
    people,
    saturday: p.get('day') === 'sat',
    comfort: (p.get('comfort') ?? '').split(',').filter(Boolean),
    insurance: p.get('insurance') ?? '',
    doctor: p.get('doctor') ?? '',
  };
}
