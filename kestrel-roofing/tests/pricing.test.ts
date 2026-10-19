import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimate, pitchFactor, RATES } from '../src/lib/pricing.ts';

const base = { homeSqft: 2000, stories: 2 as const, pitch: 6, material: 'architectural' as const };

test('pitch factor matches √(rise²+12²)/12', () => {
  assert.equal(pitchFactor(12).toFixed(3), '1.414');
  assert.equal(pitchFactor(6).toFixed(3), '1.118');
  assert.equal(pitchFactor(4).toFixed(3), '1.054');
});

test('typical two-story, 6/12, shingle', () => {
  const e = estimate(base);
  // 1000 footprint × 1.15 × 1.118 × 1.10 = 1414 sq ft → 14 squares (nearest half)
  assert.equal(e.squares, 14);
  assert.equal(e.low, 6700);   // 14 × 475 = 6650 → nearest $100
  assert.equal(e.high, 9100);  // 14 × 650
  assert.equal(e.days, 1);
  assert.equal(e.monthly, 660); // midpoint 7900 / 12 → nearest $10
});

test('one story doubles the footprint', () => {
  assert.equal(estimate({ ...base, stories: 1 }).squares, 28.5);
});

test('price and area grow with pitch; steep roofs carry a surcharge', () => {
  const prices = [4, 6, 8, 10, 12].map((pitch) => estimate({ ...base, pitch }));
  for (let i = 1; i < prices.length; i++) {
    assert.ok(prices[i].squares >= prices[i - 1].squares, 'squares non-decreasing');
    assert.ok(prices[i].low > prices[i - 1].low, 'price increasing');
  }
  const e12 = estimate({ ...base, pitch: 12 });
  assert.equal(e12.low, Math.round((e12.squares * RATES.architectural.low * 1.12) / 100) * 100);
});

test('metal costs roughly twice shingle and takes an extra day', () => {
  const s = estimate(base), m = estimate({ ...base, material: 'metal' });
  assert.ok(m.low > s.low * 2 && m.high < s.high * 2.5);
  assert.equal(m.days, s.days + 1);
});

test('days scale with roof size', () => {
  assert.equal(estimate({ ...base, homeSqft: 4000, stories: 1 }).days, 3);  // ~57 sq
  assert.equal(estimate({ ...base, homeSqft: 2800, stories: 1 }).days, 2);  // ~40 sq
});

test('inputs are clamped to sane ranges', () => {
  assert.deepEqual(estimate({ ...base, pitch: 30 }), estimate({ ...base, pitch: 12 }));
  assert.deepEqual(estimate({ ...base, pitch: 1 }), estimate({ ...base, pitch: 4 }));
  assert.ok(estimate({ ...base, homeSqft: 1e9 }).squares < 200);
  assert.ok(estimate({ ...base, homeSqft: 0 }).squares > 0);
});
