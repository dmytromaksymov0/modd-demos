// «Чи терміново?» in the browser: «що робити дорогою / чого не робити» follow the picked flags and species.
// node scripts/e2e-triage.cjs [baseUrl] — on the built site (astro preview), home and /nevidkladna/.
const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
const BASE = process.argv[2] || 'http://localhost:4321';
const ANIMAL = /соба|цуцен|кіт|кот|кішк|кошен|переноск/i;
let failed = 0, passed = 0;
const ok = (cond, name) => { if (cond) passed++; else failed++; console.log(`${cond ? '✔' : '✖'} ${name}`); };

(async () => {
  const b = await chromium.launch();
  for (const page of ['/', '/nevidkladna/']) {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = []; p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await p.goto(BASE + page + '?t=day', { waitUntil: 'networkidle' });
    const T = (s) => `${page} · ${s}`;
    const lists = async () => ({
      way: (await p.$$eval('[data-outcome="now"] [data-list="way"] li', (l) => l.map((x) => x.textContent.trim()))),
      dont: (await p.$$eval('[data-outcome="now"] [data-list="dont"] li', (l) => l.map((x) => x.textContent.trim()))),
    });
    const flags = async (...ids) => {
      for (const id of ids) await p.check(`input[name="flag"][value="${id}"]`);
      await p.click('[data-go="flags"]');
      await p.waitForSelector('[data-outcome="now"]:not([hidden])', { timeout: 5000 });
      return lists();
    };
    const restart = () => p.click('[data-go="restart"]');

    let w = await flags();
    ok(w.way[0]?.startsWith('Подзвоніть дорогою') && w.dont.some((x) => /не давайте їжу й ліки людини/i.test(x)), T('«Так, є» without a tick → general tips'));
    ok(![...w.way, ...w.dont].some((x) => ANIMAL.test(x)), T('… and none of them names a species'));
    await restart();

    w = await flags('urine');
    const urine = [...w.way, ...w.dont].join(' | ');
    ok(/закупорка/.test(urine) && /не тисніть на живіт/i.test(urine), T('«лоток без сечі» → urinary tips'));
    ok(!/соба|травм|дошка|ковдра/i.test(urine), T('«лоток без сечі» → nothing about dogs or trauma'));
    ok(!ANIMAL.test(urine), T('species unknown at the flag step → no carrier, no «кота / собаку»'));
    await restart();

    w = await flags('poison');
    ok(w.way.some((x) => x.includes('упаковку')) && w.dont.some((x) => /не давайте нічого/i.test(x)), T('poison → take the package, give nothing'));
    await restart();

    w = await flags('trauma', 'bloat');
    ok(/операційну/.test(w.way[0]) && w.way.filter((x) => /подзвоніть/i.test(x)).length === 1, T('bloat + trauma → one call tip, «операційну» first'));
    ok(new Set(w.way).size === w.way.length && new Set(w.dont).size === w.dont.length && w.way.length <= 5 && w.dont.length <= 4 && w.dont.some((x) => /знеболювальні/.test(x)), T('two flags → merged, no duplicates, capped'));
    ok(w.dont.some((x) => /не годуйте й не поїть/i.test(x)) && !w.dont.some((x) => /не давайте їжу й ліки/i.test(x)), T('bloat replaces the general «їжа» rule'));
    await restart();

    // Step 2: a cat with urinary symptoms getting worse → «now» with the urinary tips, now species-aware.
    await p.click('[data-go="step2"]');
    await p.click('label:has(input[name="species"][value="cat"])'); await p.click('label:has(input[name="symptom"][value="pee-often"])'); await p.click('label:has(input[name="course"][value="worse"])');
    await p.click('[data-go="result"]');
    await p.waitForSelector('[data-outcome="now"]:not([hidden])', { timeout: 5000 });
    w = await lists();
    ok(w.way.some((x) => /закупорка/.test(x)) && w.way.some((x) => /переноску з пелюшкою/.test(x)) && !w.way.some((x) => /соба/i.test(x)), T('cat, «часто ходить», стає гірше → now, urinary tips for a cat'));
    ok(await p.isVisible('[data-outcome="now"] [data-list="dont"] svg path[d^="M18 6"]'), T('«Чого не робити» uses the × icon'));
    await restart();

    // The other outcomes are untouched.
    await p.click('[data-go="step2"]');
    await p.click('label:has(input[name="species"][value="dog"])'); await p.click('label:has(input[name="symptom"][value="itch"])'); await p.click('label:has(input[name="course"][value="days"])');
    await p.click('[data-go="result"]');
    ok(await p.isVisible('[data-outcome="plan"]') && !(await p.isVisible('[data-outcome="now"]')), T('dog, itch, days → plan (unchanged)'));

    ok(errors.length === 0, T(`no console errors${errors.length ? ': ' + errors.join('; ') : ''}`));
    await p.close();
  }
  await b.close();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
