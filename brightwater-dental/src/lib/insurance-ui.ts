// Loaded on first interaction with an [data-insurance] form (dynamic import), so it costs nothing on page load.
import { answer, type PlanType } from './insurance';

export function init(form: HTMLFormElement) {
  const out = form.querySelector<HTMLElement>('[data-answer]')!;
  const render = () => {
    const data = new FormData(form);
    const a = answer(String(data.get('carrier')), String(data.get('plan') || 'ppo') as PlanType);
    out.dataset.tone = a.tone;
    out.querySelector('[data-headline]')!.textContent = a.headline;
    out.querySelector('[data-amount]')!.textContent = a.amount;
    out.querySelector('[data-amount-label]')!.textContent = a.amountLabel;
    out.querySelector('[data-detail]')!.textContent = a.detail;
    const cta = out.querySelector<HTMLAnchorElement>('[data-cta]')!;
    cta.href = a.cta.href;
    cta.textContent = a.cta.label;
    form.querySelector<HTMLElement>('[data-plan-row]')!.hidden = data.get('carrier') === 'none';
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', (e) => { e.preventDefault(); render(); out.focus(); });
  form.querySelector<HTMLElement>('[data-submit]')!.hidden = true; // answers update live once JS is here
  render();
}
