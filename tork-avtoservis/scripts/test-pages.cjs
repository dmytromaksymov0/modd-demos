// Inner pages: symptom finder, full calculator (prefill from URL, combos, transfer to booking),
// prices class switch on mobile, estimate on «Як ми працюємо», service-page calc links, no console errors.
// Run: node scripts/test-pages.cjs [baseUrl]
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const base = process.argv[2] || 'http://localhost:4321';
let fail = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };
const norm = (s) => s.replace(/\s/g, ' ').trim();
(async () => {
  const b = await chromium.launch(); const errs = [];
  const page = async (vp = { width: 1280, height: 800 }) => { const p = await b.newPage({ viewport: vp }); p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); return p; };
  // finder
  let p = await page();
  await p.goto(base + '/poslugy/', { waitUntil: 'networkidle' });
  await p.fill('[data-finder-input]', 'скрипить коли гальмую');
  ok(await p.$eval('.svc[data-svc="halma"]', (e) => e.hasAttribute('data-hit')), 'finder: «скрипить коли гальмую» → Гальма');
  await p.fill('[data-finder-input]', 'дме тепле');
  ok(await p.$eval('.svc[data-svc="kondytsioner"]', (e) => e.hasAttribute('data-hit')), 'finder: «дме тепле» → Кондиціонер');
  await p.fill('[data-finder-input]', 'щось незрозуміле');
  ok(/Telegram/.test(await p.textContent('[data-finder-out]')), 'finder: unknown text suggests Telegram');
  await p.click('a[data-s="khodova"]');
  ok(await p.$eval('.svc[data-svc="khodova"]', (e) => e.hasAttribute('data-hit')), 'finder chip highlights Ходова');
  // calculator with prefill
  p = await page();
  await p.goto(base + '/kalkulyator/?klas=D&robota=ball-joint&robota=alignment#kalk', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => /клас D/.test(document.querySelector('[data-calc-class]').textContent));
  ok(norm(await p.textContent('[data-calc-total]')) === '2 210 ₴', 'prefill D: ball joint 1300 + alignment 1300 − 390 = 2 210 ₴');
  ok(/Кульова \+ розвал разом: −390/.test(await p.textContent('[data-calc-saving]')), 'combo «Кульова + розвал» −390 ₴');
  await p.click('[data-calc] label:has-text("Мастило + фільтр")');
  await p.click('[data-calc] label:has-text("Повітряний і салонний фільтри")');
  ok(/Мастило \+ фільтри разом/.test(await p.textContent('[data-calc-saving]')), 'second combo listed');
  await p.click('[data-calc-book]'); await p.waitForTimeout(300);
  ok((await p.inputValue('[data-calc-klas]')) === 'D' && /ball-joint/.test(await p.inputValue('[data-calc-field]')), 'calculation transferred to booking form');
  // service page → calculator link
  p = await page();
  await p.goto(base + '/poslugy/halma/', { waitUntil: 'networkidle' });
  const href = await p.getAttribute('a:has-text("Порахувати в калькуляторі")', 'href');
  ok(/robota=pads-front/.test(href), 'Гальма page links to calculator with brake works: ' + href);
  // prices mobile
  p = await page({ width: 375, height: 812 });
  await p.goto(base + '/tsiny/', { waitUntil: 'networkidle' });
  const visCols = async () => p.$$eval('th[data-c]', (els) => [...new Set(els.filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.dataset.c))].join(''));
  ok(await visCols() === 'B', 'prices 375: only class B column by default');
  await p.click('label:has(#tc-D)');
  ok(await visCols() === 'D', 'prices 375: switching to D shows only D');
  // how we work: estimate interactive
  p = await page();
  await p.goto(base + '/yak-my-pratsyuyemo/', { waitUntil: 'networkidle' });
  await p.click('[data-line="discs"] label:has-text("Робимо")');
  await p.waitForFunction(() => document.querySelector('[data-estimate] [data-total]').textContent.replace(/\s/g, ' ') === '7 540 ₴');
  ok(true, '«Як ми працюємо»: estimate recalculates to 7 540 ₴');
  ok(errs.length === 0, 'no console errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close(); console.log(fail ? `${fail} FAILED` : 'all passed'); process.exit(fail ? 1 : 0);
})();
