// Home interactions: node scripts/test-home.cjs [baseUrl]
// - insurance JS is not requested on load, only after the first interaction; answers change with the plan
// - comfort chips rewrite the comfort-plan link
// - sticky bar hidden in the hero, shown after it, hidden again over the booking block
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const base = process.argv[2] || 'http://localhost:4321';
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const scripts = [];
  p.on('request', (r) => r.resourceType() === 'script' && scripts.push(r.url()));
  await p.goto(base + '/', { waitUntil: 'networkidle' });
  ok(!scripts.some((u) => /insurance-ui/.test(u)), 'insurance-ui not loaded on page load');
  const sel = p.locator('#ins-carrier');
  await sel.scrollIntoViewIfNeeded();
  await sel.selectOption('none');
  await p.waitForTimeout(600);
  ok(scripts.some((u) => /insurance-ui/.test(u)), 'insurance-ui loaded after first interaction');
  ok((await p.locator('[data-amount]').textContent()) === '$29', 'no insurance → $29 plan');
  ok(await p.locator('[data-plan-row]').isHidden(), 'plan type hidden for no insurance');
  await sel.selectOption('cigna');
  await p.locator('label.seg', { hasText: 'DHMO' }).click();
  await p.waitForTimeout(200);
  ok((await p.locator('[data-amount]').textContent()) === '$99', 'Cigna DHMO → $99 first visit');
  await p.locator('label.seg', { hasText: 'PPO' }).first().click();
  await p.waitForTimeout(200);
  ok((await p.locator('[data-amount]').textContent()) === '$0', 'Cigna PPO → $0');
  ok(/insurance=cigna-ppo/.test(await p.locator('[data-cta]').getAttribute('href')), 'CTA carries the insurance into /book');
  ok(await p.locator('text=Estimate only').first().isVisible(), '"Estimate only" line visible');

  const chip = p.locator('.comfort-chips button', { hasText: 'Needles' });
  await chip.scrollIntoViewIfNeeded();
  await chip.click();
  await p.waitForTimeout(150);
  ok(/comfort=sounds,needles,control/.test(await p.locator('[data-comfort-cta]').getAttribute('href')), 'chips rewrite the comfort-plan link');

  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(400);
  ok((await p.locator('[data-sticky-bar]').getAttribute('data-visible')) === 'false', 'sticky bar hidden in hero');
  await p.locator('#lanes-cap').scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
  ok((await p.locator('[data-sticky-bar]').getAttribute('data-visible')) === 'true', 'sticky bar shown after hero');
  await p.locator('#visit-h').scrollIntoViewIfNeeded(); await p.evaluate(() => scrollBy(0, 700)); await p.waitForTimeout(500);
  ok((await p.locator('[data-sticky-bar]').getAttribute('data-visible')) === 'false', 'sticky bar hidden over the booking block');
  await b.close();
  process.exitCode = fails ? 1 : 0;
})();
