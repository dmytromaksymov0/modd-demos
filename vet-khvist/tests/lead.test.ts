import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLead, normalizeUaPhone, telegramMessage, errorRedirect, thanksUrl, SEND_FAIL } from '../src/lib/lead.ts';

test('UA phone normalisation', () => {
  assert.equal(normalizeUaPhone('067 123 45 67'), '380671234567');
  assert.equal(normalizeUaPhone('+38 (067) 123-45-67'), '380671234567');
  assert.equal(normalizeUaPhone('671234567'), '380671234567');
  assert.equal(normalizeUaPhone('067 12'), null);
  assert.equal(normalizeUaPhone('+380 07 123 45 67'), null);
});

test('phone required / invalid', () => {
  const a = validateLead({}); assert.equal(a.ok, false); assert.ok(!a.ok && a.errors.phone);
  const b = validateLead({ phone: '123' }); assert.ok(!b.ok && /10 цифр/.test(b.errors.phone!));
});

test('honeypot → spam, silently', () => {
  const r = validateLead({ phone: '0671234567', company: 'ACME' });
  assert.ok(!r.ok && r.spam);
});

test('only known reasons, channel and pet survive; page must be on-site', () => {
  assert.equal(validateLead({ phone: '0671234567', page: '//evil.example/x' }).ok && (validateLead({ phone: '0671234567', page: '//evil.example/x' }) as { lead: { page?: string } }).lead.page, undefined);
  const r = validateLead({ phone: '0671234567', pryvid: ['щеплення', '<script>'], kanal: 'viber', vyd: 'kit', page: 'https://evil.example/' });
  assert.ok(r.ok);
  if (r.ok) {
    assert.deepEqual(r.lead.reasons, ['щеплення']);
    assert.equal(r.lead.channel, 'call');
    assert.equal(r.lead.pet, 'kit');
    assert.equal(r.lead.page, undefined);
  }
});

test('Telegram message escapes HTML and carries the triage result', () => {
  const r = validateLead({ phone: '0671234567', note: '<b>кіт</b> & пес', triage: 'Сьогодні', kind: 'zapys' });
  assert.ok(r.ok);
  if (r.ok) {
    const m = telegramMessage(r.lead, new Date('2026-10-21T10:00:00Z'));
    assert.ok(m.includes('&lt;b&gt;кіт&lt;/b&gt; &amp; пес'));
    assert.ok(m.includes('«Чи терміново?»:</b> Сьогодні'));
  }
});

test('club: age only from the list, kind klub', () => {
  const r = validateLead({ phone: '0671234567', kind: 'klub', vik: '8+ років' });
  assert.ok(r.ok && r.lead.kind === 'klub' && r.lead.age === '8+ років');
  const x = validateLead({ phone: '0671234567', vik: '<b>' });
  assert.ok(x.ok && x.lead.age === undefined);
});

test('redirects stay on site; club thanks flag; fallback names the phone', () => {
  assert.equal(errorRedirect('//evil'), '/?pomylka=1#pomylka');
  assert.equal(errorRedirect('/zapys/', 'send'), '/zapys/?pomylka=nadislaty#ne-nadislano');
  assert.equal(thanksUrl({ channel: 'telegram', kind: 'klub' }), '/dyakuyemo/?kanal=telegram&klub=1');
  assert.match(SEND_FAIL, /057 000 24 24/);
});
