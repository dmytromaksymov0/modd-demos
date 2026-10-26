// Portfolio render — presentation images, videos, AVIF/WebP and manifest from portfolio/raw/.
// Run after `npm run capture`:  npm run render            (all)
//                               npm run render -- vet      (one or more project keys; collage is rebuilt from what exists)
import { chromium, type Browser } from 'playwright';
import sharp from 'sharp';
import { mkdir, readFile, writeFile, rm, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const RAW = path.join(ROOT, 'raw');
const TPL = path.join(ROOT, 'templates');
const OUT_TPL = path.join(TPL, '.out');
const FINAL = path.join(ROOT, 'final');
const WEBP_MAX = 300 * 1024;

interface Project {
  key: string; title: string; domain: string; url: string;
  niche: { uk: string; en: string }; geo: { uk: string; en: string };
  headline: string; // lowercase — modd Display has lowercase glyphs only
  description: { uk: string; en: string };
  features: { uk: string; en: string }[];
  lighthouse: string;
  shots: { desktop: string; mobile: string; wide: [string, string, string]; detail: string; detailFit: 'contain' | 'top'; detailFeature: string; full: string };
  // cover framing: browser width (px) and how much of the 1440×900 desktop shot to show (CSS px from the top)
  cover?: { bw?: number; clip?: number };
}

const PROJECTS: Project[] = [
  {
    key: 'kestrel', title: 'Kestrel Roofing', domain: 'kestrel-roofing-co.pages.dev', url: 'https://kestrel-roofing-co.pages.dev',
    niche: { uk: 'покрівля', en: 'roofing' }, geo: { uk: 'Колумбус, США', en: 'Columbus, Ohio, USA' },
    headline: 'покрівля, яку спершу міряють, а потім рахують',
    description: {
      uk: 'Сайт покрівельної компанії з Огайо, де ціну даху видно ще до виїзду майстра, а страховий випадок розкладено по кроках.',
      en: 'A roofing contractor site from Ohio that shows the price of a new roof before anyone climbs a ladder and walks homeowners through an insurance claim step by step.',
    },
    features: [
      { uk: 'Калькулятор вартості даху з вибором уклону за фото реальних будинків', en: 'Roof cost calculator with pitch picked from photos of real houses' },
      { uk: 'Страховий випадок у три доріжки: ви, Kestrel, страхова', en: 'Insurance claim in three lanes: you, Kestrel, the insurer' },
      { uk: 'День заміни даху погодинно — від 7:00 до 17:30', en: 'Replacement day hour by hour, 7:00 to 5:30' },
      { uk: 'Заявка у два кроки з перевіркою ZIP-коду', en: 'Two-step lead form with live ZIP check' },
    ],
    lighthouse: '96–100',
    shots: {
      desktop: 'kestrel/desktop-home-fold.png', mobile: 'kestrel/mobile-home-fold.png',
      wide: ['kestrel/mobile-home-fold.png', 'kestrel/mobile-roof-cost-calculator-fold.png', 'kestrel/mobile-storm-damage-fold.png'],
      detail: 'kestrel/desktop-roof-cost-calculator-calculator-filled.png', detailFit: 'contain', detailFeature: 'калькулятор вартості даху',
      full: 'kestrel/desktop-home-full.png',
    },
    cover: { clip: 790 }, // hero content ends at ~760px; below it the 1440×900 fold is empty background
  },
  {
    key: 'brightwater', title: 'Brightwater Family Dental', domain: 'brightwater-dental-ba5.pages.dev', url: 'https://brightwater-dental-ba5.pages.dev',
    niche: { uk: 'стоматологія', en: 'family dentistry' }, geo: { uk: 'Остін, США', en: 'Austin, Texas, USA' },
    headline: 'стоматологія за сімейним розкладом',
    description: {
      uk: 'Сайт сімейної стоматології з Техасу, де всю родину записують одним заходом, а страховку перевіряють із відповіддю в доларах.',
      en: 'A family dental practice site from Texas that books the whole family in one go and answers “am I covered?” in dollars.',
    },
    features: [
      { uk: 'Запис усієї родини: крісла поруч, один набір контактів', en: 'Whole-family booking: chairs side by side, one set of contacts' },
      { uk: 'Перевірка страховки з відповіддю в доларах', en: 'Insurance check that answers in dollars' },
      { uk: 'План комфорту для тих, хто боїться стоматолога', en: 'Comfort plan for anxious patients' },
      { uk: 'Тріаж невідкладних випадків', en: 'Emergency triage' },
    ],
    lighthouse: '97–100',
    shots: {
      desktop: 'brightwater/desktop-home-fold.png', mobile: 'brightwater/mobile-home-fold.png',
      wide: ['brightwater/mobile-home-fold.png', 'brightwater/mobile-book-fold.png', 'brightwater/mobile-emergency-dentist-fold.png'],
      detail: 'brightwater/desktop-insurance-financing-insurance-result.png', detailFit: 'contain', detailFeature: 'перевірка страховки',
      full: 'brightwater/desktop-home-full.png',
    },
  },
  {
    key: 'tork', title: 'ТОРК Автосервіс', domain: 'tork-avtoservis.pages.dev', url: 'https://tork-avtoservis.pages.dev',
    niche: { uk: 'автосервіс', en: 'car service' }, geo: { uk: 'Харків', en: 'Kharkiv, Ukraine' },
    headline: 'автосервіс без сюрпризів у чеку',
    description: {
      uk: 'Сайт харківського СТО в мові конструктивізму Держпрому, де кошторис погоджують у чаті з майстром, а ціну видно до візиту.',
      en: 'A Kharkiv car service site in the language of Derzhprom constructivism, where the estimate is approved in a chat with the mechanic and the price is known before the visit.',
    },
    features: [
      { uk: 'Ремонт у чаті з інтерактивним кошторисом', en: 'Repair-in-chat with an interactive estimate' },
      { uk: 'Калькулятор: клас авто × роботи → сума й час', en: 'Calculator: car class × jobs → price and time' },
      { uk: 'Фасад-сітка в дусі харківського конструктивізму', en: 'Facade grid inspired by Kharkiv constructivism' },
      { uk: 'Ціни за класами авто — від Lanos до Land Cruiser', en: 'Prices by car class, from Lanos to Land Cruiser' },
    ],
    lighthouse: '96–100',
    shots: {
      desktop: 'tork/desktop-home-fold.png', mobile: 'tork/mobile-home-fold.png',
      wide: ['tork/mobile-home-fold.png', 'tork/mobile-kalkulyator-fold.png', 'tork/mobile-tsiny-fold.png'],
      detail: 'tork/desktop-kalkulyator-calculator-filled.png', detailFit: 'contain', detailFeature: 'калькулятор: клас авто × роботи',
      full: 'tork/desktop-home-full.png',
    },
  },
  {
    key: 'vet', title: 'Ветклініка «Хвіст»', domain: 'vet-khvist.pages.dev', url: 'https://vet-khvist.pages.dev',
    niche: { uk: 'ветклініка 24/7', en: '24/7 vet clinic' }, geo: { uk: 'Харків', en: 'Kharkiv, Ukraine' },
    headline: 'ветклініка, де світло горить цілодобово',
    description: {
      uk: 'Сайт цілодобової ветклініки, який удень, уночі й у комендантську годину показує різне — і допомагає вирішити, чи їхати зараз.',
      en: 'A 24/7 vet clinic site that changes by day, night and curfew hours and helps owners decide whether to come in right now.',
    },
    features: [
      { uk: 'Сайт перебудовується вдень, уночі й у комендантську годину', en: 'The site rebuilds itself for day, night and curfew' },
      { uk: '«Чи терміново?» — червоні прапорці першими', en: '“Is it urgent?” triage with red flags first' },
      { uk: 'Календар турботи на рік із нагадуваннями в Telegram', en: 'Year-long care calendar with Telegram reminders' },
      { uk: 'Ціни «все включено» без «без урахування наркозу»', en: 'All-inclusive prices, anaesthesia included' },
    ],
    lighthouse: '100',
    shots: {
      desktop: 'vet/desktop-home-night.png', mobile: 'vet/mobile-home-fold.png',
      wide: ['vet/mobile-home-fold.png', 'vet/mobile-home-night.png', 'vet/mobile-nevidkladna-fold.png'],
      detail: 'vet/desktop-home-triage-go-now.png', detailFit: 'contain', detailFeature: 'тріаж «Чи терміново?»',
      full: 'vet/desktop-home-full.png',
    },
    cover: { bw: 1148, clip: 870 }, // the "Планово" door runs to the right edge: no overlap at all
  },
  {
    key: 'vyshnia', title: 'Вишня, студія краси', domain: 'vyshnia-beauty.pages.dev', url: 'https://vyshnia-beauty.pages.dev',
    niche: { uk: 'студія краси', en: 'beauty studio' }, geo: { uk: 'Харків', en: 'Kharkiv, Ukraine' },
    headline: 'запис за чотири кроки — і гарантія 21 день',
    description: {
      uk: 'Сайт студії манікюру, брів і вій, де запис за чотири кроки стоїть на першому екрані, а дату гарантії видно до підтвердження.',
      en: 'A nail, brow and lash studio site with four-step booking on the first screen and the coating guarantee date shown before you confirm.',
    },
    features: [
      { uk: 'Запис за 4 кроки на першому екрані з ціною й датою гарантії', en: '4-step booking on the first screen with price and guarantee date' },
      { uk: '«Хочу так само» — робота підставляє послугу, колір і майстриню', en: '“I want this one” — a work pre-fills service, colour and artist' },
      { uk: 'Стерильність як ритуал: пакет відкривають при вас', en: 'Sterility as a ritual: the pouch is opened in front of you' },
      { uk: 'Конструктор подарункового сертифіката з живим превʼю', en: 'Gift certificate builder with live preview' },
    ],
    lighthouse: '100',
    shots: {
      desktop: 'vyshnia/desktop-home-fold.png', mobile: 'vyshnia/mobile-home-fold.png',
      wide: ['vyshnia/mobile-home-fold.png', 'vyshnia/mobile-roboty-fold.png', 'vyshnia/mobile-sertyfikaty-fold.png'],
      detail: 'vyshnia/desktop-zapys-booking-summary.png', detailFit: 'contain', detailFeature: 'запис за 4 кроки',
      full: 'vyshnia/desktop-home-full.png',
    },
  },
];

const FORMATS = {
  cover: { w: 1600, h: 1000 },
  wide: { w: 2400, h: 1200 },
  detail: { w: 1600, h: 1000 },
  scroll: { w: 1600, h: 0 }, // height from the screenshot
  og: { w: 1200, h: 630 },
  thumb: { w: 800, h: 600 },
} as const;
type Format = keyof typeof FORMATS;

const fileUrl = (rel: string) => 'file://' + path.join(RAW, rel);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

async function topColor(rel: string): Promise<string> {
  const { data } = await sharp(path.join(RAW, rel)).extract({ left: 0, top: 0, width: 40, height: 6 }).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
  return `rgb(${data[0]},${data[1]},${data[2]})`;
}

function fill(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : `{{${k}}}`));
}

async function renderHtml(browser: Browser, name: string, html: string, w: number, h: number, out: string) {
  await mkdir(OUT_TPL, { recursive: true });
  const file = path.join(OUT_TPL, name + '.html');
  // templates reference base.css and brand/ relative to templates/, not templates/.out/
  await writeFile(file, html.replace('<head>', `<head><base href="file://${TPL}/">`));
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto('file://' + file, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })))));
  const left = await page.evaluate(() => (document.body.innerText.match(/\{\{\w+\}\}/g) || []).join(','));
  if (left) throw new Error(`${name}: unfilled ${left}`);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: w, height: h } });
  await page.close();
}

async function exportVariants(png: string) {
  const base = png.replace(/\.png$/, '');
  await sharp(png).avif({ quality: 55, effort: 5 }).toFile(base + '.avif');
  const meta = await sharp(png).metadata();
  let width = meta.width!;
  for (;;) {
    for (const q of [82, 74, 66, 58, 50, 42]) {
      const buf = await sharp(png).resize({ width, withoutEnlargement: true }).webp({ quality: q, effort: 5 }).toBuffer();
      if (buf.length <= WEBP_MAX) { await writeFile(base + '.webp', buf); return { q, width }; }
    }
    width = Math.round(width * 0.85);
  }
}

function video(fullPng: string, out: string) {
  // smooth eased scroll of the full home page: 1280×800 window, 10 s, no audio
  const T = 10;
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-loop', '1', '-framerate', '25', '-t', String(T), '-i', fullPng,
    '-vf', `scale=1280:-2:flags=lanczos,crop=1280:800:0:'(ih-800)*(1-cos(PI*min(max(t-0.6,0),${T - 1.2})/${T - 1.2}))/2',format=yuv420p`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '34', '-r', '25', '-tune', 'stillimage', '-movflags', '+faststart', '-an', out,
  ]);
}

// cover layout: browser at left 80/top 72, phone 288 wide at right 80 (left edge x=1232).
// Default browser width 1180 → the phone overlaps only its outer 28px (page margin, never content).
function coverGeometry(p: Project) {
  const bw = p.cover?.bw ?? 1180, clip = p.cover?.clip ?? 900;
  const vh = Math.round((clip * (bw - 2)) / 1440);
  const browserBottom = 72 + 44 + vh;
  const phoneH = 20 + 34 + Math.round((268 * 844) / 390);
  const pt = Math.min(1000 - 36 - phoneH, browserBottom + 56 - phoneH); // sits low, overhanging the browser's bottom edge
  return { bw: String(bw), vh: String(vh), pt: String(pt) };
}

async function renderProject(browser: Browser, p: Project, tpls: Record<string, string>) {
  const dir = path.join(FINAL, p.key);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const common = { title: esc(p.title), niche: esc(p.niche.uk), geo: esc(p.geo.uk), domain: p.domain, headline: esc(p.headline) };
  const s = p.shots;
  for (const rel of [s.desktop, s.mobile, s.detail, s.full, ...s.wide]) if (!existsSync(path.join(RAW, rel))) throw new Error(`missing raw shot ${rel}`);

  const vars: Record<Format, Record<string, string>> = {
    cover: { ...common, desktop: fileUrl(s.desktop), mobile: fileUrl(s.mobile), mobile_bg: await topColor(s.mobile), ...coverGeometry(p) },
    wide: { ...common, m1: fileUrl(s.wide[0]), m2: fileUrl(s.wide[1]), m3: fileUrl(s.wide[2]),
      m1_bg: await topColor(s.wide[0]), m2_bg: await topColor(s.wide[1]), m3_bg: await topColor(s.wide[2]) },
    detail: { ...common, img: fileUrl(s.detail), fit: s.detailFit, feature: esc(s.detailFeature) },
    scroll: { ...common, full: fileUrl(s.full), height: '0' },
    og: { ...common, desktop: fileUrl(s.desktop) },
    thumb: { ...common, desktop: fileUrl(s.desktop), mobile: fileUrl(s.mobile), mobile_bg: await topColor(s.mobile) },
  };
  // scroll: browser inner width 1440 → page height = bar + scaled screenshot + margins
  const fm = await sharp(path.join(RAW, s.full)).metadata();
  const scrollH = 80 + 44 + Math.round((fm.height! * 1438) / fm.width!) + 2 + 112;
  vars.scroll.height = String(scrollH);

  const files: Record<string, { png: string; avif: string; webp: string; width: number; height: number }> = {};
  for (const f of Object.keys(FORMATS) as Format[]) {
    const w = FORMATS[f].w, h = f === 'scroll' ? scrollH : FORMATS[f].h;
    const png = path.join(dir, `${p.key}-${f}.png`);
    await renderHtml(browser, `${p.key}-${f}`, fill(tpls[f], vars[f]), w, h, png);
    await exportVariants(png);
    const rel = (ext: string) => path.relative(ROOT, png.replace(/\.png$/, ext));
    files[f] = { png: rel('.png'), avif: rel('.avif'), webp: rel('.webp'), width: w, height: h };
    console.log(`✓ ${p.key}/${f} ${w}×${h}`);
  }
  let videoFile: string | null = null;
  try {
    const mp4 = path.join(dir, `${p.key}-scroll.mp4`);
    video(path.join(RAW, s.full), mp4);
    videoFile = path.relative(ROOT, mp4);
    console.log(`✓ ${p.key}/video ${((await stat(mp4)).size / 1024 / 1024).toFixed(2)} MB`);
  } catch (e) { console.log(`✗ ${p.key}/video: ${(e as Error).message.split('\n')[0]}`); }
  return { files, videoFile };
}

async function renderCollage(browser: Browser, tpl: string) {
  const order = ['tork', 'vet', 'vyshnia', 'kestrel', 'brightwater'];
  const ps = order.map((k) => PROJECTS.find((p) => p.key === k)!);
  const browsers = await Promise.all(ps.map(async (p, i) => `
    <div class="browser b${i + 1}" style="${p.cover?.clip ? `height:${34 + Math.round(([960, 520, 520, 700, 780][i] * p.cover.clip) / 1440)}px` : ''}"><div class="bar"><div class="dots"><i></i><i></i><i></i></div><div class="url">${p.domain}</div><div class="dots-right"></div></div>
    <div class="view fill" style="height:calc(100% - 34px)"><img src="${fileUrl(p.shots.desktop)}" style="object-view-box: inset(0 0 ${(100 - ((p.cover?.clip ?? 900) / 900) * 100).toFixed(2)}% 0)" alt=""></div></div>`));
  const list = ps.map((p) => `<li><span class="tab"></span><span><b>${esc(p.title)}</b></span><span>${esc(p.niche.uk)} · ${esc(p.geo.uk)}</span></li>`).join('');
  const phone = PROJECTS.find((p) => p.key === 'vyshnia')!.shots.mobile;
  const png = path.join(FINAL, 'modd-collage.png');
  await renderHtml(browser, 'collage', fill(tpl, { browsers: browsers.join(''), list, phone: fileUrl(phone), phone_bg: await topColor(phone) }), 2400, 1400, png);
  await exportVariants(png);
  console.log('✓ collage 2400×1400');
  return { png: path.relative(ROOT, png), avif: path.relative(ROOT, png.replace(/png$/, 'avif')), webp: path.relative(ROOT, png.replace(/png$/, 'webp')), width: 2400, height: 1400 };
}

function alt(p: Project, f: Format | 'collage' | 'video'): { uk: string; en: string } {
  const t = p.title;
  const m: Record<string, { uk: string; en: string }> = {
    cover: { uk: `${t}: головна сторінка в браузері й на телефоні`, en: `${t}: home page in a browser window and on a phone` },
    wide: { uk: `${t}: три мобільні екрани поруч`, en: `${t}: three mobile screens side by side` },
    detail: { uk: `${t}: ${p.shots.detailFeature}, крупним планом`, en: `${t}: close-up of ${p.features[0].en.toLowerCase()}` },
    scroll: { uk: `${t}: головна сторінка повністю`, en: `${t}: the full home page` },
    og: { uk: `${t} — ${p.headline}`, en: `${t} — ${p.description.en}` },
    thumb: { uk: `${t}: мініатюра проєкту`, en: `${t}: project thumbnail` },
    video: { uk: `${t}: прокрутка головної сторінки`, en: `${t}: scrolling through the home page` },
  };
  return m[f];
}

async function main() {
  const only = process.argv.slice(2);
  const list = only.length ? PROJECTS.filter((p) => only.includes(p.key)) : PROJECTS;
  const tpls: Record<string, string> = {};
  for (const f of [...Object.keys(FORMATS), 'collage']) tpls[f] = await readFile(path.join(TPL, `${f}.html`), 'utf8');
  await mkdir(FINAL, { recursive: true });
  const browser = await chromium.launch();
  const results: Record<string, Awaited<ReturnType<typeof renderProject>>> = {};
  for (const p of list) results[p.key] = await renderProject(browser, p, tpls);
  const collage = await renderCollage(browser, tpls.collage);
  await browser.close();
  await rm(OUT_TPL, { recursive: true, force: true });

  // manifest: merge with previous when re-rendering a subset
  const mPath = path.join(ROOT, 'manifest.json');
  let prev: any = { projects: [] };
  try { prev = JSON.parse(await readFile(mPath, 'utf8')); } catch {}
  const projects = PROJECTS.map((p) => {
    const r = results[p.key];
    if (!r) return prev.projects.find((x: any) => x.key === p.key) ?? null;
    return {
      key: p.key, title: p.title, url: p.url, niche: p.niche, geo: p.geo,
      description: p.description, features: p.features, lighthouse_mobile: p.lighthouse,
      images: Object.fromEntries(Object.entries(r.files).map(([f, v]) => [f, { ...v, alt: alt(p, f as Format) }])),
      video: r.videoFile ? { mp4: r.videoFile, alt: alt(p, 'video') } : null,
    };
  }).filter(Boolean);
  const manifest = {
    studio: 'modd.', generated: new Date().toISOString().slice(0, 10),
    collage: { ...collage, alt: { uk: 'П’ять сайтів студії modd. в одному колажі', en: 'Five modd. websites in one collage' } },
    section: { title: { uk: 'Роботи', en: 'Work' }, note: { uk: 'Частина проєктів — власні розробки студії під нішу.', en: 'Some projects are the studio’s own builds for a niche.' } },
    projects,
  };
  await writeFile(mPath, JSON.stringify(manifest, null, 2));
  await writeFile(path.join(FINAL, 'index.html'), gallery(manifest));
  console.log('→ portfolio/final/index.html, portfolio/manifest.json');
}

function gallery(m: any): string {
  const rel = (p: string) => path.relative('final', p);
  const card = (label: string, img: any) => `<figure${img.width > img.height * 2 ? ' class="span"' : ''}><a href="${rel(img.png)}" target="_blank"><img src="${rel(img.webp)}" alt="${esc(img.alt.uk)}" loading="lazy"></a><figcaption><b>${label}</b> ${img.width}×${img.height}</figcaption></figure>`;
  const proj = m.projects.map((p: any) => `
    <section><h2>${esc(p.title)} <small>${esc(p.niche.uk)} · ${esc(p.geo.uk)} · <a href="${p.url}">${p.url.replace('https://', '')}</a></small></h2>
    <p>${esc(p.description.uk)}</p>
    <div class="grid">${['cover', 'wide', 'detail', 'og', 'thumb'].map((f) => card(f, p.images[f])).join('')}
    ${p.video ? `<figure><video src="${rel(p.video.mp4)}" muted loop autoplay playsinline></video><figcaption><b>video</b> 1280×800 · 10 s</figcaption></figure>` : ''}
    </div>
    <details><summary>scroll — головна повністю</summary><img class="scroll" src="${rel(p.images.scroll.webp)}" alt="${esc(p.images.scroll.alt.uk)}" loading="lazy"></details></section>`).join('');
  return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>modd. portfolio — final</title>
<style>
:root{color-scheme:light dark;--bg:#F3F5F7;--fg:#1B1E24;--muted:#565C66;--card:#fff;--line:#D5D9DF}
@media (prefers-color-scheme:dark){:root{--bg:#15171b;--fg:#EEF0F2;--muted:#9aa0a8;--card:#1d2026;--line:#2b2f36}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif;padding:32px 16px 80px;max-width:1440px;margin-inline:auto}
h1{font-size:26px;margin:0}h2{font-size:20px;margin:56px 0 4px}h2 small{font-weight:400;color:var(--muted);font-size:14px;margin-left:8px}a{color:inherit}
p{color:var(--muted);margin:0 0 16px;max-width:70ch}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;align-items:start}
figure{margin:0;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden}figure.span{grid-column:span 2}
figure img,figure video{display:block;width:100%;height:auto}figcaption{padding:8px 12px;font-size:13px;color:var(--muted)}figcaption b{color:var(--fg)}
details{margin-top:16px}summary{cursor:pointer;color:var(--muted)}img.scroll{display:block;width:100%;max-width:800px;margin-top:12px;border-radius:8px}
.collage img{width:100%;border-radius:10px;border:1px solid var(--line);margin-top:20px}
@media (max-width:700px){figure.span{grid-column:auto}}
</style></head><body><h1>modd. — роботи</h1><p>5 проєктів · формати cover, wide, detail, scroll, og, thumb + відео · PNG-оригінали, AVIF і WebP поруч · manifest.json</p>
<div class="collage"><a href="${rel(m.collage.png)}" target="_blank"><img src="${rel(m.collage.webp)}" alt="${esc(m.collage.alt.uk)}"></a></div>${proj}<p style="margin-top:48px;font-size:13px">${esc(m.section.note.uk)}</p></body></html>`;
}

main().catch((e) => { console.error(e); process.exit(1); });
