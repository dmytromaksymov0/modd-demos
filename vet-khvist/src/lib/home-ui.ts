// Home-page interactivity, loaded on the first interaction with a [data-lazy] widget (see index.astro).
// Pure logic lives in triage.ts / care.ts / lead.ts (tested); this file only reads the DOM and writes results.
import { decide, onTheWay, type Answers, type Level } from './triage.ts';
import { careEvents, careYear, fmtDate, inDays, daysUntil, type CareAge, type Species } from './care.ts';
import { PHONE_REQUIRED } from './lead.ts';
import { club } from '../config/site.ts';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const ICON = { check: ['', 'M20 6 9 17l-5-5'], x: [' text-urgent-night', 'M18 6 6 18M6 6l12 12'] } as const;
const li = (text: string, icon: keyof typeof ICON = 'check') => {
  const el = document.createElement('li'); el.className = 'flex gap-2';
  el.innerHTML = `<svg class="mt-0.5 size-4 shrink-0${ICON[icon][0]}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON[icon][1]}"/></svg>`;
  const s = document.createElement('span'); s.textContent = text; el.append(s); return el;
};
const LABEL: Record<Level, string> = { now: 'Їдьте зараз', today: 'Сьогодні', plan: 'Планово' };

function initTriage(root: HTMLElement) {
  if (root.dataset.ready) return; root.dataset.ready = '1';
  const form = root.querySelector<HTMLFormElement>('[data-triage-form]')!;
  const step = (n: 1 | 2) => form.querySelectorAll<HTMLElement>('[data-step]').forEach((s) => { s.hidden = s.dataset.step !== String(n); });
  const result = root.querySelector<HTMLElement>('[data-result]')!;
  const empty = form.querySelector<HTMLElement>('[data-empty]')!;
  const val = (n: string) => form.querySelector<HTMLInputElement>(`input[name="${n}"]:checked`)?.value;
  const vals = (n: string) => [...form.querySelectorAll<HTMLInputElement>(`input[name="${n}"]:checked`)].map((i) => i.value);
  let last: { level: Level; summary: string } | null = null;

  const show = (a: Answers) => {
    const r = decide(a);
    if (!r) { empty.classList.remove('hidden'); empty.focus?.(); return; }
    empty.classList.add('hidden');
    result.hidden = false; form.hidden = true;
    result.querySelectorAll<HTMLElement>('[data-outcome]').forEach((o) => { o.hidden = o.dataset.outcome !== r.level; });
    const box = result.querySelector<HTMLElement>(`[data-outcome="${r.level}"]`)!;
    const fill = (name: string, items: string[]) => {
      const ul = box.querySelector(`[data-list="${name}"]`); const wrap = ul?.parentElement as HTMLElement | null;
      if (!ul || !wrap) return; ul.replaceChildren(...items.map((t) => li(t, name === 'dont' ? 'x' : 'check'))); wrap.hidden = !items.length;
    };
    fill('reasons', r.reasons);
    if (r.level === 'now') { const w = onTheWay(r.way, a.species); fill('way', w.doNow); fill('dont', w.dont); } else fill('watch', r.watch);
    last = { level: r.level, summary: `${LABEL[r.level]}${r.reasons.length ? ` — ${r.reasons.slice(0, 2).join('; ')}` : ''}` };
    box.querySelector<HTMLElement>('[data-outcome-title]')?.focus({ preventScroll: true });
    result.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' });
  };

  root.addEventListener('click', (e) => {
    const go = (e.target as HTMLElement).closest<HTMLElement>('[data-go]')?.dataset.go;
    if (go === 'flags') {
      const flags = vals('flag');
      // «Так, є» without ticking anything still means «go now» — never make a scared person fill in a checklist.
      if (flags.length) show({ flags }); else forceNow();
    } else if (go === 'step2') { step(2); form.querySelector<HTMLElement>('[data-step="2"] legend')?.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' }); }
    else if (go === 'step1') step(1);
    else if (go === 'result') {
      show({ flags: vals('flag'), species: val('species') as Answers['species'], age: val('age') as Answers['age'], symptoms: vals('symptom'), course: val('course') as Answers['course'] });
    } else if (go === 'restart') { form.reset(); result.hidden = true; form.hidden = false; step(1); last = null; form.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' }); }
  });

  function forceNow() {
    result.hidden = false; form.hidden = true; empty.classList.add('hidden');
    result.querySelectorAll<HTMLElement>('[data-outcome]').forEach((o) => { o.hidden = o.dataset.outcome !== 'now'; });
    const box = result.querySelector<HTMLElement>('[data-outcome="now"]')!;
    // Nothing ticked, species not asked yet → only the general, species-neutral tips.
    const w = onTheWay([]);
    for (const [name, items] of [['way', w.doNow], ['dont', w.dont]] as const) {
      const ul = box.querySelector(`[data-list="${name}"]`); if (ul) { ul.replaceChildren(...items.map((t) => li(t, name === 'dont' ? 'x' : 'check'))); (ul.parentElement as HTMLElement).hidden = !items.length; }
    }
    const rs = box.querySelector('[data-list="reasons"]'); if (rs) (rs.parentElement as HTMLElement).hidden = true;
    last = { level: 'now', summary: LABEL.now };
    box.querySelector<HTMLElement>('[data-outcome-title]')?.focus({ preventScroll: true });
    result.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' });
  }

  // «Записатися» from today/plan carries the result into the booking form.
  result.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('[data-book-with-triage]') || !last) return;
    const f = document.querySelector<HTMLInputElement>('[data-triage-field]');
    const s = document.querySelector<HTMLElement>('[data-triage-summary]');
    if (f) f.value = last.summary;
    if (s) { s.textContent = `Результат «Чи терміново?»: ${last.summary}. Лікар побачить це в заявці.`; s.classList.remove('hidden'); }
  });
}

function initCare(form: HTMLFormElement) {
  if (form.dataset.ready) return; form.dataset.ready = '1';
  const scope = form.closest('section') ?? document;
  const list = scope.querySelector<HTMLElement>('[data-care-list]')!;
  const bot = scope.querySelector<HTMLElement>('[data-care-bot]');
  const year = form.dataset.care === 'year';
  const render = () => {
    const species = (form.querySelector<HTMLInputElement>('input[name="c-species"]:checked')?.value ?? 'cat') as Species;
    const age = (form.querySelector<HTMLInputElement>('input[name="c-age"]:checked')?.value ?? 'adult') as CareAge;
    const raw = form.querySelector<HTMLInputElement>('input[name="c-last"]')!.value.trim();
    const m = raw.match(/^(\d{1,2})[.\/\-\s](\d{4})$/);
    const last = m && +m[1] >= 1 && +m[1] <= 12 ? `${m[2]}-${m[1].padStart(2, '0')}` : undefined;
    const today = new Date();
    const ev = year ? careYear({ species, age, lastVaccine: last, today }) : careEvents({ species, age, lastVaccine: last, today }).slice(0, 4);
    list.replaceChildren(...ev.map((e, i) => {
      const el = document.createElement('li');
      el.className = `grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4 border-t border-ink py-4${i === ev.length - 1 ? ' border-b' : ''}`;
      el.innerHTML = '<span class="num font-semibold"></span><span><strong class="block"></strong><span class="text-fg-mute"></span></span>';
      el.querySelector('span')!.textContent = fmtDate(e.date);
      el.querySelector('strong')!.textContent = e.title;
      el.querySelector('strong + span')!.textContent = e.note;
      return el;
    }));
    const first = ev.find((e) => e.kind === 'vaccine') ?? ev[0];
    const name = species === 'cat' ? 'Барсику' : 'Рексу';
    if (bot) bot.textContent = `${name} ${inDays(daysUntil(first.date, today))} — ${first.title.toLowerCase()}. Для клубу знижка ${club.discount} %. Записати на зручний час?`;
  };
  form.addEventListener('change', render);
  form.addEventListener('input', (e) => { if ((e.target as HTMLInputElement).name === 'c-last') render(); });
  render();
}

function initBooking(form: HTMLFormElement) {
  if (form.dataset.ready) return; form.dataset.ready = '1';
  const box = form.querySelector<HTMLElement>('[data-form-error]')!;
  const sendBox = form.querySelector<HTMLElement>('[data-send-error]')!;
  const btn = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const label = form.querySelector<HTMLElement>('[data-submit-label]')!;
  const idle = label.textContent ?? 'Записатися';
  const setError = (name: string, msg: string | null) => {
    const input = form.querySelector<HTMLInputElement>(`[name="${name}"]`); if (!input) return;
    const id = `${input.id}-jserr`; document.getElementById(id)?.remove();
    input.removeAttribute('aria-invalid'); input.classList.remove('!border-alert', '!border-2');
    input.setAttribute('aria-describedby', (input.getAttribute('aria-describedby') ?? '').split(' ').filter((x) => x && x !== id).join(' '));
    if (!msg) return;
    const p = document.createElement('p'); p.id = id; p.className = 't-caption font-semibold text-alert'; p.textContent = msg;
    input.insertAdjacentElement('afterend', p);
    input.setAttribute('aria-invalid', 'true'); input.classList.add('!border-alert', '!border-2');
    input.setAttribute('aria-describedby', `${input.getAttribute('aria-describedby') ?? ''} ${id}`.trim());
  };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    ['phone', 'name'].forEach((n) => setError(n, null));
    [box, sendBox].forEach((x) => x.classList.remove('!block'));
    const phone = form.querySelector<HTMLInputElement>('[name="phone"]')!;
    if (!phone.value.replace(/\D/g, '')) { setError('phone', PHONE_REQUIRED); phone.focus(); return; }
    btn.disabled = true; label.textContent = 'Надсилаємо…';
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { accept: 'application/json' } });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) { location.href = body.thanks ?? '/dyakuyemo/'; return; }
      const errors: Record<string, string> = body.errors ?? {};
      Object.entries(errors).forEach(([k, v]) => k !== 'form' && setError(k, v));
      const firstField = Object.keys(errors).find((k) => k !== 'form');
      if (firstField) form.querySelector<HTMLElement>(`[name="${firstField}"]`)?.focus();
      if (errors.form || !firstField) { sendBox.classList.add('!block'); sendBox.focus(); }
    } catch {
      sendBox.classList.add('!block'); sendBox.focus();
    } finally { btn.disabled = false; label.textContent = idle; }
  });
}

export function init() {
  document.querySelectorAll<HTMLElement>('[data-triage]').forEach(initTriage);
  document.querySelectorAll<HTMLFormElement>('[data-care]').forEach(initCare);
  document.querySelectorAll<HTMLFormElement>('[data-booking-form]').forEach(initBooking);
}
