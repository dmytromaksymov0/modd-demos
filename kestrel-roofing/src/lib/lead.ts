// Lead validation + Telegram message formatting. Pure functions — shared by the
// Cloudflare Pages Function (functions/api/lead.ts) and unit-tested in tests/.

export const PROBLEMS = { leak: 'Leak', storm: 'Storm or hail', 'old-roof': 'Old roof', 'not-sure': 'Not sure' } as const;
export type Problem = keyof typeof PROBLEMS;

export interface Lead { problem: Problem; zip: string; name: string; phone: string; estimate?: string; page?: string }
export type LeadResult = { ok: true; lead: Lead } | { ok: false; spam?: true; errors: Partial<Record<keyof Lead | 'form', string>> };

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const phoneDigits = (v: string) => v.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
export const formatPhone = (d: string) => `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;

export function validateLead(input: Record<string, unknown>): LeadResult {
  // Honeypot: real people never see or fill the "company" field.
  if (str(input.company, 200)) return { ok: false, spam: true, errors: { form: 'Rejected.' } };

  const errors: Partial<Record<keyof Lead, string>> = {};
  const problem = str(input.problem, 20);
  const zip = str(input.zip, 10);
  const name = str(input.name, 80).replace(/\s+/g, ' ');
  const digits = phoneDigits(str(input.phone, 30));

  if (!(problem in PROBLEMS)) errors.problem = 'Pick the closest option — “Not sure” is fine.';
  if (!/^\d{5}$/.test(zip)) errors.zip = 'Enter your 5-digit ZIP code.';
  if (name.length < 2) errors.name = 'Tell us what to call you.';
  if (digits.length !== 10 || /^[01]/.test(digits)) errors.phone = 'We need a 10-digit US number to call you back.';
  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    lead: { problem: problem as Problem, zip, name, phone: formatPhone(digits), estimate: str(input.estimate, 200) || undefined, page: str(input.page, 200) || undefined },
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function telegramMessage(lead: Lead, city: string | null, when: Date): string {
  const time = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' }).format(when);
  const lines = [
    `<b>🏠 New inspection request</b>`,
    ``,
    `<b>Problem:</b> ${PROBLEMS[lead.problem]}`,
    `<b>Name:</b> ${esc(lead.name)}`,
    `<b>Phone:</b> <a href="tel:+1${phoneDigits(lead.phone)}">${lead.phone}</a>`,
    `<b>ZIP:</b> ${lead.zip}${city ? ` — ${esc(city)}` : ' — outside service area'}`,
  ];
  if (lead.estimate) lines.push(`<b>Calculator:</b> ${esc(lead.estimate)}`);
  if (lead.page) lines.push(`<b>Page:</b> ${esc(lead.page)}`);
  lines.push(``, `<i>${time} ET</i>`);
  return lines.join('\n');
}
