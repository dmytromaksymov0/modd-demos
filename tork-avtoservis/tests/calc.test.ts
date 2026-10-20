import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculate, workPrice, roundTo10, fmtMoney, fmtTime } from '../src/lib/calc.ts';
import { works, combos } from '../src/data/works.ts';
import { carClasses } from '../src/config/site.ts';

const rate = (id: string) => carClasses.find((c) => c.id === id)!.rate;
const w = (id: string) => works.find((x) => x.id === id)!;

test('labour = class rate × norm hours, rounded to 10 ₴', () => {
  assert.equal(workPrice(w('pads-front'), rate('A')), 600);   // 0.75 × 800
  assert.equal(workPrice(w('pads-front'), rate('B')), 710);   // 712.5 → 710
  assert.equal(workPrice(w('pads-front'), rate('D')), 980);   // 975 → 980
  assert.equal(roundTo10(714), 710); assert.equal(roundTo10(715), 720);
});

test('fixed-price works ignore the class', () => {
  for (const c of carClasses) assert.equal(workPrice(w('diag-comp'), c.rate), 500);
});

test('combo: front pads + discs together is cheaper and faster', () => {
  const r = calculate(['pads-front', 'discs-front'], rate('B'), works, combos);
  assert.equal(r.total, 710 + 950 - 380);
  assert.equal(r.minutes, 45 + 60 - 25);
  assert.deepEqual(r.comboLabels, ['Колодки + диски разом']);
  assert.equal(r.savings[0].money, 380);
});

test('combo applies only when every job of the pair is selected', () => {
  const r = calculate(['pads-front', 'oil'], rate('B'), works, combos);
  assert.equal(r.saving, 0); assert.equal(r.savings.length, 0);
});

test('two combos at once are listed separately', () => {
  const r = calculate(['ball-joint', 'alignment', 'oil', 'filters'], rate('D'), works, combos);
  assert.deepEqual(r.comboLabels, ['Кульова + розвал разом', 'Мастило + фільтри разом']);
  assert.equal(r.total, 1300 + 1300 + 780 + 390 - 390 - 200);
});

test('suspension diagnostics is free when a repair is booked with it', () => {
  const alone = calculate(['diag-khodova'], rate('C'), works, combos);
  assert.equal(alone.total, 450);
  const withRepair = calculate(['diag-khodova', 'links-front'], rate('C'), works, combos);
  assert.equal(withRepair.total, 660);
  assert.ok(withRepair.savings.some((s) => s.label.startsWith('Діагностика') && s.money === 450));
});

test('empty selection is zero', () => {
  const r = calculate([], rate('A'), works, combos);
  assert.equal(r.total, 0); assert.equal(r.minutes, 0);
});

test('formatting: hryvnia with non-breaking spaces, hours and minutes', () => {
  assert.equal(fmtMoney(1330), '1 330 ₴');
  assert.equal(fmtTime(45), '45 хв');
  assert.equal(fmtTime(80), '1 год 20 хв');
  assert.equal(fmtTime(120), '2 год');
});

test('every work id is unique and every combo refers to existing works', () => {
  assert.equal(new Set(works.map((x) => x.id)).size, works.length);
  for (const c of combos) for (const id of c.ids) assert.ok(works.some((x) => x.id === id), id);
});
