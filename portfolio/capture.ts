// Portfolio capture — clean screenshots of the five live modd. demo sites.
// Run: npm run capture            (all projects)
//      npm run capture -- vet     (one or more project keys)
// Output: portfolio/raw/<project>/<device>-<page>-<state>.png + raw/index.html + raw/report.json
import { chromium, type Browser, type Page, type Locator } from 'playwright';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

type Device = 'desktop' | 'mobile';
type Mode = 'fold' | 'full' | 'crop';
type Step = (p: Page) => Promise<void>;

interface Shot {
  device: Device;
  page: string; // URL path, e.g. "/" or "/book/?crew=family"
  name: string; // slug for the file name ("home", "book")
  state: string; // "fold", "full", "crop-warranty", "insurance-result"…
  mode: Mode;
  crop?: string; // selector for mode "crop"
  at?: string; // ISO time the page clock is frozen to (overrides project default)
  steps?: Step[];
  cropUntil?: string; // crop ends at the bottom of this element; "sel@n" picks the n-th match (0-based)
}

interface Project {
  key: string;
  title: string;
  base: string;
  at: string; // default frozen time (local business hours, Thursday 22 Oct 2026)
  shots: Shot[];
}

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const RAW = path.join(ROOT, 'raw');
const VIEW: Record<Device, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};
const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

// ---------- interaction helpers (same data on every run) ----------
const pick = (scope: string, name: string, value: string): Step => async (p) => {
  const el = p.locator(`${scope} input[name="${name}"][value="${value}"]`).first();
  try {
    await el.check({ force: true, timeout: 3000 });
  } catch {
    await el.evaluate((n: HTMLInputElement) => {
      n.checked = true;
      n.dispatchEvent(new Event('input', { bubbles: true }));
      n.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
};
const click = (sel: string, nth = 0): Step => async (p) => {
  const el = p.locator(sel).nth(nth);
  await el.scrollIntoViewIfNeeded({ timeout: 5000 });
  await el.click({ timeout: 5000 });
};
const clickText = (scope: string, text: string | RegExp): Step => async (p) => {
  const el = p.locator(scope).getByRole('button', { name: text }).first();
  await el.scrollIntoViewIfNeeded({ timeout: 5000 });
  try { await el.click({ timeout: 4000 }); } catch { await el.click({ force: true, timeout: 4000 }); }
};
// nth enabled radio of a group (calendar days, time slots)
const pickEnabled = (scope: string, name: string, nth = 0): Step => async (p) => {
  const el = p.locator(`${scope} input${name === '*' ? '[type="radio"]' : `[name="${name}"]`}:not([disabled])`).nth(nth);
  try { await el.check({ force: true, timeout: 3000 }); } catch {
    await el.evaluate((n: HTMLInputElement) => { n.checked = true; n.dispatchEvent(new Event('input', { bubbles: true })); n.dispatchEvent(new Event('change', { bubbles: true })); });
  }
};
const fill = (sel: string, value: string): Step => async (p) => {
  await p.locator(sel).first().fill(value, { timeout: 5000 });
};
const select = (sel: string, value: string): Step => async (p) => {
  await p.locator(sel).first().selectOption(value, { timeout: 5000 });
};
const wait = (ms: number): Step => async (p) => p.waitForTimeout(ms);
// presentation-only CSS for a single shot (never changes content)
const css = (rules: string): Step => async (p) => { await p.addStyleTag({ content: rules }); };
// submit a form the way a user would (Enter), without depending on button hit-testing
const submit = (sel: string): Step => async (p) => {
  await p.locator(sel).first().evaluate((f: HTMLFormElement) => f.requestSubmit());
};
// first enabled button inside a container (calendar days, time slots)
const clickEnabled = (scope: string, nth = 0): Step => async (p) => {
  const el = p.locator(`${scope} button:not([disabled]):not([aria-disabled="true"])`).nth(nth);
  await el.scrollIntoViewIfNeeded({ timeout: 5000 });
  await el.click({ timeout: 5000 });
};

const fold = (device: Device, page: string, name: string, extra: Partial<Shot> = {}): Shot => ({
  device, page, name, state: 'fold', mode: 'fold', ...extra,
});
const crop = (device: Device, page: string, name: string, state: string, sel: string, extra: Partial<Shot> = {}): Shot => ({
  device, page, name, state, mode: 'crop', crop: sel, ...extra,
});
const full = (page: string, name: string): Shot => ({ device: 'desktop', page, name, state: 'full', mode: 'full' });
const both = (make: (d: Device) => Shot): Shot[] => [make('desktop'), make('mobile')];

// ---------- projects ----------
const kestrelHeroSteps: Step[] = [
  pick('#hero-form', 'problem', 'storm'),
  fill('#hero-form input[name="zip"]', '43026'),
  wait(300),
  clickText('#hero-form', /Next/),
  fill('#hero-form input[name="name"]', 'Karen Miller'),
  fill('#hero-form input[name="phone"]', '(614) 555-0147'),
];

const PROJECTS: Project[] = [
  {
    key: 'kestrel',
    title: 'Kestrel Roofing',
    base: 'https://kestrel-roofing-co.pages.dev',
    at: '2026-10-22T10:30:00-04:00',
    shots: [
      ...['/', '/roof-replacement/', '/storm-damage/', '/roof-cost-calculator/', '/projects/', '/about/', '/free-inspection/'].map((u) =>
        fold('desktop', u, slug(u))),
      full('/', 'home'),
      fold('mobile', '/', 'home'),
      fold('mobile', '/roof-cost-calculator/', 'roof-cost-calculator'),
      fold('mobile', '/storm-damage/', 'storm-damage'),
      // interactive states
      ...both((d) => crop(d, '/', 'home', 'lead-form-step2', '#hero-form', { steps: kestrelHeroSteps })),
      ...both((d) => crop(d, '/roof-cost-calculator/', 'roof-cost-calculator', 'calculator-filled', '[data-calc]', {
        steps: [pick('[data-calc]', 'c-stories', '2'), pick('[data-calc]', 'c-pitch', '8'), pick('[data-calc]', 'c-material', 'metal'), wait(300)],
      })),
      ...both((d) => crop(d, '/', 'home', 'day-timeline', '[data-day]')),
      ...both((d) => crop(d, '/storm-damage/', 'storm-damage', 'insurance-lanes-step3', '[data-lanes]', {
        steps: [click('[data-lane-tabs] [role="tab"], [data-lane-tabs] button', 2), wait(300)],
      })),
      ...both((d) => crop(d, '/projects/', 'projects', 'filter-storm', '[data-filter-root]', {
        steps: [click('[data-filter="storm"]'), wait(300)],
      })),
      ...both((d) => fold(d, '/thanks/', 'thanks', { state: 'success' })),
      // strong sections
      crop('desktop', '/', 'home', 'crop-hero', '[data-hero]'),
      crop('desktop', '/', 'home', 'crop-warranty', 'section[aria-labelledby="warranty-title"]'),
      crop('desktop', '/', 'home', 'crop-honest-price', 'section[aria-labelledby="price-title"]'),
      crop('desktop', '/', 'home', 'crop-proof', 'section[aria-labelledby="proof-title"]'),
    ],
  },
  {
    key: 'brightwater',
    title: 'Brightwater Family Dental',
    base: 'https://brightwater-dental-ba5.pages.dev',
    at: '2026-10-22T10:30:00-05:00',
    shots: [
      ...['/', '/new-patients/', '/services/', '/services/same-day-crowns/', '/services/emergency-dentist/', '/insurance-financing/', '/team/', '/book/'].map((u) =>
        fold('desktop', u, slug(u))),
      full('/', 'home'),
      fold('mobile', '/', 'home'),
      fold('mobile', '/book/', 'book'),
      fold('mobile', '/services/emergency-dentist/', 'emergency-dentist'),
      ...both((d) => crop(d, '/book/?crew=family', 'book', 'family-booking', '[data-book]', {
        steps: [
          fill('input[name="p0_name"]', 'Sam'), select('select[name="p0_visit"]', 'cleaning'),
          fill('input[name="p1_name"]', 'Leo'), select('select[name="p1_visit"]', 'kids'),
          fill('input[name="p2_name"]', 'Mia'), select('select[name="p2_visit"]', 'kids'),
          clickEnabled('[data-days]', 2), wait(300), clickEnabled('[data-times]', 0), wait(300),
          pick('[data-book]', 'comfort', 'sounds'), pick('[data-book]', 'comfort', 'needles'),
          select('select[name="carrier"]', 'delta'), select('select[name="plan"]', 'ppo'), wait(300),
        ],
      })),
      ...both((d) => crop(d, '/insurance-financing/', 'insurance-financing', 'insurance-result', '[data-insurance]', {
        steps: [select('[data-insurance] select[name="carrier"]', 'delta'), pick('[data-insurance]', 'plan', 'ppo'), submit('form[data-insurance]'), wait(500)],
      })),
      ...both((d) => crop(d, '/insurance-financing/', 'insurance-financing', 'plan-calculator-family4', '[data-plan-calc]', {
        steps: [click('[data-step="adults:1"]'), click('[data-step="kids:1"]'), click('[data-step="kids:1"]'), wait(300)],
      })),
      ...both((d) => crop(d, '/services/emergency-dentist/', 'emergency-dentist', 'triage-knocked-out', 'section[aria-labelledby="triage-h"]', {
        steps: [pick('[data-triage]', 'symptom', 'knocked'), pick('[data-triage]', 'airway', 'no'), pick('[data-triage]', 'fever', 'no'), wait(400)],
      })),
      ...both((d) => fold(d, '/thanks/?d=2026-10-24&t=9:00%20am&n=3', 'thanks', { state: 'success' })),
      crop('desktop', '/', 'home', 'crop-hero', '[data-hero]'),
      crop('desktop', '/', 'home', 'crop-family-lanes', 'section[aria-labelledby="family-h"]'),
      crop('desktop', '/', 'home', 'crop-comfort', 'section[aria-labelledby="comfort-h"]'),
      crop('desktop', '/', 'home', 'crop-team', 'section[aria-labelledby="team-h"]'),
      crop('desktop', '/new-patients/', 'new-patients', 'crop-first-hour', 'section[aria-labelledby="hour-h"]'),
    ],
  },
  {
    key: 'tork',
    title: 'ТОРК Автосервіс',
    base: 'https://tork-avtoservis.pages.dev',
    at: '2026-10-22T14:20:00+03:00',
    shots: [
      ...['/', '/poslugy/', '/poslugy/khodova/', '/kalkulyator/', '/yak-my-pratsyuyemo/', '/tsiny/', '/kontakty/'].map((u) =>
        fold('desktop', u, slug(u))),
      full('/', 'home'),
      fold('mobile', '/', 'home'),
      fold('mobile', '/kalkulyator/', 'kalkulyator'),
      fold('mobile', '/tsiny/', 'tsiny'),
      ...both((d) => crop(d, '/', 'home', 'estimate-approved', '#chat', {
        steps: [pick('[data-estimate]', 'est-discs', 'later'), wait(200), click('[data-approve]'), wait(400)],
      })),
      ...both((d) => crop(d, '/kalkulyator/?klas=C&robota=pads-front&robota=discs-front&robota=oil', 'kalkulyator', 'calculator-filled', '[data-calc]', {
        // desktop: stop after the "3 · Ходова" block so the dark result panel is not mostly empty
        steps: [wait(600)], ...(d === 'desktop' ? { cropUntil: '[data-calc] fieldset@2' } : {}),
      })),
      ...both((d) => crop(d, '/poslugy/', 'poslugy', 'finder-symptom', '[data-finder]', {
        steps: [fill('[data-finder-input]', 'скрипить при гальмуванні'), wait(400)],
      })),
      ...both((d) => fold(d, '/dyakuyemo/?kanal=telegram', 'dyakuyemo', { state: 'success' })),
      crop('desktop', '/', 'home', 'crop-hero', '[data-hero]'),
      crop('desktop', '/', 'home', 'crop-services', '#poslugy'),
      crop('desktop', '/', 'home', 'crop-masters', '#maistry'),
      crop('desktop', '/kontakty/', 'kontakty', 'crop-route', 'section:has(svg)'),
    ],
  },
  {
    key: 'vet',
    title: 'Ветклініка «Хвіст»',
    base: 'https://vet-khvist.pages.dev',
    at: '2026-10-22T14:20:00+03:00',
    shots: [
      ...['/', '/nevidkladna/', '/poslugy/', '/poslugy/khirurhiya/', '/tsiny/', '/likari/', '/klub/', '/zapys/'].map((u) =>
        fold('desktop', u, slug(u))),
      fold('desktop', '/?t=night', 'home', { state: 'night', at: '2026-10-22T23:40:00+03:00' }),
      fold('desktop', '/?t=curfew', 'home', { state: 'curfew', at: '2026-10-23T02:47:00+03:00' }),
      full('/', 'home'),
      fold('mobile', '/', 'home'),
      fold('mobile', '/?t=night', 'home', { state: 'night', at: '2026-10-22T23:40:00+03:00' }),
      fold('mobile', '/nevidkladna/', 'nevidkladna'),
      ...both((d) => crop(d, '/', 'home', 'triage-plan', '[data-triage]', {
        steps: [
          clickText('[data-triage]', /Нічого з цього немає/), wait(200),
          pick('[data-triage]', 'species', 'cat'), pick('[data-triage]', 'age', 'adult'),
          pick('[data-triage]', 'symptom', 'vomit'), pick('[data-triage]', 'symptom', 'diarrhea'), pick('[data-triage]', 'course', 'days'),
          clickText('[data-triage]', /Показати результат/), wait(400),
        ],
      })),
      ...both((d) => crop(d, '/', 'home', 'triage-go-now', '[data-triage]', {
        steps: [pick('[data-triage]', 'flag', 'urine'), clickText('[data-triage]', /Так, є/), wait(400)],
      })),
      ...both((d) => crop(d, '/', 'home', 'care-calendar-dog', '#klub', {
        steps: [pick('[data-care]', 'c-species', 'dog'), pick('[data-care]', 'c-age', 'young'), wait(400)],
      })),
      ...both((d) => crop(d, '/tsiny/', 'tsiny', 'prices-dog-25kg', 'section[aria-labelledby="t-prices"]', {
        steps: [pick('', 'vyd', 'pes'), pick('', 'w', '2'), wait(300)],
      })),
      ...both((d) => fold(d, '/dyakuyemo/?kanal=telegram', 'dyakuyemo', { state: 'success' })),
      crop('desktop', '/', 'home', 'crop-doors', 'main > section:first-of-type, [data-doors]'),
      crop('desktop', '/', 'home', 'crop-call-at-3', '#dzvinok'),
      crop('desktop', '/', 'home', 'crop-doctors', '#likari'),
      crop('desktop', '/likari/', 'likari', 'crop-duty', '#cherhovi'),
    ],
  },
  {
    key: 'vyshnia',
    title: 'Вишня, студія краси',
    base: 'https://vyshnia-beauty.pages.dev',
    at: '2026-10-22T14:20:00+03:00',
    shots: [
      ...['/', '/poslugy/', '/maistry/', '/roboty/', '/sterylnist/', '/sertyfikaty/', '/kontakty/', '/zapys/'].map((u) =>
        fold('desktop', u, slug(u))),
      full('/', 'home'),
      fold('mobile', '/', 'home'),
      fold('mobile', '/roboty/', 'roboty'),
      fold('mobile', '/sertyfikaty/', 'sertyfikaty'),
      ...both((d) => crop(d, '/zapys/', 'zapys', 'booking-summary', '#zapys', {
        steps: [
          pick('#zapys', 'posluga', 'mani-coat'), pick('#zapys', 'kolir', 'vyshnia'),
          clickText('#zapys', /Далі/), wait(300),
          pick('#zapys', 'maister', 'olena'), clickText('#zapys', /Далі/), wait(300),
          pickEnabled('#zapys [data-days]', 'data', 2), wait(500), pickEnabled('#zapys [data-slots]', '*', 1), wait(400),
        ],
      })),
      ...both((d) => crop(d, '/roboty/', 'roboty', 'filter-manicure-vyshnia', 'main', {
        steps: [pick('', 'g', 'manicure'), pick('', 'c', 'vyshnia'), wait(400)],
      })),
      ...both((d) => crop(d, '/sertyfikaty/', 'sertyfikaty', 'certificate-filled', '[data-cert]', {
        steps: [
          pick('[data-cert]', 'nominal', '1500'), pick('[data-cert]', 'dyzain', 'pudra'),
          fill('[data-cert] input[name="komu"]', 'Мамі'), fill('[data-cert] input[name="vid"]', 'Каті'),
          fill('[data-cert] textarea[name="pobazhannia"]', 'З днем народження! Година тільки для себе.'), wait(400),
        ],
      })),
      ...both((d) => fold(d, '/zapysano/?posluga=mani-coat&maister=olena&kolir=vyshnia&data=2026-10-24&chas=12:30', 'zapysano', { state: 'success' })),
      crop('desktop', '/', 'home', 'crop-hero-booking', '#zapys'),
      crop('desktop', '/', 'home', 'crop-works', '#roboty'),
      crop('desktop', '/', 'home', 'crop-sterility', '#sterylnist'),
      crop('desktop', '/', 'home', 'crop-guarantee', '#harantiya'),
    ],
  },
];

function slug(u: string): string {
  const p = u.split('?')[0].replace(/^\/|\/$/g, '');
  return p === '' ? 'home' : p.replace(/\//g, '-');
}

// ---------- capture ----------
const NO_MOTION = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}
html{scroll-behavior:auto!important}
astro-dev-toolbar,#astro-dev-toolbar,[id*="cookie" i],[class*="cookie" i],[id*="consent" i],[class*="consent" i]{display:none!important}`;

interface Result {
  project: string; file: string; device: Device; page: string; state: string; mode: Mode;
  width?: number; height?: number; issues: string[];
}

async function settle(p: Page) {
  try { await p.waitForLoadState('networkidle', { timeout: 15000 }); } catch {}
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(800);
}

async function scrollThrough(p: Page) {
  await p.evaluate(async () => {
    const step = Math.max(300, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 300));
    window.scrollTo(0, 0);
  });
}

// visible <img> that did not load, inside an element or in the current viewport
async function brokenImages(el: Locator, viewportOnly = false): Promise<string[]> {
  return el.evaluate((root, vo) =>
    [...root.querySelectorAll('img')]
      .filter((i) => i.offsetParent !== null && !(i.complete && i.naturalWidth > 0))
      .filter((i) => {
        if (!vo) return true;
        const r = i.getBoundingClientRect();
        return r.right > 0 && r.left < innerWidth && (root !== document.body || (r.bottom > 0 && r.top < innerHeight));
      })
      .map((i) => i.currentSrc || i.src), viewportOnly).catch(() => []);
}

async function shoot(browser: Browser, proj: Project, s: Shot): Promise<Result> {
  const file = `${s.device}-${s.name}-${s.state}.png`;
  const out = path.join(RAW, proj.key, file);
  const issues: string[] = [];
  const ctx = await browser.newContext({
    viewport: VIEW[s.device],
    deviceScaleFactor: 2,
    isMobile: s.device === 'mobile',
    hasTouch: s.device === 'mobile',
    userAgent: s.device === 'mobile' ? MOBILE_UA : undefined,
    locale: proj.key === 'kestrel' || proj.key === 'brightwater' ? 'en-US' : 'uk-UA',
  });
  await ctx.clock.setFixedTime(new Date(s.at ?? proj.at));
  const p = await ctx.newPage();
  p.on('pageerror', (e) => issues.push(`pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') issues.push(`console: ${m.text().slice(0, 160)}`); });
  p.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('/api/')) issues.push(`http ${r.status()}: ${r.url()}`); });
  try {
    await p.goto(proj.base + s.page, { waitUntil: 'load', timeout: 30000 });
    await settle(p);
    await p.addStyleTag({ content: NO_MOTION });
    await scrollThrough(p);
    for (const [i, step] of (s.steps ?? []).entries()) {
      try { await step(p); } catch (e) { issues.push(`step ${i + 1} failed: ${(e as Error).message.split('\n')[0]}`); }
    }
    await settle(p);
    const hs = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (hs > 0) issues.push(`horizontal scroll ${hs}px`);

    if (s.mode === 'crop') {
      const el = p.locator(s.crop!).first();
      if ((await el.count()) === 0) throw new Error(`selector not found: ${s.crop}`);
      // hide fixed/sticky chrome outside the element so it never overlaps the crop
      await el.evaluate((target) => {
        for (const n of document.querySelectorAll<HTMLElement>('body *')) {
          const pos = getComputedStyle(n).position;
          if ((pos === 'fixed' || pos === 'sticky') && !target.contains(n) && !n.contains(target)) n.style.visibility = 'hidden';
        }
      });
      await el.scrollIntoViewIfNeeded();
      await p.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await p.waitForTimeout(300);
      (await brokenImages(el, true)).forEach((src) => issues.push(`image not loaded: ${src}`));
      // crop with breathing room around the element (absolute page coordinates)
      const box = await el.evaluate((n) => {
        const r = n.getBoundingClientRect();
        return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, pw: document.documentElement.scrollWidth, ph: document.documentElement.scrollHeight };
      });
      const pad = s.device === 'desktop' ? 40 : 16;
      // paint the padding with the page background so neighbouring sections never bleed into the crop,
      // and scroll the element to the top so sticky children sit where a reader would see them
      await el.evaluate((n, pd) => {
        const bg = getComputedStyle(document.body).backgroundColor || '#fff';
        const st = (n as HTMLElement).style;
        st.position = getComputedStyle(n).position === 'static' ? 'relative' : st.position;
        st.zIndex = '2147483000';
        st.boxShadow = `0 0 0 ${pd + 2}px ${bg}`;
        window.scrollTo(0, Math.max(0, n.getBoundingClientRect().top + scrollY - pd));
      }, pad);
      await p.waitForTimeout(250);
      const x = Math.max(0, box.x - pad), y = Math.max(0, box.y - pad);
      let bottom = box.y + box.h;
      if (s.cropUntil) {
        const until = await p.evaluate((sel) => {
          const [q, i] = sel.split('@');
          const n = document.querySelectorAll(q)[Number(i ?? 0)]; if (!n) return null;
          const r = n.getBoundingClientRect(); return r.bottom + scrollY;
        }, s.cropUntil);
        if (until) bottom = Math.min(bottom, until + 20 - pad); else issues.push(`cropUntil not found: ${s.cropUntil}`); // ends right under the block: no padding that would show the next headings
      }
      const w = Math.min(box.pw, box.x + box.w + pad) - x, h = Math.min(box.ph, bottom + pad) - y;
      await p.screenshot({ path: out, fullPage: true, clip: { x, y, width: w, height: h } });
    } else {
      await p.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo(0, 0); });
      await p.waitForTimeout(300);
      (await brokenImages(p.locator('body'), s.mode === 'fold')).forEach((src) => issues.push(`image not loaded: ${src}`));
      await p.screenshot({ path: out, fullPage: s.mode === 'full' });
    }
  } catch (e) {
    issues.push(`FAILED: ${(e as Error).message.split('\n')[0]}`);
  } finally {
    await ctx.close();
  }
  return { project: proj.key, file: `${proj.key}/${file}`, device: s.device, page: s.page, state: s.state, mode: s.mode, issues };
}

async function runProject(browser: Browser, proj: Project): Promise<Result[]> {
  await rm(path.join(RAW, proj.key), { recursive: true, force: true });
  await mkdir(path.join(RAW, proj.key), { recursive: true });
  const results: Result[] = [];
  for (const s of proj.shots) {
    const r = await shoot(browser, proj, s);
    results.push(r);
    console.log(`${r.issues.length ? '✗' : '✓'} ${r.file}${r.issues.length ? '  ← ' + r.issues.join(' · ') : ''}`);
  }
  return results;
}

function indexHtml(all: Result[]): string {
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const groups = PROJECTS.filter((p) => all.some((r) => r.project === p.key)).map((p) => {
    const cards = all.filter((r) => r.project === p.key).map((r) => `
      <figure class="${r.device}${r.issues.length ? ' bad' : ''}">
        <a href="${r.file}" target="_blank"><img src="${r.file}" loading="lazy" alt=""></a>
        <figcaption><b>${esc(r.file.split('/')[1])}</b><span>${r.device} · ${esc(r.page)} · ${r.mode}</span>${r.issues.map((i) => `<em>${esc(i)}</em>`).join('')}</figcaption>
      </figure>`).join('');
    return `<section><h2>${esc(p.title)} <small>${p.base.replace('https://', '')} · ${all.filter((r) => r.project === p.key).length} shots</small></h2><div class="grid">${cards}</div></section>`;
  }).join('');
  return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>modd. portfolio — raw</title><style>
:root{color-scheme:light dark;--bg:#f4f4f2;--fg:#151515;--muted:#6b6b6b;--card:#fff;--line:#e2e2de}
@media (prefers-color-scheme:dark){:root{--bg:#141414;--fg:#eee;--muted:#9a9a9a;--card:#1d1d1d;--line:#2c2c2c}}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.45 system-ui,-apple-system,sans-serif;padding:24px 16px 64px}
h1{font-size:22px;margin:0 0 4px}p.lead{color:var(--muted);margin:0 0 24px}
h2{font-size:18px;margin:40px 0 12px}h2 small{font-weight:400;color:var(--muted);font-size:13px;margin-left:8px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;align-items:start}
figure{margin:0;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden}
figure.bad{outline:2px solid #d33}
figure img{display:block;width:100%;height:auto;max-height:420px;object-fit:cover;object-position:top;background:var(--line)}
figure.mobile img{max-height:520px}
figcaption{padding:8px 10px;display:grid;gap:2px}figcaption span{color:var(--muted);font-size:12px;word-break:break-all}
figcaption em{color:#d33;font-style:normal;font-size:12px}
</style></head><body><h1>modd. — portfolio raw shots</h1>
<p class="lead">${all.length} снимков · ${all.filter((r) => r.issues.length).length} с замечаниями · desktop 1440×900, mobile 390×844, @2x · клик открывает оригинал</p>
${groups}</body></html>`;
}

async function main() {
  const only = process.argv.slice(2);
  const projects = only.length ? PROJECTS.filter((p) => only.includes(p.key)) : PROJECTS;
  await mkdir(RAW, { recursive: true });
  const browser = await chromium.launch();
  const results = (await Promise.all(projects.map((p) => runProject(browser, p)))).flat();
  await browser.close();

  // merge with previous report when re-shooting a subset
  let all = results;
  if (only.length) {
    try {
      const prev: Result[] = JSON.parse(await (await import('node:fs/promises')).readFile(path.join(RAW, 'report.json'), 'utf8'));
      all = [...prev.filter((r) => !only.includes(r.project)), ...results];
    } catch {}
  }
  all.sort((a, b) => PROJECTS.findIndex((p) => p.key === a.project) - PROJECTS.findIndex((p) => p.key === b.project));
  await writeFile(path.join(RAW, 'report.json'), JSON.stringify(all, null, 2));
  await writeFile(path.join(RAW, 'index.html'), indexHtml(all));
  const bad = all.filter((r) => r.issues.length);
  console.log(`\n${all.length} shots, ${bad.length} with issues → portfolio/raw/index.html`);
}

main().catch((e) => { console.error(e); process.exit(1); });
