// «Чи терміново?» (moment 4.1) — pure logic, unit-tested in tests/triage.test.ts.
// Output is a place + time («їдьте зараз / сьогодні / планово»), never a diagnosis.
// Safety rules (phase 0, §4.1):
//   1. Any red flag → «now», no further questions.
//   2. Uncertainty only ever raises the level, never lowers it: «інше / не знаю», a puppy/kitten or a pet over 8,
//      symptoms from 2+ different areas, «стан погіршується» → at least «today».
//   3. No outcome says «можна не їхати» — the mildest one («plan») still lists when to go now.
//   4. The phone number is shown by the UI in every outcome.

export type Level = 'now' | 'today' | 'plan';
export type Species = 'cat' | 'dog';
export type Age = 'young' | 'adult' | 'senior'; // до 6 міс · дорослий · 8+ років
export type Course = 'new' | 'days' | 'worse';  // щойно почалось · кілька днів, без змін · погіршується

export interface RedFlag { id: string; label: string; hint?: string }
export interface Symptom { id: string; area: string; label: string; level: Level; watch?: string; species?: Species }

export const RED_FLAGS: readonly RedFlag[] = [
  { id: 'breath', label: 'Важко дихає або дихає з відкритим ротом', hint: 'ясна бліді, сірі або сині; у кота відкритий рот — завжди терміново' },
  { id: 'urine', label: 'Тужиться над лотком, а сечі немає або кілька крапель', hint: 'особливо коти: не чекайте до ранку' },
  { id: 'seizure', label: 'Судоми, втратив свідомість або не може встати' },
  { id: 'bleeding', label: 'Кровотеча, що не зупиняється, коли притискаєте рану' },
  { id: 'trauma', label: 'Збило авто, впав з висоти, покусали інші тварини', hint: 'навіть якщо зовні все гаразд' },
  { id: 'poison', label: 'З’їв отруту, ліки людини, шоколад, виноград, родзинки, ксиліт або отруту від гризунів', hint: 'навіть якщо почувається нормально' },
  { id: 'bloat', label: 'Живіт роздутий і твердий, марно намагається блювати', hint: 'особливо великі собаки' },
  { id: 'blood-gi', label: 'Блювання або пронос з кров’ю, блює багато разів поспіль' },
  { id: 'birth', label: 'Пологи: сильні потуги понад 30–60 хв, а цуценя чи кошеня не з’являється' },
  { id: 'face', label: 'Раптовий набряк морди, губ або горла' },
];

export const AREAS = ['Їжа й травлення', 'Дихання', 'Сечовипускання', 'Рух', 'Шкіра й вуха', 'Очі', 'Поведінка'] as const;

export const SYMPTOMS: readonly Symptom[] = [
  { id: 'no-food', area: 'Їжа й травлення', label: 'Не їсть понад добу', level: 'today', watch: 'чи п’є воду' },
  { id: 'vomit', area: 'Їжа й травлення', label: 'Блював 1–2 рази, далі бадьорий', level: 'plan', watch: 'чи не частішає блювання' },
  { id: 'diarrhea', area: 'Їжа й травлення', label: 'Пронос без крові', level: 'plan', watch: 'чи п’є і чи немає крові' },
  { id: 'no-stool', area: 'Їжа й травлення', label: 'Не ходить «по-великому» понад 2 дні', level: 'today', watch: 'чи тужиться і чи є блювання' },
  { id: 'cough', area: 'Дихання', label: 'Кашляє або чхає', level: 'plan', watch: 'чи не стало важче дихати' },
  { id: 'nose', area: 'Дихання', label: 'Виділення з носа', level: 'plan', watch: 'чи їсть і чи немає температури' },
  { id: 'pee-often', area: 'Сечовипускання', label: 'Часто ходить у туалет, сеча є', level: 'today', watch: 'чи є сеча щоразу' },
  { id: 'pee-blood', area: 'Сечовипускання', label: 'Кров у сечі', level: 'today', watch: 'чи є сеча щоразу' },
  { id: 'limp', area: 'Рух', label: 'Кульгає, але стає на лапу', level: 'plan', watch: 'чи не з’явився набряк' },
  { id: 'no-weight', area: 'Рух', label: 'Не стає на лапу', level: 'today', watch: 'чи немає набряку й рани' },
  { id: 'itch', area: 'Шкіра й вуха', label: 'Свербить, чухає вуха або трусить головою', level: 'plan', watch: 'чи немає ран від розчухування' },
  { id: 'wound', area: 'Шкіра й вуха', label: 'Рана або укус, кров зупинилась', level: 'today', watch: 'чи не набрякає місце укусу' },
  { id: 'lump', area: 'Шкіра й вуха', label: 'Помітили новоутворення або «шишку»', level: 'plan', watch: 'чи не росте швидко' },
  { id: 'squint', area: 'Очі', label: 'Мружить або не відкриває око', level: 'today', watch: 'чи не тре око лапою' },
  { id: 'eye-discharge', area: 'Очі', label: 'Виділення з ока, око відкрите', level: 'plan', watch: 'чи не почервоніло око' },
  { id: 'lethargy', area: 'Поведінка', label: 'Млявий, ховається, «не такий, як завжди»', level: 'today', watch: 'чи їсть, п’є і ходить у туалет' },
  { id: 'other', area: 'Поведінка', label: 'Інше або не знаю, як описати', level: 'today' },
];

export interface Answers { flags?: string[]; species?: Species; age?: Age; symptoms?: string[]; course?: Course }
// `way`: red-flag ids the «що робити дорогою» tips are built from (the cat urinary rule maps to «urine»).
export interface Result { level: Level; reasons: string[]; watch: string[]; way: string[] }

const rank: Record<Level, number> = { plan: 0, today: 1, now: 2 };
const max = (a: Level, b: Level): Level => (rank[a] >= rank[b] ? a : b);

/** Returns null when nothing is selected yet (the UI then says «Оберіть хоча б одне або подзвоніть»). */
export function decide(a: Answers): Result | null {
  const flags = (a.flags ?? []).filter((id) => RED_FLAGS.some((f) => f.id === id));
  if (flags.length) {
    return { level: 'now', reasons: flags.map((id) => RED_FLAGS.find((f) => f.id === id)!.label), watch: [], way: flags };
  }
  const picked = (a.symptoms ?? []).map((id) => SYMPTOMS.find((s) => s.id === id)).filter((s): s is Symptom => !!s);
  if (!picked.length) return null;

  let level: Level = picked.reduce<Level>((l, s) => max(l, s.level), 'plan');
  const reasons: string[] = [];
  const areas = new Set(picked.map((s) => s.area));
  if (areas.size >= 2 && level === 'plan') { level = 'today'; reasons.push('кілька різних симптомів одночасно'); }
  if (a.age === 'young' && level === 'plan') { level = 'today'; reasons.push('цуценята й кошенята швидко зневоднюються'); }
  if (a.age === 'senior' && level === 'plan') { level = 'today'; reasons.push('тварині понад 8 років'); }
  if (a.course === 'worse' && level === 'plan') { level = 'today'; reasons.push('стан погіршується'); }
  if (a.species === 'cat' && picked.some((s) => s.id === 'pee-often' || s.id === 'pee-blood') && a.course === 'worse') {
    level = 'now'; reasons.push('у котів проблеми з сечею можуть швидко перейти в закупорку');
  }
  // «Інше / не знаю» is already «today» by itself; keep it explicit for the reasons list.
  if (picked.some((s) => s.id === 'other')) reasons.push('симптом важко описати — краще, щоб лікар подивився');

  const watch = [...new Set(picked.map((s) => s.watch).filter((w): w is string => !!w))].slice(0, 4);
  return { level, reasons, watch, way: level === 'now' ? ['urine'] : [] };
}

// «Що робити дорогою — і чого не робити» for «now», built from what was picked (not one list for everyone).
// Texts are the same as the 9 situations on /nevidkladna/ (src/data/emergencies.ts; tests check they match).
// Species: a tip with `species` is shown only for that species; when the species is unknown (red flags come
// before the «Хто» question) only species-neutral tips are shown.
// `slot`: tips that answer the same question («чи годувати», «тепло чи прохолода», «переноска», «дзвінок») —
// the first one wins, so a flag-specific rule replaces the general one instead of contradicting it.
export interface Tip { text: string; species?: Species; slot?: 'call' | 'feed' | 'temp' | 'carrier'; from?: string }
interface FlagTips { doNow: Tip[]; dont: Tip[] }

/** Most critical first: airway, blood loss, bloat, seizures, poison, urinary block, trauma, GI blood, birth. */
export const FLAG_ORDER = ['breath', 'face', 'bleeding', 'bloat', 'seizure', 'poison', 'urine', 'trauma', 'blood-gi', 'birth'] as const;

export const FLAG_TIPS: Record<string, FlagTips> = {
  breath: {
    doNow: [
      { text: 'мінімум стресу: тихо, без зайвих рухів', from: 'dykhannia' },
      { text: 'кота — у переносці з відкритим верхом або на рушнику', species: 'cat', slot: 'carrier', from: 'dykhannia' },
      { text: 'у машині — прохолодне повітря, не тісно', slot: 'temp', from: 'dykhannia' },
    ],
    dont: [
      { text: 'не притискайте груди й не кладіть силоміць на бік', from: 'dykhannia' },
      { text: 'не давайте пити й їсти', slot: 'feed', from: 'dykhannia' },
    ],
  },
  face: {
    doNow: [
      { text: 'мінімум стресу: тихо, без зайвих рухів', from: 'dykhannia' },
      { text: 'стежте за диханням і кольором ясен — скажіть лікарю, коли дзвоните' },
    ],
    dont: [
      { text: 'не давайте пити й їсти', slot: 'feed', from: 'dykhannia' },
      { text: 'не давайте протиалергійні ліки для людей' },
    ],
  },
  bleeding: {
    doNow: [
      { text: 'притисніть чистою тканиною або бинтом і тримайте', from: 'krovotecha' },
      { text: 'просочилось — додайте ще шар зверху, не знімаючи першого', from: 'krovotecha' },
    ],
    dont: [
      { text: 'не знімайте пов’язку, щоб «подивитися»', from: 'krovotecha' },
      { text: 'не засипайте рану порошками', from: 'krovotecha' },
    ],
  },
  bloat: {
    doNow: [
      { text: 'їдьте одразу: рахунок іде на хвилини', from: 'zhyvit' },
      { text: 'подзвоніть дорогою — підготуємо операційну', slot: 'call', from: 'zhyvit' },
    ],
    dont: [
      { text: 'не годуйте й не поїть', slot: 'feed', from: 'zhyvit' },
      { text: 'не чекайте, «чи мине»', from: 'zhyvit' },
    ],
  },
  seizure: {
    doNow: [
      { text: 'приберіть предмети, об які може вдаритися', from: 'sudomy' },
      { text: 'засічіть час нападу, приглушіть світло й звук', from: 'sudomy' },
      { text: 'зніміть на відео, якщо можете — це допоможе лікарю', from: 'sudomy' },
    ],
    dont: [
      { text: 'не тримайте за язик і не кладіть нічого в пащу', from: 'sudomy' },
      { text: 'не намагайтеся втримати силоміць', from: 'sudomy' },
    ],
  },
  poison: {
    doNow: [
      { text: 'візьміть упаковку або залишки того, що з’їв', from: 'otruiennia' },
      { text: 'якщо речовина на шерсті — оберніть рушником, щоб не вилизував', from: 'otruiennia' },
    ],
    dont: [
      { text: 'не викликайте блювання самостійно, поки лікар не сказав', from: 'otruiennia' },
      { text: 'не давайте нічого: ні їжі, ні води, ні молока, олії чи активованого вугілля', slot: 'feed', from: 'otruiennia' },
    ],
  },
  urine: {
    doNow: [
      { text: 'їдьте одразу, навіть уночі: закупорка небезпечна за години', from: 'sechovypuskannia' },
      { text: 'візьміть із собою переноску з пелюшкою', species: 'cat', slot: 'carrier', from: 'sechovypuskannia' },
    ],
    dont: [
      { text: 'не тисніть на живіт', from: 'sechovypuskannia' },
      { text: 'не давайте сечогінні чи «травички»', from: 'sechovypuskannia' },
    ],
  },
  trauma: {
    doNow: [
      { text: 'переносьте на твердому: дошка, натягнута ковдра', from: 'travma' },
      { text: 'кота — у переносці', species: 'cat', slot: 'carrier', from: 'travma' },
      { text: 'від болю навіть спокійна тварина може вкусити — тримайте обличчя подалі', from: 'travma' },
    ],
    dont: [
      { text: 'не вправляйте лапу й не накладайте шини', from: 'travma' },
      { text: 'не давайте знеболювальні для людей', from: 'travma' },
    ],
  },
  'blood-gi': {
    doNow: [
      { text: 'запам’ятайте, скільки разів блював і коли востаннє' },
      { text: 'постеліть пелюшку або рушник — дорогою може знову знудити' },
    ],
    dont: [
      { text: 'не давайте ліки людини від блювання чи проносу' },
      { text: 'не годуйте до огляду', slot: 'feed' },
    ],
  },
  birth: {
    doNow: [
      { text: 'запишіть час початку потуг і народження кожного малюка', from: 'polohy' },
      { text: 'візьміть малюків з собою в теплій коробці', from: 'polohy' },
    ],
    dont: [
      { text: 'не тягніть малюка', from: 'polohy' },
      { text: 'не давайте препарати «для пологів» без лікаря', from: 'polohy' },
    ],
  },
};

/** General tips — kept only when no flag-specific tip answers the same slot. */
export const GENERAL_TIPS: FlagTips = {
  doNow: [
    { text: 'подзвоніть дорогою — лікар підготує кабінет', slot: 'call' },
    { text: 'тримайте в теплі, але не перегрівайте', slot: 'temp' },
  ],
  dont: [{ text: 'не давайте їжу й ліки людини', slot: 'feed' }],
};

export const MAX_DO = 5;
export const MAX_DONT = 4;
export interface Way { doNow: string[]; dont: string[] }

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function collect(groups: Tip[][], species: Species | undefined, limit: number): string[] {
  const seen = new Set<string>(); const slots = new Set<string>(); const out: Tip[] = [];
  for (const tip of groups.flat()) {
    if (tip.species && tip.species !== species) continue;
    if (seen.has(tip.text) || (tip.slot && slots.has(tip.slot))) continue;
    seen.add(tip.text); if (tip.slot) slots.add(tip.slot); out.push(tip);
  }
  // The call comes first whatever its source — it is the one step that helps in every case.
  out.sort((a, b) => Number(b.slot === 'call') - Number(a.slot === 'call'));
  return out.slice(0, limit).map((t) => cap(t.text));
}

/** What to do on the way and what not to do — for «now». `flags` are red-flag ids (unknown ids are ignored). */
export function onTheWay(flags: readonly string[], species?: Species): Way {
  const picked = FLAG_ORDER.filter((id) => flags.includes(id)).map((id) => FLAG_TIPS[id]);
  return {
    // Flag-specific first (by severity); the general call/warmth tips fill the rest unless a flag replaced them.
    doNow: collect([...picked.map((t) => t.doNow), GENERAL_TIPS.doNow], species, MAX_DO),
    dont: collect([...picked.map((t) => t.dont), GENERAL_TIPS.dont], species, MAX_DONT),
  };
}

/** The way up from «today»/«plan» — always present. */
export const GO_NOW_IF = 'якщо з’явиться важке дихання, кров, судоми, тварина не встає або перестала пити.';
