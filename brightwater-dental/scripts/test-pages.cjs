// Inner-page interactions: node scripts/test-pages.cjs [baseUrl]
// booking prefill + slots + summary, no-JS booking fallback, emergency triage, plan calculator.
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const base = process.argv[2] || 'http://localhost:4321';
let fails = 0;
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));

  // Booking: family prefill
  await p.goto(base + '/book/?crew=family&day=sat&comfort=sounds,control&insurance=cigna-ppo&doctor=elena-ruiz', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  ok(await p.locator('[data-calendar]').isVisible(), 'calendar replaces the no-JS time preference');
  ok((await p.locator('[data-person]:not(.is-empty)').count()) === 3, 'crew=family → 3 people');
  ok((await p.locator('#p1-visit').inputValue()) === 'kids', 'person 2 prefilled as kids cleaning');
  ok(/Sat/.test(await p.locator('.day[aria-checked=true]').textContent()), 'day=sat → Saturday selected');
  ok(await p.locator('input[name=comfort][value=sounds]').isChecked() && await p.locator('input[name=comfort][value=control]').isChecked(), 'comfort prefilled');
  ok((await p.locator('#b-carrier').inputValue()) === 'cigna' && (await p.locator('#b-plan').inputValue()) === 'ppo', 'insurance prefilled');
  ok((await p.locator('#b-doctor').inputValue()) === 'elena-ruiz', 'doctor prefilled');
  ok(await p.evaluate(() => scrollY) === 0, 'page does not scroll on load');
  const times = p.locator('.time');
  ok((await times.count()) > 0, `side-by-side times offered (${await times.count()})`);
  await times.first().click();
  ok((await p.locator('[data-date]').inputValue()).match(/^\d{4}-\d{2}-\d{2}$/) && (await p.locator('[data-time]').inputValue()) !== '', 'hidden date/time filled after picking a time');
  ok(await p.locator('[data-lanes]').isVisible(), 'chair lanes preview shown');
  await p.locator('[data-add]').click();
  ok((await p.locator('[data-person]:not(.is-empty)').count()) === 4, 'add someone → 4 people');
  ok((await p.locator('[data-time]').inputValue()) === '', 'changing the group clears the chosen time');
  const t4 = await p.locator('.time').first().textContent().catch(() => '');
  ok(/back-to-back/.test(t4 || ''), '4 people → back-to-back times');
  await p.locator('[data-person]:not(.is-empty) [data-remove]').last().click();
  ok((await p.locator('[data-person]:not(.is-empty)').count()) === 3, 'remove → 3 people');
  ok(await p.locator('[data-sticky-bar]').count() === 0, 'no sticky bar on /book');

  // Booking without JS
  const nojs = await b.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const q = await nojs.newPage();
  await q.goto(base + '/book/');
  ok(await q.locator('[data-pref]').isVisible(), 'no-JS: preferred-time radios visible');
  ok((await q.locator('form[data-book]').getAttribute('method')) === 'post', 'no-JS: plain POST form');
  ok(await q.locator('#p2-name').isVisible(), 'no-JS: three people rows visible');
  await nojs.close();

  // Emergency triage
  await p.goto(base + '/services/emergency-dentist/', { waitUntil: 'networkidle' });
  const pick = async (sel) => { await p.locator(sel).locator('xpath=..').click(); await p.waitForTimeout(80); };
  const shown = async () => (await p.locator('[data-verdict]:visible').evaluateAll((els) => els.map((e) => e.dataset.verdict))).join(',');
  await pick('input[name=symptom][value=crown]'); await pick('input[name=fever][value=no]');
  ok((await shown()) === 'soon', 'crown out, no fever → can wait');
  await pick('input[name=symptom][value=knocked]');
  ok((await shown()) === 'now', 'knocked-out tooth → come in now');
  await pick('input[name=airway][value=yes]');
  ok((await shown()) === 'er', 'airway swelling → ER');
  await pick('input[name=airway][value=no]'); await pick('input[name=symptom][value=pain]');
  ok((await shown()) === 'today', 'toothache → today');

  // Plan calculator
  await p.goto(base + '/insurance-financing/', { waitUntil: 'networkidle' });
  ok((await p.locator('[data-saved]').textContent()) === '$328', 'calculator default 2+2 → $328');
  await p.locator('[data-step="kids:1"]').click();
  ok((await p.locator('[data-plan]').textContent()) === '$1,380', '2 adults + 3 kids → $1,380 a year');
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  process.exitCode = fails ? 1 : 0;
})();
