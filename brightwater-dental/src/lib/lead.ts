// Booking request validation + Telegram message. Pure — shared by functions/api/lead.ts and tests/.
import { hours } from '../config/site.ts';
import { visitTypes, type VisitId } from './booking.ts';
import { carriers, answer, type PlanType } from './insurance.ts';

export const COMFORTS = {
  sounds: 'The sounds → headphones', needles: 'Needles → numbing gel first', control: 'Out of control → stop signal',
  gagging: 'Gagging → small sensors, scan', judged: 'Being judged → no lectures', bills: 'Surprise bills → prices in writing',
} as const;
export const PREFERRED = { first: 'First available', evening: 'Weeknight after 4:30 pm', saturday: 'Saturday morning', day: 'Weekday daytime' } as const;
export const DOCTORS = { 'elena-ruiz': 'Dr. Ruiz', 'mark-holloway': 'Dr. Holloway', 'hannah-kessler': 'Dr. Kessler' } as const;

export type Person = { name: string; visit: VisitId };
export interface Booking {
  people: Person[];
  when: { date: string; time: string; mode: string } | { preferred: keyof typeof PREFERRED };
  comfort: (keyof typeof COMFORTS)[]; sedation: boolean;
  carrier: string; plan: PlanType; doctor: keyof typeof DOCTORS | '';
  name: string; phone: string; email?: string;
}
type Field = 'name' | 'phone' | 'email' | 'p0_name' | 'when' | 'people' | 'form';
export type BookingResult = { ok: true; booking: Booking } | { ok: false; spam?: true; errors: Partial<Record<Field, string>> };

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v: unknown) => (Array.isArray(v) ? v : v === undefined || v === null || v === '' ? [] : [v]).map((x) => str(x, 40));
export const phoneDigits = (v: string) => v.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
export const formatPhone = (d: string) => `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
const TIME = /^(1[0-2]|[1-9])(:(00|30))? (am|pm)$/;
export const timeToMin = (t: string) => { const m = t.match(TIME)!; const h = Number(m[1]) % 12 + (m[4] === 'pm' ? 12 : 0); return h * 60 + Number(m[3] ?? 0); };

/** `today` is YYYY-MM-DD in Austin; requests more than 60 days out or in the past are rejected. */
export function validateBooking(input: Record<string, unknown>, today: string): BookingResult {
  if (str(input.company, 200)) return { ok: false, spam: true, errors: { form: 'Rejected.' } };
  const e: Partial<Record<Field, string>> = {};

  const people: Person[] = [];
  for (let i = 0; i < 5; i++) {
    const name = str(input[`p${i}_name`], 60).replace(/\s+/g, ' ');
    const visit = str(input[`p${i}_visit`], 20) as VisitId;
    if (i > 0 && !name) continue;
    if (!visitTypes.some((v) => v.id === visit)) { e.people = 'Pick a visit type for everyone.'; continue; }
    people.push({ name, visit });
  }
  if (!people[0]?.name || people[0].name.length < 2) e.p0_name = 'Add the first person’s name.';

  let when: Booking['when'];
  const date = str(input.date, 10), time = str(input.time, 10);
  if (date || time) {
    const day = new Date(`${date}T12:00:00Z`);
    const h = hours.days.find((d) => d.day === day.getUTCDay());
    const diff = (day.getTime() - new Date(`${today}T12:00:00Z`).getTime()) / 86400000;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(day.getTime()) || !h || diff < 0 || diff > 60 || !TIME.test(time)) e.when = 'That time isn’t available any more — please pick another.';
    else {
      const m = timeToMin(time);
      if (m < h.open || m >= h.close) e.when = 'That time is outside our hours — please pick another.';
    }
    when = { date, time, mode: str(input.mode, 20) === 'back-to-back' ? 'back-to-back' : 'side-by-side' };
  } else {
    const p = str(input.preferred, 20);
    when = { preferred: (p in PREFERRED ? p : 'first') as keyof typeof PREFERRED };
  }

  const name = str(input.name, 80).replace(/\s+/g, ' ');
  const digits = phoneDigits(str(input.phone, 30));
  const email = str(input.email, 120);
  if (name.length < 2) e.name = 'Tell us who we’re texting.';
  if (digits.length !== 10 || /^[01]/.test(digits)) e.phone = 'We need a 10-digit US mobile number to text you.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) e.email = 'That email doesn’t look right — or leave it empty.';
  if (Object.keys(e).length) return { ok: false, errors: e };

  const carrier = carriers.some((c) => c.id === str(input.carrier, 20)) ? str(input.carrier, 20) : 'none';
  const plan = (['ppo', 'dhmo', 'unsure'].includes(str(input.plan, 10)) ? str(input.plan, 10) : 'unsure') as PlanType;
  const doctor = (str(input.doctor, 30) in DOCTORS ? str(input.doctor, 30) : '') as Booking['doctor'];
  return {
    ok: true,
    booking: {
      people, when, carrier, plan, doctor, name, phone: formatPhone(digits), email: email || undefined,
      comfort: [...new Set(list(input.comfort))].filter((c): c is keyof typeof COMFORTS => c in COMFORTS),
      sedation: str(input.sedation, 10) === 'ask',
    },
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const label = (v: VisitId) => visitTypes.find((t) => t.id === v)!.label;

export function telegramMessage(b: Booking, when: Date): string {
  const sent = new Intl.DateTimeFormat('en-US', { timeZone: hours.tz, dateStyle: 'medium', timeStyle: 'short' }).format(when);
  const slot = 'date' in b.when
    ? `${new Date(`${b.when.date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}, ${b.when.time}${b.people.length > 1 ? ` · ${b.when.mode.replace(/-/g, ' ')}` : ''}`
    : `${PREFERRED[b.when.preferred]} — text two options`;
  const ins = answer(b.carrier, b.plan);
  const lines = [
    `<b>📅 New booking request${b.people.length > 1 ? ` · ${b.people.length} people` : ''}</b>`, ``,
    `<b>When:</b> ${esc(slot)}`,
    ...b.people.map((p, i) => `<b>${i + 1}.</b> ${esc(p.name || `Person ${i + 1}`)} — ${esc(label(p.visit))}`), ``,
    `<b>Contact:</b> ${esc(b.name)} · <a href="tel:+1${phoneDigits(b.phone)}">${b.phone}</a>${b.email ? ` · ${esc(b.email)}` : ''}`,
    `<b>Insurance:</b> ${esc(carriers.find((c) => c.id === b.carrier)!.label)}${b.carrier === 'none' ? '' : ` (${b.plan.toUpperCase()})`} — ${esc(ins.amount)} ${esc(ins.amountLabel)}`,
  ];
  if (b.doctor) lines.push(`<b>Dentist:</b> ${DOCTORS[b.doctor]}`);
  if (b.comfort.length || b.sedation) lines.push(`<b>Comfort plan:</b> ${[...b.comfort.map((c) => COMFORTS[c]), ...(b.sedation ? ['Ask about sedation'] : [])].map(esc).join('; ')}`);
  lines.push(``, `<i>Sent ${sent} CT · confirm by text within 15 min</i>`);
  return lines.join('\n');
}

