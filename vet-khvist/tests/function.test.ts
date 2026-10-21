// The Pages Function itself (functions/api/lead.ts) with a mocked fetch → Telegram.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost, onRequestGet } from '../functions/api/lead.ts';

const env = { TELEGRAM_BOT_TOKEN: 'T:k', TELEGRAM_CHAT_ID: '-1001' };
let sent: { url: string; body: any }[] = [];
let tgStatus = 200;
beforeEach(() => {
  sent = []; tgStatus = 200;
  globalThis.fetch = (async (url: string, init: RequestInit) => { sent.push({ url, body: JSON.parse(String(init.body)) }); return new Response('{}', { status: tgStatus }); }) as typeof fetch;
});
const form = (o: Record<string, string | string[]>, json = true) => {
  const fd = new FormData(); for (const [k, v] of Object.entries(o)) [v].flat().forEach((x) => fd.append(k, x));
  return new Request('https://x/api/lead', { method: 'POST', body: fd, headers: json ? { accept: 'application/json' } : {} });
};

test('booking → Telegram, all fields, JSON thanks', async () => {
  const r = await onRequestPost({ request: form({ phone: '067 123 45 67', name: 'Олена', vyd: 'kit', klychka: 'Барсик', pryvid: ['щеплення', 'огляд'], koly: 'завтра', note: 'чхає', kanal: 'telegram', triage: 'Сьогодні', page: '/zapys/' }), env });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true, thanks: '/dyakuyemo/?kanal=telegram' });
  assert.equal(sent[0].url, 'https://api.telegram.org/botT:k/sendMessage');
  const t: string = sent[0].body.text;
  for (const s of ['+380 67 123 45 67', 'написати в Telegram', 'Олена', 'кіт, Барсик', 'щеплення, огляд', 'завтра', 'чхає', 'Сьогодні', '/zapys/']) assert.ok(t.includes(s), s);
});

test('club sign-up carries age and last vaccine; thanks has klub flag', async () => {
  const r = await onRequestPost({ request: form({ phone: '0501112233', kind: 'klub', kanal: 'telegram', vyd: 'pes', vik: '8+ років', ostannie: '03.2026' }), env });
  assert.equal((await r.json()).thanks, '/dyakuyemo/?kanal=telegram&klub=1');
  assert.ok(/Клуб турботи/.test(sent[0].body.text) && /8\+ років/.test(sent[0].body.text) && /03\.2026/.test(sent[0].body.text));
});

test('invalid phone → 422 JSON with a Ukrainian message; no JS → 303 back to the page', async () => {
  const a = await onRequestPost({ request: form({ phone: '123', page: '/zapys/' }), env });
  assert.equal(a.status, 422); assert.match((await a.json()).errors.phone, /10 цифр/);
  const b = await onRequestPost({ request: form({ phone: '123', page: '/zapys/' }, false), env });
  assert.equal(b.status, 303); assert.equal(b.headers.get('location'), '/zapys/?pomylka=1#pomylka');
  assert.equal(sent.length, 0);
});

test('no secrets → 503 with the phone; no JS → 303 to «не надіслано»', async () => {
  const a = await onRequestPost({ request: form({ phone: '0671234567' }), env: {} });
  assert.equal(a.status, 503); assert.match((await a.json()).errors.form, /057 000 24 24/);
  const b = await onRequestPost({ request: form({ phone: '0671234567', page: '/klub/' }, false), env: {} });
  assert.equal(b.headers.get('location'), '/klub/?pomylka=nadislaty#ne-nadislano');
});

test('Telegram down → 502 with the phone', async () => {
  tgStatus = 500;
  const r = await onRequestPost({ request: form({ phone: '0671234567' }), env });
  assert.equal(r.status, 502); assert.match((await r.json()).errors.form, /057 000 24 24/);
});

test('honeypot → fake success, nothing sent; GET → 405; open redirect blocked', async () => {
  const r = await onRequestPost({ request: form({ phone: '0671234567', company: 'bot' }), env });
  assert.equal(r.status, 200); assert.equal(sent.length, 0);
  assert.equal(onRequestGet().status, 405);
  const x = await onRequestPost({ request: form({ phone: '1', page: '//evil.example' }, false), env });
  assert.equal(x.headers.get('location'), '/?pomylka=1#pomylka');
});
