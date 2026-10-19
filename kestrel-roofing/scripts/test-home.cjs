// Home page interactions: scenario tabs, form preselect, day timeline, mini calculator, schema.
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const base = process.argv[2] || 'http://localhost:4321';
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto(base + '/', { waitUntil: 'networkidle' });

  // Tabs
  const tabs = p.locator('[role="tab"]');
  ok((await tabs.count()) === 3, 'three scenario tabs');
  ok(await p.locator('#panel-leak').isVisible() && !(await p.locator('#panel-storm').isVisible()), 'only the first panel visible');
  await tabs.first().focus(); await p.keyboard.press('ArrowRight');
  ok((await tabs.nth(1).getAttribute('aria-selected')) === 'true' && await p.locator('#panel-storm').isVisible(), 'ArrowRight moves to “Hail or wind”');
  await p.keyboard.press('End');
  ok(await p.locator('#panel-old').isVisible(), 'End key selects the last tab');

  // Preselect from scenario CTA
  await tabs.nth(1).click();
  await p.locator('#panel-storm a[data-set-problem]').click();
  await p.waitForTimeout(600);
  ok(await p.locator('#hero-form input[name="problem"][value="storm"]').isChecked(), 'scenario CTA pre-selects “Storm or hail” in the hero form');

  // Timeline
  const clock = p.locator('[data-clock]');
  await p.locator('[data-day]').scrollIntoViewIfNeeded();
  ok((await clock.textContent()) === '7:00', 'clock starts at 7:00');
  ok(await p.locator('[data-day] [data-prev]').isDisabled(), 'prev disabled on first step');
  await p.locator('[data-day] [data-next]').click(); await p.waitForTimeout(700);
  ok((await clock.textContent()) === '7:40', 'next → 7:40 (' + (await clock.textContent()) + ')');
  await p.locator('[data-track]').focus();
  for (let i = 0; i < 10; i++) await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(900);
  ok((await clock.textContent()) === '5:30' && (await p.locator('[data-ampm]').textContent()) === 'pm', 'arrow keys reach 5:30 pm');
  ok(await p.locator('[data-day] [data-next]').isDisabled(), 'next disabled on last step');

  // Mini calculator
  const price = p.locator('[data-out-price]');
  ok((await price.textContent()).trim() === '$6,700 – $9,100', 'default estimate (2,000 sq ft, 2 stories, shingle): ' + (await price.textContent()));
  await p.locator('[data-mini-calc] label', { hasText: 'Metal' }).click();
  ok((await price.textContent()).includes('$14,'), 'metal raises the estimate: ' + (await price.textContent()));
  await p.locator('[data-mini-calc] label', { hasText: 'One' }).click();
  await p.locator('#mc-size').fill('3000');
  ok((await p.locator('[data-out-squares]').textContent()) === '42.5 squares', '3,000 sq ft ranch → 42.5 squares: ' + (await p.locator('[data-out-squares]').textContent()));
  ok((await p.locator('[data-out-days]').textContent()) === '3 days', 'metal, 42.5 sq → 3 days');

  // Schema
  const ld = JSON.parse(await p.locator('script[type="application/ld+json"]').textContent());
  ok(ld['@type'] === 'RoofingContractor' && ld.areaServed.length >= 10, 'RoofingContractor JSON-LD with service area');
  ok((await p.title()).length <= 70, 'title ≤ 70 chars (' + (await p.title()).length + ')');
  ok(errs.length === 0, 'no console errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
})();
