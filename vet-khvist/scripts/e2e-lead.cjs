// End-to-end: built site + real Pages Function (wrangler pages dev) + mock Telegram API.
// node scripts/e2e-lead.cjs   (run `npm run build` first)
const http = require('http');
const { spawn } = require('child_process');
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) process.exitCode = 1; };
const MOCK = 9989, SITE = 8789, BARE = 8790; // BARE: the same site with no Telegram secrets (demo before the bot)

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

    // 1. Home: «Чи терміново?» → «Планово» → book with the result, reply via Telegram
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await p.goto(base + '/?t=day', { waitUntil: 'networkidle' });
    await p.click('[data-go="step2"]');
    await p.click('label:has(input[name="species"][value="dog"])'); await p.click('label:has(input[name="symptom"][value="itch"])');
    await p.click('[data-go="result"]'); await p.click('[data-outcome="plan"] [data-book-with-triage]'); await p.waitForTimeout(400);
    await p.click('[data-booking-form] label:has(input[name="pryvid"][value="огляд"])');
    await p.click('[data-booking-form] label:has(input[name="vyd"][value="pes"])');
    await p.fill('#f-phone', '067 123 45 67'); await p.fill('#f-name', 'Ірина'); await p.fill('#f-klychka', 'Рекс');
    await p.click('[data-booking-form] label:has(input[name="kanal"][value="telegram"])');
    await Promise.all([p.waitForURL('**/dyakuyemo/**'), p.click('[data-booking-form] [data-submit]')]);
    let m = received.at(-1);
    ok(m && m.url === '/botTEST:token/sendMessage' && m.body.chat_id === '-100777', 'JS booking → Telegram sendMessage with token + chat id');
    ok(/\+380 67 123 45 67/.test(m.body.text) && /написати в Telegram/.test(m.body.text) && /собака, Рекс/.test(m.body.text) && /Привід:<\/b> огляд/.test(m.body.text), 'message: normalized phone, channel, pet, reason');
    ok(/«Чи терміново\?»:<\/b> Планово/.test(m.body.text), 'triage result travels with the booking');
    ok(/у Telegram/.test(await p.locator('[data-channel]').textContent()), '/dyakuyemo/ names the chosen channel');

    // 2. Plan-door chip preselects the reason (?pryvid=)
    await p.goto(base + '/?pryvid=' + encodeURIComponent('щеплення') + '#zapys', { waitUntil: 'networkidle' });
    ok(await p.locator('[data-booking-form] input[name="pryvid"][value="щеплення"]').isChecked(), '?pryvid= preselects the reason');

    // 3. Club sign-up
    await p.goto(base + '/klub/', { waitUntil: 'networkidle' });
    await p.click('[data-booking-form] label:has(input[name="vyd"][value="pes"])'); await p.click('[data-booking-form] label:has(input[name="vik"][value="8+ років"])');
    await p.fill('#f-phone', '0501112233'); await p.fill('#f-ostannie', '03.2026');
    await Promise.all([p.waitForURL('**/dyakuyemo/**klub=1'), p.click('[data-booking-form] [data-submit]')]);
    m = received.at(-1);
    ok(/Клуб турботи · новий учасник/.test(m.body.text) && /8\+ років/.test(m.body.text) && /Останнє щеплення:<\/b> 03\.2026/.test(m.body.text), 'club sign-up: kind, age, last vaccine');
    ok(/Ласкаво просимо в клуб/.test(await p.locator('h1').textContent()), '/dyakuyemo/?klub=1 shows the club copy');

    // 4. Validation with JS: bad phone → message under the field, nothing sent
    const before = received.length;
    await p.goto(base + '/zapys/', { waitUntil: 'networkidle' });
    await p.fill('#f-phone', '12345'); await p.click('[data-booking-form] [data-submit]'); await p.waitForTimeout(800);
    ok(/Перевірте номер/.test(await p.locator('#f-phone-jserr').textContent()) && (await p.locator('#f-phone').getAttribute('aria-invalid')) === 'true' && received.length === before, 'invalid phone → 422, Ukrainian message under the field, nothing sent');

    // 5. Telegram down → clear fallback with the phone
    failNext = true;
    await p.fill('#f-phone', '0671234567'); await p.click('[data-booking-form] [data-submit]'); await p.waitForTimeout(1200);
    ok(await p.locator('#ne-nadislano').isVisible() && await p.locator('#ne-nadislano a[href="tel:+380570002424"]').isVisible(), 'Telegram failure → «не вдалося надіслати» box with the phone');

    // 6. No JavaScript: plain post → /dyakuyemo/, and the error path
    const nojs = await b.newContext({ javaScriptEnabled: false });
    const q = await nojs.newPage();
    await q.goto(base + '/zapys/');
    await q.fill('#f-phone', '(066) 765-43-21'); await q.fill('#f-note', 'Кіт чхає третій день');
    await Promise.all([q.waitForURL('**/dyakuyemo/**'), q.click('[data-booking-form] [data-submit]')]);
    ok(/Дякуємо/.test(await q.locator('h1').textContent()) && /Кіт чхає третій день/.test(received.at(-1).body.text) && /\+380 66 765 43 21/.test(received.at(-1).body.text), 'no-JS post → 303 /dyakuyemo/, message delivered');
    await q.goto(base + '/zapys/');
    await q.fill('#f-phone', '000');
    await Promise.all([q.waitForURL('**/zapys/?pomylka=1#pomylka'), q.click('[data-booking-form] [data-submit]')]);
    ok(await q.locator('#pomylka').isVisible(), 'no-JS invalid post → back to the page with the error box (:target)');

    // 7. Bot not connected yet (no secrets): honest fallback with and without JS, no page errors
    const bb = `http://127.0.0.1:${BARE}`;
    const pageErrors = [], consoleErrors = [];
    const s1 = await b.newPage();
    s1.on('pageerror', (e) => pageErrors.push(e.message));
    s1.on('console', (x) => { if (x.type() === 'error' && !/status of 503/.test(x.text())) consoleErrors.push(x.text()); });
    await s1.goto(bb + '/zapys/', { waitUntil: 'networkidle' });
    await s1.fill('#f-phone', '0671234567');
    const [resp] = await Promise.all([s1.waitForResponse('**/api/lead'), s1.click('[data-booking-form] [data-submit]')]);
    await s1.waitForTimeout(400);
    ok(resp.status() === 503 && await s1.locator('#ne-nadislano').isVisible() && /057 000 24 24/.test(await s1.locator('#ne-nadislano').innerText()) && s1.url().includes('/zapys/'), 'no secrets, JS → 503, box with the phone, stays on the page');
    ok(await s1.evaluate(() => document.activeElement?.id) === 'ne-nadislano' && (await s1.locator('[data-submit-label]').textContent()) === 'Записатися', 'focus moves to the box, button is usable again');
    ok(pageErrors.length === 0 && consoleErrors.length === 0, `no uncaught errors in the console${pageErrors.length + consoleErrors.length ? ': ' + [...pageErrors, ...consoleErrors].join(' | ') : ''}`);
    const s2 = await (await b.newContext({ javaScriptEnabled: false })).newPage();
    await s2.goto(bb + '/klub/');
    await s2.fill('#f-phone', '0671234567');
    await Promise.all([s2.waitForURL('**/klub/?pomylka=nadislaty#ne-nadislano'), s2.click('[data-booking-form] [data-submit]')]);
    ok(await s2.locator('#ne-nadislano').isVisible() && !(await s2.locator('#pomylka').isVisible()), 'no secrets, no JS → 303 back to the page, «не вдалося надіслати» box via :target');

    // 8. Honeypot and GET
    const n = received.length;
    const r = await fetch(base + '/api/lead', { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ phone: '0671234567', company: 'bot' }) });
    ok(r.status === 200 && received.length === n, 'honeypot → fake 200, nothing sent');
    ok((await fetch(base + '/api/lead')).status === 405, 'GET /api/lead → 405');
    await b.close();
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { wr.kill(); bare.kill(); mock.close(); }
})();
