// Booking / club request validation + Telegram message. Pure — shared by functions/api/lead.ts and tests/.
import { site, time, planReasons } from '../config/site.ts';

export const CHANNELS = { telegram: 'Telegram', call: 'Дзвінок' } as const;
export type Channel = keyof typeof CHANNELS;
export const KINDS = { zapys: 'Запис', klub: 'Клуб турботи' } as const;
export type Kind = keyof typeof KINDS;
export const PETS = { kit: 'кіт', pes: 'собака', inshe: 'інша тварина' } as const;
export const AGES = ['до 4 міс', 'до року', 'дорослий', '8+ років'] as const;

export interface Lead {
  kind: Kind;
  phone: string; phoneDigits: string;
  name?: string; petName?: string; pet?: keyof typeof PETS;
  reasons: string[]; when?: string; note?: string; age?: string; lastVaccine?: string;
  channel: Channel;
  triage?: string;  // result of «Чи терміново?» carried into the form
  page?: string;
}
type Field = 'phone' | 'name' | 'form';
export type LeadResult = { ok: true; lead: Lead } | { ok: false; spam?: true; errors: Partial<Record<Field, string>> };

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');
/** On-site path only: «/x/y», never «//host» (protocol-relative = open redirect). */
const ON_SITE = /^\/(?!\/)[\w\-/]*$/;
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v: unknown) => (Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : []).map((x) => str(x, 60)).filter(Boolean);

/** Ukrainian phone → 12 digits starting with 380, or null. Accepts +380…, 380…, 0XXXXXXXXX with spaces/dashes/brackets. */
export function normalizeUaPhone(raw: string): string | null {
  let d = raw.replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('0')) d = '38' + d;
  else if (d.length === 9) d = '380' + d;
  if (!/^380\d{9}$/.test(d)) return null;
  if (d[3] === '0') return null;
  return d;
}
export const formatUaPhone = (d: string) => `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;

export const PHONE_REQUIRED = 'Вкажіть телефон — без нього не зможемо записати.';
export const PHONE_INVALID = 'Перевірте номер: потрібно 10 цифр, наприклад 067 123 45 67, або +380 і 9 цифр.';

export function validateLead(input: Record<string, unknown>): LeadResult {
  if (str(input.company, 200)) return { ok: false, spam: true, errors: { form: 'Відхилено.' } };
  const e: Partial<Record<Field, string>> = {};
  const rawPhone = str(input.phone, 40);
  const digits = normalizeUaPhone(rawPhone);
  if (!rawPhone) e.phone = PHONE_REQUIRED;
  else if (!digits) e.phone = PHONE_INVALID;
  const name = str(input.name, 60);
  if (name && name.length < 2) e.name = 'Ім’я закоротке — або залиште поле порожнім.';
  if (Object.keys(e).length) return { ok: false, errors: e };

  const kind = (str(input.kind, 8) in KINDS ? str(input.kind, 8) : 'zapys') as Kind;
  const channel = (str(input.kanal, 10) in CHANNELS ? str(input.kanal, 10) : 'call') as Channel;
  const pet = (str(input.vyd, 8) in PETS ? str(input.vyd, 8) : undefined) as Lead['pet'];
  const reasons = [...new Set(list(input.pryvid))].filter((r) => (planReasons as readonly string[]).includes(r));
  const page = str(input.page, 80);
  return {
    ok: true,
    lead: {
      kind, phone: formatUaPhone(digits!), phoneDigits: digits!, channel,
      name: name || undefined, petName: str(input.klychka, 40) || undefined, pet,
      reasons, when: str(input.koly, 60) || undefined, note: text(input.note, 1000) || undefined,
      age: (AGES as readonly string[]).includes(str(input.vik, 20)) ? str(input.vik, 20) : undefined,
      lastVaccine: str(input.ostannie, 20) || undefined,
      triage: str(input.triage, 120) || undefined,
      page: ON_SITE.test(page) ? page : undefined,
    },
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function telegramMessage(l: Lead, when: Date): string {
  const sent = new Intl.DateTimeFormat('uk-UA', { timeZone: time.tz, dateStyle: 'medium', timeStyle: 'short' }).format(when);
  const reply = l.channel === 'telegram' ? 'написати в Telegram' : 'подзвонити';
  const out = [
    `<b>${l.kind === 'klub' ? 'Клуб турботи · новий учасник' : 'Нова заявка на запис'} · Хвіст</b>`, ``,
    `<b>Телефон:</b> <a href="tel:+${l.phoneDigits}">${l.phone}</a>`,
    `<b>Відповісти:</b> ${reply}`,
  ];
  if (l.name) out.push(`<b>Ім’я:</b> ${esc(l.name)}`);
  if (l.pet || l.petName) out.push(`<b>Тварина:</b> ${[l.pet ? PETS[l.pet] : '', l.petName ? esc(l.petName) : ''].filter(Boolean).join(', ')}`);
  if (l.age) out.push(`<b>Вік:</b> ${esc(l.age)}`);
  if (l.reasons.length) out.push(`<b>Привід:</b> ${l.reasons.map(esc).join(', ')}`);
  if (l.lastVaccine) out.push(`<b>Останнє щеплення:</b> ${esc(l.lastVaccine)}`);
  if (l.when) out.push(`<b>Зручний час:</b> ${esc(l.when)}`);
  if (l.triage) out.push(`<b>«Чи терміново?»:</b> ${esc(l.triage)}`);
  if (l.note) out.push(`<b>Що турбує:</b> ${esc(l.note)}`);
  out.push(``, `<i>${sent}${l.page ? ` · сторінка ${esc(l.page)}` : ''}</i>`);
  return out.join('\n');
}

/** Shown whenever the request could not be delivered (no secrets yet, Telegram down, broken request). */
export const SEND_FAIL = `Не вдалося надіслати заявку — зателефонуйте ${site.phone.display}, черговий адміністратор запише вас.`;

/** Back to the form page (on-site paths only). 'check' = fix the phone (#pomylka), 'send' = not delivered (#ne-nadislano). */
export function errorRedirect(page: string | undefined, kind: 'check' | 'send' = 'check'): string {
  const p = page && ON_SITE.test(page) ? page : '/';
  return kind === 'send' ? `${p}?pomylka=nadislaty#ne-nadislano` : `${p}?pomylka=1#pomylka`;
}
export const thanksUrl = (l: Pick<Lead, 'channel' | 'kind'>) => `/dyakuyemo/?kanal=${l.channel}${l.kind === 'klub' ? '&klub=1' : ''}`;
