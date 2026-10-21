const { chromium } = require('/Users/user/Downloads/modd-demos/node_modules/playwright');
// Home flows: node scripts/test-home.cjs [baseUrl] — triage outcomes, lazy JS, care calendar, booking errors.
const path = require('path');
const S = path.join(__dirname, '..', 'screenshots') + '/';
const BASE = process.argv[2] || 'http://localhost:4321';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const reqs = []; p.on('request', (r) => reqs.push(r.url()));
  await p.goto(BASE + '/?t=day', { waitUntil: 'networkidle' });
  const before = reqs.filter((u) => u.includes('home-ui')).length;
  // 1. «Так, є» without ticks → now (first click must not be lost)
  await p.click('[data-go="flags"]');
  await p.waitForSelector('[data-outcome="now"]:not([hidden])', { timeout: 5000 });
  console.log('lazy module before interaction:', before, 'after:', reqs.filter((u) => u.includes('home-ui')).length);
  console.log('1 flags-empty → now:', await p.isVisible('[data-outcome="now"]'));
  await p.screenshot({ path: S + 'flow-triage-now.png', fullPage: false });
  await p.click('[data-go="restart"]');
  // 2. poison flag → now with package advice
  await p.check('input[name="flag"][value="poison"]'); await p.click('[data-go="flags"]');
  console.log('2 poison → way list:', (await p.textContent('[data-outcome="now"] [data-list="way"]')).includes('упаковку'));
  await p.click('[data-go="restart"]');
  // 3. step 2: adult dog, itch, days → plan
  await p.click('[data-go="step2"]');
  await p.click('label:has(input[name="species"][value="dog"])'); await p.click('label:has(input[name="symptom"][value="itch"])'); await p.click('label:has(input[name="course"][value="days"])');
  await p.click('[data-go="result"]');
  console.log('3 itch adult → plan:', await p.isVisible('[data-outcome="plan"]'));
  await p.screenshot({ path: S + 'flow-triage-plan.png' });
  // 4. book with triage → summary in form
  await p.click('[data-outcome="plan"] [data-book-with-triage]');
  console.log('4 triage summary:', await p.textContent('[data-triage-summary]'));
  await p.click('[data-go="restart"]');
  // 5. empty step 2 → error
  await p.click('[data-go="step2"]'); await p.click('[data-go="result"]');
  console.log('5 empty → error visible:', await p.isVisible('[data-empty]'));
  // 6. care calendar: dog, senior
  await p.click('label:has(input[name="c-species"][value="dog"])'); await p.click('label:has(input[name="c-age"][value="senior"])');
  await p.waitForTimeout(200);
  console.log('6 care list:', (await p.textContent('[data-care-list]')).replace(/\s+/g, ' ').slice(0, 160));
  console.log('  bot:', await p.textContent('[data-care-bot]'));
  // 7. booking: empty phone → inline error; valid → no /api in preview → send-fail box
  await p.click('[data-booking-form] [data-submit]');
  console.log('7 empty phone error:', await p.isVisible('#f-phone-jserr'));
  await p.fill('[data-booking-form] input[name="phone"]', '067 123 45 67'); await p.click('[data-booking-form] [data-submit]');
  await p.waitForTimeout(800);
  console.log('  send-fail box shown (no function in astro preview):', await p.isVisible('[data-send-error]'));
  await p.locator('[data-send-error]').screenshot({ path: S + 'flow-send-fail.png' });
  await b.close();
})();
