// Layout shift from a late font swap: web fonts are held back 1.5 s (slow 3G-like), then CLS is summed
// from layout-shift entries. Lighthouse usually gets the preloaded fonts before first paint and misses this.
// Usage: node scripts/font-swap-check.cjs [base] — fails if any page/width exceeds 0.1 (CWV "good").
const { chromium } = require('../../node_modules/playwright');
const base = process.argv[2] || 'http://localhost:4321';
const pages = ['/', '/poslugy/', '/poslugy/diagnostyka/', '/poslugy/khodova/', '/poslugy/to-ta-zamina-olyvy/', '/poslugy/halma/', '/poslugy/kondytsioner/', '/kalkulyator/', '/yak-my-pratsyuyemo/', '/tsiny/', '/kontakty/', '/dyakuyemo/', '/pryvatnist/', '/404/'];
const widths = [320, 375, 412, 768, 1280, 1920];
const LIMIT = 0.1; // Core Web Vitals "good"
(async () => {
  const b = await chromium.launch();
  let worst = 0, bad = 0;
  for (const path of pages) {
    const row = [];
    for (const w of widths) {
      const p = await b.newPage({ viewport: { width: w, height: w < 768 ? 800 : 900 } });
      await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true }); });
      await p.route('**/fonts/*', async (r) => { await new Promise((ok) => setTimeout(ok, 1500)); r.continue(); });
      await p.goto(base + path, { waitUntil: 'commit' });
      await p.waitForTimeout(3000);
      const cls = await p.evaluate(() => window.__cls);
      await p.close();
      worst = Math.max(worst, cls);
      if (cls > LIMIT) bad++;
      row.push(`${w}:${cls.toFixed(3)}${cls > LIMIT ? '✗' : ''}`);
    }
    console.log(path.padEnd(30), row.join('  '));
  }
  console.log(bad ? `✗ ${bad} page/width combinations above CLS ${LIMIT}` : `✓ late font swap: CLS ≤ ${LIMIT} everywhere (worst ${worst.toFixed(3)})`);
  await b.close();
  process.exit(bad ? 1 : 0);
})();
