// Review fixes (22.10.2026): before/after shots of the class cards and of Д/Л in the display font.
// node scripts/review-shots.cjs before|after   → docs/review-fixes/<tag>-*.png
const { chromium } = require('../../node_modules/playwright');
const tag = process.argv[2] || 'after';
const base = 'http://localhost:4321';
const out = (n) => `docs/review-fixes/${tag}-${n}.png`;
(async () => {
  const b = await chromium.launch();
  const page = async (w, path) => { const p = await b.newPage({ viewport: { width: w, height: 900 } }); await p.goto(base + path, { waitUntil: 'networkidle' }); await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' }); await p.evaluate(() => document.fonts.ready); return p; };
  // Class cards: calculator at 4 widths, home mini calculator at 375 and 1280.
  for (const w of [375, 768, 1280, 1920]) {
    const p = await page(w, '/kalkulyator/');
    await p.locator('[data-calc-full] fieldset').first().screenshot({ path: out(`klas-kalkulyator-${w}`) }); await p.close();
  }
  for (const w of [375, 1280]) {
    const p = await page(w, '/');
    await p.locator('[data-calc]:not([data-calc-full]) fieldset').first().screenshot({ path: out(`klas-home-${w}`) }); await p.close();
  }
  // Д/Л: logo + wide plates in the header and hero, service headings, Derzhprom plate.
  let p = await page(1280, '/');
  await p.screenshot({ path: out('font-home-1280'), clip: { x: 0, y: 0, width: 1280, height: 640 } });
  await p.locator('footer img').first().screenshot({ path: out('font-footer-logo') }); await p.close();
  p = await page(375, '/');
  await p.screenshot({ path: out('font-home-375'), clip: { x: 0, y: 0, width: 375, height: 760 } }); await p.close();
  for (const s of ['khodova', 'diagnostyka', 'halma']) {
    p = await page(1280, `/poslugy/${s}/`);
    await p.screenshot({ path: out(`font-${s}-1280`), clip: { x: 0, y: 0, width: 1280, height: 600 } }); await p.close();
  }
  p = await page(1280, '/tsiny/');
  await p.screenshot({ path: out('font-tsiny-1280'), clip: { x: 0, y: 0, width: 1280, height: 520 } }); await p.close();
  await b.close(); console.log('shots →', `docs/review-fixes/${tag}-*.png`);
})();
