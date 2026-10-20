// End-to-end: built site + real Pages Function (wrangler pages dev) + mock Telegram API.
// node scripts/e2e-lead.cjs   (run `npm run build` first)
const http = require('http');
const { spawn } = require('child_process');
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) process.exitCode = 1; };
const MOCK = 9979, SITE = 8779, BARE = 8780; // BARE: the same site with no Telegram secrets (demo before the bot)

const received = [];
let failNext = false;
const mock = http.createServer((req, res) => {
  let body = ''; req.on('data', (c) => (body += c));
  req.on('end', () => {
    if (failNext) { failNext = false; res.writeHead(500); res.end('boom'); return; }
    received.push({ url: req.url, body: JSON.parse(body || '{}') }); res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"ok":true}');
  });
}).listen(MOCK);

let log = '';
const startPages = (port, bindings) => {
  const args = ['wrangler', 'pages', 'dev', 'dist', '--port', String(port), '--ip', '127.0.0.1', '--inspector-port', String(port + 1000), '--persist-to', `.wrangler/e2e-${port}`, ...bindings.flatMap((x) => ['--binding', x])];
  const w = spawn('npx', args, { cwd: __dirname + '/..', env: { ...process.env, WRANGLER_SEND_METRICS: 'false', CI: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  w.stdout.on('data', (d) => (log += d)); w.stderr.on('data', (d) => (log += d));
  return w;
};
const wr = startPages(SITE, ['TELEGRAM_BOT_TOKEN=TEST:token', 'TELEGRAM_CHAT_ID=-100777', `TELEGRAM_API_BASE=http://127.0.0.1:${MOCK}`]);
const bare = startPages(BARE, []);
const waitUp = async (port) => { for (let i = 0; i < 160; i++) { try { const r = await fetch(`http://127.0.0.1:${port}/`); if (r.ok) return; } catch {} await new Promise((r) => setTimeout(r, 500)); } throw new Error('wrangler did not start:\n' + log); };

(async () => {
  try {
    await waitUp(SITE); await waitUp(BARE);
    const base = `http://127.0.0.1:${SITE}`;
    const b = await chromium.launch();

    // 1. Calculator → booking with JS, reply via Telegram
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await p.goto(base + '/kalkulyator/?klas=C&robota=pads-front&robota=discs-front#kalk', { waitUntil: 'networkidle' });
    await p.waitForFunction(() => /клас C/.test(document.querySelector('[data-calc-class]').textContent));
    await p.locator('[data-calc-book]').click(); await p.waitForTimeout(300);
    await p.fill('#bk-phone', '067 123 45 67'); await p.fill('#bk-name', 'Ірина'); await p.fill('#bk-car', 'Tucson 2018');
    await p.locator('[data-booking-form] label', { hasText: 'Telegram' }).click();
    await Promise.all([p.waitForURL('**/dyakuyemo/**'), p.locator('[data-submit]').click()]);
    let m = received.at(-1);
    ok(m && m.url === '/botTEST:token/sendMessage' && m.body.chat_id === '-100777', 'JS booking → Telegram sendMessage with token + chat id');
    ok(/\+380 67 123 45 67/.test(m.body.text) && /написати в Telegram/.test(m.body.text) && /Tucson 2018/.test(m.body.text), 'message: normalized phone, reply channel, car');
    ok(/Розрахунок \(клас C\)/.test(m.body.text) && /Колодки передні/.test(m.body.text) && /Робота 1 490 ₴/.test(m.body.text), 'message: class C calc re-priced on the server (830 + 1100 − 440 = 1 490 ₴)');
    ok(/у Telegram/.test(await p.locator('[data-channel]').textContent()), '/dyakuyemo/ names the chosen channel');

    // 2. Estimate choice from the home chat travels with the booking
    await p.goto(base + '/', { waitUntil: 'networkidle' });
    await p.locator('[data-line="discs"] label', { hasText: 'Робимо' }).click();
    await p.locator('[data-approve]').click(); await p.waitForTimeout(300);
    await p.fill('#bk-phone', '+380501112233');
    await Promise.all([p.waitForURL('**/dyakuyemo/**'), p.locator('[data-submit]').click()]);
    m = received.at(-1);
    ok(/Робимо: Колодки передні, Диски передні/.test(m.body.text) && /Сума за погодженим: 7 540 ₴/.test(m.body.text) && /написати в Telegram/.test(m.body.text), 'estimate choice delivered; form default channel is Telegram');

    // 3. Validation with JS: bad phone → message under the field, nothing sent
    const before = received.length;
    await p.goto(base + '/kontakty/', { waitUntil: 'networkidle' });
    await p.fill('#bk-phone', '12345');
    await p.locator('[data-submit]').click(); await p.waitForTimeout(800);
    ok(/Перевірте номер/.test(await p.locator('#bk-phone-jserr').textContent()) && (await p.locator('#bk-phone').getAttribute('aria-invalid')) === 'true' && received.length === before, 'invalid phone → 422, Ukrainian message under the field, nothing sent');
    ok(p.url().includes('/kontakty/'), 'stays on the page');

    // 4. Telegram down → clear fallback message
    failNext = true;
    await p.fill('#bk-phone', '0671234567');
    await p.locator('[data-submit]').click(); await p.waitForTimeout(1200);
    ok(await p.locator('#ne-nadislano').isVisible() && !(await p.locator('#pomylka').isVisible()) && await p.locator('#ne-nadislano a[href="tel:+380570001414"]').isVisible() && await p.locator('#ne-nadislano a[href^="https://t.me/"]').isVisible(), 'Telegram failure → «не вдалося надіслати» box with phone, Telegram, Viber');

    // 5. Messenger button preselects Viber, then send
    await p.goto(base + '/poslugy/halma/', { waitUntil: 'networkidle' });
    await p.locator('[data-hero] a', { hasText: 'Viber' }).click(); await p.waitForTimeout(400);
    await p.fill('#bk-phone', '0931234567');
    await Promise.all([p.waitForURL('**/dyakuyemo/?kanal=viber'), p.locator('[data-submit]').click()]);
    ok(/написати у Viber/.test(received.at(-1).body.text) && /сторінка \/poslugy\/halma\//.test(received.at(-1).body.text), 'Viber button → reply via Viber, page recorded');

    // 6. No JavaScript: plain form post → /dyakuyemo/, and the error path
    const nojs = await b.newContext({ javaScriptEnabled: false });
    const q = await nojs.newPage();
    await q.goto(base + '/tsiny/');
    await q.fill('#bk-phone', '(066) 765-43-21'); await q.fill('#bk-what', 'Скрипить при гальмуванні');
    await Promise.all([q.waitForURL('**/dyakuyemo/**'), q.locator('[data-submit]').click()]);
    ok(/Дякуємо/.test(await q.locator('h1').textContent()) && /Скрипить при гальмуванні/.test(received.at(-1).body.text) && /\+380 66 765 43 21/.test(received.at(-1).body.text), 'no-JS post → 303 /dyakuyemo/, message delivered');
    await q.goto(base + '/tsiny/');
    await q.fill('#bk-phone', '000');
    await Promise.all([q.waitForURL('**/tsiny/?pomylka=1#pomylka'), q.locator('[data-submit]').click()]);
    ok(await q.locator('#pomylka').isVisible(), 'no-JS invalid post → back to the same page with the error box (:target)');

    // 8. Bot not connected yet (no secrets): honest fallback with and without JS, no page errors
    const bb = `http://127.0.0.1:${BARE}`;
    const pageErrors = [], consoleErrors = [];
    const s1 = await b.newPage();
    s1.on('pageerror', (e) => pageErrors.push(e.message));
    s1.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource: the server responded with a status of 503/.test(m.text())) consoleErrors.push(m.text()); });
    await s1.goto(bb + '/kontakty/', { waitUntil: 'networkidle' });
    await s1.fill('#bk-phone', '0671234567');
    const [resp] = await Promise.all([s1.waitForResponse('**/api/lead'), s1.locator('[data-submit]').click()]);
    await s1.waitForTimeout(400);
    const boxText = await s1.locator('#ne-nadislano').innerText();
    ok(resp.status() === 503 && await s1.locator('#ne-nadislano').isVisible() && /\+380 57 000-14-14/.test(boxText) && /Telegram/.test(boxText) && /Viber/.test(boxText) && s1.url().includes('/kontakty/'), 'no secrets, JS → 503, box with phone + Telegram + Viber, stays on the page');
    ok(await s1.evaluate(() => document.activeElement?.id) === 'ne-nadislano' && (await s1.locator('[data-submit-label]').textContent()) === 'Записатися', 'focus moves to the box, button is usable again');
    ok(pageErrors.length === 0 && consoleErrors.length === 0, `no uncaught errors in the console${pageErrors.length + consoleErrors.length ? ': ' + [...pageErrors, ...consoleErrors].join(' | ') : ''}`);
    const s2 = await (await b.newContext({ javaScriptEnabled: false })).newPage();
    await s2.goto(bb + '/poslugy/khodova/');
    await s2.fill('#bk-phone', '0671234567');
    await Promise.all([s2.waitForURL('**/poslugy/khodova/?pomylka=nadislaty#ne-nadislano'), s2.locator('[data-submit]').click()]);
    ok(await s2.locator('#ne-nadislano').isVisible() && !(await s2.locator('#pomylka').isVisible()) && await s2.locator('#ne-nadislano a[href^="viber://"]').isVisible(), 'no secrets, no JS → 303 back to the page, «не вдалося надіслати» box via :target');

    // 7. Honeypot and GET
    const r = await fetch(base + '/api/lead', { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ phone: '0671234567', company: 'bot' }) });
    const n = received.length;
    ok(r.status === 200 && received.length === n, 'honeypot → fake 200, nothing sent');
    ok((await fetch(base + '/api/lead')).status === 405, 'GET /api/lead → 405');
    await b.close();
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { wr.kill(); bare.kill(); mock.close(); }
})();
