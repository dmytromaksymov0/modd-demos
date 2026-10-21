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
export interface Result { level: Level; reasons: string[]; watch: string[]; poison: boolean }

const rank: Record<Level, number> = { plan: 0, today: 1, now: 2 };
const max = (a: Level, b: Level): Level => (rank[a] >= rank[b] ? a : b);

/** Returns null when nothing is selected yet (the UI then says «Оберіть хоча б одне або подзвоніть»). */
export function decide(a: Answers): Result | null {
  const flags = (a.flags ?? []).filter((id) => RED_FLAGS.some((f) => f.id === id));
  if (flags.length) {
    return { level: 'now', reasons: flags.map((id) => RED_FLAGS.find((f) => f.id === id)!.label), watch: [], poison: flags.includes('poison') };
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
  return { level, reasons, watch, poison: false };
}

/** What to do on the way — shown with «now». Conservative, practical, no home treatment. */
export function onTheWay(r: Pick<Result, 'poison'>, species?: Species): string[] {
  const out = [
    'Подзвоніть дорогою — лікар підготує кабінет',
    species === 'cat' ? 'Кота — у переносці, накрийте її рушником' : 'Собаку з травмою переносьте на твердому: дошка, натягнута ковдра',
    'Не давайте ліки людини, їжу й воду, якщо блює',
    'Тримайте в теплі, але не перегрівайте',
  ];
  if (r.poison) out.push('Візьміть упаковку або залишки того, що з’їв');
  return out;
}

/** The way up from «today»/«plan» — always present. */
export const GO_NOW_IF = 'якщо з’явиться важке дихання, кров, судоми, тварина не встає або перестала пити.';
