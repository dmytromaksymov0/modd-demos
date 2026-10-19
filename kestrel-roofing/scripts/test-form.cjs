// Behaviour checks: lead form steps/validation, sticky bar visibility, keyboard focus.
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const base = process.argv[2] || 'http://localhost:4321';
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(base + '/styleguide/', { waitUntil: 'networkidle' });
  const f = p.locator('#sg-form');
  await f.scrollIntoViewIfNeeded();
  ok(await f.locator('[data-step="2"]').isHidden(), 'step 2 hidden until step 1 is done');
  await f.locator('[data-next]').click();
  ok((await f.locator('[data-chip-error]').textContent()).includes('Pick'), 'chip required message');
  await f.locator('label.chip', { hasText: 'Storm or hail' }).click();
  await f.locator('input[name="zip"]').fill('4301');
  await f.locator('[data-next]').click();
  ok((await f.locator('#sg-form-zip-error').textContent()).includes('5-digit'), 'short ZIP error');
  await f.locator('input[name="zip"]').fill('43017');
  ok((await f.locator('[data-zip-note]').textContent()).includes('Dublin'), 'ZIP 43017 → Dublin, storm area: ' + (await f.locator('[data-zip-note]').textContent()));
  await f.locator('input[name="zip"]').fill('90210');
  ok((await f.locator('[data-zip-note]').textContent()).includes('outside'), 'out-of-area ZIP handled honestly');
  await f.locator('input[name="zip"]').fill('43221');
  await f.locator('[data-next]').click();
  ok(await f.locator('[data-step="2"]').isVisible(), 'step 2 shown');
  ok(await p.evaluate(() => document.activeElement?.name === 'name'), 'focus moved to name field');
  await f.locator('[data-submit]').click();
  ok((await f.locator('#sg-form-name-error').textContent()).length > 0, 'name required');
  await f.locator('input[name="name"]').fill('Jordan Miller');
  await f.locator('input[name="phone"]').fill('614555');
  await f.locator('[data-submit]').click();
  ok((await f.locator('#sg-form-phone-error').textContent()).includes('10-digit'), 'phone validation');
  await f.locator('input[name="phone"]').fill('6145550199');
  await f.locator('input[name="phone"]').blur();
  ok((await f.locator('input[name="phone"]').inputValue()) === '(614) 555-0199', 'phone formatted on blur');
  await f.locator('[data-submit]').click();
  await f.locator('[data-success]').waitFor({ state: 'visible', timeout: 3000 });
  ok(true, 'success state shown (demo mode)');

  // Sticky bar
  await p.goto(base + '/styleguide/', { waitUntil: 'networkidle' });
  const vis = () => p.locator('[data-sticky-bar]').getAttribute('data-visible');
  ok((await vis()) === 'false', 'sticky bar hidden at top (hero on screen)');
  await p.locator('#color').scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  ok((await vis()) === 'true', 'sticky bar visible after the hero');
  await p.locator('#sg-form').scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  ok((await vis()) === 'false', 'sticky bar hidden while a lead form is on screen');

  // Keyboard: skip link + visible focus
  const d = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await d.goto(base + '/styleguide/', { waitUntil: 'networkidle' });
  await d.keyboard.press('Tab');
  ok(await d.evaluate(() => document.activeElement?.textContent?.includes('Skip to content')), 'first Tab lands on “Skip to content”');
  const outline = await d.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  ok(outline !== 'none', 'focused element has a visible outline (' + outline + ')');
  // Reduced motion: sticky bar transition disabled
  const rm = await b.newContext({ reducedMotion: 'reduce', viewport: { width: 375, height: 812 } });
  const r = await rm.newPage(); await r.goto(base + '/styleguide/');
  const dur = await r.evaluate(() => getComputedStyle(document.querySelector('[data-sticky-bar]')).transitionDuration);
  ok(parseFloat(dur) < 0.01, 'prefers-reduced-motion: transitions off (' + dur + ')');
  await b.close();
})();
