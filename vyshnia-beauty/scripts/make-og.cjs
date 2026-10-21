// 1200×630 Open Graph images (public/og/<slug>.jpg) + PNG favicons, in the «Віяло» language: porcelain, the wordmark,
// one headline (Geologica, SHRP), one fact, and a real photo in the tip mask — no text over the photo.
// node scripts/make-og.cjs
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const path = require('path'), fs = require('fs'), os = require('os');
const root = path.join(__dirname, '..');
const f = (p) => 'file://' + path.join(root, p);
const logo = fs.readFileSync(path.join(root, 'public/brand/vyshnia-logo.svg'), 'utf8');
const pages = [
  { slug: 'home', kicker: 'Студія краси · центр Харкова', title: 'Оберіть колір. Ми відповідаємо за нього <em>21&nbsp;день</em>', photo: 'svc-manicure.jpg', pos: '50% 40%', fact: 'Запис онлайн за 4 кроки · ціна наперед' },
  { slug: 'poslugy', kicker: 'Послуги та ціни', title: 'Манікюр від 750&nbsp;₴, педикюр від 950&nbsp;₴', photo: 'work-nude-soft.jpg', pos: '50% 50%', fact: 'Топ-майстриня +20 % · зняття покриття входить' },
  { slug: 'maistry', kicker: 'Майстрині', title: 'Шість майстринь — обирайте людину, а&nbsp;не салон', photo: 'master-iryna.jpg', pos: '50% 35%', fact: 'Запис до конкретної майстрині в один клік' },
  { slug: 'roboty', kicker: 'Роботи', title: 'Побачили — <em>хочу так само</em>', photo: 'work-french-ring.jpg', pos: '50% 55%', fact: 'Фільтр за послугою й кольором' },
  { slug: 'sterylnist', kicker: 'Стерильність', title: 'Пакет відкривають <em>при&nbsp;вас</em>', photo: 'sterile-kraft.jpg', pos: '50% 45%', fact: 'Сухожар 180 °C · 60 хв · одноразові пилки' },
  { slug: 'sertyfikaty', kicker: 'Подарунковий сертифікат', title: '500–2000&nbsp;₴ або конкретна послуга', photo: 'tips-scissors.jpg', pos: '70% 50%', fact: 'Діє 6 місяців · у Telegram або в крафт-конверті' },
  { slug: 'kontakty', kicker: 'Контакти', title: '4 хвилини від м.&nbsp;Архітектора Бекетова', photo: 'interior-table.jpg', pos: '55% 50%', fact: 'вул. Фарфорова, 7 · щодня 9:00–21:00' },
  { slug: 'zapys', kicker: 'Запис онлайн', title: 'Послуга, майстриня, час — <em>за хвилину</em>', photo: 'svc-pedicure.jpg', pos: '58% 40%', fact: 'Без передоплати · гарантія на покриття 21 день' },
];
const html = (p) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:G;src:url(${f('design/fonts-src/Geologica[CRSV,SHRP,slnt,wght].ttf')});font-weight:100 900}
@font-face{font-family:T;src:url(${f('design/fonts-src/GolosText[wght].ttf')});font-weight:400 900}
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;display:grid;grid-template-columns:1fr 360px;gap:56px;padding:56px 72px 56px 64px;background:#F3F3F1;color:#221B1E;font-family:T}
.l{display:flex;flex-direction:column}.l svg{width:250px;height:auto}
.k{margin-top:auto;font-weight:600;font-size:22px;color:#6B6366}
h1{font-family:G;font-weight:480;font-variation-settings:"SHRP" 60;font-size:60px;line-height:1.04;letter-spacing:-.025em;margin-top:14px}
h1 em{font-style:normal;color:#7E1631;font-variation-settings:"SHRP" 100}
.fact{margin-top:22px;font-size:24px;color:#221B1E}.fact b{color:#7E1631}
.tip{border-radius:999px 999px 26px 26px;background:#E9D6CF url(${f('src/assets/photos/')}${p.photo}) ${p.pos}/cover}
</style></head><body><div class="l">${logo}<p class="k">${p.kicker}</p><h1>${p.title}</h1><p class="fact">${p.fact}</p></div><div class="tip"></div></body></html>`;
(async () => {
  fs.mkdirSync(path.join(root, 'public/og'), { recursive: true });
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1200, height: 630 } });
  for (const p of pages) {
    const tmp = path.join(os.tmpdir(), `vyshnia-og-${p.slug}.html`); // file:// assets load only from a file:// page
    fs.writeFileSync(tmp, html(p));
    await pg.goto('file://' + tmp, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: path.join(root, `public/og/${p.slug}.jpg`), type: 'jpeg', quality: 82 });
    console.log('og', p.slug);
  }
  const fav = fs.readFileSync(path.join(root, 'public/favicon.svg'), 'utf8');
  for (const [size, name] of [[180, 'apple-touch-icon.png'], [512, 'icon-512.png'], [192, 'icon-192.png'], [32, 'favicon-32.png']]) {
    await pg.setViewportSize({ width: size, height: size });
    await pg.setContent(`<style>*{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${fav}`);
    await pg.screenshot({ path: path.join(root, 'public', name), omitBackground: true });
  }
  await b.close();
})();
