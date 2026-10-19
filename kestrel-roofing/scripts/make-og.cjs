// Generate 1200×630 Open Graph images (Field Report style) into public/og/. node scripts/make-og.cjs
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const path = require('path'), fs = require('fs');
const root = path.join(__dirname, '..');
const f = (p) => 'file://' + path.join(root, p);
const logo = fs.readFileSync(path.join(root, 'public/brand/kestrel-logo.svg'), 'utf8');
const pages = [
  { slug: 'home', kicker: 'Columbus roofing since 2009', title: 'We measure first, then we price.', photo: 'hero-1-porch-house-crew.jpg', pos: '50% 45%', pin: [50, 32, "Underlayment on"] },
  { slug: 'roof-replacement', kicker: 'Roof replacement', title: 'A new roof in one day. Price locked first.', photo: 'hero-2-brick-house-decking.jpg', pos: '62% 50%', pin: [40, 30, 'Tear-off · 7:40'] },
  { slug: 'storm-damage', kicker: 'Storm & hail damage', title: 'Free storm inspection within 48 hours.', photo: 'storm-hail-3tab.jpg', pos: '50% 50%', pin: [36, 40, 'Hail hit · 1 in'] },
  { slug: 'roof-cost-calculator', kicker: 'Roof cost calculator', title: 'What will a new roof cost? Real numbers.', photo: 'pitch-8-12-brick-colonial.jpg', pos: '50% 45%', pin: [50, 26, 'Pitch 8/12'] },
  { slug: 'projects', kicker: 'Projects', title: 'Recent roofs around Columbus.', photo: 'project-stone-house-in-progress.jpg', pos: '50% 50%', pin: [42, 30, '42 squares · 2 days'] },
  { slug: 'about', kicker: 'About Kestrel', title: 'Our own crews. 25 years on our work.', photo: 'crew-two-umJz4M-iCOw.jpg', pos: '50% 50%', pin: [36, 34, 'Harnessed, always'] },
  { slug: 'free-inspection', kicker: 'Free inspection', title: 'Book a free roof inspection.', photo: 'about-roofer-ladder.jpg', pos: '50% 35%', pin: [52, 24, 'Photo report in 24 h'] },
];
const html = (p) => `<!doctype html><html><head><style>
@font-face{font-family:A;src:url(${f('node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2')});font-weight:100 900;font-stretch:62% 125%}
@font-face{font-family:M;src:url(${f('node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2')})}
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;background:#F4F5F3;font-family:A;display:grid;grid-template-columns:560px 1fr;color:#14181C}
.l{padding:56px 48px 48px 64px;display:flex;flex-direction:column}.l svg{width:300px;height:auto}
.k{font-family:M;font-size:20px;letter-spacing:.06em;text-transform:uppercase;color:#545C63;margin-top:auto}
h1{font-size:62px;line-height:1;letter-spacing:-.025em;font-weight:750;font-variation-settings:"wdth" 125;margin-top:16px}
.u{margin-top:28px;font-size:22px;color:#545C63}.u b{color:#2341D6}
.r{position:relative;margin:28px 28px 28px 0;border-radius:3px;overflow:hidden;background:url(${f('src/assets/photos/')}${p.photo}) ${p.pos}/cover}
.pin{position:absolute;left:${p.pin[0]}%;top:${p.pin[1]}%;display:flex;align-items:center}
.pin i{width:20px;height:20px;border-radius:50%;background:#2341D6;border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.3)}
.pin s{width:44px;height:2px;background:#fff}.pin span{white-space:nowrap;background:#fff;font-family:M;font-size:20px;color:#2341D6;padding:8px 12px;text-transform:uppercase;letter-spacing:.04em;border-radius:3px}
</style></head><body><div class="l">${logo}<p class="k">${p.kicker}</p><h1>${p.title}</h1><p class="u"><b>(614) 555-0142</b> · kestrel roofing co.</p></div>
<div class="r"><div class="pin"><i></i><s></s><span>${p.pin[2]}</span></div></div></body></html>`;
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1200, height: 630 } });
  for (const p of pages) {
    // file:// fonts and photos only load from a file:// page, not from setContent's about:blank.
    const tmp = path.join(require('os').tmpdir(), `kestrel-og-${p.slug}.html`);
    fs.writeFileSync(tmp, html(p));
    await pg.goto('file://' + tmp, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: path.join(root, `public/og/${p.slug}.jpg`), type: 'jpeg', quality: 82 });
    console.log('og', p.slug);
  }
  // Favicons from the SVG mark
  const mark = fs.readFileSync(path.join(root, 'public/brand/kestrel-mark.svg'), 'utf8');
  for (const [size, name] of [[180, 'apple-touch-icon.png'], [512, 'icon-512.png'], [32, 'favicon-32.png']]) {
    await pg.setViewportSize({ width: size, height: size });
    await pg.setContent(`<style>*{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${mark}`);
    await pg.screenshot({ path: path.join(root, 'public', name), omitBackground: true });
  }
  await b.close();
})();
