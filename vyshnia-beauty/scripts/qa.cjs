// QA: node scripts/qa.cjs [baseUrl] [paths...]
// Each path × 375/768/1280/1920 (+320 checks only): fold + full-page screenshots into screenshots/,
// console errors, failed requests, horizontal scroll, elements outside the viewport, text < 13px,
// touch targets < 44px, and the booking first-screen rules ([data-check]):
//   steps + step 1 (whole first tip with its price) on the first screen at every width;
//   from 1024px the whole summary panel incl. its button; below 1024px the bottom bar.
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const path = require('path');
const fs = require('fs');
const base = process.argv[2] || 'http://localhost:4321';
const pages = process.argv.slice(3).length ? process.argv.slice(3) : ['/styleguide/', '/styleguide/hero/'];
const sizes = [[375, 812], [768, 1024], [1280, 800], [1920, 1080], [320, 640]];
const out = path.join(__dirname, '..', 'screenshots');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const b = await chromium.launch();
  let problems = 0;
  for (const p of pages) {
    const slug = p.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'home';
    for (const [w, h] of sizes) {
      const mobile = w < 768, shoot = w !== 320;
      const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
      const page = await ctx.newPage();
      const errs = [];
      page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
      page.on('pageerror', (e) => errs.push(e.message));
      page.on('requestfailed', (r) => errs.push('request failed: ' + r.url()));
      await page.goto(`${base}${p}`, { waitUntil: 'load' });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const fold = await page.evaluate((vh) => {
        const shown = (e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none';
        const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), ok: r.top >= 0 && r.bottom <= vh }; };
        const first = (sel) => [...document.querySelectorAll(sel)].find(shown);
        const tip = first('[data-check=step1] .service-tip');
        return { steps: box(first('[data-check=steps] > :not(.hidden)') || first('[data-check=steps]')), tip: box(tip), panel: box(first('[data-check=summary]')), bar: box(first('[data-check=bar]')) };
      }, h);
      if (shoot) await page.screenshot({ path: `${out}/${slug}-${w}-fold.png` });
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } scrollTo({ top: 0, behavior: 'instant' }); });
      await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; }));
      await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))));
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(400);
      const r = await page.evaluate((vw) => {
        const vis = (e) => { const s = getComputedStyle(e); const closed = e.closest('details:not([open])'); return e.offsetParent !== null && s.visibility !== 'hidden' && !e.closest('[aria-hidden="true"]') && !(closed && !e.closest('summary')); };
        const outside = [...document.querySelectorAll('body *')].filter((e) => {
          if (!vis(e) || (e.closest('svg') && e.tagName !== 'svg') || e.closest('.sr-only')) return false;
          for (let q = e.parentElement; q; q = q.parentElement) { const s = getComputedStyle(q); if (['auto', 'scroll', 'hidden', 'clip'].includes(s.overflowX)) return false; }
          const bx = e.getBoundingClientRect(); return bx.width > 0 && (bx.right > vw + 1 || bx.left < -1);
        }).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ').slice(0, 3).join('.')}`).slice(0, 5);
        const textEls = [...document.querySelectorAll('body *')].filter((e) => vis(e) && !e.closest('svg') && !e.closest('.sr-only') && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
        const tiny = textEls.filter((e) => parseFloat(getComputedStyle(e).fontSize) < 12.9).map((e) => `${e.tagName.toLowerCase()}:"${e.textContent.trim().slice(0, 24)}" ${getComputedStyle(e).fontSize}`).slice(0, 5);
        const small = [...document.querySelectorAll('a[href], button, summary, select, input:not([type=hidden])')].filter((e) => (vis(e) || e.closest('label')) && !e.closest('[aria-hidden="true"]') && !e.closest('p, dd, .t-lead, nav[aria-label="Розділи стайлгайду"]')).filter((e) => {
          const t = e.matches('input[type=radio], input[type=checkbox]') && e.closest('label') ? e.closest('label') : e;
          if (e.matches('input[type=checkbox]') && !e.closest('label.chip, .works-filter')) return false; // consent box: the whole label row is the target
          if (t.closest('footer') && t.tagName === 'A') return false; // footer text links (inline, 15px line)
          if (t.tagName === 'A' && getComputedStyle(t).display === 'inline' && t.closest('label, p, li')) return false; // inline link inside a sentence (WCAG 2.5.8 inline exception)
          const bx = t.getBoundingClientRect(); return bx.width > 0 && (bx.height < 43.5 || bx.width < 43.5) && !(t.closest('.shade-picker, .works-filter') && bx.height >= 36 && bx.width >= 24);
        }).map((e) => `${e.tagName.toLowerCase()}:"${(e.textContent || e.getAttribute('aria-label') || e.value || '').trim().slice(0, 20)}" ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`).slice(0, 6);
        return { sw: document.documentElement.scrollWidth, outside, tiny, small };
      }, w);
      if (shoot) await page.screenshot({ path: `${out}/${slug}-${w}.png`, fullPage: true });
      const flags = [];
      if (r.sw > w) flags.push(`HORIZONTAL SCROLL ${r.sw}>${w}`);
      if (r.outside.length) flags.push('OUTSIDE VIEWPORT: ' + r.outside.join(', '));
      if (errs.length) flags.push('CONSOLE: ' + [...new Set(errs)].join(' | '));
      if (r.tiny.length) flags.push('TEXT < 13px: ' + r.tiny.join(', '));
      if (r.small.length) flags.push('TARGET < 44px: ' + r.small.join(', '));
      if (fold.tip && w >= 375) {
        if (!fold.steps?.ok) flags.push(`STEPS NOT ON FIRST SCREEN (${fold.steps?.top}–${fold.steps?.bottom})`);
        if (!fold.tip.ok) flags.push(`STEP 1 TIP NOT ON FIRST SCREEN (${fold.tip.top}–${fold.tip.bottom})`);
        if (w >= 1024 && !fold.panel?.ok) flags.push(`SUMMARY PANEL NOT ON FIRST SCREEN (${fold.panel?.top}–${fold.panel?.bottom})`);
        if (w < 1024 && !fold.bar?.ok) flags.push(`SUMMARY BAR NOT ON FIRST SCREEN (${fold.bar?.top}–${fold.bar?.bottom})`);
      }
      problems += flags.length;
      const f = fold.tip ? ` tip≤${fold.tip.bottom}${fold.panel ? ` panel≤${fold.panel.bottom}` : ''}${fold.bar ? ` bar ${fold.bar.top}–${fold.bar.bottom}` : ''} (vh ${h})` : '';
      console.log(`${p} @${w}:${f}` + (flags.length ? '\n   ✗ ' + flags.join('\n   ✗ ') : '  ✓'));
      await ctx.close();
    }
  }
  await b.close();
  process.exitCode = problems ? 1 : 0;
})();
