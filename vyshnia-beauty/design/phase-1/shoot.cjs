// Скриншоты первого экрана: node shoot.cjs name=url|file ...  → shots/<name>-1280.png, -375.png
const { chromium, devices } = require('../../../node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  for (const arg of process.argv.slice(2)) {
    const [name, src] = arg.split('=');
    const url = /^https?:/.test(src) ? src : 'file://' + path.resolve(__dirname, src);
    for (const [w, h, mob] of [[1280, 800, false], [375, 812, true]]) {
      const ctx = await b.newContext(mob ? { ...devices['iPhone 13'], viewport: { width: w, height: h } } : { viewport: { width: w, height: h }, locale: 'uk-UA' });
      const p = await ctx.newPage(); const errs = [];
      p.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 120)));
      p.on('pageerror', e => errs.push(String(e).slice(0, 120)));
      await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(e => errs.push('goto ' + e.message.slice(0, 80)));
      await p.waitForTimeout(1500);
      await p.screenshot({ path: path.join(__dirname, 'shots', `${name}-${w}.png`) });
      const r = await p.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const over = [...document.querySelectorAll('body *')].filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.right > vw + 1 || b.left < -1) && getComputedStyle(e).position !== 'fixed'; }).slice(0, 5).map(e => e.tagName + '.' + e.className);
        const chk = [...document.querySelectorAll('[data-check]')].map(e => { const b = e.getBoundingClientRect(); return e.dataset.check + ':' + (b.bottom <= innerHeight && b.top >= 0 ? 'in' : 'OUT(' + Math.round(b.top) + '-' + Math.round(b.bottom) + ')'); });
        const small = [...document.querySelectorAll('body *')].filter(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12 && e.getBoundingClientRect().width).length;
        return { sw: document.documentElement.scrollWidth, vw, over, chk, small };
      });
      console.log(name, w, JSON.stringify(r), errs.length ? 'ERR ' + errs.join(' | ') : '');
      await ctx.close();
    }
  }
  await b.close();
})();
