// Phase 1 preview screenshots: node design/phase-1/shoot.cjs [files...]
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const path = require('path');
const dir = __dirname;
const files = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  for (const f of files) {
    const name = path.basename(f, '.html');
    for (const [w, h, tag, mobile] of [[1280, 800, '1280', false], [375, 812, '375', true]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
      const p = await ctx.newPage();
      const errs = []; p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message));
      await p.goto('file://' + path.join(dir, f), { waitUntil: 'networkidle' });
      await p.evaluate(() => document.fonts.ready);
      await p.screenshot({ path: `${dir}/screenshots/${name}-${tag}.png` });
      await p.screenshot({ path: `${dir}/screenshots/${name}-${tag}-full.png`, fullPage: true });
      const r = await p.evaluate((vw) => {
        const out = [...document.querySelectorAll('body *')].filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.right > vw + 0.5 || b.left < -0.5) && getComputedStyle(e).position !== 'fixed'; }).map(e => e.tagName + '.' + e.className).slice(0, 6);
        const fold = [...document.querySelectorAll('a.btn')].filter(a => a.offsetParent && !a.closest('.mbar')).map(a => [a.textContent.trim().slice(0, 20), Math.round(a.getBoundingClientRect().bottom)]);
        return { sw: document.documentElement.scrollWidth, out, fold };
      }, w);
      console.log(name, tag, 'scrollWidth', r.sw, 'overflow:', r.out.join(',') || 'none', '| btn bottoms', JSON.stringify(r.fold), errs.length ? 'ERRORS ' + errs.join(' | ') : 'no console errors');
      await ctx.close();
    }
  }
  await b.close();
})();
