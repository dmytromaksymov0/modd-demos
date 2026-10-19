import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/lead.ts';

const env = { TELEGRAM_BOT_TOKEN: 'TEST:token', TELEGRAM_CHAT_ID: '-100123' };
const realFetch = globalThis.fetch;
let calls: { url: string; body: any }[] = [];
let tgStatus = 200;

beforeEach(() => {
  calls = []; tgStatus = 200;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init.body)) });
    return new Response(JSON.stringify({ ok: tgStatus === 200 }), { status: tgStatus });
  }) as typeof fetch;
});
afterEach(() => { globalThis.fetch = realFetch; });

const form = (fields: Record<string, string>, json = true) => {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  return new Request('https://kestrel.test/api/lead', { method: 'POST', body: fd, headers: json ? { accept: 'application/json' } : {} });
};
const good = { problem: 'leak', zip: '43017', name: 'Jordan Miller', phone: '614 555 0199', page: '/' };

test('valid lead → Telegram sendMessage, 200 JSON', async () => {
  const res = await onRequestPost({ request: form(good), env });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.telegram.org/botTEST:token/sendMessage');
  assert.equal(calls[0].body.chat_id, '-100123');
  assert.equal(calls[0].body.parse_mode, 'HTML');
  assert.match(calls[0].body.text, /Leak/);
  assert.match(calls[0].body.text, /43017 — Dublin/);
});

test('invalid lead → 422 with field errors, nothing sent', async () => {
  const res = await onRequestPost({ request: form({ ...good, phone: '12' }), env });
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.ok(body.errors.phone);
  assert.equal(calls.length, 0);
});

test('honeypot → fake success, nothing sent', async () => {
  const res = await onRequestPost({ request: form({ ...good, company: 'spam' }), env });
  assert.equal(res.status, 200);
  assert.equal(calls.length, 0);
});

test('missing env → 503, nothing sent', async () => {
  const res = await onRequestPost({ request: form(good), env: {} });
  assert.equal(res.status, 503);
  assert.equal(calls.length, 0);
});

test('Telegram error → 502', async () => {
  tgStatus = 400;
  const res = await onRequestPost({ request: form(good), env });
  assert.equal(res.status, 502);
});

test('no-JS form post → 303 redirect to /thanks/', async () => {
  const res = await onRequestPost({ request: form(good, false), env });
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), '/thanks/');
});

test('no-JS invalid post → 303 back to the form with an error flag', async () => {
  const res = await onRequestPost({ request: form({ ...good, zip: 'x' }, false), env });
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), '/free-inspection/?error=1#form-error');
});

test('JSON body is accepted too', async () => {
  const req = new Request('https://kestrel.test/api/lead', { method: 'POST', body: JSON.stringify(good), headers: { 'content-type': 'application/json', accept: 'application/json' } });
  const res = await onRequestPost({ request: req, env });
  assert.equal(res.status, 200);
});
