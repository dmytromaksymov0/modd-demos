// Home-page interactivity, loaded on the first interaction (see index.astro). Pure math lives in
// estimate.ts and calc.ts; this file only reads the DOM and writes results.
import { estimateTotal, type Line } from './estimate.ts';
import { calculate, fmtMoney, fmtTime } from './calc.ts';
import { works, combos } from '../data/works.ts';
import { carClasses } from '../config/site.ts';

function initEstimate(form: HTMLFormElement) {
  const items = [...form.querySelectorAll<HTMLElement>('[data-line]')];
  const read = (): Line[] => items.map((el) => ({
    id: el.dataset.line!, labour: Number(el.dataset.labour), parts: Number(el.dataset.parts),
    doing: form.querySelector<HTMLInputElement>(`input[name="est-${el.dataset.line}"][value="do"]`)?.checked ?? false,
    comboWith: el.dataset.comboWith || undefined, comboSaving: Number(el.dataset.comboSaving) || undefined,
  }));
  const total = form.querySelector('[data-total]')!, split = form.querySelector('[data-split]')!;
  const label = form.querySelector('[data-approve-label]')!, combo = form.querySelector<HTMLElement>('[data-combo]')!;
  const thread = form.querySelector('[data-thread]')!;
  const render = () => {
    const t = estimateTotal(read());
    total.textContent = fmtMoney(t.total);
    split.textContent = `робота ${fmtMoney(t.labour)} · запчастини ${fmtMoney(t.parts)}`;
    label.textContent = t.total ? `Погоджую ${fmtMoney(t.total)}` : 'Нічого не робимо сьогодні';
    combo.hidden = !t.saving;
    thread.replaceChildren();
  };
  form.addEventListener('change', render);
  form.querySelector('[data-approve]')!.addEventListener('click', () => {
    const t = estimateTotal(read());
    const later = read().filter((l) => !l.doing && l.labour).length;
    const est = document.querySelector<HTMLInputElement>('[data-est-field]');
    const doingIds = read().filter((l) => l.doing).map((l) => l.id);
    if (est) est.value = doingIds.length ? doingIds.join(',') : '-';
    const mine = document.createElement('p');
    mine.className = 'ml-auto max-w-[85%] bg-ochre px-4 py-2.5 text-steel font-semibold';
    mine.textContent = t.total ? `Погоджую ${fmtMoney(t.total)}` : 'Сьогодні нічого не робимо, дякую';
    const reply = document.createElement('p');
    reply.className = 'max-w-[85%] border border-steel-2 px-4 py-2.5';
    reply.textContent = t.total
      ? `Андрій: Прийнято. Починаємо о 11:00, фото скину по ходу.${later ? ' Відкладене записав у нагадування.' : ''}`
      : 'Андрій: Добре. Діагностика ходової — безкоштовно, авто можна забирати.';
    thread.replaceChildren(mine, reply);
  });
  render();
}

function initCalc(form: HTMLFormElement) {
  const out = {
    total: form.querySelector('[data-calc-total]')!, time: form.querySelector('[data-calc-time]')!,
    saving: form.querySelector<HTMLElement>('[data-calc-saving]')!, cls: form.querySelector('[data-calc-class]')!,
  };
  const state = () => {
    const klas = form.querySelector<HTMLInputElement>('input[name="klas"]:checked')!.value;
    const rate = carClasses.find((c) => c.id === klas)!.rate;
    const ids = [...form.querySelectorAll<HTMLInputElement>('input[name="robota"]:checked')].map((i) => i.value);
    return { klas, ids, r: calculate(ids, rate, works, combos) };
  };
  const render = () => {
    const { klas, ids, r } = state();
    out.cls.textContent = `клас ${klas}`;
    out.total.textContent = ids.length ? fmtMoney(r.total) : '—';
    out.time.textContent = ids.length ? `≈ ${fmtTime(r.minutes)}` : 'оберіть роботи';
    out.saving.hidden = !r.saving;
    if (r.saving) out.saving.innerHTML = r.savings.map((s) => `${s.label}: <b class="num">−${fmtMoney(s.money)}</b>${s.minutes ? `, <span class="num">−${fmtTime(s.minutes)}</span>` : ''}`).join('<br>');
  };
  form.addEventListener('change', render);
  form.querySelector('[data-calc-book]')?.addEventListener('click', () => {
    const { klas, ids, r } = state();
    const names = ids.map((id) => works.find((w) => w.id === id)!.label.toLowerCase()).join(', ');
    const text = ids.length ? `Розрахунок: клас ${klas} — ${names}. Робота ${fmtMoney(r.total)}, ≈ ${fmtTime(r.minutes)}.` : '';
    const field = document.querySelector<HTMLInputElement>('[data-calc-field]');
    const klasField = document.querySelector<HTMLInputElement>('[data-calc-klas]');
    const summary = document.querySelector<HTMLElement>('[data-calc-summary]');
    if (field) field.value = ids.join(',');
    if (klasField) klasField.value = ids.length ? klas : '';
    if (summary) { summary.textContent = text; summary.classList.toggle('hidden', !text); }
  });
  render();
}

export function init() {
  document.querySelectorAll<HTMLFormElement>('[data-estimate]').forEach(initEstimate);
  document.querySelectorAll<HTMLFormElement>('[data-calc]').forEach(initCalc);
}
