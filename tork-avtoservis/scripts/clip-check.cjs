// Finds text clipped inside overflow:hidden facade windows (qa.cjs only sees the viewport edge).
// node scripts/clip-check.cjs [baseUrl] [paths...]
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const base = process.argv[2] || 'http://localhost:4321';
// No paths → every page (an empty list used to pass silently).
const all = ['/', '/poslugy/', '/poslugy/diagnostyka/', '/poslugy/khodova/', '/poslugy/to-ta-zamina-olyvy/', '/poslugy/halma/', '/poslugy/kondytsioner/', '/kalkulyator/', '/yak-my-pratsyuyemo/', '/tsiny/', '/kontakty/', '/pryvatnist/', '/dyakuyemo/', '/404/'];
const paths = process.argv.length > 3 ? process.argv.slice(3) : all;
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const w of [320, 375, 768, 1280]) {
    const p = await b.newPage({ viewport: { width: w, height: 800 } });
    for (const path of paths) {
      await p.goto(base + path, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
      const r = await p.evaluate(() => [...document.querySelectorAll('h1,h2,h3,p,dd,dt,b,span,a,li,td,th')].filter((e) => {
        if (!e.offsetParent || e.closest('[aria-hidden="true"], .sr-only, details:not([open]) > :not(summary)')) return false;
        const win = e.closest('.window'); if (!win || getComputedStyle(win).display === 'contents') return false;
        const er = e.getBoundingClientRect(), wr = win.getBoundingClientRect();
        return e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible' || er.right > wr.right + 1 || er.left < wr.left - 1;
      }).map((e) => e.tagName + ':' + e.textContent.trim().slice(0, 30)).slice(0, 5));
      if (r.length) { bad++; console.log(`${path} @${w}: ${r.join(' | ')}`); }
    }
    await p.close();
  }
  await b.close(); console.log(bad ? `${bad} problems` : `no clipped text (${paths.length} pages × 4 widths)`); process.exit(bad ? 1 : 0);
})();
