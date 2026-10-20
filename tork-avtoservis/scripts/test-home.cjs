// Home interactions: lazy island (no home-ui JS before interaction), estimate recalculation and approve reply,
// mini calculator (class switch, combo saving, transfer to the booking form), messenger buttons preselect channel,
// mobile bar hidden in hero. Run: node scripts/test-home.cjs [baseUrl]
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const base = process.argv[2] || 'http://localhost:4321';
let fail = 0;
const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) fail++; };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const reqs = []; p.on('request', (r) => reqs.push(r.url()));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto(base + '/', { waitUntil: 'networkidle' });
  ok(!reqs.some((u) => /home-ui/.test(u)), 'home-ui.js is not loaded before interaction');
  const total = () => p.textContent('[data-estimate] [data-total]');
  ok((await total()).replace(/\s/g, ' ') === '2 680 ₴', 'estimate default total 2 680 ₴ (pads only)');
  await p.click('[data-line="discs"] label:has-text("Робимо")');
  await p.waitForFunction(() => document.querySelector('[data-estimate] [data-total]').textContent.replace(/\s/g, ' ') !== '2 680 ₴');
  ok(reqs.some((u) => /home-ui/.test(u)), 'home-ui.js loaded on first interaction');
  ok((await total()).replace(/\s/g, ' ') === '7 540 ₴', 'pads + discs = 830 + 1850 + 1100 + 4200 − 440 combo = 7 540 ₴');
  ok(await p.isVisible('[data-estimate] [data-combo]'), 'combo saving line shown');
  await p.click('[data-line="pads"] label:has-text("Відкласти")');
  await p.click('[data-line="discs"] label:has-text("Відкласти")');
  ok((await total()).replace(/\s/g, ' ') === '0 ₴', 'everything postponed = 0 ₴');
  ok(/Нічого не робимо/.test(await p.textContent('[data-approve]')), 'approve button says nothing today');
  await p.click('[data-line="pads"] label:has-text("Робимо")');
  await p.click('[data-approve]');
  ok(/Погоджую 2\s680/.test(await p.textContent('[data-thread]')), 'approve adds my message to the thread');
  ok(/Андрій: Прийнято/.test(await p.textContent('[data-thread]')), 'master replies in the thread');
  // calculator
  const ct = () => p.textContent('[data-calc-total]');
  ok((await ct()).replace(/\s/g, ' ') === '1 280 ₴', 'calc default class B pads+discs = 1 280 ₴');
  await p.click('[data-calc] label:has-text("Клас D")');
  ok((await ct()).replace(/\s/g, ' ') === '1 760 ₴', 'class D = 980 + 1300 − 520 = 1 760 ₴');
  ok(/−520/.test(await p.textContent('[data-calc-saving]')), 'combo saving −520 ₴ for class D');
  await p.click('[data-calc] label:has-text("Діагностика ходової")');
  ok((await ct()).replace(/\s/g, ' ') === '1 760 ₴', 'diagnostics free with a repair');
  ok(/Колодки \+ диски разом: −520/.test(await p.textContent('[data-calc-saving]')) && /Діагностика ходової при ремонті: −450/.test(await p.textContent('[data-calc-saving]')), 'savings listed separately: combo −520, diagnostics −450');
  await p.click('[data-calc-book]');
  await p.waitForTimeout(400);
  const v = await p.inputValue('[data-calc-field]'), k = await p.inputValue('[data-calc-klas]');
  ok(k === 'D' && v === 'pads-front,discs-front,diag-khodova', 'calculation transferred to the booking form: ' + k + ' / ' + v);
  ok(/1\s760/.test(await p.textContent('[data-calc-summary]')), 'summary shows 1 760 ₴');
  ok(await p.isVisible('[data-calc-summary]'), 'calculation summary visible in the form');
  // messenger buttons
  await p.evaluate(() => scrollTo(0, 0));
  await p.click('[data-hero] a:has-text("Viber")');
  await p.waitForTimeout(300);
  ok(await p.isChecked('[data-booking-form] input[name="kanal"][value="viber"]'), 'Viber button preselects Viber in the form');
  ok(await p.evaluate(() => document.activeElement?.getAttribute('name') === 'phone'), 'focus moved to the phone field');
  // no-JS: messenger link works as a plain URL
  const nj = await b.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const q = await nj.newPage();
  await q.goto(base + '/?kanal=telegram#zapys');
  ok(await q.isVisible('[data-booking-form]'), 'no-JS: form reachable via ?kanal=telegram#zapys');
  ok((await q.textContent('[data-estimate] [data-total]')).includes('2'), 'no-JS: estimate total rendered on the server');
  // mobile bar
  const m = await b.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const mp = await m.newPage();
  await mp.goto(base + '/', { waitUntil: 'networkidle' });
  ok((await mp.getAttribute('[data-mbar]', 'data-visible')) === 'false', 'mobile bar hidden on the first screen');
  await mp.evaluate(() => scrollTo(0, 1500)); await mp.waitForTimeout(500);
  ok((await mp.getAttribute('[data-mbar]', 'data-visible')) === 'true', 'mobile bar shown after the hero');
  ok(errs.length === 0, 'no console errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(fail ? `${fail} FAILED` : 'all passed');
  process.exit(fail ? 1 : 0);
})();
