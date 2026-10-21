// QA: node scripts/qa.cjs [baseUrl] [paths...]   (MODES=day,night,curfew — default day,night)
// Each path × time state (?t=) × 375/768/1280/1920 (+320 checks only): fold + full-page screenshots into screenshots/,
// console errors, failed requests, horizontal scroll, elements outside the viewport, text < 13px,
// lamp-dim text < 14px, touch targets < 44px, and — on phones — whether the lit number, the address and the
// «Подзвонити» button are fully on the first screen ([data-check]).
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const path = require('path');
const fs = require('fs');
const base = process.argv[2] || 'http://localhost:4321';
const pages = process.argv.slice(3).length ? process.argv.slice(3) : ['/styleguide/', '/styleguide/hero/'];
const modes = (process.env.MODES || 'day,night').split(',');
const sizes = [[375, 812], [768, 1024], [1280, 800], [1920, 1080], [320, 640]];
const out = path.join(__dirname, '..', 'screenshots');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const b = await chromium.launch();
  let problems = 0;
  for (const p of pages) {
    const slug = p.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'home';
    for (const mode of modes) {
      for (const [w, h] of sizes) {
        const mobile = w < 768, shoot = w !== 320;
        const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
        const page = await ctx.newPage();
        const errs = [];
        page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
        page.on('pageerror', (e) => errs.push(e.message));
        page.on('requestfailed', (r) => errs.push('request failed: ' + r.url()));
        await page.goto(`${base}${p}?t=${mode}`, { waitUntil: 'load' });
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(300);
        const fold = await page.evaluate((vh) => {
          const box = (sel) => { const el = [...document.querySelectorAll(sel)].find((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden'); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), ok: r.top >= 0 && r.bottom <= vh }; };
          return { phone: box('[data-check=phone]'), addr: box('[data-check=addr]'), call: box('[data-check=call]') };
        }, h);
        if (shoot) await page.screenshot({ path: `${out}/${slug}-${mode}-${w}-fold.png` });
        await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } scrollTo({ top: 0, behavior: 'instant' }); });
        await page.evaluate(() => document.querySelectorAll('img[loading="lazy"], iframe[loading="lazy"]').forEach((i) => { i.loading = 'eager'; }));
        await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))));
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(500);
        const r = await page.evaluate((vw) => {
          const vis = (e) => { const s = getComputedStyle(e); const closed = e.closest('details:not([open])'); return e.offsetParent !== null && s.visibility !== 'hidden' && !e.closest('[aria-hidden="true"]') && !(closed && !e.closest('summary')); };
          const outside = [...document.querySelectorAll('body *')].filter((e) => {
            if (!vis(e) || (e.closest('svg') && e.tagName !== 'svg')) return false;
            for (let q = e.parentElement; q; q = q.parentElement) { const s = getComputedStyle(q); if (['auto', 'scroll', 'hidden', 'clip'].includes(s.overflowX)) return false; }
            const bx = e.getBoundingClientRect(); return bx.width > 0 && (bx.right > vw + 1 || bx.left < -1);
          }).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ').slice(0, 3).join('.')}`).slice(0, 5);
          const textEls = [...document.querySelectorAll('body *')].filter((e) => vis(e) && !e.closest('svg') && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
          const tiny = textEls.filter((e) => parseFloat(getComputedStyle(e).fontSize) < 12.9).map((e) => `${e.tagName.toLowerCase()}:"${e.textContent.trim().slice(0, 24)}" ${getComputedStyle(e).fontSize}`).slice(0, 5);
          const lampDim = getComputedStyle(document.documentElement).getPropertyValue('--color-lamp-dim').trim();
          const toRgb = (hex) => { const n = parseInt(hex.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };
          const dimSmall = textEls.filter((e) => getComputedStyle(e).color === toRgb(lampDim) && parseFloat(getComputedStyle(e).fontSize) < 13.9).map((e) => `"${e.textContent.trim().slice(0, 24)}" ${getComputedStyle(e).fontSize}`).slice(0, 5);
          const small = [...document.querySelectorAll('a[href], button, summary, select, input:not([type=hidden])')].filter((e) => (vis(e) || e.closest('label')) && !e.closest('[aria-hidden="true"]') && !e.closest('p, li > p, blockquote, dd, .t-lead')).filter((e) => {
            const t = e.matches('input[type=radio], input[type=checkbox]') && e.closest('label') ? e.closest('label') : e;
            if (t.closest('ul') && t.tagName === 'A' && getComputedStyle(t).display === 'inline') return false; // inline text links in a list of links
            const bx = t.getBoundingClientRect(); return bx.width > 0 && (bx.height < 43.5 || bx.width < 43.5);
          }).map((e) => `${e.tagName.toLowerCase()}:"${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 20)}" ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`).slice(0, 6);
          return { sw: document.documentElement.scrollWidth, outside, tiny, dimSmall, small, time: document.documentElement.dataset.time };
        }, w);
        if (shoot) await page.screenshot({ path: `${out}/${slug}-${mode}-${w}.png`, fullPage: true });
        const flags = [];
        if (r.time !== mode) flags.push(`data-time=${r.time}, expected ${mode}`);
        if (r.sw > w) flags.push(`HORIZONTAL SCROLL ${r.sw}>${w}`);
        if (r.outside.length) flags.push('OUTSIDE VIEWPORT: ' + r.outside.join(', '));
        if (errs.length) flags.push('CONSOLE: ' + [...new Set(errs)].join(' | '));
        if (r.tiny.length) flags.push('TEXT < 13px: ' + r.tiny.join(', '));
        if (r.dimSmall.length) flags.push('LAMP-DIM < 14px: ' + r.dimSmall.join(', '));
        if (r.small.length) flags.push('TARGET < 44px: ' + r.small.join(', '));
        if (mobile && w >= 375 && fold.phone) for (const k of ['phone', 'addr', 'call']) if (fold[k] && !fold[k].ok) flags.push(`${k.toUpperCase()} NOT ON FIRST SCREEN (${fold[k].top}–${fold[k].bottom})`);
        problems += flags.length;
        const f = fold.phone ? ` phone≤${fold.phone.bottom} addr≤${fold.addr?.bottom} call≤${fold.call?.bottom}` : '';
        console.log(`${p} ${mode} @${w}:${mobile ? f : ''}` + (flags.length ? '\n   ✗ ' + flags.join('\n   ✗ ') : '  ✓'));
        await ctx.close();
      }
    }
  }
  await b.close();
  process.exitCode = problems ? 1 : 0;
})();
