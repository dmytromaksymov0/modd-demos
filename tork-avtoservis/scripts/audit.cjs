// Final audit across all pages: one h1, unique title/description, alt text, JSON-LD parses,
// keyboard focus is visible on every focusable element, touch targets on phones, console errors.
// node scripts/audit.cjs [baseUrl]   (adapted from brightwater-dental/scripts/audit.cjs)
const { chromium } = require('../../node_modules/playwright');
const base = process.argv[2] || 'http://localhost:4321';
const pages = ['/', '/poslugy/', '/poslugy/diagnostyka/', '/poslugy/khodova/', '/poslugy/to-ta-zamina-olyvy/', '/poslugy/halma/', '/poslugy/kondytsioner/', '/kalkulyator/', '/yak-my-pratsyuyemo/', '/tsiny/', '/kontakty/', '/pryvatnist/', '/dyakuyemo/', '/404/'];
(async () => {
  const b = await chromium.launch();
  const titles = new Map(), descs = new Map(); let problems = 0;
  const flag = (p, m) => { problems++; console.log(`✗ ${p}: ${m}`); };
  for (const path of pages) {
    const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
    const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    await page.goto(base + path, { waitUntil: 'networkidle' });
    const info = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      title: document.title,
      desc: document.querySelector('meta[name="description"]')?.content ?? '',
      noAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).map((i) => i.src.slice(-40)),
      ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { JSON.parse(s.textContent); return true; } catch { return false; } }),
      headings: [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => +h.tagName[1]),
      lang: document.documentElement.lang,
    }));
    if (info.h1 !== 1) flag(path, `${info.h1} h1 elements`);
    if (info.noAlt.length) flag(path, `images without alt: ${info.noAlt}`);
    if (info.ld.includes(false)) flag(path, 'invalid JSON-LD');
    if (info.lang !== 'uk') flag(path, 'html lang is not uk');
    for (let i = 1; i < info.headings.length; i++) if (info.headings[i] - info.headings[i - 1] > 1) { flag(path, `heading jumps h${info.headings[i - 1]}→h${info.headings[i]}`); break; }
    if (info.title.length > 70 || info.title.length < 20) flag(path, `title length ${info.title.length}`);
    if (info.desc.length < 70 || info.desc.length > 170) flag(path, `description length ${info.desc.length}`);
    if (!['/dyakuyemo/', '/404/'].includes(path)) {
      if (titles.has(info.title)) flag(path, `duplicate title with ${titles.get(info.title)}`); titles.set(info.title, path);
      if (descs.has(info.desc)) flag(path, `duplicate description with ${descs.get(info.desc)}`); descs.set(info.desc, path);
    }
    // Keyboard: Tab through the page, every stop must show an outline or box-shadow ring.
    let stops = 0, invisible = [];
    const seen = new Set();
    for (let i = 0; i < 120; i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(() => {
        const el = document.activeElement; if (!el || el === document.body) return null;
        const cs = getComputedStyle(el); let ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || el.matches('input.range'); // range: ring on ::-webkit-slider-thumb
        // Visually hidden inputs (chips, segmented controls) show focus on the sibling span.
        if (!ring && el.matches('input.sr-only, input.peer, input.opacity-0')) {
          const sib = el.nextElementSibling; const s2 = sib && getComputedStyle(sib);
          ring = !!s2 && ((s2.outlineStyle !== 'none' && parseFloat(s2.outlineWidth) > 0) || s2.boxShadow !== 'none');
          // TORK chips (class picker, channel picker, mobile price-class switch) draw the ring on the wrapping label: has-[:focus-visible].
          if (!ring) { const lab = el.closest('label'); const s3 = lab && getComputedStyle(lab); ring = !!s3 && ((s3.outlineStyle !== 'none' && parseFloat(s3.outlineWidth) > 0) || s3.boxShadow !== 'none'); }
        }
        const id = el.outerHTML.slice(0, 80);
        return { id, ring };
      });
      if (!f || seen.has(f.id)) { if (!f) break; continue; }
      seen.add(f.id); stops++;
      if (!f.ring) invisible.push(f.id);
    }
    if (invisible.length) flag(path, `focus not visible on ${invisible.length}: ${invisible.slice(0, 3).join(' | ')}`);
    if (errs.length) flag(path, 'console: ' + errs.join(' | '));
    // Touch targets on a phone: interactive elements ≥ 44×44 (inline text links excepted).
    await page.setViewportSize({ width: 375, height: 812 });
    const small = await page.evaluate(() => [...document.querySelectorAll('a, button, input:not([type=hidden]), select, summary, label.chip, [role=tab], [role=radio]')]
      .filter((el) => { const r = el.getBoundingClientRect(); if (!r.width || getComputedStyle(el).visibility === 'hidden') return false;
        if (el.matches('input.sr-only, input.peer, input.opacity-0') || el.closest('[aria-hidden="true"]')) return false; // honeypot is aria-hidden and off-screen
        if (el.matches('input[type=checkbox], input[type=radio]') && el.closest('label') && el.closest('label').getBoundingClientRect().height >= 44) return false; // hit area is the label
        if (el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.closest('p, li, figcaption, address')) return false; // inline text link
        return r.height < 44 && !(el.tagName === 'A' && r.height >= 24 && el.closest('nav, footer'));
      }).map((el) => `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}" ${Math.round(el.getBoundingClientRect().height)}px`));
    if (small.length) flag(path, `small touch targets: ${small.slice(0, 5).join('; ')}${small.length > 5 ? ` (+${small.length - 5})` : ''}`);
    console.log(`${path}: ${stops} focus stops, h1 ok=${info.h1 === 1}`);
    await page.close();
  }
  console.log(problems ? `${problems} problems` : 'audit clean');
  await b.close(); process.exitCode = problems ? 1 : 0;
})();
