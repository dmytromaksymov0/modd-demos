import { test } from 'node:test';
import assert from 'node:assert/strict';
import { yearly } from '../src/lib/plan.ts';

test('family of four saves $328 a year on the Brightwater Plan', () => {
  assert.deepEqual(yearly(2, 2), { without: 1480, plan: 1152, saved: 328, perMonth: 96 });
});
test('one adult: $425 without, $348 with', () => {
  assert.deepEqual(yearly(1, 0), { without: 425, plan: 348, saved: 77, perMonth: 29 });
});
test('zero people costs nothing', () => {
  assert.deepEqual(yearly(0, 0), { without: 0, plan: 0, saved: 0, perMonth: 0 });
});
