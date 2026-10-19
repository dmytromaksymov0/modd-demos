// Inner-page interactions: calculator (pitch from photos), insurance lanes, project filter, ZIP check.
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const base = process.argv[2] || 'http://localhost:4321';
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));

  // Calculator
  await p.goto(base + '/roof-cost-calculator/', { waitUntil: 'networkidle' });
  const price = () => p.locator('[data-r-price]').textContent();
  const start = await price();
  ok(start.trim() === '$6,700 – $9,100', 'calculator default = home mini-calc (' + start + ')');
  await p.locator('label.pitch-card', { hasText: 'Very steep' }).click();
  const steep = await price();
  ok(steep !== start && (await p.locator('[data-c-pitch-fine]').inputValue()) === '12', 'picking the 12/12 photo updates price and the fine-tune select (' + steep + ')');
  await p.locator('[data-c-pitch-fine]').selectOption('9');
  ok(await p.locator('input[name="c-pitch"][value="8"]').isChecked(), 'fine-tune 9/12 highlights the nearest photo (8/12)');
  await p.locator('[data-c-size-num]').fill('3200');
  await p.locator('label', { hasText: 'One story' }).click();
  await p.locator('label', { hasText: 'Standing-seam metal' }).click();
  ok((await p.locator('[data-r-summary]').textContent()).includes('3,200 sq ft · 1 story · 9/12 · standing-seam metal'), 'summary reflects inputs');
  ok((await p.locator('#final-form [data-estimate-field]').inputValue()).includes('3,200 sq ft'), 'estimate copied into the lead form');
  await p.locator('[data-calc] a[data-set-problem]').click(); await p.waitForTimeout(500);
  ok(await p.locator('#final-form input[name="problem"][value="old-roof"]').isChecked(), 'CTA pre-selects “Old roof” in the form');
  await p.locator('[data-c-size-num]').fill('99999'); await p.locator('[data-c-size-num]').blur();
  ok((await p.locator('[data-c-size-num]').inputValue()) === '8000', 'size clamped to 8,000');

  // Insurance lanes — and the page must not jump on load (regression: scrollIntoView on init)
  const m = await b.newPage({ viewport: { width: 375, height: 812 }, isMobile: true });
  await m.goto(base + '/storm-damage/', { waitUntil: 'networkidle' });
  ok((await m.evaluate(() => scrollY)) === 0, 'storm page stays at the top on load (phone)');
  await m.close();
  await p.goto(base + '/storm-damage/', { waitUntil: 'networkidle' });
  ok((await p.evaluate(() => scrollY)) === 0, 'storm page stays at the top on load (desktop)');
  ok(await p.locator('#claim-step-3').isVisible() && !(await p.locator('#claim-step-1').isVisible()), 'claim lanes open on step 3 (adjuster meeting)');
  await p.locator('#claim-tab-3').focus(); await p.keyboard.press('ArrowRight');
  ok(await p.locator('#claim-step-4').isVisible(), 'ArrowRight → step 4');
  await p.locator('[data-lane-next]').click(); await p.locator('[data-lane-next]').click(); await p.locator('[data-lane-next]').click();
  ok(await p.locator('#claim-step-7').isVisible() && await p.locator('[data-lane-next]').isDisabled(), 'next reaches step 7 and disables');
  ok((await p.locator('#claim-step-7').textContent()).includes('never more'), 'step 7 states “deductible — never more”');
  ok(await p.locator('#final-form input[name="problem"][value="storm"]').isChecked(), 'storm page form pre-selects “Storm or hail”');

  // Projects filter
  await p.goto(base + '/projects/', { waitUntil: 'networkidle' });
  ok((await p.locator('.project:visible').count()) === 6, '6 projects listed');
  await p.locator('[data-filter="storm"]').click();
  ok((await p.locator('.project:visible').count()) === 2, 'storm filter → 2');
  await p.locator('[data-filter="metal"]').click();
  ok((await p.locator('.project:visible').count()) === 1, 'metal filter → 1');
  await p.locator('[data-filter="all"]').click();
  ok((await p.locator('.project:visible').count()) === 6, 'all → 6');

  // ZIP check
  await p.goto(base + '/about/', { waitUntil: 'networkidle' });
  await p.locator('#zc-input').fill('43026');
  ok((await p.locator('#zc-out').textContent()).includes('Hilliard'), 'ZIP 43026 → Hilliard');
  await p.locator('#zc-input').fill('44101');
  ok((await p.locator('#zc-out').textContent()).includes('outside'), 'ZIP 44101 → outside our area');

  // Free inspection page: ?problem= preselect
  await p.goto(base + '/free-inspection/?problem=leak', { waitUntil: 'networkidle' });
  ok(await p.locator('#final-form input[name="problem"][value="leak"]').isChecked(), '?problem=leak pre-selects “Leak”');

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
})();
