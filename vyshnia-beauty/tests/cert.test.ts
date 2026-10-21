import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCert, certMessage, certThanksUrl } from '../src/lib/lead.ts';

const base = { kind: 'sertyfikat', phone: '067 123 45 67', zgoda: 'on' };

test('nominal must be one of 500 / 1000 / 1500 / 2000', () => {
  assert.equal(validateCert({ ...base, nominal: '1000' }).ok, true);
  const bad = validateCert({ ...base, nominal: '999' });
  assert.ok(!bad.ok && bad.errors.nominal);
});

test('a service certificate takes the price from the price list, not from the page', () => {
  const r = validateCert({ ...base, typ: 'posluga', cert_posluga: 'pedi-coat', nominal: '2000', amount: '1' });
  assert.ok(r.ok); if (r.ok) { assert.equal(r.cert.amount, 950); assert.equal(r.cert.serviceName, 'Педикюр з покриттям гель-лаком'); }
});

test('required phone + consent; honeypot is spam; unknown design / delivery fall back', () => {
  const r = validateCert({ kind: 'sertyfikat', nominal: '500' });
  assert.ok(!r.ok && r.errors.phone && r.errors.zgoda);
  const s = validateCert({ ...base, nominal: '500', company: 'x' }); assert.ok(!s.ok && s.spam);
  const f = validateCert({ ...base, nominal: '500', dyzain: 'gold', dostavka: 'pigeon' });
  assert.ok(f.ok && f.cert.design === 'vyshnia' && f.cert.delivery === 'telegram');
});

test('message escapes HTML and carries everything the admin needs; thanks URL', () => {
  const r = validateCert({ ...base, nominal: '1500', komu: '<Мамі>', vid: 'Катя', pobazhannia: 'Будь красивою & щасливою', dostavka: 'paper', dyzain: 'pudra' });
  assert.ok(r.ok);
  if (r.ok) {
    const m = certMessage(r.cert, new Date('2026-10-21T10:00:00Z'));
    for (const s of ['1500 ₴', 'Пудра', '&lt;Мамі&gt;', 'Катя', '&amp; щасливою', 'крафт-конверті', '+380 67 123 45 67', 'посилання на оплату']) assert.ok(m.includes(s), s);
    assert.equal(certThanksUrl(r.cert), '/zapysano/?typ=sertyfikat&suma=1500&dostavka=paper');
  }
});
