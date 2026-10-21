// 1200×630 Open Graph images (public/og/<slug>.jpg) + PNG favicons, in the «Світло горить» language:
// the night door (lamp edge, lit number, one fact) + a real photo without text over it (a plate on a photo reads as
// its caption). node scripts/make-og.cjs
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const path = require('path'), fs = require('fs'), os = require('os');
const root = path.join(__dirname, '..');
const f = (p) => 'file://' + path.join(root, p);
const logo = fs.readFileSync(path.join(root, 'public/brand/khvist-logo-night.svg'), 'utf8');
const pages = [
  { slug: 'home', kicker: 'Ветклініка · Харків · цілодобово', title: 'Світло горить і&nbsp;вдень, і&nbsp;вночі', photo: 'vet-cat-stethoscope.jpg', pos: '50% 72%', fact: 'Операційна працює без світла' },
  { slug: 'nevidkladna', kicker: 'Невідкладна допомога', title: 'Черговий лікар на&nbsp;місці щоночі', photo: 'paw-in-hands.jpg', pos: '55% 55%', fact: 'Без запису · дзвоніть дорогою' },
  { slug: 'poslugy', kicker: 'Послуги', title: 'Терапія, хірургія, щеплення, діагностика', photo: 'cat-ear-exam.jpg', pos: '45% 40%', fact: '9 лікарів · ціни «все включено»' },
  { slug: 'terapiya', kicker: 'Терапія', title: 'Коли тварина «не така, як завжди»', photo: 'cat-ear-exam.jpg', pos: '45% 40%', fact: 'Огляд 550 грн' },
  { slug: 'khirurhiya', kicker: 'Хірургія', title: 'Ціна до каси й наркоз під наглядом', photo: 'surgical-instruments.jpg', pos: '50% 55%', fact: 'Стерилізація кішки 3&nbsp;400 грн — все включено' },
  { slug: 'vaktsynatsiya', kicker: 'Вакцинація', title: 'Схема на рік і нагадування в&nbsp;Telegram', photo: 'kitten-bodysuit-syringe.jpg', pos: '50% 35%', fact: 'Кіт від 850 грн, вакцина включена' },
  { slug: 'diahnostyka', kicker: 'Діагностика', title: 'Аналізи за 30–60 хвилин, УЗД і&nbsp;рентген', photo: 'ultrasound-pomeranian.jpg', pos: '40% 60%', fact: 'УЗД від 700 грн' },
  { slug: 'tsiny', kicker: 'Ціни', title: 'Одна сума до каси', photo: 'dog-teeth-check.jpg', pos: '50% 50%', fact: 'Уночі ×1.5 тільки на огляди' },
  { slug: 'likari', kicker: 'Лікарі', title: '9 лікарів, і хтось — на&nbsp;місці щоночі', photo: 'doctor-blue-shepherd.jpg', pos: '45% 30%', fact: 'Графік чергувань щотижня' },
  { slug: 'klub', kicker: 'Клуб турботи', title: 'Нагадаємо про щеплення раніше, ніж ви згадаєте', photo: 'dog-listening.jpg', pos: '50% 40%', fact: 'Безкоштовно · −10 %' },
  { slug: 'zapys', kicker: 'Запис', title: 'Записатися на зручний день', photo: 'doctor-female-pomeranian.jpg', pos: '50% 45%', fact: 'Передзвонимо за 15 хвилин' },
];
const html = (p) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:S;src:url(${f('design/fonts-src/Piazzolla[opsz,wght].ttf')});font-weight:100 900}
@font-face{font-family:U;src:url(${f('design/fonts-src/UbuntuSans[wdth,wght].ttf')});font-weight:100 800}
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;display:grid;grid-template-columns:700px 1fr;font-family:U;background:#2A211C}
.l{position:relative;padding:48px 52px 44px 64px;display:flex;flex-direction:column;color:#FFE6C9}
.l::before{content:'';position:absolute;inset:0 auto 0 0;width:10px;background:#FFC98F}
.l svg{width:240px;height:auto}
.k{margin-top:auto;font-weight:650;font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:#FFC98F}
h1{font-family:S;font-weight:500;font-size:62px;line-height:1.04;letter-spacing:-.02em;margin-top:14px}
.ph{margin-top:26px;font-weight:700;font-size:40px;color:#FFC98F;letter-spacing:-.01em}
.r{position:relative;background:url(${f('src/assets/photos/')}${p.photo}) ${p.pos}/cover}
.fact{margin-top:10px;font-size:22px;color:#C7AE95}
</style></head><body><div class="l">${logo}<p class="k">${p.kicker}</p><h1>${p.title}</h1><p class="ph">057 000 24 24</p><p class="fact">${p.fact}</p></div>
<div class="r"></div></body></html>`;
(async () => {
  fs.mkdirSync(path.join(root, 'public/og'), { recursive: true });
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1200, height: 630 } });
  for (const p of pages) {
    const tmp = path.join(os.tmpdir(), `khvist-og-${p.slug}.html`); // file:// assets load only from a file:// page
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
    await pg.screenshot({ path: path.join(root, 'public', name) });
  }
  await b.close();
})();
