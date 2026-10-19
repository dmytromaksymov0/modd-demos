import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBooking, telegramMessage, timeToMin } from '../src/lib/lead.ts';
import { buildIcs } from '../src/lib/ics.ts';

const TODAY = '2026-10-19';
const good = {
  p0_name: 'Sam', p0_visit: 'cleaning', p1_name: 'Leo', p1_visit: 'kids', p2_name: 'Mia', p2_visit: 'kids', p3_name: '', p3_visit: 'kids',
  date: '2026-10-24', time: '9:30 am', mode: 'side-by-side', comfort: ['sounds', 'control', 'evil'], sedation: 'ask',
  carrier: 'cigna', plan: 'ppo', doctor: 'elena-ruiz', name: 'Sam Rivera', phone: '+1 (512) 555-0187', email: 'sam@example.com', company: '',
};

test('valid family booking is normalised', () => {
  const r = validateBooking(good, TODAY);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.booking.people.length, 3);
  assert.equal(r.booking.phone, '(512) 555-0187');
  assert.deepEqual(r.booking.comfort, ['sounds', 'control']);
  assert.equal(r.booking.sedation, true);
  assert.deepEqual(r.booking.when, { date: '2026-10-24', time: '9:30 am', mode: 'side-by-side' });
});

test('honeypot → spam', () => {
  const r = validateBooking({ ...good, company: 'Acme' }, TODAY);
  assert.ok(!r.ok && r.spam);
});

test('errors are per field and human', () => {
  const r = validateBooking({ ...good, p0_name: '', name: 'S', phone: '012-555-0187', email: 'nope' }, TODAY);
  assert.ok(!r.ok);
  if (r.ok) return;
  assert.deepEqual(Object.keys(r.errors).sort(), ['email', 'name', 'p0_name', 'phone']);
  assert.match(r.errors.phone!, /10-digit/);
});

test('slot must be an open day, inside hours, within 60 days', () => {
  for (const [date, time] of [['2026-10-25', '9:30 am'], ['2026-10-24', '3 pm'], ['2026-10-18', '9 am'], ['2027-02-01', '9 am'], ['2026-10-24', '25:00']]) {
    const r = validateBooking({ ...good, date, time }, TODAY);
    assert.ok(!r.ok && r.errors.when, `${date} ${time} should be rejected`);
  }
});

test('no-JS preference instead of a slot', () => {
  const { date, time, mode, ...rest } = good;
  const r = validateBooking({ ...rest, preferred: 'saturday' }, TODAY);
  assert.ok(r.ok && 'preferred' in r.booking.when && r.booking.when.preferred === 'saturday');
});

test('unknown visit type / carrier / doctor are handled', () => {
  const r = validateBooking({ ...good, p1_visit: 'whitening-xl' }, TODAY);
  assert.ok(!r.ok && r.errors.people);
  const r2 = validateBooking({ ...good, carrier: 'hack', doctor: 'dr-evil' }, TODAY);
  assert.ok(r2.ok && r2.booking.carrier === 'none' && r2.booking.doctor === '');
});

test('Telegram message lists people, slot, insurance in dollars, comfort; escapes HTML', () => {
  const r = validateBooking({ ...good, p0_name: '<b>Sam</b>' }, TODAY);
  assert.ok(r.ok);
  if (!r.ok) return;
  const m = telegramMessage(r.booking, new Date('2026-10-19T15:00:00Z'));
  assert.match(m, /3 people/);
  assert.match(m, /Sat, Oct 24, 9:30 am · side by side/);
  assert.match(m, /&lt;b&gt;Sam&lt;\/b&gt; — Cleaning &amp; exam/);
  assert.match(m, /Cigna \(PPO\) — \$0/);
  assert.match(m, /Dr\. Ruiz/);
  assert.match(m, /headphones; .*stop signal; Ask about sedation/);
  assert.match(m, /tel:\+15125550187/);
});

test('timeToMin and .ics', () => {
  assert.equal(timeToMin('9:30 am'), 570);
  assert.equal(timeToMin('12 pm'), 720);
  const ics = buildIcs({ date: '2026-10-24', time: '9:30 am', minutes: 60, people: 3, uid: 'x', now: new Date('2026-10-19T00:00:00Z') });
  assert.match(ics, /DTSTART;TZID=America\/Chicago:20261024T093000/);
  assert.match(ics, /DTEND;TZID=America\/Chicago:20261024T103000/);
  assert.match(ics, /\(3 people\)/);
  assert.match(ics, /\r\nEND:VCALENDAR\r\n$/);
});
