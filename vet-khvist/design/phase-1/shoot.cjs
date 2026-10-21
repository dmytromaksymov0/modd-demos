// node design/phase-1/shoot.cjs <file.html> [...]
// Screenshots each preview at 1280x800 and 375x812 (day + ?t=night), reports
// horizontal overflow, elements past the viewport edge, and whether the phone
// number, call button and address are fully visible on the first mobile screen.
const path = require('path');
const fs = require('fs');
const { chromium } = require('../../../node_modules/playwright');

const out = path.join(__dirname, 'shots');
fs.mkdirSync(out, { recursive: true });
const files = process.argv.slice(2);
if (!files.length) { console.error('no files'); process.exit(1); }

(async () => {
  const browser = await chromium.launch();
  for (const f of files) {
    const base = path.basename(f, '.html');
    for (const mode of (process.env.MODES || 'day,night').split(',')) {
      for (const [w, h] of [[1280, 800], [375, 812]]) {
        const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1 });
        const p = await ctx.newPage();
        const errs = [];
        p.on('console', m => m.type() === 'error' && errs.push(m.text()));
        p.on('pageerror', e => errs.push(String(e)));
        await p.goto('file://' + path.resolve(f) + (mode === 'day' ? '' : '?t=' + mode));
        await p.evaluate(() => document.fonts.ready);
        await p.waitForTimeout(300);
        const shot = path.join(out, `${base}-${mode}-${w}.png`);
        await p.screenshot({ path: shot });
        const r = await p.evaluate(() => {
          const vw = document.documentElement.clientWidth, vh = innerHeight;
          const overflow = document.documentElement.scrollWidth > vw;
          const outside = [...document.querySelectorAll('body *')].filter(el => {
            const b = el.getBoundingClientRect(); const s = getComputedStyle(el);
            return b.width && s.visibility !== 'hidden' && s.position !== 'fixed' && (b.right > vw + 1 || b.left < -1) && !el.closest('[aria-hidden=true]') && s.display !== 'none';
          }).slice(0, 5).map(el => el.tagName + '.' + el.className);
          const vis = sel => { const els = [...document.querySelectorAll(sel)].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden'); if (!els.length) return 'missing'; const res = els.map(el => { const b = el.getBoundingClientRect(); return [b.top >= 0 && b.bottom <= vh, Math.round(b.top), Math.round(b.bottom)]; }); const ok = res.find(x => x[0]); return ok ? `ok@${ok[2]}` : `OUT@${res[0][1]}-${res[0][2]}`; };
          return { overflow, outside, phone: vis('[data-check=phone]'), call: vis('[data-check=call]'), addr: vis('[data-check=addr]'), plan: vis('[data-check=plan]') };
        });
        console.log(`${base} ${mode} ${w}: overflow=${r.overflow} phone=${r.phone} call=${r.call} addr=${r.addr} plan=${r.plan}${r.outside.length ? ' outside=' + r.outside.join(',') : ''}${errs.length ? ' ERR=' + errs.join(' | ') : ''}`);
        await ctx.close();
      }
    }
  }
  await browser.close();
})();
