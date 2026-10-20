import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost, onRequestGet } from '../functions/api/lead.ts';

const env = { TELEGRAM_BOT_TOKEN: 'T:1', TELEGRAM_CHAT_ID: '-1', TELEGRAM_API_BASE: 'https://tg.test' };
const body = { phone: '067 123 45 67', name: 'Сергій', kanal: 'viber', page: '/kalkulyator/', calc_klas: 'A', calc_works: 'oil' };

function withFetch(fn: (calls: { url: string; body: any }[]) => Promise<void>, status = 200) {
  return async () => {
    const calls: { url: string; body: any }[] = [];
    const orig = globalThis.fetch;
    globalThis.fetch = (async (url: string, init: RequestInit) => { calls.push({ url, body: JSON.parse(String(init.body)) }); return new Response('{}', { status }); }) as typeof fetch;
    try { await fn(calls); } finally { globalThis.fetch = orig; }
  };
}
const json = (b: unknown) => new Request('https://x/api/lead', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(b) });
const form = (b: Record<string, string>, accept?: string) => { const fd = new FormData(); for (const [k, v] of Object.entries(b)) fd.append(k, v); return new Request('https://x/api/lead', { method: 'POST', body: fd, headers: accept ? { accept } : {} }); };

test('JSON → Telegram + {ok, thanks}', withFetch(async (calls) => {
  const r = await onRequestPost({ request: json(body), env });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true, thanks: '/dyakuyemo/?kanal=viber' });
  assert.equal(calls[0].url, 'https://tg.test/botT:1/sendMessage');
  assert.equal(calls[0].body.chat_id, '-1'); assert.equal(calls[0].body.parse_mode, 'HTML');
  assert.match(calls[0].body.text, /написати у Viber/); assert.match(calls[0].body.text, /Розрахунок \(клас A\)/);
}));
test('fetch with FormData (the site form) → JSON', withFetch(async () => {
  const r = await onRequestPost({ request: form(body, 'application/json'), env });
  assert.equal(r.status, 200); assert.equal((await r.json()).ok, true);
}));
test('plain form post (no JS) → 303 to /dyakuyemo/', withFetch(async (calls) => {
  const r = await onRequestPost({ request: form(body), env });
  assert.equal(r.status, 303); assert.equal(r.headers.get('location'), '/dyakuyemo/?kanal=viber'); assert.equal(calls.length, 1);
}));
test('validation error → 422 JSON in Ukrainian, nothing sent', withFetch(async (calls) => {
  const r = await onRequestPost({ request: json({ ...body, phone: '123' }), env });
  assert.equal(r.status, 422); assert.match((await r.json()).errors.phone, /Перевірте номер/); assert.equal(calls.length, 0);
}));
test('validation error without JS → 303 back to the same page with the error anchor', withFetch(async () => {
  const r = await onRequestPost({ request: form({ phone: '', page: '/tsiny/' }), env });
  assert.equal(r.status, 303); assert.equal(r.headers.get('location'), '/tsiny/?pomylka=1#pomylka');
}));
test('honeypot → fake success, nothing sent', withFetch(async (calls) => {
  const r = await onRequestPost({ request: json({ ...body, company: 'spam' }), env });
  assert.equal(r.status, 200); assert.equal(calls.length, 0);
}));
test('missing secrets (bot not connected yet) → 503 with phone + messengers, nothing sent', withFetch(async (calls) => {
  const r = await onRequestPost({ request: json(body), env: {} });
  const b = await r.json();
  assert.equal(r.status, 503); assert.equal(b.delivery, true); assert.equal(calls.length, 0);
  assert.match(b.errors.form, /зателефонуйте \+380 57 000-14-14/); assert.match(b.errors.form, /Telegram чи Viber/);
}));
test('missing secrets without JS → 303 back to the page with the «not sent» box', withFetch(async () => {
  const r = await onRequestPost({ request: form({ ...body, page: '/tsiny/' }), env: { TELEGRAM_BOT_TOKEN: '', TELEGRAM_CHAT_ID: '' } });
  assert.equal(r.status, 303); assert.equal(r.headers.get('location'), '/tsiny/?pomylka=nadislaty#ne-nadislano');
}));
test('Telegram failure → 502 with a phone fallback', withFetch(async () => {
  const r = await onRequestPost({ request: json(body), env });
  assert.equal(r.status, 502); assert.match((await r.json()).errors.form, /зателефонуйте/);
}, 500));
test('broken JSON → 400', withFetch(async () => {
  const r = await onRequestPost({ request: new Request('https://x/api/lead', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: '{' }), env });
  assert.equal(r.status, 400);
}));
test('GET → 405', () => { assert.equal(onRequestGet().status, 405); });
