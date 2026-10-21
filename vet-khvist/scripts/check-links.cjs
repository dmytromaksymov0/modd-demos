// Crawl every built page; check internal links (status 200) and #anchors (target exists).
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const base = process.argv[2] || 'http://localhost:4321';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const queue = ['/', '/404', '/styleguide/', '/dyakuyemo/'], seen = new Set(), bad = [];
  while (queue.length) {
    const path = queue.shift(); if (seen.has(path)) continue; seen.add(path); if (path.includes('#')) continue;
    const res = await p.goto('about:blank').then(() => p.goto(base + path, { waitUntil: 'domcontentloaded' }));
    if (res.status() !== 200 && path !== '/404') { bad.push(`${path} → ${res.status()}`); continue; }
    const links = await p.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => !h.startsWith('?')));
    for (const h of links) {
      if (/^(tel:|mailto:|https?:)/.test(h)) continue;
      const u = new URL(h, base + path);
      if (u.hash) {
        if (u.pathname === path) { if (!(await p.locator(u.hash).count())) bad.push(`${path}: missing anchor ${u.hash}`); }
        else queue.push(u.pathname + '#' + u.hash.slice(1));
      }
      if (!seen.has(u.pathname)) queue.push(u.pathname);
    }
  }
  // Cross-page anchors
  for (const s of [...seen].filter((x) => x.includes('#'))) {
    const [pathname, hash] = s.split('#');
    await p.goto(base + pathname); if (!(await p.locator('#' + hash).count())) bad.push(`missing anchor ${s}`);
  }
  console.log('pages:', [...seen].filter((x) => !x.includes('#')).join(' '));
  console.log(bad.length ? 'PROBLEMS:\n' + bad.join('\n') : 'all links and anchors OK');
  await b.close(); process.exitCode = bad.length ? 1 : 0;
})();
