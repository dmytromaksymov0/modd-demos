import { test } from 'node:test';
import assert from 'node:assert/strict';
import { careEvents, inDays, daysUntil } from '../src/lib/care.ts';

const today = new Date(2026, 9, 21); // 21 Oct 2026

test('events are sorted, in the future, and never empty', () => {
  for (const species of ['cat', 'dog'] as const) for (const age of ['baby', 'young', 'adult', 'senior'] as const) {
    const ev = careEvents({ species, age, today });
    assert.ok(ev.length >= 3, `${species} ${age}`);
    for (let i = 1; i < ev.length; i++) assert.ok(+ev[i].date >= +ev[i - 1].date);
    assert.ok(ev.every((e) => +e.date >= +today));
  }
});

test('adult with a known last vaccine → revaccination a year later, deworming 10 days before', () => {
  const ev = careEvents({ species: 'cat', age: 'adult', lastVaccine: '2026-01', today });
  const vac = ev.find((e) => e.kind === 'vaccine')!;
  assert.equal(vac.date.getFullYear(), 2027);
  assert.equal(vac.date.getMonth(), 0);
  const worm = ev.find((e) => e.title.includes('глистів'))!;
  assert.equal(daysUntil(vac.date, worm.date), 10);
});

test('overdue or unknown vaccine date → soon (within 2 weeks)', () => {
  for (const lastVaccine of ['2024-03', undefined]) {
    const vac = careEvents({ species: 'dog', age: 'adult', lastVaccine, today }).find((e) => e.kind === 'vaccine')!;
    assert.ok(daysUntil(vac.date, today) <= 14);
  }
});

test('tick season: in October the next treatment is 1 March', () => {
  const t = careEvents({ species: 'dog', age: 'adult', today }).find((e) => e.title.includes('кліщів'))!;
  assert.equal(t.date.getMonth(), 2);
  assert.equal(t.date.getDate(), 1);
  assert.equal(t.date.getFullYear(), 2027);
});

test('Ukrainian plural for days', () => {
  assert.equal(inDays(0), 'сьогодні');
  assert.equal(inDays(1), 'завтра');
  assert.equal(inDays(2), 'через 2 дні');
  assert.equal(inDays(5), 'через 5 днів');
  assert.equal(inDays(11), 'через 11 днів');
  assert.equal(inDays(21), 'через 21 день');
  assert.equal(inDays(14), 'через 14 днів');
});

import { careYear } from '../src/lib/care.ts';
test('a full year: within 12 months, ticks only in March–October, deworming every ~3 months', () => {
  const ev = careYear({ species: 'dog', age: 'adult', today });
  const end = new Date(2027, 9, 21);
  assert.ok(ev.every((e) => +e.date >= +today && +e.date < +end));
  const ticks = ev.filter((e) => e.title.includes('кліщів'));
  assert.ok(ticks.length >= 7 && ticks.every((e) => e.date.getMonth() >= 2 && e.date.getMonth() <= 9));
  assert.ok(ev.filter((e) => e.title.includes('глистів')).length >= 4);
  assert.equal(ev.filter((e) => e.kind === 'vaccine').length, 1);
});

test('year view has no empty winter when the vaccine is far away: deworming before it too', () => {
  const ev = careYear({ species: 'dog', age: 'adult', lastVaccine: '2026-03', today });
  const first = ev[0];
  assert.ok(+first.date - +today < 1000 * 60 * 60 * 24 * 95, 'first reminder within ~3 months');
});
