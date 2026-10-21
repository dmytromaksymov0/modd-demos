// Real polish colours on the swatch tips. `token` is the colour token in src/styles/tokens.css.
export const shades = [
  { id: 'vyshnia', name: 'Вишня', token: '--color-shade-vyshnia', note: 'глибокий вишневий' },
  { id: 'pudra', name: 'Пудра', token: '--color-shade-pudra', note: 'нюдовий рожево-бежевий' },
  { id: 'moloko', name: 'Молоко', token: '--color-shade-moloko', note: 'напівпрозорий молочний' },
  { id: 'french', name: 'Френч', token: '--color-shade-french', note: 'біла лінія усмішки' },
  { id: 'tsehla', name: 'Цегла', token: '--color-shade-tsehla', note: 'теплий теракотово-червоний' },
  { id: 'nich', name: 'Ніч', token: '--color-shade-nich', note: 'майже чорний' },
] as const;
export type ShadeId = (typeof shades)[number]['id'];
