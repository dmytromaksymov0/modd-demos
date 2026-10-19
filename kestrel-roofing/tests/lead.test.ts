import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLead, telegramMessage } from '../src/lib/lead.ts';

const good = { problem: 'storm', zip: '43221', name: '  Jordan   Miller ', phone: '+1 (614) 555-0199' };

test('valid lead is normalised', () => {
  const r = validateLead(good);
  assert.ok(r.ok);
  assert.equal(r.lead.name, 'Jordan Miller');
  assert.equal(r.lead.phone, '(614) 555-0199');
});

test('phone formats: dashes, dots, leading 1', () => {
  for (const phone of ['614-555-0199', '614.555.0199', '16145550199', '(614)5550199']) {
    const r = validateLead({ ...good, phone });
    assert.ok(r.ok, phone);
  }
});

test('rejects bad fields with human messages', () => {
  const r = validateLead({ problem: 'roof-on-fire', zip: '4322', name: 'J', phone: '555-0199' });
  assert.ok(!r.ok && !r.spam);
  assert.deepEqual(Object.keys(r.errors).sort(), ['name', 'phone', 'problem', 'zip']);
  assert.match(r.errors.phone!, /10-digit/);
});

test('rejects US numbers starting with 0 or 1 after the country code', () => {
  assert.ok(!validateLead({ ...good, phone: '014-555-0199' }).ok);
});

test('honeypot marks spam', () => {
  const r = validateLead({ ...good, company: 'Acme SEO' });
  assert.ok(!r.ok && r.spam);
});

test('non-string input does not crash', () => {
  const r = validateLead({ problem: ['storm'], zip: 43221, name: null, phone: {} } as never);
  assert.ok(!r.ok);
});

test('telegram message escapes HTML and includes the essentials', () => {
  const r = validateLead({ ...good, name: 'Bob <script>', estimate: '$6,700–$9,100 · 14 sq', page: '/storm-damage/' });
  assert.ok(r.ok);
  const msg = telegramMessage(r.lead, 'Upper Arlington', new Date('2026-10-18T14:05:00Z'));
  assert.match(msg, /Bob &lt;script&gt;/);
  assert.doesNotMatch(msg, /<script>/);
  assert.match(msg, /Storm or hail/);
  assert.match(msg, /tel:\+16145550199/);
  assert.match(msg, /43221 — Upper Arlington/);
  assert.match(msg, /\$6,700–\$9,100/);
  assert.match(msg, /10:05 AM ET/);
});

test('out-of-area ZIP is flagged in the message', () => {
  const r = validateLead({ ...good, zip: '44101' });
  assert.ok(r.ok);
  assert.match(telegramMessage(r.lead, null, new Date()), /outside service area/);
});
