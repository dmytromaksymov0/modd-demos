import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide, onTheWay, RED_FLAGS, SYMPTOMS, GO_NOW_IF, FLAG_TIPS, FLAG_ORDER, GENERAL_TIPS, MAX_DO, MAX_DONT } from '../src/lib/triage.ts';
import { emergencies } from '../src/data/emergency.ts';

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

// «Що робити дорогою — і чого не робити»: built from what was picked, species-aware.
const all = (w: { doNow: string[]; dont: string[] }) => [...w.doNow, ...w.dont];
const SPECIES_WORDS = /соба|цуцен|кіт|кот|кішк|кошен|переноск/i; // substrings: \b does not work on Cyrillic

test('cat + «лоток без сечі» → nothing about dogs or trauma', () => {
  const r = decide({ flags: ['urine'], species: 'cat' })!;
  const w = all(onTheWay(r.way, 'cat')).join(' | ');
  assert.doesNotMatch(w, /соба|травм|дошка|ковдра/i);
  assert.match(w, /закупорка/);
  assert.match(w, /не тисніть на живіт/i);
});

test('dog + bloat → «не годуйте й не поїть», and the general «їжа й ліки» rule is replaced, not repeated', () => {
  const w = onTheWay(['bloat'], 'dog');
  assert.ok(w.dont.some((x) => /не годуйте й не поїть/i.test(x)));
  assert.ok(!w.dont.some((x) => /не давайте їжу й ліки людини/i.test(x)));
  assert.match(w.doNow[0], /подзвоніть дорогою — підготуємо операційну/i, 'the call comes first');
  assert.equal(w.doNow.filter((x) => /подзвоніть/i.test(x)).length, 1, 'one call tip, not two');
});

test('poison → take the package, give nothing, no self-induced vomiting', () => {
  const w = onTheWay(decide({ flags: ['poison'] })!.way);
  assert.ok(w.doNow.some((x) => x.includes('упаковку')));
  assert.ok(w.dont.some((x) => /не давайте нічого/i.test(x)));
  assert.ok(w.dont.some((x) => /не викликайте блювання/i.test(x)));
  assert.ok(!onTheWay(['trauma']).doNow.some((x) => x.includes('упаковку')));
});

test('two flags → one merged list: no duplicates, most critical first, capped', () => {
  const w = onTheWay(['trauma', 'breath'], 'cat'); // given in the wrong order on purpose
  for (const list of [w.doNow, w.dont]) assert.equal(new Set(list).size, list.length);
  assert.ok(w.doNow.length <= MAX_DO && w.dont.length <= MAX_DONT);
  const breath = w.doNow.findIndex((x) => /мінімум стресу/i.test(x));
  const trauma = w.doNow.findIndex((x) => /на твердому/i.test(x));
  assert.ok(breath >= 0 && trauma >= 0 && breath < trauma, 'breathing before trauma');
  assert.equal(w.doNow.filter((x) => /переносц/i.test(x)).length, 1, 'one carrier tip, the breathing one');
  assert.ok(w.doNow.some((x) => /відкритим верхом/i.test(x)));
  assert.ok(!w.doNow.some((x) => /тримайте в теплі/i.test(x)), 'breathing wants cool air, so no «keep warm»');
  // the same text from two flags (breath + face) appears once
  // bloat replaces the general «їжа й ліки людини», so trauma's own «знеболювальні для людей» must still fit
  assert.ok(onTheWay(['bloat', 'trauma'], 'dog').dont.some((x) => /знеболювальні для людей/.test(x)));
  const twice = onTheWay(['breath', 'face']);
  assert.equal(all(twice).filter((x) => /мінімум стресу/i.test(x)).length, 1);
  assert.equal(all(twice).filter((x) => /не давайте пити й їсти/i.test(x)).length, 1);
});

test('unknown species → only species-neutral tips, for every flag and every pair', () => {
  const ids = [...FLAG_ORDER];
  const cases: string[][] = [[], ...ids.map((id) => [id]), ...ids.flatMap((a, i) => ids.slice(i + 1).map((b) => [a, b]))];
  for (const flags of cases) {
    for (const x of all(onTheWay(flags))) assert.doesNotMatch(x, SPECIES_WORDS, `${flags.join('+') || 'none'}: ${x}`);
  }
  // and the neutral list still says what to do
  assert.ok(onTheWay(['urine']).doNow.length >= 2);
});

test('species-tagged tips are the only ones naming an animal or a carrier', () => {
  for (const t of [...Object.values(FLAG_TIPS), GENERAL_TIPS].flatMap((g) => [...g.doNow, ...g.dont])) {
    if (!t.species) assert.doesNotMatch(t.text, SPECIES_WORDS, t.text);
  }
  assert.ok(onTheWay(['trauma'], 'dog').doNow.every((x) => !/кота/i.test(x)));
  assert.ok(onTheWay(['trauma'], 'cat').doNow.some((x) => /кота — у переносці/i.test(x)));
});

test('every flag has its own 1–3 tips each way, and the general tips stay when nothing contradicts them', () => {
  for (const f of RED_FLAGS) {
    const t = FLAG_TIPS[f.id];
    assert.ok(t, f.id); assert.ok(FLAG_ORDER.includes(f.id as never), f.id);
    assert.ok(t.doNow.length >= 1 && t.doNow.length <= 3 && t.dont.length >= 1 && t.dont.length <= 3, f.id);
  }
  const w = onTheWay(['bleeding'], 'dog');
  assert.match(w.doNow[0], /^Подзвоніть дорогою — лікар підготує кабінет/);
  assert.ok(w.doNow.some((x) => /тримайте в теплі/i.test(x)));
  assert.ok(w.dont.some((x) => /не давайте їжу й ліки людини/i.test(x)));
  // nothing ticked («Так, є» without a tick): general, neutral tips only
  assert.deepEqual(onTheWay([]).doNow, GENERAL_TIPS.doNow.map((t) => t.text.charAt(0).toUpperCase() + t.text.slice(1)));
});

test('tips taken from /nevidkladna use exactly its wording', () => {
  for (const [id, g] of Object.entries(FLAG_TIPS)) {
    for (const [list, key] of [[g.doNow, 'doNow'], [g.dont, 'dont']] as const) {
      for (const t of list) {
        if (!t.from) continue;
        const e = emergencies.find((x) => x.id === t.from);
        assert.ok(e, `${id}: no situation «${t.from}»`);
        assert.ok(e![key].includes(t.text), `${id}: «${t.text}» is not in /nevidkladna «${e!.title}» (${key})`);
      }
    }
  }
});

test('the cat urinary rule («now» from symptoms) gets the urinary tips', () => {
  const r = decide({ species: 'cat', symptoms: ['pee-often'], course: 'worse' })!;
  assert.deepEqual(r.way, ['urine']);
  assert.ok(onTheWay(r.way, 'cat').doNow.some((x) => /закупорка/.test(x)));
  assert.deepEqual(decide({ species: 'dog', symptoms: ['itch'] })!.way, []);
});
