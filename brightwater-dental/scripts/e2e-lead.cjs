// End-to-end: built site + real Pages Function (wrangler pages dev) + mock Telegram API.
// node scripts/e2e-lead.cjs   (run `npm run build` first)
const http = require('http');
const { spawn } = require('child_process');
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) process.exitCode = 1; };
const MOCK = 9989, SITE = 8789;

const received = [];
const mock = http.createServer((req, res) => {
  let body = ''; req.on('data', (c) => (body += c));
  req.on('end', () => { received.push({ url: req.url, body: JSON.parse(body || '{}') }); res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"ok":true}'); });
}).listen(MOCK);

const wr = spawn('npx', ['wrangler', 'pages', 'dev', 'dist', '--port', String(SITE), '--ip', '127.0.0.1',
  '--binding', 'TELEGRAM_BOT_TOKEN=TEST:token', '--binding', 'TELEGRAM_CHAT_ID=-100777', '--binding', `TELEGRAM_API_BASE=http://127.0.0.1:${MOCK}`],
  { cwd: __dirname + '/..', env: { ...process.env, WRANGLER_SEND_METRICS: 'false', CI: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; wr.stdout.on('data', (d) => (log += d)); wr.stderr.on('data', (d) => (log += d));
const waitUp = async () => { for (let i = 0; i < 160; i++) { try { const r = await fetch(`http://127.0.0.1:${SITE}/`); if (r.ok) return; } catch {} await new Promise((r) => setTimeout(r, 500)); } throw new Error('wrangler did not start:\n' + log); };

(async () => {
  try {
    await waitUp();
    const base = `http://127.0.0.1:${SITE}`;
    const b = await chromium.launch();

    // 1. Family booking with JS, prefilled from the home page link
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await p.goto(base + '/book/?crew=family&day=sat&comfort=sounds&insurance=cigna-ppo', { waitUntil: 'networkidle' });
    await p.waitForTimeout(1200);
    await p.fill('#p0-name', 'Sam'); await p.fill('#p1-name', 'Leo'); await p.fill('#p2-name', 'Mia');
    await p.locator('.time').first().click();
    const picked = await p.locator('[data-time]').inputValue();
    await p.fill('#b-name', 'Sam Rivera'); await p.fill('#b-phone', '512-555-0187');
    await Promise.all([p.waitForURL('**/thanks/**'), p.locator('[data-submit]').click()]);
    const m = received.at(-1);
    ok(m && m.url === '/botTEST:token/sendMessage' && m.body.chat_id === '-100777', 'JS booking → Telegram sendMessage with token + chat id');
    ok(/3 people/.test(m.body.text) && /Sam — Cleaning/.test(m.body.text) && /Leo — Kids/.test(m.body.text) && new RegExp(picked).test(m.body.text), 'message has 3 people, visit types and the chosen time');
    ok(/Cigna \(PPO\) — \$0/.test(m.body.text) && /headphones/.test(m.body.text), 'message has insurance in dollars and the comfort plan');
    ok(/We hold this time/.test(await p.locator('[data-summary]').textContent()) && await p.locator('[data-ics]').isVisible(), '/thanks/ shows the slot and an Add-to-calendar .ics');
    const ics = await p.evaluate(async () => (await fetch(document.querySelector('[data-ics]').href)).text());
    ok(/BEGIN:VEVENT/.test(ics) && /TZID=America\/Chicago/.test(ics), '.ics is a valid calendar event');

    // 2. Client-side validation: missing contact → errors next to fields, nothing sent
    const before = received.length;
    await p.goto(base + '/book/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1000);
    await p.fill('#p0-name', 'Ana'); await p.locator('.time').first().click();
    await p.fill('#b-name', 'A'); await p.fill('#b-phone', '012');
    await p.locator('[data-submit]').click(); await p.waitForTimeout(400);
    ok(/10-digit/.test(await p.locator('#phone-error').textContent()) && (await p.locator('#b-phone').getAttribute('aria-invalid')) === 'true' && received.length === before, 'invalid phone → message under the field, nothing sent');

    // 3. Server-side rejection (a slot outside hours forged in the hidden field)
    await p.fill('#b-name', 'Ana Lee'); await p.fill('#b-phone', '5125550101');
    // forge an out-of-hours time in the request the widget sends
    await p.route('**/api/lead', async (route) => { const body = JSON.parse(route.request().postData()); body.time = '11 pm'; await route.continue({ postData: JSON.stringify(body) }); });
    await p.locator('[data-submit]').click(); await p.waitForTimeout(1200);
    ok(/outside our hours|isn’t available/.test(await p.locator('#when-error').textContent()) && received.length === before, 'server 422 → message under the time picker, nothing sent');
    await p.unroute('**/api/lead');

    // 4. No JavaScript: plain HTML form post → /thanks/
    const nojs = await b.newContext({ javaScriptEnabled: false });
    const q = await nojs.newPage();
    await q.goto(base + '/book/');
    await q.fill('#p0-name', 'Chris'); await q.locator('label', { hasText: 'Saturday morning' }).click();
    await q.locator('label', { hasText: 'Needles' }).click(); await q.locator('label', { hasText: 'Being judged' }).click();
    await q.fill('#b-name', 'Chris Novak'); await q.fill('#b-phone', '(512) 555-0148');
    await Promise.all([q.waitForURL('**/thanks/**'), q.locator('[data-submit]').click()]);
    const t = received.at(-1).body.text;
    if (!/Saturday morning/.test(t)) console.log(t);
    ok(/Got it/.test(await q.locator('h1').textContent()) && /Saturday morning — text two options/.test(t) && /numbing gel first/.test(t) && /no lectures/.test(t), 'no-JS post → /thanks/, preference and both comfort choices delivered');
    // no-JS error path
    await q.goto(base + '/book/');
    await Promise.all([q.waitForURL('**/book/?error=1#form-error'), q.locator('[data-submit]').click()]);
    ok(await q.locator('#form-error').isVisible(), 'no-JS invalid post → back to /book/ with the error box (:target)');

    // 5. GET /api/lead is not allowed
    ok((await fetch(base + '/api/lead')).status === 405, 'GET /api/lead → 405');
    await b.close();
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { wr.kill(); mock.close(); }
})();
