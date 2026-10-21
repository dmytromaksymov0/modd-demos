import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stateAt, minutesIn } from '../src/lib/time.ts';
import { time } from '../src/config/site.ts';
const at = (h: number, m = 0) => stateAt(h * 60 + m, time);

test('day 08:00–21:59', () => { for (const [h, m] of [[8, 0], [12, 0], [14, 20], [21, 59]]) assert.equal(at(h, m), 'day', `${h}:${m}`); });
test('night 22:00–23:59 and 05:00–07:59', () => { for (const [h, m] of [[22, 0], [23, 40], [5, 0], [7, 59]]) assert.equal(at(h, m), 'night', `${h}:${m}`); });
test('curfew 00:00–04:59 wins over night', () => { for (const [h, m] of [[0, 0], [2, 47], [4, 59]]) assert.equal(at(h, m), 'curfew', `${h}:${m}`); });
test('Kyiv time across DST: 21:30 UTC is 00:30 in summer (curfew) and 23:30 in winter (night)', () => {
  assert.equal(stateAt(minutesIn('Europe/Kyiv', new Date('2026-07-15T21:30:00Z')), time), 'curfew');
  assert.equal(stateAt(minutesIn('Europe/Kyiv', new Date('2026-12-15T21:30:00Z')), time), 'night');
});
