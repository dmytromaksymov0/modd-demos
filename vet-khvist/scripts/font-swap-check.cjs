// Font-swap CLS: delay both web fonts by 1.5 s so the metric-matched fallbacks render first, then sum layout shifts.
// node scripts/font-swap-check.cjs [baseUrl] [paths...]
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const base = process.argv[2] || 'http://localhost:4321';
const paths = process.argv.slice(3).length ? process.argv.slice(3) : ['/', '/nevidkladna/', '/poslugy/khirurhiya/', '/tsiny/', '/likari/', '/klub/', '/zapys/'];
(async () => {
  const b = await chromium.launch(); let worst = 0;
  for (const p of paths) for (const [w, h, mobile] of [[375, 812, true], [1280, 800, false]]) for (const t of ['day', 'night']) {
    const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile });
    await c.route('**/fonts/*.woff2', async (r) => { await new Promise((x) => setTimeout(x, 1500)); await r.continue(); });
    const pg = await c.newPage();
    await pg.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
    await pg.goto(`${base}${p}?t=${t}`, { waitUntil: 'networkidle' }); await pg.waitForTimeout(600);
    const cls = await pg.evaluate(() => window.__cls); worst = Math.max(worst, cls);
    console.log(`${p} ${t} @${w}: CLS ${cls.toFixed(3)}${cls > 0.1 ? '  ✗' : ''}`); await c.close();
  }
  console.log('worst', worst.toFixed(3)); await b.close(); process.exitCode = worst > 0.1 ? 1 : 0;
})();
