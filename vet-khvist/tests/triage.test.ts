import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide, onTheWay, RED_FLAGS, SYMPTOMS, GO_NOW_IF } from '../src/lib/triage.ts';

test('nothing selected → null (UI asks to pick or call)', () => {
  assert.equal(decide({}), null);
  assert.equal(decide({ flags: [], symptoms: [] }), null);
});

test('every red flag alone → now', () => {
  for (const f of RED_FLAGS) assert.equal(decide({ flags: [f.id] })?.level, 'now', f.id);
});

test('a red flag wins over any symptom mix', () => {
  assert.equal(decide({ flags: ['urine'], symptoms: ['vomit', 'itch'], age: 'adult', course: 'new' })?.level, 'now');
});

test('poison flag adds «take the package» on the way', () => {
  const r = decide({ flags: ['poison'] })!;
  assert.ok(onTheWay(r).some((x) => x.includes('упаковку')));
  assert.ok(!onTheWay(decide({ flags: ['trauma'] })!).some((x) => x.includes('упаковку')));
});

test('a single mild symptom in an adult → plan, with things to watch', () => {
  const r = decide({ species: 'dog', age: 'adult', symptoms: ['itch'], course: 'days' })!;
  assert.equal(r.level, 'plan');
  assert.ok(r.watch.length > 0);
});

test('uncertainty never lowers: young, senior, worsening, two areas, «other» → at least today', () => {
  assert.equal(decide({ age: 'young', symptoms: ['diarrhea'] })?.level, 'today');
  assert.equal(decide({ age: 'senior', symptoms: ['cough'] })?.level, 'today');
  assert.equal(decide({ age: 'adult', symptoms: ['limp'], course: 'worse' })?.level, 'today');
  assert.equal(decide({ age: 'adult', symptoms: ['cough', 'itch'] })?.level, 'today');
  assert.equal(decide({ symptoms: ['other'] })?.level, 'today');
});

test('a today-level symptom stays today even with calm modifiers', () => {
  assert.equal(decide({ age: 'adult', course: 'new', symptoms: ['no-weight'] })?.level, 'today');
});

test('a cat with urinary symptoms that are getting worse → now', () => {
  assert.equal(decide({ species: 'cat', symptoms: ['pee-often'], course: 'worse' })?.level, 'now');
  assert.equal(decide({ species: 'dog', symptoms: ['pee-often'], course: 'worse' })?.level, 'today');
});

test('no symptom is ever classified below plan, and «now» only comes from flags or the cat rule', () => {
  for (const s of SYMPTOMS) assert.ok(['plan', 'today'].includes(s.level), s.id);
});

test('unknown ids are ignored, not trusted', () => {
  assert.equal(decide({ flags: ['nope'], symptoms: ['nope'] }), null);
});

test('the way up is always defined', () => {
  assert.match(GO_NOW_IF, /важке дихання/);
});
