import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceFor, slotsFor, nearest, isBookable, guaranteeIso, partsOfDay, mastersFor, groupOf, worksOn, addDaysIso, ANY, CLOSE, toMin } from '../src/lib/booking.ts';
import { serviceById } from '../src/lib/booking.ts';

const today = '2026-10-21'; // Wednesday

test('top master = ×1.2 rounded to 10 ₴; «any» never charges the top surcharge', () => {
  assert.equal(priceFor('mani-coat', 'sofiia'), 750);
  assert.equal(priceFor('mani-coat', 'olena'), 900);
  assert.equal(priceFor('pedi-coat', 'daryna'), 1140);
  assert.equal(priceFor('mani-coat', ANY), 750);
  assert.equal(priceFor('nope', 'olena'), null);
});

test('groups and masters line up with the brief: 4 nail + brows + lashes', () => {
  assert.deepEqual(mastersFor('manicure').map((m) => m.id), ['olena', 'daryna', 'sofiia', 'marta']);
  assert.deepEqual(mastersFor('brows').map((m) => m.id), ['iryna']);
  assert.deepEqual(mastersFor('lashes').map((m) => m.id), ['alina']);
  assert.equal(groupOf('pedi-toes'), 'pedicure');
  assert.equal(groupOf('manicure'), 'manicure');
});

test('slots are deterministic, end by 21:00 and respect the day off', () => {
  const a = slotsFor({ service: 'mani-coat', master: 'sofiia', date: '2026-10-22', today, nowMin: 600 });
  const b = slotsFor({ service: 'mani-coat', master: 'sofiia', date: '2026-10-22', today, nowMin: 600 });
  assert.deepEqual(a, b);
  const dur = serviceById('mani-coat')!.minutes;
  assert.ok(a.every((s) => toMin(s.t) + dur <= CLOSE));
  assert.ok(a.some((s) => s.free) && a.some((s) => !s.free), 'a real-looking day has both');
  assert.equal(worksOn('sofiia', '2026-10-21'), false); // Wednesday off
  assert.ok(slotsFor({ service: 'mani-coat', master: 'sofiia', date: '2026-10-21', today, nowMin: 600 }).every((s) => !s.free));
});

test('today hides times less than an hour ahead', () => {
  const s = slotsFor({ service: 'brows-shape', master: 'iryna', date: today, today, nowMin: 15 * 60 + 10 });
  assert.ok(s.length && s.every((x) => toMin(x.t) >= 16 * 60 + 30));
});

test('«any» master is free if anyone in the group is, and names who', () => {
  const s = slotsFor({ service: 'mani-coat', master: ANY, date: '2026-10-24', today, nowMin: 600 });
  const free = s.filter((x) => x.free);
  assert.ok(free.length > 0);
  assert.ok(free.every((x) => mastersFor('manicure').some((m) => m.id === x.master)));
});

test('nearest window exists within the horizon for every master and service group', () => {
  for (const [service, master] of [['mani-coat', 'olena'], ['pedi-coat', 'marta'], ['brows-lam', 'iryna'], ['lash-2d', 'alina'], ['mani-ext', ANY]]) {
    const n = nearest({ service, master, today, nowMin: 600 });
    assert.ok(n, `${service}/${master}`);
  }
});

test('server check: only free slots within 14 days', () => {
  const n = nearest({ service: 'mani-coat', master: 'olena', today, nowMin: 600 })!;
  assert.equal(isBookable({ service: 'mani-coat', master: 'olena', date: n.date, t: n.t, today, nowMin: 600 }), true);
  assert.equal(isBookable({ service: 'mani-coat', master: 'olena', date: addDaysIso(today, -1), t: '12:00', today, nowMin: 600 }), false);
  assert.equal(isBookable({ service: 'mani-coat', master: 'olena', date: addDaysIso(today, 20), t: '12:00', today, nowMin: 600 }), false);
  assert.equal(isBookable({ service: 'mani-coat', master: 'olena', date: '2026-10-26', t: '12:00', today, nowMin: 600 }), false); // Monday off
});

test('guarantee = visit + 21 days; parts of day split at 12:00 and 17:00', () => {
  assert.equal(guaranteeIso('2026-10-22'), '2026-11-12');
  assert.equal(guaranteeIso('2026-12-20'), '2027-01-10');
  const p = partsOfDay([{ t: '11:30', free: true }, { t: '12:00', free: true }, { t: '17:00', free: false }]);
  assert.deepEqual(p.map((x) => [x.label, x.slots.length]), [['Ранок', 1], ['День', 1], ['Вечір', 1]]);
});
