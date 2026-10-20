// Booking request validation + Telegram message. Pure — shared by functions/api/lead.ts and tests/.
// The server never trusts client-side sums: class + works and the estimate choice are re-validated and re-priced here.
import { carClasses, hours, site } from '../config/site.ts';
import { works, combos } from '../data/works.ts';
import { lines as estimateLines, car as estimateCar } from '../data/estimate.ts';
import { calculate, fmtMoney, fmtTime } from './calc.ts';
import { estimateTotal } from './estimate.ts';

export const CHANNELS = { telegram: 'Telegram', viber: 'Viber', call: 'Дзвінок' } as const;
export type Channel = keyof typeof CHANNELS;

export interface Lead {
  phone: string;            // +380 XX XXX XX XX
  phoneDigits: string;      // 380XXXXXXXXX
  name?: string; car?: string; what?: string;
  channel: Channel;
  calc?: { klas: string; works: string[]; total: number; minutes: number; saving: number };
  estimate?: { doing: string[]; later: string[]; total: number };
  page?: string;
}
type Field = 'phone' | 'name' | 'car' | 'what' | 'form';
export type LeadResult = { ok: true; lead: Lead } | { ok: false; spam?: true; errors: Partial<Record<Field, string>> };

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v: unknown) => (Array.isArray(v) ? v : typeof v === 'string' && v ? v.split(',') : []).map((x) => str(x, 40)).filter(Boolean);

/** Ukrainian phone → 12 digits starting with 380, or null. Accepts +380…, 380…, 0XXXXXXXXX, with any spaces/dashes/brackets. */
export function normalizeUaPhone(raw: string): string | null {
  let d = raw.replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('0')) d = '38' + d;
  else if (d.length === 9) d = '380' + d;
  if (!/^380\d{9}$/.test(d)) return null;
  if (d[3] === '0') return null; // no operator/area code starts with 0
  return d;
}
export const formatUaPhone = (d: string) => `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;

export function validateLead(input: Record<string, unknown>): LeadResult {
  if (str(input.company, 200)) return { ok: false, spam: true, errors: { form: 'Відхилено.' } };
  const e: Partial<Record<Field, string>> = {};
  const rawPhone = str(input.phone, 40);
  const digits = normalizeUaPhone(rawPhone);
  if (!rawPhone) e.phone = 'Вкажіть телефон — без нього не зможемо записати.';
  else if (!digits) e.phone = 'Перевірте номер: потрібно 10 цифр, наприклад 067 123 45 67, або +380 і 9 цифр.';
  const name = str(input.name, 60);
  const car = str(input.car, 80);
  const what = text(input.what, 1000);
  if (name && name.length < 2) e.name = 'Ім’я закоротке — або залиште поле порожнім.';
  if (Object.keys(e).length) return { ok: false, errors: e };

  const channel = (str(input.kanal, 10) in CHANNELS ? str(input.kanal, 10) : 'call') as Channel;

  let calc: Lead['calc'];
  const klas = str(input.calc_klas, 2).toUpperCase();
  const calcWorks = [...new Set(list(input.calc_works))].filter((id) => works.some((w) => w.id === id));
  const cls = carClasses.find((c) => c.id === klas);
  if (cls && calcWorks.length) {
    const r = calculate(calcWorks, cls.rate, works, combos);
    calc = { klas, works: calcWorks, total: r.total, minutes: r.minutes, saving: r.saving };
  }

  let estimate: Lead['estimate'];
  const doing = list(input.est_doing).filter((id) => estimateLines.some((l) => l.id === id && l.kind !== 'none'));
  if (doing.length || str(input.est_doing, 5) === '-') {
    const all = estimateLines.map((l) => ({ id: l.id, labour: l.labour, parts: l.parts, doing: doing.includes(l.id), comboWith: (l as { comboWith?: string }).comboWith, comboSaving: (l as { comboSaving?: number }).comboSaving }));
    estimate = { doing, later: estimateLines.filter((l) => l.kind !== 'none' && !doing.includes(l.id)).map((l) => l.id), total: estimateTotal(all).total };
  }

  const page = str(input.page, 80);
  return {
    ok: true,
    lead: {
      phone: formatUaPhone(digits!), phoneDigits: digits!, channel,
      name: name || undefined, car: car || undefined, what: what || undefined,
      calc, estimate, page: /^\/[\w\-/]*$/.test(page) ? page : undefined,
    },
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const workLabel = (id: string) => works.find((w) => w.id === id)?.label ?? id;
const lineLabel = (id: string) => estimateLines.find((l) => l.id === id)?.what ?? id;

export function telegramMessage(l: Lead, when: Date): string {
  const sent = new Intl.DateTimeFormat('uk-UA', { timeZone: hours.tz, dateStyle: 'medium', timeStyle: 'short' }).format(when);
  const reply = { telegram: `написати в Telegram`, viber: `написати у Viber`, call: `подзвонити` }[l.channel];
  const out = [
    `<b>🔧 Нова заявка · ТОРК</b>`, ``,
    `<b>Телефон:</b> <a href="tel:+${l.phoneDigits}">${l.phone}</a>`,
    `<b>Відповісти:</b> ${reply}`,
  ];
  if (l.name) out.push(`<b>Ім’я:</b> ${esc(l.name)}`);
  if (l.car) out.push(`<b>Авто:</b> ${esc(l.car)}`);
  if (l.what) out.push(`<b>Що турбує:</b> ${esc(l.what)}`);
  if (l.calc) {
    out.push(``, `<b>Розрахунок (клас ${l.calc.klas}):</b>`, ...l.calc.works.map((id) => `• ${esc(workLabel(id))}`),
      `Робота ${fmtMoney(l.calc.total)}, ≈ ${fmtTime(l.calc.minutes)}${l.calc.saving ? ` (економія ${fmtMoney(l.calc.saving)})` : ''}`);
  }
  if (l.estimate) {
    out.push(``, `<b>Приклад кошторису (${esc(estimateCar.name)}):</b>`,
      `Робимо: ${l.estimate.doing.length ? l.estimate.doing.map(lineLabel).map(esc).join(', ') : '—'}`,
      `Відкласти: ${l.estimate.later.length ? l.estimate.later.map(lineLabel).map(esc).join(', ') : '—'}`,
      `Сума за погодженим: ${fmtMoney(l.estimate.total)}`);
  }
  out.push(``, `<i>${sent}${l.page ? ` · сторінка ${esc(l.page)}` : ''} · відповісти протягом 15 хв у робочий час</i>`);
  return out.join('\n').replace(/ /g, ' ');
}

/** Redirect target for no-JS errors: back to the page the form was on, never off-site. */
/** Shown whenever the request could not be delivered (no secrets yet, Telegram down, broken request). */
export const SEND_FAIL = `Не вдалося надіслати заявку — зателефонуйте ${site.phone.display} або напишіть нам у Telegram чи Viber.`;

/** Back to the form page (on-site paths only). 'check' = fix the phone (#pomylka), 'send' = delivery failed (#ne-nadislano). */
export function errorRedirect(page: string | undefined, kind: 'check' | 'send' = 'check'): string {
  const p = page && /^\/[\w\-/]*$/.test(page) ? page : '/';
  return kind === 'send' ? `${p}?pomylka=nadislaty#ne-nadislano` : `${p}?pomylka=1#pomylka`;
}
export const thanksUrl = (l: Pick<Lead, 'channel'>) => `/dyakuyemo/?kanal=${l.channel}`;

