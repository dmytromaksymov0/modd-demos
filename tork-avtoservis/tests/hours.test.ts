import { test } from 'node:test';
import assert from 'node:assert/strict';
import { status, nowIn, fmt } from '../src/lib/hours.ts';
import { hours } from '../src/config/site.ts';

const at = (day: number, h: number, m = 0) => status(hours.days, day, h * 60 + m);

test('weekday inside hours → open until 19:00', () => {
  const s = at(2, 12); assert.equal(s.open, true); assert.equal(s.text, 'Відчинено до 19:00');
});
test('weekday before opening → opens today at 8:30', () => {
  const s = at(3, 7, 45); assert.equal(s.open, false); assert.equal(s.text, 'Зачинено · відкриємо о 8:30');
});
test('Friday evening → tomorrow (Saturday) from 9:00', () => {
  assert.equal(at(5, 19, 30).text, 'Зачинено · завтра з 9:00');
});
test('Saturday after 16:00 → Monday from 8:30 (Sunday is a day off)', () => {
  assert.equal(at(6, 16).text, 'Зачинено · у понеділок з 8:30');
});
test('Sunday → tomorrow from 8:30', () => {
  assert.equal(at(0, 11).text, 'Зачинено · завтра з 8:30');
});
test('closing minute itself is closed', () => {
  assert.equal(at(1, 19, 0).open, false); assert.equal(at(1, 18, 59).open, true);
});
test('nowIn converts to Kyiv time (UTC+3 in summer, UTC+2 in winter)', () => {
  assert.deepEqual(nowIn('Europe/Kyiv', new Date('2026-07-15T09:00:00Z')), { day: 3, min: 12 * 60 });
  assert.deepEqual(nowIn('Europe/Kyiv', new Date('2026-12-15T09:00:00Z')), { day: 2, min: 11 * 60 });
  assert.equal(fmt(510), '8:30');
});
