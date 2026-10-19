// Booking widget behaviour (loaded on idle / first interaction). Progressive enhancement over the plain form:
// people rows add/remove, real days + side-by-side times, chair lanes preview, live summary, URL prefill.
import { hours } from '../config/site';
import { fmt, nowIn } from './hours';
import { openDays, slotsFor, visitTypes, prefill, type Day, type Slot, type VisitId } from './booking';
import { carriers, answer, type PlanType } from './insurance';

const $ = <T extends Element = HTMLElement>(root: ParentNode, s: string) => root.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(root: ParentNode, s: string) => [...root.querySelectorAll<T>(s)];

function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: hours.tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function init(form: HTMLFormElement) {
  const rows = $$<HTMLLIElement>(form, '[data-person]');
  const more = $<HTMLDetailsElement>(form, '[data-more]');
  const addBtn = $<HTMLButtonElement>(form, '[data-add]');
  const days = openDays(todayIso(), 12);
  const now = nowIn(hours.tz);
  let day: Day | null = null;
  let slot: Slot | null = null;
  let showAll = false;

  // ---- prefill from URL
  const pre = prefill(location.search);
  pre.people.forEach((p, i) => {
    const r = rows[i]; if (!r) return;
    $<HTMLSelectElement>(r, 'select').value = p.visit;
    if (i > 0) r.dataset.keep = '1';
  });
  pre.comfort.forEach((c) => { const cb = form.querySelector<HTMLInputElement>(`input[name=comfort][value="${c}"]`); if (cb) cb.checked = true; });
  if (pre.insurance) {
    const [id, plan] = pre.insurance.split('-');
    if (carriers.some((c) => c.id === pre.insurance)) $<HTMLSelectElement>(form, '#b-carrier').value = pre.insurance;
    else if (carriers.some((c) => c.id === id)) { $<HTMLSelectElement>(form, '#b-carrier').value = id; if (plan) $<HTMLSelectElement>(form, '#b-plan').value = plan === 'unsure' ? 'unsure' : plan; }
    if (pre.insurance === 'ut-select-ppo' || pre.insurance.startsWith('ut-select')) $<HTMLSelectElement>(form, '#b-carrier').value = 'ut-select';
    if (pre.insurance.startsWith('state-tx')) $<HTMLSelectElement>(form, '#b-carrier').value = 'state-tx';
  }
  if (pre.doctor) $<HTMLSelectElement>(form, '#b-doctor').value = pre.doctor;

  // ---- people rows
  more.open = true;
  const active = () => rows.filter((r) => !r.classList.contains('is-empty'));
  const syncRows = () => {
    rows.forEach((r, i) => {
      if (i === 0) return;
      const name = $<HTMLInputElement>(r, 'input');
      const keep = r.dataset.keep === '1' || name.value.trim() !== '';
      r.classList.toggle('is-empty', !keep);
      $$<HTMLInputElement | HTMLSelectElement>(r, 'input, select').forEach((el) => { el.disabled = !keep; });
    });
    addBtn.classList.toggle('is-full', active().length >= rows.length);
  };
  addBtn.addEventListener('click', () => {
    const next = rows.find((r) => r.classList.contains('is-empty'));
    if (!next) return;
    next.dataset.keep = '1'; syncRows();
    $<HTMLInputElement>(next, 'input').focus();
    groupChanged();
  });
  form.addEventListener('click', (e) => {
    const rm = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-remove]');
    if (!rm) return;
    const r = rm.closest<HTMLLIElement>('[data-person]')!;
    r.dataset.keep = '0'; $<HTMLInputElement>(r, 'input').value = '';
    syncRows(); groupChanged(); addBtn.focus();
  });
  syncRows();
  document.documentElement.toggleAttribute('data-book-ready', true);

  // ---- calendar
  $<HTMLElement>(form, '[data-pref]').classList.add('hidden');
  const cal = $<HTMLElement>(form, '[data-calendar]'); cal.classList.remove('hidden'); cal.classList.add('flex');
  const daysEl = $<HTMLElement>(form, '[data-days]');
  const timesEl = $<HTMLElement>(form, '[data-times]');
  const lanesEl = $<HTMLElement>(form, '[data-lanes]');
  const visits = (): VisitId[] => active().map((r) => $<HTMLSelectElement>(r, 'select').value as VisitId);
  const today = todayIso();
  const nowFor = (d: Day) => (d.iso === today ? now.min : -1);
  // slotsFor is pure: memoise by day + group so re-renders don't recompute 12 days of availability
  const memo = new Map<string, ReturnType<typeof slotsFor>>();
  const slotsMemo = (d: Day, v: VisitId[]) => { const k = d.iso + v.join(); if (!memo.has(k)) memo.set(k, slotsFor(d, v, nowFor(d))); return memo.get(k)!; };

  function renderDays() {
    daysEl.innerHTML = '';
    days.forEach((d) => {
      const n = slotsMemo(d, visits()).length;
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(day?.iso === d.iso));
      b.disabled = n === 0;
      b.className = 'day flex min-h-[4.75rem] min-w-[4.75rem] shrink-0 flex-col items-center justify-center rounded-md border px-2 font-display leading-tight';
      const [wd, md] = [d.short.split(', ')[0], d.short.split(', ')[1]];
      b.innerHTML = `<span class="text-label font-[700]">${d.iso === today ? 'Today' : wd}</span><span class="text-[1.125rem] font-[750]">${md.replace(/^\w+ /, '')}</span><span class="text-[0.8125rem] ${d.weekday === 6 ? 'font-[700]' : 'text-stone'}">${n === 0 ? 'Full' : d.weekday === 6 ? 'Saturday' : d.close >= 1140 ? 'till 7 pm' : `till ${fmt(d.close)}`}</span>`;
      b.setAttribute('aria-label', `${d.label}${n === 0 ? ', fully booked' : `, ${n} times`}`);
      if (d.weekday === 6) b.dataset.sat = '';
      b.addEventListener('click', () => { day = d; slot = null; showAll = false; renderDays(); renderTimes(); update(); });
      daysEl.append(b);
    });
  }

  function renderTimes() {
    timesEl.innerHTML = ''; lanesEl.classList.add('hidden');
    if (!day) { timesEl.innerHTML = '<p class="text-small text-stone">Pick a day to see times that fit everyone.</p>'; return; }
    const list = slotsMemo(day, visits());
    // compact by default: up to 4 per part of the day (keeps the evening and the height predictable)
    const part = (f: (s: Slot) => boolean) => { const g = list.filter(f); return showAll ? g : g.slice(0, 4); };
    const groups: [string, Slot[]][] = [['Morning', part((s) => s.start < 720)], ['Afternoon', part((s) => s.start >= 720 && s.start < 990)], ['Evening', part((s) => s.start >= 990)]];
    const shownCount = groups.reduce((n, [, g]) => n + g.length, 0);
    const v = visits();
    timesEl.insertAdjacentHTML('beforeend', `<p class="font-display font-[700]">${day.label} · ${v.length} ${v.length === 1 ? 'person' : 'people'}</p>`);
    groups.filter(([, g]) => g.length).forEach(([name, g]) => {
      const wrap = document.createElement('div');
      wrap.innerHTML = `<p class="t-label mb-2 text-stone">${name}</p>`;
      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-2 gap-2 sm:grid-cols-4'; grid.setAttribute('role', 'radiogroup'); grid.setAttribute('aria-label', `${name} times`);
      g.forEach((s) => {
        const b = document.createElement('button');
        b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(slot?.start === s.start));
        b.className = 'time flex min-h-14 flex-col items-center justify-center rounded-sm border px-2 font-display leading-tight';
        b.innerHTML = `<span class="text-[1.0625rem] font-[750] tabular-nums">${s.label}</span><span class="text-[0.8125rem] text-stone">${v.length > 1 ? (s.mode === 'side-by-side' ? 'side by side' : 'back-to-back') : `done ${fmt(s.doneBy)}`}</span>`;
        b.addEventListener('click', () => { slot = s; renderTimes(); update(); });
        grid.append(b);
      });
      wrap.append(grid); timesEl.append(wrap);
    });
    if (!list.length) timesEl.insertAdjacentHTML('beforeend', '<p class="text-small text-stone">No time fits everyone that day — try another day or split the group.</p>');
    if (shownCount < list.length) {
      const more = document.createElement('button');
      more.type = 'button'; more.className = 'inline-flex min-h-11 items-center self-start font-display font-[650] text-spring underline decoration-2 decoration-spring/40 underline-offset-4';
      more.textContent = `Show all ${list.length} times`;
      more.addEventListener('click', () => { showAll = true; renderTimes(); });
      timesEl.append(more);
    }
    if (slot) renderLanes();
  }

  function renderLanes() {
    if (!slot || !day) return;
    const v = visits(); const names = active().map((r, i) => $<HTMLInputElement>(r, 'input').value.trim() || (i === 0 ? 'You' : `Person ${i + 1}`));
    const start = slot.start, end = slot.doneBy, span = Math.max(60, end - start);
    lanesEl.classList.remove('hidden');
    lanesEl.innerHTML = `<p class="mb-3 flex flex-wrap justify-between gap-2 font-display font-[700]"><span>${day.short} · ${fmt(start)}</span><span class="font-[500] text-stone">everyone done by ${fmt(end)}</span></p>` +
      v.map((id, i) => {
        const t = visitTypes.find((x) => x.id === id)!; const s0 = slot!.starts[i];
        return `<div class="grid grid-cols-[5.5rem_1fr] items-center gap-3 py-1 text-small"><span class="truncate font-display font-[650]">${escape(names[i])}</span><div class="relative h-9 rounded-sm bg-white"><div class="absolute inset-y-1 flex items-center overflow-hidden rounded-[0.375rem] bg-spring px-2.5 text-white" style="left:${((s0 - start) / span) * 100}%;width:${(t.minutes / span) * 100}%"><span class="truncate">${t.label.replace(' · $99', '')} · chair ${slot!.chairs[i] + 1}</span></div></div></div>`;
      }).join('');
  }
  const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  // ---- summary + hidden fields
  const sumPeople = $<HTMLElement>(form, '[data-sum-people]');
  function update() {
    const v = visits();
    sumPeople.innerHTML = active().map((r, i) => {
      const name = $<HTMLInputElement>(r, 'input').value.trim() || (i === 0 ? 'You' : `Person ${i + 1}`);
      const t = visitTypes.find((x) => x.id === v[i])!;
      return `<li class="flex justify-between gap-3 border-b border-line py-2 text-small last:border-0"><b class="font-display font-[650]">${escape(name)}</b><span class="text-right text-stone">${t.label}</span></li>`;
    }).join('');
    $<HTMLElement>(form, '[data-sum-when] span').textContent = slot && day ? `${day.short}, ${slot.label}${v.length > 1 ? ` · ${slot.mode.replace(/-/g, ' ')}` : ''}` : day ? `${day.short} — pick a time` : 'pick a day';
    const comforts = $$<HTMLInputElement>(form, 'input[name=comfort]:checked').map((c) => c.closest('label')!.querySelector('b')!.textContent);
    if ($<HTMLInputElement>(form, 'input[name=sedation]').checked) comforts.push('Ask about sedation');
    $<HTMLElement>(form, '[data-sum-comfort] span').textContent = comforts.length ? comforts.join(', ') : 'none yet';
    const a = answer($<HTMLSelectElement>(form, '#b-carrier').value, $<HTMLSelectElement>(form, '#b-plan').value as PlanType);
    $<HTMLElement>(form, '[data-sum-ins] span').textContent = `${a.headline} — ${a.amount} ${a.amountLabel.split(' — ')[0]}`;
    $<HTMLInputElement>(form, '[data-date]').value = slot && day ? day.iso : '';
    $<HTMLInputElement>(form, '[data-time]').value = slot ? fmt(slot.start) : '';
    $<HTMLInputElement>(form, '[data-mode]').value = slot?.mode ?? '';
    const pref = form.querySelector<HTMLInputElement>('input[name=preferred][value=first]'); if (pref) pref.checked = !slot;
  }

  // the group changed: the chosen time may no longer fit everyone — keep the day if it still has times
  function groupChanged() {
    slot = null;
    if (day && !slotsMemo(day, visits()).length) day = days.find((d) => slotsMemo(d, visits()).length) ?? null;
    renderDays(); renderTimes(); update();
  }
  form.addEventListener('input', (e) => {
    const t = e.target as HTMLElement;
    if (t.matches('[data-person] input')) { renderLanes(); update(); }
  });
  form.addEventListener('change', (e) => {
    const t = e.target as HTMLElement;
    if (t.matches('[data-person] select')) { groupChanged(); return; }
    update();
  });

  // ---- submit: JSON to the Pages Function, errors next to fields, success → /thanks/
  const submitBtn = $<HTMLButtonElement>(form, '[data-submit]');
  const formError = $<HTMLElement>(form, '[data-form-error]');
  const fieldFor: Record<string, string> = { p0_name: '#p0-name', name: '#b-name', phone: '#b-phone', email: '#b-email' };
  const showErrors = (errors: Record<string, string>) => {
    $$<HTMLElement>(form, '.field-error').forEach((p) => (p.textContent = ''));
    $$<HTMLElement>(form, '[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    let first: HTMLElement | null = null;
    for (const [k, msg] of Object.entries(errors)) {
      if (k === 'form') continue;
      const p = form.querySelector<HTMLElement>(`#${k.replace('_', '-')}-error`); if (p) p.textContent = msg;
      const input = fieldFor[k] ? form.querySelector<HTMLElement>(fieldFor[k]) : null;
      if (input) { input.setAttribute('aria-invalid', 'true'); first ??= input; } else first ??= p;
    }
    formError.textContent = errors.form ?? formError.textContent;
    formError.classList.toggle('is-shown', !!errors.form || Object.keys(errors).length > 0);
    (first ?? formError).focus?.();
    if (first && !first.matches('input')) first.scrollIntoView({ block: 'center' });
  };
  const clientCheck = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if ($<HTMLInputElement>(form, '#p0-name').value.trim().length < 2) e.p0_name = 'Add the first person’s name.';
    if ($<HTMLInputElement>(form, '#b-name').value.trim().length < 2) e.name = 'Tell us who we’re texting.';
    const d = $<HTMLInputElement>(form, '#b-phone').value.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
    if (d.length !== 10 || /^[01]/.test(d)) e.phone = 'We need a 10-digit US mobile number to text you.';
    const em = $<HTMLInputElement>(form, '#b-email').value.trim();
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) e.email = 'That email doesn’t look right — or leave it empty.';
    if (!slot) e.when = 'Pick a time that works — or call us and we’ll find one.';
    return e;
  };
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const local = clientCheck();
    if (Object.keys(local).length) { showErrors(local); return; }
    const fd = new FormData(form); const body: Record<string, unknown> = {};
    for (const k of new Set(fd.keys())) { const all = fd.getAll(k).map(String); body[k] = all.length > 1 ? all : all[0]; }
    submitBtn.disabled = true; submitBtn.textContent = 'Sending…';
    try {
      const r = await fetch(form.action, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({ ok: false, errors: { form: 'Something went wrong. Please call us.' } }));
      if (j.ok) {
        const v = visits(); const minutes = slot ? slot.doneBy - slot.start : 60;
        try { sessionStorage.setItem('bw-booking', JSON.stringify({ names: active().map((r) => $<HTMLInputElement>(r, 'input').value.trim()), visits: v, minutes })); } catch {}
        location.href = j.thanks ?? '/thanks/';
        return;
      }
      showErrors(j.errors ?? { form: 'Something went wrong. Please call us.' });
    } catch {
      showErrors({ form: 'No connection. Please try again or call us.' });
    }
    submitBtn.disabled = false; submitBtn.textContent = 'Request these times';
  });

  // initial day: Saturday if asked for, else the first open day with times
  day = (pre.saturday ? days.find((d) => d.weekday === 6 && slotsMemo(d, visits()).length) : null)
    ?? days.find((d) => slotsMemo(d, visits()).length) ?? null;
  renderDays(); renderTimes(); update();
  // center the chosen day inside the horizontal strip without scrolling the page
  const sel = form.querySelector<HTMLElement>('[data-days] [aria-checked=true]');
  const strip = $<HTMLElement>(form, '[data-days-scroll]');
  if (sel) strip.scrollLeft = sel.offsetLeft - strip.clientWidth / 2 + sel.offsetWidth / 2;
}
