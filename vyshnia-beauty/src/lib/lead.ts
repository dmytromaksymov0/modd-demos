// Booking request validation + Telegram message. Pure — shared by functions/api/lead.ts and tests/.
// The server never trusts the page: it re-checks the service, the master, the slot and recomputes the price.
import { site } from '../config/site.ts';
import { serviceById, masterById, priceFor, isBookable, guaranteeIso, groupOf, isShade, ANY, parseIso, kyivNow } from './booking.ts';
export { kyivNow } from './booking.ts';
import { shades } from '../data/shades.ts';

export const CHANNELS = { telegram: 'Telegram', viber: 'Viber', call: 'Дзвінок' } as const;
export type Channel = keyof typeof CHANNELS;
export const PARTS = { ranok: 'ранок (9–12)', den: 'день (12–17)', vechir: 'вечір (17–21)' } as const;
export const NOMINALS = [500, 1000, 1500, 2000] as const;
export const DESIGNS = { vyshnia: 'Вишня', pudra: 'Пудра', moloko: 'Молоко' } as const;
export const DELIVERY = { telegram: 'електронний у Telegram', viber: 'електронний у Viber', paper: 'паперовий у крафт-конверті (забрати в студії)' } as const;

/** Gift certificate request (kind = sertyfikat). The amount is a nominal or a service's price — never taken from the page. */
export interface Cert {
  kind: 'sertyfikat'; amount: number; service?: string; serviceName?: string; design: keyof typeof DESIGNS; delivery: keyof typeof DELIVERY;
  to?: string; from?: string; message?: string; phone: string; phoneDigits: string; name?: string; page?: string;
}
export type CertResult = { ok: true; cert: Cert } | { ok: false; spam?: true; errors: Partial<Record<'phone' | 'name' | 'nominal' | 'zgoda' | 'form', string>> };

export interface Lead {
  service: string; serviceName: string; master: string; masterName: string; price: number;
  shade?: string; date?: string; time?: string; part?: keyof typeof PARTS; guarantee?: string;
  phone: string; phoneDigits: string; name?: string; channel: Channel; note?: string; page?: string;
}
type Field = 'phone' | 'name' | 'posluga' | 'chas' | 'zgoda' | 'form';
export type LeadResult = { ok: true; lead: Lead } | { ok: false; spam?: true; errors: Partial<Record<Field, string>> };

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
/** On-site path only: «/x/y», never «//host» (protocol-relative = open redirect). */
const ON_SITE = /^\/(?!\/)[\w\-/]*$/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Ukrainian phone → 12 digits starting with 380, or null. Accepts +380…, 380…, 0XXXXXXXXX with spaces/dashes/brackets. */
export function normalizeUaPhone(raw: string): string | null {
  let d = raw.replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('0')) d = '38' + d;
  else if (d.length === 9) d = '380' + d;
  if (!/^380\d{9}$/.test(d) || d[3] === '0') return null;
  return d;
}
export const formatUaPhone = (d: string) => `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;

export const PHONE_REQUIRED = 'Вкажіть телефон — без нього не зможемо підтвердити запис.';
export const PHONE_INVALID = 'Перевірте номер: 10 цифр, наприклад 067 123 45 67, або +380 і 9 цифр.';
export const SLOT_TAKEN = 'Цей час щойно зайняли — оберіть інший, будь ласка.';
export const CONSENT = 'Потрібна ваша згода на обробку даних для запису.';

export function validateCert(input: Record<string, unknown>): CertResult {
  if (str(input.company, 200)) return { ok: false, spam: true, errors: { form: 'Відхилено.' } };
  const e: Partial<Record<'phone' | 'name' | 'nominal' | 'zgoda', string>> = {};
  const rawPhone = str(input.phone, 40); const digits = normalizeUaPhone(rawPhone);
  if (!rawPhone) e.phone = PHONE_REQUIRED; else if (!digits) e.phone = PHONE_INVALID;
  const name = str(input.name, 60);
  if (name && name.length < 2) e.name = 'Імʼя закоротке — або залиште поле порожнім.';
  if (!str(input.zgoda, 5)) e.zgoda = CONSENT;
  let amount = 0, service: string | undefined, serviceName: string | undefined;
  if (str(input.typ, 10) === 'posluga') {
    const s = serviceById(str(input.cert_posluga, 20));
    if (s) { amount = s.price; service = s.id; serviceName = s.name; }
  } else {
    const n = Number(str(input.nominal, 6));
    if ((NOMINALS as readonly number[]).includes(n)) amount = n;
  }
  if (!amount) e.nominal = 'Оберіть номінал або послугу.';
  if (Object.keys(e).length) return { ok: false, errors: e };
  const page = str(input.page, 80);
  return {
    ok: true,
    cert: {
      kind: 'sertyfikat', amount, service, serviceName,
      design: (str(input.dyzain, 10) in DESIGNS ? str(input.dyzain, 10) : 'vyshnia') as Cert['design'],
      delivery: (str(input.dostavka, 10) in DELIVERY ? str(input.dostavka, 10) : 'telegram') as Cert['delivery'],
      to: str(input.komu, 40) || undefined, from: str(input.vid, 40) || undefined, message: text(input.pobazhannia, 140) || undefined,
      phone: formatUaPhone(digits!), phoneDigits: digits!, name: name || undefined, page: ON_SITE.test(page) ? page : undefined,
    },
  };
}

export function certMessage(c: Cert, sentAt: Date): string {
  const sent = new Intl.DateTimeFormat('uk-UA', { timeZone: 'Europe/Kyiv', dateStyle: 'medium', timeStyle: 'short' }).format(sentAt);
  return [
    `<b>Подарунковий сертифікат · Вишня</b>`, ``,
    `<b>Номінал:</b> ${c.amount} ₴${c.serviceName ? ` (${esc(c.serviceName)})` : ''}`,
    `<b>Дизайн:</b> ${DESIGNS[c.design]}`,
    c.to ? `<b>Кому:</b> ${esc(c.to)}` : '', c.from ? `<b>Від кого:</b> ${esc(c.from)}` : '',
    c.message ? `<b>Побажання:</b> ${esc(c.message)}` : '',
    `<b>Отримання:</b> ${DELIVERY[c.delivery]}`, ``,
    `<b>Телефон покупця:</b> <a href="tel:+${c.phoneDigits}">${c.phone}</a>`, c.name ? `<b>Імʼя:</b> ${esc(c.name)}` : '',
    `<b>Оплата:</b> надіслати посилання на оплату · діє 6 місяців`, ``, `<i>${sent}${c.page ? ` · ${esc(c.page)}` : ''}</i>`,
  ].filter((x, i, a) => x !== '' || (i > 0 && a[i - 1] !== '')).join('\n');
}
export const certThanksUrl = (c: Cert) => `/zapysano/?typ=sertyfikat&suma=${c.amount}&dostavka=${c.delivery}`;

export function validateLead(input: Record<string, unknown>, now: Date): LeadResult {
  if (str(input.company, 200)) return { ok: false, spam: true, errors: { form: 'Відхилено.' } };
  const e: Partial<Record<Field, string>> = {};
  const rawPhone = str(input.phone, 40);
  const digits = normalizeUaPhone(rawPhone);
  if (!rawPhone) e.phone = PHONE_REQUIRED; else if (!digits) e.phone = PHONE_INVALID;
  const name = str(input.name, 60);
  if (name && name.length < 2) e.name = 'Імʼя закоротке — або залиште поле порожнім.';
  if (!str(input.zgoda, 5)) e.zgoda = CONSENT;

  // posluga: a service id, or a group (no-JS form picks the group's main service)
  let svc = serviceById(str(input.posluga, 20));
  if (!svc) { const g = groupOf(str(input.posluga, 20)); if (g) svc = serviceById({ manicure: 'mani-coat', pedicure: 'pedi-coat', brows: 'brows-shape', lashes: 'lash-lam' }[g]); }
  if (!svc) e.posluga = 'Оберіть послугу.';

  const rawMaster = str(input.maister, 20) || ANY;
  const m = rawMaster === ANY ? undefined : masterById(rawMaster);
  const master = m && svc && m.groups.includes(svc.group) ? m.id : ANY; // unknown or wrong-group master → «будь-яка»

  const date = ISO.test(str(input.data, 10)) ? str(input.data, 10) : undefined;
  const time = /^\d{2}:\d{2}$/.test(str(input.chas, 5)) ? str(input.chas, 5) : undefined;
  const part = (str(input.chastyna, 8) in PARTS ? str(input.chastyna, 8) : undefined) as Lead['part'];
  if (svc && date && time) {
    const { today, nowMin } = kyivNow(now);
    if (!isBookable({ service: svc.id, master, date, t: time, today, nowMin })) e.chas = SLOT_TAKEN;
  }
  if (Object.keys(e).length) return { ok: false, errors: e };

  const rawShade = str(input.kolir, 12) || str(input['kolir-panel'], 12); // no-JS desktop picks the shade in the summary
  const shade = isShade(rawShade) && svc!.coat ? rawShade : undefined;
  const channel = (str(input.kanal, 10) in CHANNELS ? str(input.kanal, 10) : 'call') as Channel;
  const page = str(input.page, 80);
  return {
    ok: true,
    lead: {
      service: svc!.id, serviceName: svc!.name, master, masterName: m && master !== ANY ? `${m.name}${m.top ? ', топ-майстер' : ''}` : 'будь-яка вільна',
      price: priceFor(svc!.id, master)!, shade, date, time: date ? time : undefined, part: time ? undefined : part,
      guarantee: svc!.coat && date ? guaranteeIso(date) : undefined,
      phone: formatUaPhone(digits!), phoneDigits: digits!, name: name || undefined, channel,
      note: text(input.note, 800) || undefined, page: ON_SITE.test(page) ? page : undefined,
    },
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ua = (isoDate: string) => new Intl.DateTimeFormat('uk-UA', { weekday: 'short', day: 'numeric', month: 'long' }).format(parseIso(isoDate));

export function telegramMessage(l: Lead, sentAt: Date): string {
  const sent = new Intl.DateTimeFormat('uk-UA', { timeZone: 'Europe/Kyiv', dateStyle: 'medium', timeStyle: 'short' }).format(sentAt);
  const when = l.date ? `${ua(l.date)}${l.time ? `, ${l.time}` : l.part ? `, ${PARTS[l.part]}` : ''}` : l.part ? PARTS[l.part] : 'узгодити';
  const out = [
    `<b>Новий запис · Вишня</b>`, ``,
    `<b>Послуга:</b> ${esc(l.serviceName)}`,
    l.shade ? `<b>Колір:</b> ${esc(shades.find((s) => s.id === l.shade)?.name ?? 'підібрати на місці')}` : '',
    `<b>Майстер:</b> ${esc(l.masterName)}`,
    `<b>Коли:</b> ${esc(when)}`,
    `<b>Ціна:</b> ${l.price} ₴${l.guarantee ? ` · гарантія до ${ua(l.guarantee)}` : ''}`, ``,
    `<b>Телефон:</b> <a href="tel:+${l.phoneDigits}">${l.phone}</a>`,
    l.name ? `<b>Імʼя:</b> ${esc(l.name)}` : '',
    `<b>Нагадати:</b> ${CHANNELS[l.channel]}`,
    l.note ? `<b>Коментар:</b> ${esc(l.note)}` : '',
    ``, `<i>${sent}${l.page ? ` · ${esc(l.page)}` : ''}</i>`,
  ];
  return out.filter((x, i, a) => x !== '' || (a[i - 1] !== '' && i > 0)).join('\n');
}

/** Shown whenever the request could not be delivered (no secrets yet, Telegram down, broken request). */
export const SEND_FAIL = `Не вдалося надіслати запис. Зателефонуйте ${site.phone} або напишіть у Telegram — адміністраторка запише вас на той самий час.`;

/** Back to the form (on-site paths only). 'check' = fix fields (#pomylka), 'send' = not delivered (#ne-nadislano). */
export function errorRedirect(page: string | undefined, kind: 'check' | 'send' = 'check'): string {
  const p = page && ON_SITE.test(page) ? page : '/';
  return kind === 'send' ? `${p}?pomylka=nadislaty#ne-nadislano` : `${p}?pomylka=1#pomylka`;
}
export function thanksUrl(l: Lead): string {
  const q = new URLSearchParams({ posluga: l.service, maister: l.master, kanal: l.channel });
  if (l.date) q.set('data', l.date);
  if (l.time) q.set('chas', l.time);
  if (l.shade) q.set('kolir', l.shade);
  return `/zapysano/?${q}`;
}
