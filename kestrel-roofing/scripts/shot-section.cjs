// Screenshot one section at 1280 and 375: node scripts/shot-section.cjs <selector> <name> [path]
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const [sel, name, p = '/'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  for (const w of [1280, 375]) {
    const page = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: w < 768 ? 2 : 1 });
    const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    await page.goto('http://localhost:4321' + p, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '[data-header],[data-sticky-bar],astro-dev-toolbar{display:none!important}' });
    const el = page.locator(sel).first();
    await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
    await el.screenshot({ path: `screenshots/_sec-${name}-${w}.png` });
    console.log(name, w, errs.length ? errs : 'ok');
    await page.close();
  }
  await b.close();
})();
