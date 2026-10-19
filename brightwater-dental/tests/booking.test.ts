import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDays, slotsFor, prefill, isTaken, CHAIRS } from '../src/lib/booking.ts';

test('openDays skips Sundays and uses practice hours', () => {
  const days = openDays('2026-10-17', 8); // Saturday
  assert.equal(days[0].iso, '2026-10-17');
  assert.equal(days[0].weekday, 6);
  assert.equal(days[0].close, 840);
  assert.equal(days[1].iso, '2026-10-19'); // Monday, Sunday skipped
  assert.ok(days.every((d) => d.weekday !== 0));
  assert.equal(days.find((d) => d.weekday === 5)!.close, 900);
});

test('availability is deterministic', () => {
  assert.equal(isTaken('2026-10-24', 1, 600, 6), isTaken('2026-10-24', 1, 600, 6));
});

test('side-by-side slots seat everyone in different chairs at the same time', () => {
  const [day] = openDays('2026-10-19', 1);
  const slots = slotsFor(day, ['cleaning', 'kids', 'kids']);
  assert.ok(slots.length > 0);
  for (const s of slots) {
    if (s.mode !== 'side-by-side') continue;
    assert.equal(new Set(s.chairs).size, 3);
    assert.ok(s.chairs.every((c) => c >= 0 && c < CHAIRS));
    assert.ok(s.starts.every((t) => t === s.start));
    assert.equal(s.doneBy, s.start + 60);
    for (let i = 0; i < 3; i++) {
      const mins = [60, 30, 30][i];
      for (let m = s.start; m < s.start + mins; m += 30) assert.equal(isTaken(day.iso, s.chairs[i], m, day.weekday), false);
    }
  }
});

test('slots never run past closing and respect an hour of notice today', () => {
  const [day] = openDays('2026-10-23', 1); // Friday, closes 3 pm
  for (const s of slotsFor(day, ['new'])) assert.ok(s.doneBy <= 900);
  const today = slotsFor(openDays('2026-10-19', 1)[0], ['kids'], 600);
  assert.ok(today.every((s) => s.start > 660));
});

test('four or five people go back-to-back', () => {
  const [day] = openDays('2026-10-20', 1);
  const slots = slotsFor(day, ['cleaning', 'kids', 'kids', 'kids']);
  assert.ok(slots.length > 0);
  assert.ok(slots.every((s) => s.mode === 'back-to-back'));
  for (const s of slots) assert.ok(s.starts.some((t) => t > s.start));
});

test('prefill reads crew, day, comfort, insurance and doctor', () => {
  const p = prefill('?crew=family&day=sat&comfort=sounds,control&insurance=cigna-ppo&doctor=elena-ruiz');
  assert.deepEqual(p.people.map((x) => x.visit), ['cleaning', 'kids', 'kids']);
  assert.equal(p.saturday, true);
  assert.deepEqual(p.comfort, ['sounds', 'control']);
  assert.equal(p.insurance, 'cigna-ppo');
  assert.equal(p.doctor, 'elena-ruiz');
  assert.deepEqual(prefill('?visit=emergency').people, [{ who: 'Me', visit: 'emergency' }]);
});
