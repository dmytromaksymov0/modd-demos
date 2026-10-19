// Generate 1200×630 Open Graph images into public/og/ + PNG favicons. node scripts/make-og.cjs
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const path = require('path'), fs = require('fs'), os = require('os');
const root = path.join(__dirname, '..');
const f = (p) => 'file://' + path.join(root, p);
const logo = fs.readFileSync(path.join(root, 'public/brand/brightwater-logo.svg'), 'utf8');
const rope = Array.from({ length: 34 }, (_, i) => `<i style="background:${i % 12 < 2 ? '#C73A23' : i % 12 === 7 || i % 12 === 8 ? '#fff;outline:1px solid #7E908B;outline-offset:-1px' : '#0A6B5D'}"></i>`).join('');
const pages = [
  { slug: 'home', kicker: 'Family dentist · Mueller, Austin', title: 'Dentistry on family time. Even <mark>Saturdays.</mark>', photo: 'hero-4-dad-kids-brushing.jpg', pos: '45% 35%', fact: 'Open till 7 pm · Sat 8–2' },
  { slug: 'new-patients', kicker: 'New patients', title: 'A first visit with no surprises.', photo: 'consult-dentist-talk.jpg', pos: '50% 45%', fact: '$99 · exam, X-rays, cleaning' },
  { slug: 'services', kicker: 'Services', title: 'Everything a family needs, in one office.', photo: 'clinic-operatory.jpg', pos: '50% 55%', fact: 'Same-day crowns · aligners' },
  { slug: 'emergency', kicker: 'Emergency dentist', title: 'In pain? Seen today.', photo: 'service-emergency-exam.jpg', pos: '50% 42%', fact: '$59 exam + X-ray' },
  { slug: 'insurance-financing', kicker: 'Insurance & financing', title: 'The price, before you sit down.', photo: 'proof-high-five.jpg', pos: '50% 40%', fact: 'Most PPOs · $29/mo plan' },
  { slug: 'team', kicker: 'Our team', title: 'Three dentists who explain first.', photo: 'team-holloway-at-work.jpg', pos: '60% 45%', fact: 'Hablamos español' },
  { slug: 'book', kicker: 'Book online', title: 'Book the whole crew in <mark>one go.</mark>', photo: 'hero-4-dad-kids-brushing.jpg', pos: '55% 35%', fact: 'Chairs side by side' },
];
const font = (n, file) => `@font-face{font-family:${n};src:url(${f('node_modules/@fontsource-variable/' + file)});font-weight:100 900}`;
const html = (p) => `<!doctype html><html><head><style>
${font('G', 'gabarito/files/gabarito-latin-wght-normal.woff2')}${font('A', 'atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2')}
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;background:#F7F8F6;font-family:A;display:grid;grid-template-columns:590px 1fr;color:#10231F}
.l{padding:52px 40px 44px 60px;display:flex;flex-direction:column}.l svg{width:280px;height:auto}
.k{font-family:G;font-weight:650;font-size:22px;color:#5B6B67;margin-top:auto}
h1{font-family:G;font-size:64px;line-height:.98;letter-spacing:-.035em;font-weight:800;margin-top:14px}
mark{background:linear-gradient(transparent 58%,#F5C842 58% 92%,transparent 92%);color:inherit}
.rope{display:flex;gap:1.5px;margin-top:30px}.rope i{width:12px;height:6px;border-radius:3px}
.u{margin-top:18px;font-family:G;font-weight:700;font-size:24px}.u span{color:#0A6B5D}
.r{position:relative;margin:28px 28px 28px 0;border-radius:28px;overflow:hidden;background:url(${f('src/assets/photos/')}${p.photo}) ${p.pos}/cover}
.fact{position:absolute;left:24px;bottom:24px;background:#fff;border-radius:14px;padding:14px 20px;font-family:G;font-weight:750;font-size:26px;box-shadow:0 18px 40px -18px rgba(16,35,31,.35)}
</style></head><body><div class="l">${logo}<p class="k">${p.kicker}</p><h1>${p.title}</h1><div class="rope">${rope}</div><p class="u"><span>(512) 555-0142</span> · Book online</p></div>
<div class="r"><p class="fact">${p.fact}</p></div></body></html>`;
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1200, height: 630 } });
  for (const p of pages) {
    const tmp = path.join(os.tmpdir(), `bw-og-${p.slug}.html`);  // file:// assets load only from a file:// page
    fs.writeFileSync(tmp, html(p));
    await pg.goto('file://' + tmp, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: path.join(root, `public/og/${p.slug}.jpg`), type: 'jpeg', quality: 84 });
    console.log('og', p.slug);
  }
  const mark = fs.readFileSync(path.join(root, 'public/brand/brightwater-mark.svg'), 'utf8');
  for (const [size, name] of [[180, 'apple-touch-icon.png'], [512, 'icon-512.png'], [32, 'favicon-32.png']]) {
    await pg.setViewportSize({ width: size, height: size });
    await pg.setContent(`<style>*{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${mark}`);
    await pg.screenshot({ path: path.join(root, 'public', name), omitBackground: true });
  }
  await b.close();
})();
