// 1200×630 Open Graph images (public/og/<slug>.jpg) + PNG favicons, in the facade language:
// steel frame, paper window with the headline, photo window, ochre plate. node scripts/make-og.cjs
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const path = require('path'), fs = require('fs'), os = require('os');
const root = path.join(__dirname, '..');
const f = (p) => 'file://' + path.join(root, p);
const logo = fs.readFileSync(path.join(root, 'public/brand/tork-logo.svg'), 'utf8');
const pages = [
  { slug: 'home', kicker: 'Автосервіс · Салтівка · з 2014', title: 'Ремонт без <mark>сюрпризів</mark> у&nbsp;чеку', photo: 'derzhprom-bridges.jpg', pos: '40% 40%', fact: 'Кошторис у Telegram до ремонту' },
  { slug: 'poslugy', kicker: 'Послуги', title: 'Діагностика, ходова, ТО, гальма, кондиціонер', photo: 'bay-04-wide.jpg', pos: '50% 50%', fact: 'Ціни за класами A–D' },
  { slug: 'diagnostyka', kicker: 'Діагностика', title: 'Спершу причина, потім ціна', photo: 'andrii-tablet.jpg', pos: '50% 22%', fact: 'Ходова 450&nbsp;₴ · безкоштовно при ремонті' },
  { slug: 'khodova', kicker: 'Ходова', title: 'Стукає спереду — покажемо, що саме', photo: 'oleg-wheel.jpg', pos: '55% 45%', fact: 'Стійки стабілізатора від&nbsp;480&nbsp;₴' },
  { slug: 'to-ta-zamina-olyvy', kicker: 'ТО та заміна мастила', title: 'Мастило й фільтр за 40 хвилин', photo: 'oleg-engine.jpg', pos: '40% 50%', fact: 'Можна своє мастило' },
  { slug: 'halma', kicker: 'Гальма', title: 'Міряємо, а не вгадуємо', photo: 'andrii-brakes.jpg', pos: '62% 45%', fact: 'Колодки передні від&nbsp;600&nbsp;₴' },
  { slug: 'kondytsioner', kicker: 'Кондиціонер', title: 'Фреон — за вагою, а не «на око»', photo: 'ac-panel.jpg', pos: '50% 50%', fact: 'Перевірка й заправка від&nbsp;640&nbsp;₴' },
  { slug: 'kalkulyator', kicker: 'Калькулятор', title: 'Спершу ціна. Потім ремонт.', photo: 'report-disc.jpg', pos: '45% 50%', fact: 'Клас авто × роботи = сума' },
  { slug: 'yak-my-pratsyuyemo', kicker: 'Як ми працюємо', title: 'Нічого без вашого «так»', photo: 'andrii-measure.jpg', pos: '60% 35%', fact: 'Фотозвіт · старі деталі — вам' },
  { slug: 'tsiny', kicker: 'Ціни', title: 'Ціна роботи за класами авто', photo: 'oleg-under-lift.jpg', pos: '30% 55%', fact: 'Нормо-година 800–1&nbsp;300&nbsp;₴' },
  { slug: 'kontakty', kicker: 'Контакти', title: '7 хвилин від м.&nbsp;Студентська', photo: 'bay-clean.jpg', pos: '45% 60%', fact: 'Пн–Пт 8:30–19:00 · Сб 9–16' },
];
const html = (p) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:D;src:url(${f('design/fonts-src/ScienceGothic.ttf')});font-weight:100 900;font-stretch:50% 200%}
@font-face{font-family:T;src:url(${f('design/fonts-src/Onest.ttf')});font-weight:100 900}
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;background:#20262A;padding:10px;display:grid;grid-template-columns:690px 1fr;gap:10px;font-family:T;color:#20262A}
.l{background:#F4F4F1;padding:44px 44px 40px;display:flex;flex-direction:column}.l svg{width:250px;height:auto}
.k{font-family:D;font-variation-settings:'wdth' 150;font-weight:650;font-size:18px;letter-spacing:.06em;text-transform:uppercase;color:#3F5A55;margin-top:auto}
h1{font-family:D;font-variation-settings:'wdth' 54;font-weight:850;font-size:74px;line-height:.94;margin-top:12px}
mark{background:linear-gradient(transparent 60%,#E0A01A 60% 92%,transparent 92%);color:inherit}
.u{margin-top:22px;font-weight:600;font-size:24px}
.r{position:relative;background:url(${f('src/assets/photos/')}${p.photo}) ${p.pos}/cover}
.fact{position:absolute;left:0;bottom:0;background:#E0A01A;padding:12px 18px;font-family:D;font-variation-settings:'wdth' 90;font-weight:780;font-size:24px;max-width:100%}
</style></head><body><div class="l">${logo}<p class="k">${p.kicker}</p><h1>${p.title}</h1><p class="u">+380 57 000-14-14 · Харків, Салтівка</p></div>
<div class="r"><p class="fact">${p.fact}</p></div></body></html>`;
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1200, height: 630 } });
  for (const p of pages) {
    const tmp = path.join(os.tmpdir(), `tork-og-${p.slug}.html`); // file:// assets load only from a file:// page
    fs.writeFileSync(tmp, html(p));
    await pg.goto('file://' + tmp, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: path.join(root, `public/og/${p.slug}.jpg`), type: 'jpeg', quality: 82 });
    console.log('og', p.slug);
  }
  const mark = fs.readFileSync(path.join(root, 'public/brand/tork-mark.svg'), 'utf8');
  for (const [size, name] of [[180, 'apple-touch-icon.png'], [512, 'icon-512.png'], [192, 'icon-192.png'], [32, 'favicon-32.png']]) {
    await pg.setViewportSize({ width: size, height: size });
    await pg.setContent(`<style>*{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${mark}`);
    await pg.screenshot({ path: path.join(root, 'public', name) });
  }
  await b.close();
})();
