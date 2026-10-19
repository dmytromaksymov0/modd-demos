import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmt, status, nowIn } from '../src/lib/hours.ts';
import { hours } from '../src/config/site.ts';

test('fmt formats minutes as 12-hour time', () => {
  assert.equal(fmt(450), '7:30 am');
  assert.equal(fmt(720), '12 pm');
  assert.equal(fmt(1140), '7 pm');
  assert.equal(fmt(0), '12 am');
});

test('status: open, before opening, after closing, Saturday → Monday', () => {
  assert.deepEqual(status(hours.days, 1, 600), { open: true, text: 'Open now · until 7 pm', short: 'Open till 7 pm' });
  assert.equal(status(hours.days, 1, 420).text, 'Opens today at 7:30 am');
  assert.equal(status(hours.days, 4, 1150).text, 'Closed · opens tomorrow 7:30 am');
  assert.equal(status(hours.days, 5, 900).text, 'Closed · opens tomorrow 8 am');
  assert.equal(status(hours.days, 6, 845).text, 'Closed · opens Mon 7:30 am');
  assert.equal(status(hours.days, 0, 600).text, 'Closed · opens tomorrow 7:30 am');
});

test('nowIn reads Austin wall-clock time (CDT, UTC−5 in October)', () => {
  const r = nowIn('America/Chicago', new Date('2026-10-19T14:30:00Z'));
  assert.deepEqual(r, { day: 1, min: 9 * 60 + 30 });
});
