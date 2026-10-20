// The example estimate used in the hero chat and the «Ремонт у чаті» section.
// The car is a Subaru Forester (class C) because that is the car really standing in bay 04 on our photo.
// Every photo caption must describe what is actually in the frame — see docs/phase-2-report.md §9.
import { works, combos } from './works.ts';
import { carClasses } from '../config/site.ts';
import { roundTo10 } from '../lib/calc.ts';

const rate = carClasses.find((c) => c.id === 'C')!.rate;
const h = (id: string) => works.find((w) => w.id === id)!.hours;
const combo = combos.find((c) => c.ids.includes('pads-front'))!;

export const car = { name: 'Subaru Forester 2.0', km: '214 600 км', classId: 'C' };

export const lines = [
  { id: 'pads', what: 'Колодки передні', short: '2,1 мм', finding: 'залишок 2,1 мм, мінімум — 3 мм', labour: roundTo10(h('pads-front') * rate), parts: 1850, partsLabel: 'колодки', kind: 'urgent' as const, doing: true },
  { id: 'discs', what: 'Диски передні', short: '22,4 мм', finding: '22,4 мм при мінімумі 22 мм — ще походять', labour: roundTo10(h('discs-front') * rate), parts: 4200, partsLabel: 'диски', kind: 'later' as const, laterLabel: 'До ~10 000 км', doing: false, comboWith: 'pads', comboSaving: roundTo10(combo.hours * rate) },
  { id: 'links', what: 'Стійки стабілізатора', short: 'без люфту', finding: 'люфту немає', labour: 0, parts: 0, kind: 'none' as const, doing: false },
];
