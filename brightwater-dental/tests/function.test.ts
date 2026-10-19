import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/lead.ts';

const env = { TELEGRAM_BOT_TOKEN: 'T:1', TELEGRAM_CHAT_ID: '-1', TELEGRAM_API_BASE: 'https://tg.test' };
const day = (() => { // next Saturday, so the slot is always in the future
  const d = new Date(); d.setUTCDate(d.getUTCDate() + ((6 - d.getUTCDay() + 7) % 7 || 7)); return d.toISOString().slice(0, 10);
})();
const body = { p0_name: 'Sam', p0_visit: 'cleaning', date: day, time: '9 am', name: 'Sam Rivera', phone: '5125550187' };

function withFetch(fn: (calls: { url: string; body: any }[]) => Promise<void>, status = 200) {
  return async () => {
    const calls: { url: string; body: any }[] = [];
    const orig = globalThis.fetch;
    globalThis.fetch = (async (url: string, init: RequestInit) => { calls.push({ url, body: JSON.parse(String(init.body)) }); return new Response('{}', { status }); }) as typeof fetch;
    try { await fn(calls); } finally { globalThis.fetch = orig; }
  };
}
const json = (b: unknown) => new Request('https://x/api/lead', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(b) });

test('JSON booking → Telegram + {ok, thanks}', withFetch(async (calls) => {
  const r = await onRequestPost({ request: json(body), env });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.ok, true); assert.match(j.thanks, new RegExp(`/thanks/\\?n=1&d=${day}&t=9\\+am`));
  assert.equal(calls[0].url, 'https://tg.test/botT:1/sendMessage');
  assert.equal(calls[0].body.chat_id, '-1'); assert.equal(calls[0].body.parse_mode, 'HTML');
}));

test('plain form post (no JS) → 303 to /thanks/, comfort checkboxes kept', withFetch(async (calls) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ p0_name: 'Ana', p0_visit: 'new', preferred: 'saturday', name: 'Ana Lee', phone: '512 555 0101' })) fd.append(k, v);
  fd.append('comfort', 'sounds'); fd.append('comfort', 'needles');
  const r = await onRequestPost({ request: new Request('https://x/api/lead', { method: 'POST', body: fd }), env });
  assert.equal(r.status, 303); assert.equal(r.headers.get('location'), '/thanks/?n=1&p=saturday');
  assert.match(calls[0].body.text, /headphones; Needles/);
}));

test('validation error → 422 JSON with field errors, nothing sent', withFetch(async (calls) => {
  const r = await onRequestPost({ request: json({ ...body, phone: '123' }), env });
  assert.equal(r.status, 422); assert.ok((await r.json()).errors.phone); assert.equal(calls.length, 0);
}));

test('validation error without JS → 303 back to the form error', withFetch(async () => {
  const fd = new FormData(); fd.append('p0_name', '');
  const r = await onRequestPost({ request: new Request('https://x/api/lead', { method: 'POST', body: fd }), env });
  assert.equal(r.status, 303); assert.equal(r.headers.get('location'), '/book/?error=1#form-error');
}));

test('honeypot → fake success, nothing sent', withFetch(async (calls) => {
  const r = await onRequestPost({ request: json({ ...body, company: 'spam' }), env });
  assert.equal(r.status, 200); assert.equal(calls.length, 0);
}));

test('missing secrets → 503', withFetch(async () => {
  const r = await onRequestPost({ request: json(body), env: {} });
  assert.equal(r.status, 503);
}));

test('Telegram failure → 502 with a phone fallback', withFetch(async () => {
  const r = await onRequestPost({ request: json(body), env });
  assert.equal(r.status, 502); assert.match((await r.json()).errors.form, /call us/);
}, 500));
