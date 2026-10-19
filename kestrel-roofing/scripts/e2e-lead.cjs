// End-to-end: real built site + real Pages Function (wrangler pages dev) + mock Telegram API.
// node scripts/e2e-lead.cjs   (run `npm run build` first)
const http = require('http');
const { spawn } = require('child_process');
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) process.exitCode = 1; };
const MOCK = 9988, SITE = 8788;

const received = [];
const mock = http.createServer((req, res) => {
  let body = ''; req.on('data', (c) => (body += c));
  req.on('end', () => { received.push({ url: req.url, body: JSON.parse(body || '{}') }); res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"ok":true}'); });
}).listen(MOCK);

const wr = spawn('npx', ['wrangler', 'pages', 'dev', 'dist', '--port', String(SITE), '--ip', '127.0.0.1',
  '--binding', 'TELEGRAM_BOT_TOKEN=TEST:token', '--binding', 'TELEGRAM_CHAT_ID=-100777', '--binding', `TELEGRAM_API_BASE=http://127.0.0.1:${MOCK}`],
  { cwd: __dirname + '/..', env: { ...process.env, WRANGLER_SEND_METRICS: 'false', CI: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; wr.stdout.on('data', (d) => (log += d)); wr.stderr.on('data', (d) => (log += d));

const waitUp = async () => { for (let i = 0; i < 120; i++) { try { const r = await fetch(`http://127.0.0.1:${SITE}/`); if (r.ok) return; } catch {} await new Promise((r) => setTimeout(r, 500)); } throw new Error('wrangler did not start:\n' + log); };

(async () => {
  try {
    await waitUp();
    const base = `http://127.0.0.1:${SITE}`;
    const b = await chromium.launch();

    // 1. JS form on the home page
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await p.goto(base + '/', { waitUntil: 'networkidle' });
    const f = p.locator('#hero-form');
    await f.locator('label.chip', { hasText: 'Storm or hail' }).click();
    await f.locator('input[name="zip"]').fill('43221');
    await f.locator('[data-next]').click();
    await f.locator('input[name="name"]').fill('Jordan Miller');
    await f.locator('input[name="phone"]').fill('6145550199');
    await f.locator('[data-submit]').click();
    await f.locator('[data-success]').waitFor({ state: 'visible', timeout: 10000 });
    ok(true, 'home form: success state after real POST /api/lead');
    const m = received.at(-1);
    ok(m && m.url === '/botTEST:token/sendMessage' && m.body.chat_id === '-100777', 'Telegram mock got sendMessage with bot token + chat id');
    ok(/Storm or hail/.test(m.body.text) && /43221 — Upper Arlington/.test(m.body.text) && /\(614\) 555-0199/.test(m.body.text) && /Page:<\/b> \//.test(m.body.text), 'message has problem, ZIP/city, phone, page');

    // 2. Calculator estimate travels with the lead
    await p.goto(base + '/roof-cost-calculator/', { waitUntil: 'networkidle' });
    await p.locator('label.pitch-card', { hasText: 'Steep' }).first().click();
    const ff = p.locator('#final-form');
    await ff.locator('label.chip', { hasText: 'Old roof' }).click();
    await ff.locator('input[name="zip"]').fill('43017');
    await ff.locator('[data-next]').click();
    await ff.locator('input[name="name"]').fill('Sam Ortiz');
    await ff.locator('input[name="phone"]').fill('614-555-0123');
    await ff.locator('[data-submit]').click();
    await ff.locator('[data-success]').waitFor({ state: 'visible', timeout: 10000 });
    ok(/Calculator:<\/b> \$[\d,]+–\$[\d,]+ · [\d.]+ sq · 2,000 sq ft · 2 stories · 8\/12/.test(received.at(-1).body.text), 'calculator estimate included in the Telegram message');

    // 3. Server-side rejection shown next to the field (number the browser check lets through)
    const before = received.length;
    await p.goto(base + '/free-inspection/', { waitUntil: 'networkidle' });
    const fi = p.locator('#final-form');
    await fi.locator('label.chip', { hasText: 'Leak' }).click();
    await fi.locator('input[name="zip"]').fill('43215');
    await fi.locator('[data-next]').click();
    await fi.locator('input[name="name"]').fill('Pat Lee');
    await fi.locator('input[name="phone"]').fill('014-555-0123');
    await fi.locator('[data-submit]').click();
    await p.waitForTimeout(1500);
    ok((await fi.locator('#final-form-phone-error').textContent()).includes('10-digit') && received.length === before, 'server 422 → message under the phone field, nothing sent');

    // 4. No JavaScript: plain HTML form post → /thanks/
    const nojs = await b.newContext({ javaScriptEnabled: false });
    const q = await nojs.newPage();
    await q.goto(base + '/free-inspection/');
    await q.locator('#final-form label.chip', { hasText: 'Not sure' }).click();
    await q.locator('#final-form input[name="zip"]').fill('43085');
    await q.locator('#final-form input[name="name"]').fill('Chris Novak');
    await q.locator('#final-form input[name="phone"]').fill('(614) 555-0148');
    await Promise.all([q.waitForURL('**/thanks/'), q.locator('#final-form [data-submit]').click()]);
    ok(/Got it/.test(await q.locator('h1').textContent()) && /Worthington/.test(received.at(-1).body.text), 'no-JS post → /thanks/ and lead delivered');

    // 5. No JavaScript, invalid → back to the form with a visible error
    await q.goto(base + '/free-inspection/');
    await q.locator('#final-form input[name="zip"]').fill('1');
    await Promise.all([q.waitForURL('**/free-inspection/?error=1#form-error'), q.locator('#final-form [data-submit]').click()]);
    ok(await q.locator('#form-error').isVisible(), 'no-JS invalid post → error notice visible');

    // 6. Honeypot
    const n = received.length;
    const res = await fetch(base + '/api/lead', { method: 'POST', headers: { accept: 'application/json' }, body: new URLSearchParams({ problem: 'leak', zip: '43215', name: 'Bot', phone: '6145550100', company: 'x' }) });
    ok(res.status === 200 && received.length === n, 'honeypot filled → 200, nothing sent');

    // 7. 404 page served by Pages
    const r404 = await fetch(base + '/no-such-page/');
    ok(r404.status === 404 && (await r404.text()).includes('Inspection #404'), 'unknown URL → custom 404 page');
    await b.close();
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { wr.kill('SIGTERM'); mock.close(); setTimeout(() => process.exit(), 500); }
})();
