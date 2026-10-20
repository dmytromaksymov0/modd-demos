import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimateTotal } from '../src/lib/estimate.ts';
import { lines } from '../src/data/estimate.ts';

const base = () => lines.map((l) => ({ id: l.id, labour: l.labour, parts: l.parts, doing: l.doing, comboWith: (l as any).comboWith, comboSaving: (l as any).comboSaving }));

test('default choice: only front pads (urgent) = 2 680 ₴', () => {
  assert.equal(estimateTotal(base()).total, 830 + 1850);
});
test('pads + discs together: combo saving on labour', () => {
  const ls = base().map((l) => (l.id === 'discs' ? { ...l, doing: true } : l));
  const t = estimateTotal(ls);
  assert.equal(t.saving, 440); assert.equal(t.total, 830 + 1850 + 1100 + 4200 - 440);
});
test('discs alone: no combo saving', () => {
  const ls = base().map((l) => ({ ...l, doing: l.id === 'discs' }));
  assert.equal(estimateTotal(ls).saving, 0);
});
test('everything postponed = 0 ₴', () => {
  assert.equal(estimateTotal(base().map((l) => ({ ...l, doing: false }))).total, 0);
});
