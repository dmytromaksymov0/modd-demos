// QA: node scripts/qa.cjs [baseUrl] [paths...]
// Full-page screenshots at 375/768/1280/1920, console errors, horizontal scroll,
// annotation labels inside their photo, hero form button above the fold on 1280×800.
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const path = require('path');
const base = process.argv[2] || 'http://localhost:4321';
const pages = process.argv.slice(3).length ? process.argv.slice(3) : ['/styleguide/'];
const widths = [375, 768, 1280, 1920];
const extra = [320]; // overflow-only check
const out = path.join(__dirname, '..', 'screenshots');
(async () => {
  const b = await chromium.launch();
  let problems = 0;
  for (const p of pages) {
    const slug = p.replace(/\//g, '') || 'home';
    for (const w of widths) {
      const mobile = w < 768;
      const ctx = await b.newContext({ viewport: { width: w, height: w === 1280 ? 800 : w === 1920 ? 1080 : w === 768 ? 1024 : 812 }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
      const page = await ctx.newPage();
      const errs = [];
      page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
      page.on('pageerror', (e) => errs.push(e.message));
      page.on('requestfailed', (r) => errs.push('request failed: ' + r.url()));
      await page.goto(base + p, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `${out}/${slug}-${w}-fold.png` });
      // Walk the page so lazy images load before the full-page capture.
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 200)); } scrollTo({ top: 0, behavior: 'instant' }); });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(900);
      const r = await page.evaluate(() => {
        const sw = document.documentElement.scrollWidth, vw = window.innerWidth;
        const annots = [...document.querySelectorAll('.annot')].filter((a) => getComputedStyle(a).display !== 'none').map((a) => {
          const fig = a.closest('figure').getBoundingClientRect(), l = a.querySelector('.annot-label').getBoundingClientRect();
          return { title: a.querySelector('b').textContent, inside: l.left >= fig.left - 0.5 && l.right <= fig.right + 0.5 && l.top >= fig.top - 0.5 && l.bottom <= fig.bottom + 0.5 };
        });
        // Measure as if the hero sat directly under the header (true on the home page).
        const submit = document.querySelector('#hero-form [data-next]');
        const hero = document.querySelector('[data-hero]'), header = document.querySelector('[data-header]');
        const b0 = submit && getComputedStyle(submit).display !== 'none' ? submit.getBoundingClientRect() : null;
        const btn = b0 ? { bottom: b0.bottom - hero.getBoundingClientRect().top + header.getBoundingClientRect().bottom } : null;
        const tiny = [...document.querySelectorAll('.t-label')].filter((e) => parseFloat(getComputedStyle(e).fontSize) < 13).length;
        return { sw, vw, annots, btnBottom: btn ? Math.round(btn.bottom) : null, vh: window.innerHeight, tiny };
      });
      await page.screenshot({ path: `${out}/${slug}-${w}.png`, fullPage: true });
      const bad = r.annots.filter((a) => !a.inside);
      const flags = [];
      if (r.sw > w) flags.push(`HORIZONTAL SCROLL ${r.sw}>${w}`);
      if (bad.length) flags.push('ANNOTATION CLIPPED: ' + bad.map((a) => a.title).join(', '));
      if (errs.length) flags.push('CONSOLE: ' + errs.join(' | '));
      if (r.tiny) flags.push(`${r.tiny} mono labels < 13px`);
      if (w === 1280 && r.btnBottom !== null && r.btnBottom > r.vh) flags.push(`HERO BUTTON BELOW FOLD (${r.btnBottom}px > ${r.vh}px)`);
      problems += flags.length;
      console.log(`${p} @${w}: annots ${r.annots.length} visible` + (w === 1280 ? `, hero button bottom ${r.btnBottom}px of ${r.vh}` : '') + (flags.length ? '\n   ✗ ' + flags.join('\n   ✗ ') : '  ✓'));
      await ctx.close();
    }
  }
  await b.close();
  process.exitCode = problems ? 1 : 0;
})();
