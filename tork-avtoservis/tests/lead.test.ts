import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLead, normalizeUaPhone, formatUaPhone, telegramMessage, errorRedirect, SEND_FAIL } from '../src/lib/lead.ts';

test('Ukrainian phone formats are normalized to 380XXXXXXXXX', () => {
  for (const v of ['067 123 45 67', '0671234567', '+380 67 123-45-67', '380671234567', '(067) 123-45-67', '671234567']) assert.equal(normalizeUaPhone(v), '380671234567', v);
  assert.equal(formatUaPhone('380671234567'), '+380 67 123 45 67');
});
test('bad phones are rejected', () => {
  for (const v of ['123', '+1 512 555 0187', '0012345678', '380012345678', '06712345678']) assert.equal(normalizeUaPhone(v), null, v);
});
test('phone is required; error in Ukrainian', () => {
  const r = validateLead({});
  assert.equal(r.ok, false); assert.match((r as any).errors.phone, /Вкажіть телефон/);
  const r2 = validateLead({ phone: '123' });
  assert.match((r2 as any).errors.phone, /Перевірте номер/);
});
test('honeypot → spam', () => {
  const r = validateLead({ phone: '0671234567', company: 'x' });
  assert.equal(r.ok, false); assert.equal((r as any).spam, true);
});
test('channel defaults to call; unknown channel ignored', () => {
  assert.equal((validateLead({ phone: '0671234567' }) as any).lead.channel, 'call');
  assert.equal((validateLead({ phone: '0671234567', kanal: 'viber' }) as any).lead.channel, 'viber');
  assert.equal((validateLead({ phone: '0671234567', kanal: 'fax' }) as any).lead.channel, 'call');
});
test('calculator is re-priced on the server, unknown works dropped', () => {
  const r = validateLead({ phone: '0671234567', calc_klas: 'D', calc_works: 'pads-front,discs-front,hack' }) as any;
  assert.deepEqual(r.lead.calc.works, ['pads-front', 'discs-front']);
  assert.equal(r.lead.calc.total, 980 + 1300 - 520);
});
test('estimate choice is re-priced; "-" means everything postponed', () => {
  const a = validateLead({ phone: '0671234567', est_doing: 'pads,discs' }) as any;
  assert.equal(a.lead.estimate.total, 7540);
  const b = validateLead({ phone: '0671234567', est_doing: '-' }) as any;
  assert.equal(b.lead.estimate.total, 0); assert.deepEqual(b.lead.estimate.later, ['pads', 'discs']);
});
test('Telegram message: escaped HTML, channel, calc, estimate', () => {
  const r = validateLead({ phone: '067 123 45 67', name: '<b>Іра</b>', kanal: 'telegram', calc_klas: 'B', calc_works: 'oil', est_doing: 'pads', what: 'стукає & гуде', page: '/poslugy/khodova/' }) as any;
  const m = telegramMessage(r.lead, new Date('2026-10-20T10:00:00Z'));
  assert.match(m, /&lt;b&gt;Іра&lt;\/b&gt;/); assert.match(m, /стукає &amp; гуде/);
  assert.match(m, /написати в Telegram/); assert.match(m, /tel:\+380671234567/);
  assert.match(m, /Розрахунок \(клас B\)/); assert.match(m, /Мастило \+ фільтр/);
  assert.match(m, /Робимо: Колодки передні/); assert.match(m, /сторінка \/poslugy\/khodova\//);
  assert.doesNotMatch(m, / /);
});
test('error redirect stays on-site', () => {
  assert.equal(errorRedirect('/tsiny/'), '/tsiny/?pomylka=1#pomylka');
  assert.equal(errorRedirect('https://evil.example/'), '/?pomylka=1#pomylka');
  assert.equal(errorRedirect('//evil.example'), '/?pomylka=1#pomylka');
  assert.equal(errorRedirect('/tsiny/', 'send'), '/tsiny/?pomylka=nadislaty#ne-nadislano');
  assert.equal(errorRedirect('https://evil.example/', 'send'), '/?pomylka=nadislaty#ne-nadislano');
  assert.match(SEND_FAIL, /\+380 57 000-14-14/); assert.match(SEND_FAIL, /Telegram/); assert.match(SEND_FAIL, /Viber/);
});
