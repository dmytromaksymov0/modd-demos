// Insurance check (signature moment B): plan → an answer in dollars. Pure data + logic, unit-testable.
// Demo network list — confirm with the real practice before launch (see README / "what changes at sale").
import { prices } from '../config/site.ts';

export type PlanType = 'ppo' | 'dhmo' | 'unsure';
export type Carrier = { id: string; label: string; ppo: boolean; note?: string };

export const carriers: Carrier[] = [
  { id: 'delta', label: 'Delta Dental', ppo: true },
  { id: 'ut-select', label: 'UT SELECT Dental (UT employees)', ppo: true, note: 'UT SELECT uses the Delta Dental PPO network.' },
  { id: 'state-tx', label: 'State of Texas Dental Choice PPO', ppo: true },
  { id: 'cigna', label: 'Cigna', ppo: true },
  { id: 'metlife', label: 'MetLife', ppo: true },
  { id: 'aetna', label: 'Aetna', ppo: true },
  { id: 'guardian', label: 'Guardian', ppo: true },
  { id: 'uhc', label: 'UnitedHealthcare', ppo: true },
  { id: 'bcbstx', label: 'Blue Cross Blue Shield of Texas', ppo: true },
  { id: 'humana', label: 'Humana', ppo: true },
  { id: 'ameritas', label: 'Ameritas', ppo: true },
  { id: 'principal', label: 'Principal', ppo: false },
  { id: 'none', label: 'I don’t have dental insurance', ppo: false },
];

export type Answer = { tone: 'yes' | 'maybe' | 'no' | 'plan'; headline: string; amount: string; amountLabel: string; detail: string; cta: { label: string; href: string } };

export function answer(carrierId: string, plan: PlanType): Answer {
  const c = carriers.find((x) => x.id === carrierId) ?? carriers[0];
  const book = (q: string) => `/book/?insurance=${encodeURIComponent(q)}`;
  if (c.id === 'none') {
    return {
      tone: 'plan', headline: 'No insurance? The Brightwater Plan',
      amount: `$${prices.planAdult}`, amountLabel: `a month per adult · $${prices.planKid} per kid`,
      detail: 'Two cleanings, two exams and X-rays a year included, one emergency exam, 15% off everything else. No deductible, no waiting period. Not insurance — cancel anytime.',
      cta: { label: `Book the $${prices.newPatient} first visit`, href: book('none') },
    };
  }
  if (plan === 'dhmo') {
    return {
      tone: 'no', headline: `${c.label} DHMO: not in our network`,
      amount: `$${prices.newPatient}`, amountLabel: 'first visit without insurance — exam, cleaning, X-rays',
      detail: 'DHMO plans only pay at the office they assign you. Many employers also offer a PPO option at open enrollment — or join our plan from $29 a month.',
      cta: { label: `Book the $${prices.newPatient} first visit`, href: book(`${c.id}-dhmo`) },
    };
  }
  if (!c.ppo) {
    return {
      tone: 'maybe', headline: `${c.label}: out-of-network, we still file for you`,
      amount: 'Varies', amountLabel: 'your plan reimburses part of the fee',
      detail: 'We send the claim, your plan pays you back its out-of-network share. We give you a written estimate before treatment.',
      cta: { label: 'Book and we’ll check your benefits', href: book(c.id) },
    };
  }
  const unsure = plan === 'unsure';
  return {
    tone: unsure ? 'maybe' : 'yes',
    headline: unsure ? `${c.label}: most employer plans here are PPO — likely in-network` : `In-network with ${c.label} PPO`,
    amount: '$0', amountLabel: 'typical cost of your cleaning, exam and X-rays',
    detail: `Preventive care is usually covered at 100% on PPO plans. Fillings are typically 80% after your deductible, crowns about 50%.${c.note ? ' ' + c.note : ''}`,
    cta: { label: `Book with ${c.label.replace(/ \(.*\)$/, '')}`, href: book(`${c.id}-${plan}`) },
  };
}
