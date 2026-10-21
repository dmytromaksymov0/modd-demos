// «Запис за 4 кроки» in the browser. Loaded on the first interaction with the form (HeroBooking.astro).
// The DOM is the state: real radios (grupa, posluga, kolir, maister, data, chas) — this module only filters, renders
// days and slots, keeps the summary in sync, moves between steps and submits with fetch (JSON) to /api/lead.
import { uah, duration } from '../data/services.ts';
import { masters } from '../data/masters.ts';
import { shades } from '../data/shades.ts';
import { site } from '../config/site.ts';
import { ANY, HORIZON, addDaysIso, parseIso, priceFor, slotsFor, nearest, partsOfDay, serviceById, groupOf, defaultService, worksOn, kyivNow, guaranteeIso } from './booking.ts';
import { normalizeUaPhone, PHONE_INVALID, PHONE_REQUIRED, CONSENT, SEND_FAIL, SLOT_TAKEN } from './lead.ts';

const WD = ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const MONTH_GEN = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
const MONTH_NOM = ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'];
const STEPS = ['Послуга', 'Майстер', 'День і час', 'Контакти'];
const CTA = ['Далі: майстер', 'Далі: день і час', 'Далі: контакти', 'Записатися'];
const CTA_SHORT = ['Далі', 'Далі', 'Далі', 'Записатися'];

const dayMonth = (iso: string) => { const d = parseIso(iso); return `${d.getDate()} ${MONTH_GEN[d.getMonth()]}`; };
const dotDate = (iso: string) => { const d = parseIso(iso); return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`; };
const longDay = (iso: string) => { const d = parseIso(iso); return `${WD[d.getDay()]} ${d.getDate()} ${MONTH_GEN[d.getMonth()]}`; };

export function init(form: HTMLFormElement) {
  const q = <T extends Element = HTMLElement>(s: string) => form.querySelector<T>(s);
  const qa = <T extends Element = HTMLElement>(s: string) => [...form.querySelectorAll<T>(s)];
  const radios = (name: string) => qa<HTMLInputElement>(`input[name="${name}"]`);
  const val = (name: string) => radios(name).find((r) => r.checked)?.value;
  const check = (name: string, v: string | undefined) => radios(name).forEach((r) => { r.checked = r.value === v; });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clock = kyivNow(new Date());

  form.noValidate = true; // our step-by-step messages instead of the browser bubbles
  // No-JS fields (date input, part of day) would submit alongside the slot radios — switch them off.
  qa<HTMLInputElement | HTMLSelectElement>('.when-nojs input, .when-nojs select').forEach((el) => { el.disabled = true; });
  // Variants of other groups are hidden by CSS until this module takes over filtering with [hidden].
  qa('[data-hide-js]').forEach((el) => { el.removeAttribute('data-hide-js'); });

  const st = {
    step: 1,
    group: val('grupa') ?? 'manicure',
    service: val('posluga') ?? 'mani-coat',
    shade: val('kolir') ?? 'vyshnia',
    master: val('maister') ?? ANY,
    date: undefined as string | undefined,
    time: undefined as string | undefined,
  };

  // ── state changes ────────────────────────────────────────────────────────────────────────────────────────────
  function setGroup(g: string) {
    st.group = g;
    if (serviceById(st.service)?.group !== g) st.service = defaultService(g as never).id;
    const m = masters.find((x) => x.id === st.master);
    if (m && !m.groups.includes(g as never)) st.master = ANY;
    st.date = st.time = undefined;
  }
  function setService(id: string) {
    const s = serviceById(id); if (!s) return;
    st.service = id; st.group = s.group;
    const m = masters.find((x) => x.id === st.master);
    if (m && !m.groups.includes(s.group)) st.master = ANY;
    st.date = st.time = undefined;
  }
  function syncRadios() {
    check('grupa', st.group); check('posluga', st.service); check('kolir', st.shade); check('kolir-panel', st.shade); check('maister', st.master);
  }

  // ── rendering ────────────────────────────────────────────────────────────────────────────────────────────────
  const nextLabel = (n: { date: string; t: string } | null) => {
    if (!n) return 'немає вікон на 2 тижні';
    const d = n.date === clock.today ? 'сьогодні' : n.date === addDaysIso(clock.today, 1) ? 'завтра' : `${WD[parseIso(n.date).getDay()]} ${parseIso(n.date).getDate()}.${String(parseIso(n.date).getMonth() + 1).padStart(2, '0')}`;
    return `вільно: ${d}, ${n.t}`;
  };

  function renderStep1() {
    qa('[data-group]').forEach((chip) => { chip.hidden = chip.dataset.group !== st.group; });
    const coat = !!serviceById(st.service)?.coat;
    const name = shades.find((s) => s.id === st.shade)?.name ?? 'підберемо на місці';
    qa('[data-shade]').forEach((f) => { f.hidden = !coat; });
    qa('[data-shade-legend]').forEach((l) => { l.textContent = l.closest('[data-shade="panel"]') ? `Колір: ${name}` : 'Колір покриття'; });
  }

  function renderStep2() {
    for (const card of qa('[data-master]')) {
      const id = card.dataset.master!;
      const serves = id === ANY || (card.dataset.groups ?? '').split(' ').includes(st.group);
      card.hidden = !serves;
      if (!serves) continue;
      const price = card.querySelector('[data-price]'); if (price) price.textContent = uah(priceFor(st.service, id) ?? 0);
      const next = card.querySelector('[data-next]');
      if (next) next.textContent = nextLabel(nearest({ service: st.service, master: id, today: clock.today, nowMin: clock.nowMin }));
    }
  }

  function renderDays() {
    const box = q('[data-days]'); if (!box) return;
    const days = Array.from({ length: HORIZON }, (_, i) => addDaysIso(clock.today, i));
    const avail = new Map(days.map((d) => [d, slotsFor({ service: st.service, master: st.master, date: d, today: clock.today, nowMin: clock.nowMin }).some((s) => s.free)]));
    if (!st.date || !avail.get(st.date)) {
      const n = nearest({ service: st.service, master: st.master, today: clock.today, nowMin: clock.nowMin });
      st.date = n?.date;
    }
    box.innerHTML = days.slice(0, 7).concat(days.slice(7)).map((d) => {
      const dt = parseIso(d), free = avail.get(d), off = st.master !== ANY && !worksOn(st.master, d);
      const note = off ? 'вихідний' : free ? 'є вікна' : 'немає вікон';
      return `<label class="day relative grid min-w-12 shrink-0 cursor-pointer place-items-center rounded-field py-2 text-caption leading-tight${free ? '' : ' is-off'}">
        <input class="sr-only" type="radio" name="data" value="${d}"${d === st.date ? ' checked' : ''}${free ? '' : ' disabled'} />
        <span class="wd">${WD[dt.getDay()]}</span><span class="font-display text-[1.0625rem] font-medium">${dt.getDate()}</span>
        <span class="sr-only">${dt.getDate()} ${MONTH_GEN[dt.getMonth()]}, ${note}</span></label>`;
    }).join('');
    const first = parseIso(days[0]), last = parseIso(days[days.length - 1]);
    const m = q('[data-month]'); if (m) m.textContent = first.getMonth() === last.getMonth() ? `· ${MONTH_NOM[first.getMonth()]}` : `· ${MONTH_NOM[first.getMonth()]} — ${MONTH_NOM[last.getMonth()]}`;
    renderSlots();
  }

  function renderSlots() {
    const box = q('[data-slots]'); if (!box) return;
    const note = q('[data-slots-note]');
    if (!st.date) { box.innerHTML = `<p class="t-small text-graphite">На найближчі 2 тижні вільних вікон немає — зателефонуйте <a href="${site.phoneHref}" class="font-semibold">${site.phone}</a>, підберемо час.</p>`; return; }
    const slots = slotsFor({ service: st.service, master: st.master, date: st.date, today: clock.today, nowMin: clock.nowMin });
    if (st.time && !slots.some((s) => s.t === st.time && s.free)) st.time = undefined;
    if (note) { note.textContent = `· ${longDay(st.date)}, ${duration(serviceById(st.service)!.minutes)}`; note.classList.remove('text-alert'); }
    box.innerHTML = partsOfDay(slots).map((p) => `<div><p class="mb-1.5 text-caption text-graphite">${p.label}</p><div class="grid grid-cols-4 gap-1.5">${p.slots.map((s) =>
      `<label class="slot relative grid min-h-11 place-items-center rounded-field border-[1.5px] text-small font-semibold num${s.free ? ' is-free' : ' is-busy'}"><input class="sr-only" type="radio" name="chas" value="${s.t}"${s.t === st.time ? ' checked' : ''}${s.free ? '' : ' disabled'} />${s.t}${s.free ? '' : '<span class="sr-only"> — зайнято</span>'}</label>`).join('')}</div></div>`).join('');
  }

  function renderSummary() {
    const s = serviceById(st.service)!;
    const m = masters.find((x) => x.id === st.master);
    const shade = s.coat ? shades.find((x) => x.id === st.shade)?.name ?? 'підберемо на місці' : undefined;
    const set = (sel: string, text: string, empty = false) => qa(sel).forEach((el) => { el.textContent = text; el.classList.toggle('text-graphite', empty); el.classList.toggle('font-semibold', !empty); el.classList.toggle('text-ink', !empty); });
    set('[data-sum="posluga"]', shade ? `${s.short} · ${shade}` : s.short);
    set('[data-sum="maister"]', m ? `${m.name}${m.top ? ', топ' : ''}` : 'будь-яка вільна', !m);
    set('[data-sum="koly"]', st.date && st.time ? `${longDay(st.date)}, ${st.time}` : st.date && st.step >= 3 ? `${longDay(st.date)} — оберіть час` : 'оберіть на кроці 3', !(st.date && st.time));
    const price = priceFor(st.service, st.master) ?? s.price;
    qa('[data-sum-total]').forEach((el) => { el.textContent = uah(price); });
    qa('[data-sum-note]').forEach((el) => { el.textContent = m?.top ? 'Разом · топ +20 %' : 'Разом · майстриня'; });
    qa('[data-sum-step]').forEach((el) => { el.textContent = String(st.step); });
    const guar = s.coat ? (st.date && st.time ? `до ${dayMonth(guaranteeIso(st.date))}` : '21 день від візиту') : '';
    qa('[data-sum-guar]').forEach((el) => { el.hidden = !s.coat; });
    qa('[data-sum-guar-date]').forEach((el) => { el.textContent = guar; });
    const barGuar = s.coat ? (st.date && st.time ? `гарантія до ${dotDate(guaranteeIso(st.date))}` : 'гарантія 21 день') : `${duration(s.minutes)}`;
    qa('[data-sum-bar-note]').forEach((el) => { el.textContent = barGuar; });
    qa('[data-cta]').forEach((el) => { el.textContent = CTA[st.step - 1]; });
    qa('[data-cta-short]').forEach((el) => { el.textContent = CTA_SHORT[st.step - 1]; el.closest('button')?.setAttribute('aria-label', CTA[st.step - 1]); });
    qa('[data-back]').forEach((el) => { el.classList.toggle('hidden', st.step === 1); el.classList.toggle('flex', st.step > 1 && !el.closest('.summary-bar')); el.classList.toggle('grid', st.step > 1 && !!el.closest('.summary-bar')); });
  }

  function renderSteps() {
    qa('[data-step]').forEach((p) => { p.toggleAttribute('data-active', p.dataset.step === String(st.step)); });
    qa('[data-step-pill]').forEach((li) => {
      const n = +li.dataset.stepPill!, state = n === st.step ? 'current' : n < st.step ? 'done' : 'todo';
      li.dataset.state = state;
      if (state === 'current') li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      const b = li.querySelector('button'); if (b) b.disabled = state !== 'done';
      const sr = li.querySelector('.step-sr'); if (sr) sr.textContent = state === 'done' ? ' — пройдено, змінити' : state === 'current' ? ' — поточний крок' : '';
    });
    qa('[data-steps-n]').forEach((el) => { el.textContent = String(st.step); });
    qa('[data-steps-name]').forEach((el) => { el.textContent = STEPS[st.step - 1]; });
    qa('[data-steps-next]').forEach((el) => { el.textContent = st.step < 4 ? `далі: ${STEPS[st.step].toLowerCase()}` : ''; });
    qa('[data-step-dash]').forEach((el) => { const n = +el.dataset.stepDash!; el.classList.toggle('bg-cherry', n <= st.step); el.classList.toggle('bg-line', n > st.step); });
  }

  function render() {
    syncRadios();
    renderStep1();
    if (st.step === 2) renderStep2();
    if (st.step === 3) renderDays();
    renderSummary();
    renderSteps();
  }

  function goTo(n: number, focus = true) {
    st.step = Math.min(4, Math.max(1, n));
    render();
    if (!focus) return;
    const head = q<HTMLElement>(`[data-step="${st.step}"] [data-step-head]`) ?? q<HTMLElement>('[data-steps]');
    const sec = form.closest('section') ?? form;
    const top = form.getBoundingClientRect().top;
    if (top < 0 || top > innerHeight * 0.5) sec.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
    head?.focus({ preventScroll: true });
  }

  // ── errors ───────────────────────────────────────────────────────────────────────────────────────────────────
  function fieldError(name: string, msg?: string) {
    if (name === 'zgoda') {
      const p = q('[data-err="zgoda"]'); if (p) { p.textContent = msg ?? ''; p.classList.toggle('hidden', !msg); }
      return;
    }
    const input = q<HTMLInputElement>(`[name="${name}"]`); if (!input) return;
    const id = `${input.id}-err`;
    let p = form.querySelector<HTMLElement>(`#${id}`);
    if (msg) {
      if (!p) { p = document.createElement('p'); p.id = id; p.className = 't-caption font-semibold text-alert'; input.insertAdjacentElement('afterend', p); }
      p.textContent = msg; input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', id);
      input.classList.add('border-alert');
    } else if (p) { p.remove(); input.removeAttribute('aria-invalid'); input.classList.remove('border-alert'); }
  }
  function formError(html?: string) {
    const box = q('[data-form-error]'); if (!box) return;
    box.innerHTML = html ?? ''; box.classList.toggle('hidden', !html);
  }
  const sendFail = () => formError(`<p class="font-semibold text-alert">${SEND_FAIL}</p><p class="mt-2 flex flex-wrap gap-x-4 gap-y-1"><a class="font-semibold" href="${site.phoneHref}">${site.phone}</a><a class="font-semibold" href="${site.telegram}">Написати в Telegram</a></p>`);

  function validateContacts(): boolean {
    const phone = q<HTMLInputElement>('[name="phone"]')!.value.trim();
    const okPhone = !!phone && !!normalizeUaPhone(phone);
    fieldError('phone', phone ? (okPhone ? undefined : PHONE_INVALID) : PHONE_REQUIRED);
    const consent = q<HTMLInputElement>('[name="zgoda"]')!.checked;
    fieldError('zgoda', consent ? undefined : CONSENT);
    if (!okPhone) q<HTMLInputElement>('[name="phone"]')!.focus(); else if (!consent) q<HTMLInputElement>('[name="zgoda"]')!.focus();
    return okPhone && consent;
  }

  async function submit() {
    formError();
    if (!st.time) { goTo(3); return; }
    if (!validateContacts()) return;
    const buttons = qa<HTMLButtonElement>('[data-next]');
    buttons.forEach((b) => { b.disabled = true; });
    qa('[data-cta], [data-cta-short]').forEach((el) => { el.textContent = 'Надсилаємо…'; });
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { accept: 'application/json' } });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) { location.assign(json.thanks ?? '/zapysano/'); return; }
      const e = json.errors ?? {};
      if (e.chas) { st.time = undefined; goTo(3); const n = q('[data-slots-note]'); if (n) { n.textContent = `· ${SLOT_TAKEN}`; n.classList.add('text-alert'); } }
      else if (e.posluga) goTo(1);
      if (e.phone) fieldError('phone', e.phone);
      if (e.zgoda) fieldError('zgoda', e.zgoda);
      if (json.delivery || e.form || (!e.phone && !e.zgoda && !e.chas && !e.posluga)) sendFail();
    } catch { sendFail(); }
    finally { buttons.forEach((b) => { b.disabled = false; }); renderSummary(); }
  }

  // ── events ───────────────────────────────────────────────────────────────────────────────────────────────────
  form.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    switch (t.name) {
      case 'grupa': setGroup(t.value); break;
      case 'posluga': setService(t.value); break;
      case 'kolir': case 'kolir-panel': st.shade = t.value; break;
      case 'maister': st.master = t.value; st.date = st.time = undefined; break;
      case 'data': st.date = t.value; st.time = undefined; renderSlots(); break;
      case 'chas': st.time = t.value; break;
      case 'zgoda': if (t.checked) fieldError('zgoda'); return;
      default: return;
    }
    render();
  });
  // Clear the phone error while typing (as soon as the number is valid) — not on blur: removing it on blur shifts the
  // layout under the pointer and the next click (consent) misses.
  form.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'phone' && t.getAttribute('aria-invalid') && normalizeUaPhone(t.value)) fieldError('phone');
  });
  form.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-next],[data-back],[data-goto]');
    if (!b) return;
    e.preventDefault();
    if (b.hasAttribute('data-goto')) { goTo(+b.dataset.goto!); return; }
    if (b.hasAttribute('data-back')) { goTo(st.step - 1); return; }
    if (st.step === 3 && !st.time) {
      const n = q('[data-slots-note]'); if (n) { n.textContent = '· оберіть час, щоб продовжити'; n.classList.add('text-alert'); }
      q<HTMLInputElement>('[name="chas"]:not(:disabled)')?.focus();
      return;
    }
    if (st.step === 4) { submit(); return; }
    goTo(st.step + 1);
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); if (st.step < 4) goTo(4); else submit(); });

  // ── prefill («Хочу так само», links from masters) ────────────────────────────────────────────────────────────
  function prefill(p: URLSearchParams, scroll = false) {
    const svc = p.get('posluga') ?? p.get('grupa');
    if (svc) { const s = serviceById(svc); if (s) setService(s.id); else { const g = groupOf(svc); if (g) setGroup(g); } }
    const shade = p.get('kolir'); if (shade && shades.some((x) => x.id === shade)) st.shade = shade;
    const m = p.get('maister'); if (m && masters.some((x) => x.id === m && x.groups.includes(st.group as never))) st.master = m;
    const step = m && svc ? 3 : svc ? 2 : 1;
    if (scroll) (form.closest('section') ?? form).scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
    goTo(step, scroll);
  }

  render();
  const params = new URLSearchParams(location.search);
  if (['posluga', 'grupa', 'maister', 'kolir'].some((k) => params.has(k))) prefill(params, false);
  form.dataset.ready = '1';
  return { prefill };
}

