// End-to-end: real form → Pages Function → mock Telegram. Starts its own mock (:9983) and `wrangler pages dev dist`
// (:8793) with TELEGRAM_* bindings pointing at the mock. Needs a fresh `npm run build`. node scripts/e2e-lead.cjs
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const http = require('http'), { spawn } = require('child_process'), path = require('path'), os = require('os'), fs = require('fs');
const root = path.join(__dirname, '..');
const PORT = 8793, TG = 9983, base = `http://localhost:${PORT}`;
const msgs = [];
let pass = 0, fail = 0;
const ok = (c, n, x = '') => { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n, x); } };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const mock = http.createServer((req, res) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { msgs.push(JSON.parse(b)); res.setHeader('content-type', 'application/json'); res.end('{"ok":true}'); }); }).listen(TG);
  const persist = fs.mkdtempSync(path.join(os.tmpdir(), 'vyshnia-e2e-'));
  const wr = spawn('npx', ['wrangler', 'pages', 'dev', 'dist', '--port', String(PORT), '--inspector-port', '9293', '--persist-to', persist,
    '--binding', 'TELEGRAM_BOT_TOKEN=test', 'TELEGRAM_CHAT_ID=1', `TELEGRAM_API_BASE=http://localhost:${TG}`], { cwd: root, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { const r = await fetch(base + '/'); if (r.ok) break; } catch {} await wait(1000); }
  const b = await chromium.launch();
  try {
    // 1. booking with JS, from a «Хочу так само» link
    {
      const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
      await p.goto(base + '/zapys/?posluga=pedi-coat&maister=marta&kolir=moloko#zapys', { waitUntil: 'networkidle' });
      await p.waitForSelector('[data-step="3"][data-active]');
      await p.click('[data-slots] .slot.is-free');
      await p.click('.summary-panel [data-next]');
      await p.fill('#bk-name', 'Катерина'); await p.fill('#bk-phone', '+38 (067) 123-45-67'); await p.check('[name="zgoda"]');
      await Promise.all([p.waitForURL(/zapysano/), p.click('.summary-panel [data-next]')]);
      await p.waitForSelector('[data-summary]:not([hidden])');
      const t = msgs.at(-1)?.text ?? '';
      ok(/Педикюр з покриттям/.test(t) && /Молоко/.test(t) && /Марта Лисенко/.test(t) && /950 ₴/.test(t) && /гарантія до/.test(t), 'JS booking → Telegram with service, shade, master, price, guarantee');
      ok((await p.textContent('[data-summary]')).includes('Марта'), '«Дякуємо» shows the booking');
      ok(await p.isVisible('[data-next-booking]'), '«Що далі» for a booking');
    }
    // 2. booking without JS
    {
      const p = await (await b.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false })).newPage();
      await p.goto(base + '/zapys/', { waitUntil: 'load' });
      await p.fill('#bk-phone', '0501112233'); await p.check('[name="zgoda"]');
      await p.selectOption('[name="chastyna"]', 'vechir');
      await Promise.all([p.waitForNavigation(), p.click('[data-step="4"] button[type=submit]')]);
      ok(p.url().includes('/zapysano/') && /вечір/.test(msgs.at(-1)?.text ?? ''), 'no-JS booking → 303 → «Дякуємо», part of day in Telegram', p.url());
    }
    // 3. certificate
    {
      const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
      await p.goto(base + '/sertyfikaty/', { waitUntil: 'networkidle' });
      await p.click('label:has(input[name="nominal"][value="1500"])');
      await p.click('label:has(input[name="dyzain"][value="pudra"])');
      await p.fill('#c-komu', 'Мамі'); await p.fill('#c-wish', 'З любовʼю');
      ok((await p.textContent('[data-p-amount]')).includes('1') && (await p.textContent('[data-p-to]')).includes('Мамі'), 'live preview follows the form');
      ok(await p.getAttribute('[data-preview]', 'data-design') === 'pudra', 'preview design switches');
      await p.click('[data-cert-submit]');
      ok(await p.isVisible('[data-cert-err]'), 'empty phone → error');
      await p.fill('#c-phone', '067 123 45 67'); await p.check('[name="zgoda"]');
      await Promise.all([p.waitForURL(/zapysano/), p.click('[data-cert-submit]')]);
      await p.waitForSelector('[data-next-cert]:not([hidden])');
      const t = msgs.at(-1)?.text ?? '';
      ok(/Подарунковий сертифікат/.test(t) && /1500 ₴/.test(t) && /Пудра/.test(t) && /Мамі/.test(t), 'certificate → Telegram with amount, design, recipient');
      ok((await p.textContent('[data-title]')).includes('Подарунок'), '«Дякуємо» for a certificate');
    }
  } finally {
    await b.close(); wr.kill('SIGTERM'); mock.close();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
})();
