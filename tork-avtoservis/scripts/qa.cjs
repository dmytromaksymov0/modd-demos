// QA: node scripts/qa.cjs [baseUrl] [paths...]
// Screenshots at 375/768/1280/1920 (fold + full page), console errors, failed requests,
// horizontal scroll (also at 320), elements poking outside the viewport, text < 13px,
// touch targets < 44px, hero CTA above the fold, sticky bar hidden on the first screen.
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const path = require('path');
const base = process.argv[2] || 'http://localhost:4321';
const pages = process.argv.slice(3).length ? process.argv.slice(3) : ['/styleguide/'];
const sizes = [[375, 812], [768, 1024], [1280, 800], [1920, 1080], [320, 640]];
const out = path.join(__dirname, '..', 'screenshots');
(async () => {
  const b = await chromium.launch();
  let problems = 0;
  for (const p of pages) {
    const slug = p.replace(/\//g, '') || 'home';
    for (const [w, h] of sizes) {
      const mobile = w < 768, shoot = w !== 320;
      const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
      const page = await ctx.newPage();
      const errs = [];
      page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
      page.on('pageerror', (e) => errs.push(e.message));
      page.on('requestfailed', (r) => errs.push('request failed: ' + r.url()));
      await page.goto(base + p, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
      const fold = await page.evaluate(() => {
        const bar = document.querySelector('[data-mbar]');
        const barShown = bar && getComputedStyle(bar).display !== 'none' && bar.dataset.visible === 'true';
        const cta = [...document.querySelectorAll('[data-hero] a, [data-hero] button')].find((a) => /Записатися/.test(a.textContent) && a.offsetParent);
        return { barShown, ctaBottom: cta ? Math.round(cta.getBoundingClientRect().bottom) : null };
      });
      if (shoot) await page.screenshot({ path: `${out}/${slug}-${w}-fold.png` });
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); } scrollTo({ top: 0, behavior: 'instant' }); });
      await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; }));
      await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))));
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(600);
      const r = await page.evaluate((vw) => {
        const vis = (e) => { const s = getComputedStyle(e); const closed = e.closest('details:not([open])'); return e.offsetParent !== null && s.visibility !== 'hidden' && !(closed && !e.closest('summary')) && !e.closest('[aria-hidden="true"]'); }; // aria-hidden: honeypot fields
        const outside = [...document.querySelectorAll('body *')].filter((e) => {
          if (!vis(e) || e.closest('svg') && e.tagName !== 'svg') return false;
          // content inside an intentional horizontal scroller (e.g. the day strip) may extend past the edge
          for (let p = e.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll') return false; }
          const bx = e.getBoundingClientRect(); return bx.width > 0 && (bx.right > vw + 1 || bx.left < -1);
        }).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ').slice(0, 3).join('.')}`).slice(0, 5);
        const tiny = [...document.querySelectorAll('body *')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12.9 && !e.closest('svg'))
          .map((e) => `${e.tagName.toLowerCase()}:"${e.textContent.trim().slice(0, 24)}" ${getComputedStyle(e).fontSize}`).slice(0, 5);
        const small = [...document.querySelectorAll('a[href], button, summary, select, input:not([type=hidden])')].filter((e) => (vis(e) || e.closest('label')) && !e.closest('p, li > p, blockquote, [aria-hidden="true"]')).filter((e) => {
          // a radio/checkbox is hit through its <label>: measure the label
          const t = e.matches('input[type=radio], input[type=checkbox]') && e.closest('label') ? e.closest('label') : e;
          const bx = t.getBoundingClientRect(); return bx.width > 0 && (bx.height < 43.5 || bx.width < 43.5);
        }).map((e) => `${e.tagName.toLowerCase()}:"${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 20)}" ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`).slice(0, 6);
        return { sw: document.documentElement.scrollWidth, outside, tiny, small };
      }, w);
      if (shoot) await page.screenshot({ path: `${out}/${slug}-${w}.png`, fullPage: true });
      const flags = [];
      if (r.sw > w) flags.push(`HORIZONTAL SCROLL ${r.sw}>${w}`);
      if (r.outside.length) flags.push('OUTSIDE VIEWPORT: ' + r.outside.join(', '));
      if (errs.length) flags.push('CONSOLE: ' + errs.join(' | '));
      if (r.tiny.length) flags.push('TEXT < 13px: ' + r.tiny.join(', '));
      if (r.small.length) flags.push('TARGET < 44px: ' + r.small.join(', '));
      if (fold.ctaBottom !== null && fold.ctaBottom > h) flags.push(`HERO CTA BELOW FOLD (${fold.ctaBottom}px > ${h}px)`);
      if (mobile && fold.barShown) flags.push('STICKY BAR VISIBLE INSIDE HERO');
      problems += flags.length;
      console.log(`${p} @${w}: hero CTA bottom ${fold.ctaBottom}px of ${h}` + (flags.length ? '\n   ✗ ' + flags.join('\n   ✗ ') : '  ✓'));
      await ctx.close();
    }
  }
  await b.close();
  process.exitCode = problems ? 1 : 0;
})();
