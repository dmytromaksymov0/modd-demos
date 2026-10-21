// Full-page 1280 screenshots of «Вишня» (local wrangler) and the four live sites' home pages (lazy images loaded) for the phase-3 comparison.
const { chromium } = require('../../../node_modules/playwright');
const path = require('path');
const only = process.argv[2];
const sites = { vyshnia: 'http://localhost:8791/', kestrel: 'https://kestrel-roofing-co.pages.dev/', brightwater: 'https://brightwater-dental-ba5.pages.dev/', tork: 'https://tork-avtoservis.pages.dev/', khvist: 'https://vet-khvist.pages.dev/' };
(async () => {
  const b = await chromium.launch();
  for (const [name, url] of Object.entries(sites).filter(([n]) => !only || n === only)) {
    const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
    await p.goto(url, { waitUntil: 'load', timeout: 60000 });
    await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)); } scrollTo({ top: 0, behavior: 'instant' }); });
    await Promise.race([p.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))))), p.waitForTimeout(8000)]);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); });
    await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(__dirname, 'live', `${name}-full.png`), fullPage: true });
    console.log(name);
    await p.close();
  }
  await b.close();
})();
