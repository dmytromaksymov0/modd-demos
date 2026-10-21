// Booking flows on the home page: node scripts/test-home.cjs [baseUrl]   (needs `wrangler pages dev dist` for /api/lead)
// Lazy island (no booking chunk before interaction), 4 steps, top +20 %, slots, contact validation, the honest
// no-secrets fallback, «Хочу так само» prefill, mobile bottom bar, and the no-JS form.
const { chromium, devices } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const base = process.argv[2] || 'http://localhost:8791';
let pass = 0, fail = 0;
const ok = (cond, name, extra = '') => { if (cond) { pass++; console.log('  ✓', name); } else { fail++; console.log('  ✗', name, extra); } };

(async () => {
  const b = await chromium.launch();

  // ── desktop wizard ──
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
    const p = await ctx.newPage(); const reqs = []; const errs = [];
    p.on('request', (r) => reqs.push(r.url())); p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/503|Service Unavailable/.test(m.text()) && errs.push(m.text()));
    await p.goto(base + '/', { waitUntil: 'networkidle' });
    ok(!reqs.some((u) => /booking-ui/.test(u)), 'booking logic is not loaded before interaction');
    ok(await p.$$eval('[data-variants-box] .chip', (els) => els.filter((e) => e.getClientRects().length).length) === 4, 'before JS logic: only the 4 manicure variants show');
    ok(await p.isVisible('[data-step="1"]') && !(await p.isVisible('[data-step="2"]')), 'step 1 visible, step 2 hidden');
    await p.click('.summary-panel [data-next]');
    await p.waitForSelector('[data-step="2"][data-active]');
    ok(reqs.some((u) => /booking-ui/.test(u)), 'logic loaded on first click, and that click was not lost (step 2 open)');
    const visibleMasters = await p.$$eval('[data-step="2"] [data-master]', (els) => els.filter((e) => e.getClientRects().length > 0).map((e) => e.dataset.master));
    ok(JSON.stringify(visibleMasters) === JSON.stringify(['any', 'olena', 'daryna', 'sofiia', 'marta']), 'manicure → only nail masters + «будь-яка»', visibleMasters.join());
    ok(/вільно: /.test(await p.textContent('[data-master="olena"] [data-next]')), 'nearest window shown per master');
    await p.click('[data-master="olena"]');
    ok((await p.textContent('.summary-panel [data-sum-total]')).includes('900'), 'top master → 900 ₴ (+20 %)');
    ok((await p.textContent('.summary-panel [data-sum-note]')).includes('топ'), 'summary says «топ +20 %»');
    await p.click('.summary-panel [data-next]');
    await p.waitForSelector('[data-step="3"][data-active]');
    const dayChecked = await p.$('[data-days] input:checked');
    ok(!!dayChecked, 'step 3: nearest day preselected');
    await p.click('.summary-panel [data-next]');
    ok((await p.textContent('[data-slots-note]')).includes('оберіть час'), 'cannot continue without a time');
    await p.click('[data-slots] .slot.is-free');
    const koly = await p.textContent('.summary-panel [data-sum="koly"]');
    ok(/\d{2}:\d{2}/.test(koly), 'summary shows day and time', koly);
    ok(/до \d+ /.test(await p.textContent('.summary-panel [data-sum-guar-date]')), 'guarantee turns into a date');
    await p.click('.summary-panel [data-next]');
    await p.waitForSelector('[data-step="4"][data-active]');
    ok((await p.textContent('.summary-panel [data-cta]')).includes('Записатися'), 'step 4: CTA = Записатися');
    await p.click('.summary-panel [data-next]');
    ok(await p.isVisible('#bk-phone-err'), 'empty phone → error under the field');
    ok(await p.isVisible('[data-err="zgoda"]'), 'no consent → error');
    await p.fill('#bk-phone', '067 123 45 67'); await p.check('[name="zgoda"]');
    await p.click('.summary-panel [data-next]');
    await p.waitForSelector('[data-form-error]:not(.hidden)', { timeout: 8000 });
    const fe = await p.textContent('[data-form-error]');
    ok(/057 000 21 21/.test(fe) && /Telegram/.test(fe), 'no secrets → honest fallback with phone and Telegram', fe.slice(0, 80));
    await p.click('[data-goto="1"]');
    ok(await p.isVisible('[data-step="1"]'), 'step pills go back');
    await p.click('[data-step="1"] .service-tip:has(input[value="brows"])');
    ok((await p.textContent('.summary-panel [data-sum="maister"]')).includes('будь-яка'), 'brows: nail master reset to «будь-яка»');
    ok(await p.isHidden('[data-shade="panel"]'), 'brows: no shade picker, no guarantee');
    ok(await p.isHidden('.summary-panel [data-sum-guar]'), 'brows: guarantee row hidden');
    ok(await p.$$eval('[data-variants-box] .chip', (els) => els.filter((e) => e.getClientRects().length).every((e) => e.dataset.group === 'brows')), 'variants: only the chosen group is visible');
    // «Хочу так само» filter + prefill without reload
    await p.click('[data-works-filter] label:has(input[value="pedicure"])');
    const shown = await p.$$eval('[data-works] .work-card', (els) => els.filter((e) => e.getClientRects().length).map((e) => e.dataset.group));
    ok(shown.length > 0 && shown.every((g) => g === 'pedicure'), 'works filter really hides other services', shown.join());
    await p.click('[data-works-filter] label:has(input[value=""])');
    await p.click('[data-works] .work-card a[data-prefill] >> nth=0');
    await p.waitForSelector('[data-step="3"][data-active]');
    ok((await p.textContent('.summary-panel [data-sum="maister"]')).includes('Олена') && p.url().indexOf('posluga') === -1, '«Хочу так само» prefills without a reload');
    ok(errs.length === 0, 'no console errors', errs.join(' | '));
    await ctx.close();
  }

  // ── «Хочу так само» prefill via URL ──
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
    const p = await ctx.newPage();
    await p.goto(base + '/?posluga=pedi-coat&maister=marta&kolir=moloko#zapys', { waitUntil: 'networkidle' });
    await p.waitForSelector('[data-step="3"][data-active]');
    ok(true, 'prefill opens step 3');
    ok((await p.textContent('.summary-panel [data-sum="posluga"]')).includes('Молоко'), 'prefill: service + shade in summary');
    ok((await p.textContent('.summary-panel [data-sum="maister"]')).includes('Марта'), 'prefill: master');
    await ctx.close();
  }

  // ── mobile bar ──
  {
    const ctx = await b.newContext({ ...devices['iPhone 13'] });
    const p = await ctx.newPage();
    await p.goto(base + '/', { waitUntil: 'networkidle' });
    ok(await p.isVisible('.summary-bar'), 'mobile: summary bar visible');
    await p.click('.summary-bar [data-next]');
    await p.waitForSelector('[data-step="2"][data-active]');
    ok(true, 'mobile: «Далі» in the bar opens step 2');
    ok(await p.isVisible('.summary-bar [data-back]'), 'mobile: back button appears in the bar');
    await ctx.close();
  }

  // ── no JS ──
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
    const p = await ctx.newPage();
    await p.goto(base + '/', { waitUntil: 'load' });
    const vis = await Promise.all([1, 2, 3, 4].map((n) => p.isVisible(`[data-step="${n}"]`)));
    ok(vis.every(Boolean), 'no JS: all four blocks visible as one form');
    ok(await p.isVisible('#bk-date'), 'no JS: date field + part of day instead of slots');
    ok(await p.isHidden('.summary-bar'), 'no JS: no bottom summary bar');
    await p.fill('#bk-phone', '0671234567'); await p.check('[name="zgoda"]');
    await Promise.all([p.waitForNavigation(), p.click('[data-step="4"] button[type=submit]')]);
    ok(p.url().includes('#ne-nadislano') && await p.isVisible('#ne-nadislano'), 'no JS: 303 back with the honest «не вдалося» box', p.url());
    await ctx.close();
  }
  await b.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
})();
