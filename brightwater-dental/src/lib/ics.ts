// .ics for the thanks page ("Add to calendar"). Pure; times are Austin local (America/Chicago, TZID).
import { site } from '../config/site.ts';
import { timeToMin } from './lead.ts';

const pad = (n: number) => String(n).padStart(2, '0');
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function buildIcs(o: { date: string; time: string; minutes: number; people: number; uid: string; now?: Date }): string {
  const start = timeToMin(o.time), end = start + o.minutes;
  const d = o.date.replace(/-/g, '');
  const t = (m: number) => `${pad(Math.floor(m / 60))}${pad(m % 60)}00`;
  const addr = `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.zip}`;
  const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`);
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Brightwater Family Dental//Booking//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${o.uid}@brightwater-dental.pages.dev`,
    `DTSTAMP:${stamp(o.now ?? new Date())}`,
    `DTSTART;TZID=America/Chicago:${d}T${t(start)}`,
    `DTEND;TZID=America/Chicago:${d}T${t(end)}`,
    `SUMMARY:${esc(`Dentist — Brightwater Family Dental${o.people > 1 ? ` (${o.people} people)` : ''}`)}`,
    `LOCATION:${esc(addr)}`,
    `DESCRIPTION:${esc(`Requested time — we confirm by text. Bring ID and your insurance card. ${site.phone.display}`)}`,
    'STATUS:TENTATIVE',
    'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n');
}
