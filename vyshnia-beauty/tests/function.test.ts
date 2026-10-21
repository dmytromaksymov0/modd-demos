// The Pages Function itself (functions/api/lead.ts) with a mocked fetch → Telegram.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost, onRequestGet } from '../functions/api/lead.ts';

const env = { TELEGRAM_BOT_TOKEN: 'T:k', TELEGRAM_CHAT_ID: '-1001' };
let sent: { url: string; body: { text: string } }[] = [];
let tgStatus = 200;
beforeEach(() => {
  sent = []; tgStatus = 200;
  globalThis.fetch = (async (url: string, init: RequestInit) => { sent.push({ url, body: JSON.parse(String(init.body)) }); return new Response('{}', { status: tgStatus }); }) as typeof fetch;
});
const form = (o: Record<string, string>, json = true) => {
  const fd = new FormData(); for (const [k, v] of Object.entries(o)) fd.append(k, v);
  return new Request('https://x/api/lead', { method: 'POST', body: fd, headers: json ? { accept: 'application/json' } : {} });
};

test('booking without a slot → Telegram, JSON thanks with the choice', async () => {
  const r = await onRequestPost({ request: form({ phone: '067 123 45 67', zgoda: 'on', posluga: 'brows-lam', maister: 'iryna', kanal: 'viber', name: 'Олена', page: '/zapys/' }), env });
  assert.equal(r.status, 200);
  const j = await r.json(); assert.ok(j.ok && j.thanks.startsWith('/zapysano/?posluga=brows-lam&maister=iryna&kanal=viber'));
  assert.equal(sent[0].url, 'https://api.telegram.org/botT:k/sendMessage');
  for (const s of ['Ламінування брів', 'Ірина Шевчук, топ-майстер', '900 ₴', 'Viber', 'Олена', '/zapys/']) assert.ok(sent[0].body.text.includes(s), s);
});

test('certificate → its own message and thanks URL', async () => {
  const r = await onRequestPost({ request: form({ kind: 'sertyfikat', phone: '0501112233', zgoda: 'on', nominal: '2000', dostavka: 'telegram', page: '/sertyfikaty/' }), env });
  assert.deepEqual(await r.json(), { ok: true, thanks: '/zapysano/?typ=sertyfikat&suma=2000&dostavka=telegram' });
  assert.ok(sent[0].body.text.includes('Подарунковий сертифікат') && sent[0].body.text.includes('2000 ₴'));
});

test('validation errors: 422 JSON, 303 back to the form without JS', async () => {
  const a = await onRequestPost({ request: form({ phone: '12' }), env });
  assert.equal(a.status, 422); assert.ok((await a.json()).errors.phone);
  const b = await onRequestPost({ request: form({ phone: '12', page: '/zapys/' }, false), env });
  assert.equal(b.status, 303); assert.equal(b.headers.get('location'), '/zapys/?pomylka=1#pomylka');
  assert.equal(sent.length, 0);
});

test('no secrets → honest 503 with the phone; no-JS → 303 to #ne-nadislano', async () => {
  const a = await onRequestPost({ request: form({ phone: '0671234567', zgoda: 'on', posluga: 'mani-coat' }), env: {} });
  assert.equal(a.status, 503); const j = await a.json(); assert.ok(j.delivery && /057 000 21 21/.test(j.errors.form));
  const b = await onRequestPost({ request: form({ phone: '0671234567', zgoda: 'on', posluga: 'mani-coat', page: '/' }, false), env: {} });
  assert.equal(b.headers.get('location'), '/?pomylka=nadislaty#ne-nadislano');
});

test('Telegram down → 502 + same fallback; spam gets a fake success; GET → 405', async () => {
  tgStatus = 500;
  const a = await onRequestPost({ request: form({ phone: '0671234567', zgoda: 'on', posluga: 'mani-coat' }), env });
  assert.equal(a.status, 502);
  const s = await onRequestPost({ request: form({ phone: '0671234567', company: 'bot' }), env });
  assert.equal(s.status, 200); assert.equal(sent.length, 1); // only the failed real attempt above
  assert.equal(onRequestGet().status, 405);
});
