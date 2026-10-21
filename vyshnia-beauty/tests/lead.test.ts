import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLead, normalizeUaPhone, telegramMessage, errorRedirect, thanksUrl, kyivNow, SLOT_TAKEN } from '../src/lib/lead.ts';
import { nearest } from '../src/lib/booking.ts';

const now = new Date('2026-10-21T07:00:00Z'); // 10:00 in Kyiv, Wednesday
const base = { phone: '067 123 45 67', zgoda: 'on', posluga: 'mani-coat' };

test('Kyiv clock, not the server clock', () => {
  assert.deepEqual(kyivNow(now), { today: '2026-10-21', nowMin: 600 });
  assert.equal(kyivNow(new Date('2026-10-21T22:30:00Z')).today, '2026-10-22'); // 01:30 next day in Kyiv
});

test('UA phone normalisation', () => {
  assert.equal(normalizeUaPhone('+38 (067) 123-45-67'), '380671234567');
  assert.equal(normalizeUaPhone('671234567'), '380671234567');
  assert.equal(normalizeUaPhone('067 12'), null);
  assert.equal(normalizeUaPhone('+380 07 123 45 67'), null);
});

test('required: phone, consent, service', () => {
  const r = validateLead({}, now);
  assert.ok(!r.ok && r.errors.phone && r.errors.zgoda && r.errors.posluga);
});

test('honeypot → spam, silently', () => {
  const r = validateLead({ ...base, company: 'ACME' }, now);
  assert.ok(!r.ok && r.spam);
});

test('price is recomputed on the server: top master +20 %, «any» = regular', () => {
  const n = nearest({ service: 'mani-coat', master: 'olena', today: '2026-10-21', nowMin: 600 })!;
  const r = validateLead({ ...base, maister: 'olena', data: n.date, chas: n.t, price: '1' }, now);
  assert.ok(r.ok); if (r.ok) { assert.equal(r.lead.price, 900); assert.equal(r.lead.masterName, 'Олена Коваль, топ-майстер'); }
  const a = validateLead({ ...base }, now);
  assert.ok(a.ok); if (a.ok) { assert.equal(a.lead.price, 750); assert.equal(a.lead.master, 'any'); }
});

test('a wrong-group master falls back to «будь-яка»; a taken slot is refused', () => {
  const r = validateLead({ ...base, posluga: 'brows-shape', maister: 'olena' }, now);
  assert.ok(r.ok && r.lead.master === 'any');
  const bad = validateLead({ ...base, maister: 'olena', data: '2026-10-26', chas: '12:00' }, now); // Monday = Olena's day off
  assert.ok(!bad.ok && bad.errors.chas === SLOT_TAKEN);
});

test('no-JS form: group as service, preferred part of day; guarantee only for coatings', () => {
  const r = validateLead({ ...base, posluga: 'pedicure', data: '2026-10-24', chastyna: 'vechir', kolir: 'moloko' }, now);
  assert.ok(r.ok); if (r.ok) { assert.equal(r.lead.service, 'pedi-coat'); assert.equal(r.lead.part, 'vechir'); assert.equal(r.lead.guarantee, '2026-11-14'); assert.equal(r.lead.shade, 'moloko'); }
  const b = validateLead({ ...base, posluga: 'brows-shape', kolir: 'vyshnia', data: '2026-10-24' }, now);
  assert.ok(b.ok && b.lead.shade === undefined && b.lead.guarantee === undefined);
});

test('Telegram message escapes HTML; redirects stay on-site', () => {
  const r = validateLead({ ...base, note: '<b>довгі</b> & квадрат', name: 'Катя' }, now);
  assert.ok(r.ok);
  if (r.ok) { const m = telegramMessage(r.lead, now); assert.ok(m.includes('&lt;b&gt;довгі&lt;/b&gt; &amp; квадрат')); assert.ok(m.includes('Новий запис · Вишня')); assert.ok(m.includes('750 ₴')); }
  assert.equal(errorRedirect('//evil.example/x'), '/?pomylka=1#pomylka');
  assert.equal(errorRedirect('/', 'send'), '/?pomylka=nadislaty#ne-nadislano');
  if (r.ok) assert.ok(thanksUrl(r.lead).startsWith('/zapysano/?posluga=mani-coat'));
  const p = validateLead({ ...base, page: '//evil.example' }, now); assert.ok(p.ok && p.lead.page === undefined);
});
