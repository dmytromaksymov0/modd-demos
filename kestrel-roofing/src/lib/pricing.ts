// Roof price estimate shared by the home mini-calculator and the full calculator page.
// Demo rates for Columbus, OH (2026), installed with one-layer tear-off. Confirm with the real client.

export type Material = 'architectural' | 'metal';

export const RATES: Record<Material, { low: number; high: number; label: string }> = {
  architectural: { low: 475, high: 650, label: 'Architectural shingle' },
  metal: { low: 1050, high: 1450, label: 'Standing-seam metal' },
};

// Itemised extras we quote openly (see Roof Replacement → "Costs we tell you about first").
export const EXTRAS = {
  extraLayer: { price: 45, unit: 'per square', label: 'Each extra layer of old shingles to tear off' },
  decking: { price: 85, unit: 'per sheet', label: 'Rotten decking (4 × 8 ft sheet) — only with photo + your OK' },
  skylight: { price: 250, unit: 'each', label: 'Re-flashing a skylight' },
  cricket: { price: 450, unit: 'each', label: 'Chimney cricket (wide chimneys)' },
} as const;

export const PITCH_MIN = 4;
export const PITCH_MAX = 12;

/** Roof area ÷ footprint for a rise-per-12 pitch: √(rise² + 12²) / 12. */
export const pitchFactor = (rise: number) => Math.sqrt(rise * rise + 144) / 12;

const OVERHANG = 1.15; // eaves and rakes beyond the walls
const WASTE = 1.1;     // cutting waste, starter, ridge

export interface EstimateInput { homeSqft: number; stories: 1 | 2; pitch: number; material: Material }
export interface Estimate { squares: number; low: number; high: number; days: number; monthly: number }

const round100 = (n: number) => Math.round(n / 100) * 100;
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

export function estimate({ homeSqft, stories, pitch, material }: EstimateInput): Estimate {
  const rise = clamp(Math.round(pitch), PITCH_MIN, PITCH_MAX);
  const footprint = clamp(homeSqft, 400, 12000) / stories;
  const roofSqft = footprint * OVERHANG * pitchFactor(rise) * WASTE;
  const squares = Math.round((roofSqft / 100) * 2) / 2; // nearest half square
  const r = RATES[material];
  const steepRate = rise >= 10 ? 1.12 : rise >= 8 ? 1.05 : 1; // steep roofs need harness work and more time
  const low = round100(squares * r.low * steepRate);
  const high = round100(squares * r.high * steepRate);
  let days = squares <= 32 ? 1 : squares <= 48 ? 2 : 3;
  if (material === 'metal') days += 1;
  if (rise >= 10 && squares > 24) days += 1;
  const monthly = Math.round((low + high) / 2 / 12 / 10) * 10; // 0% APR, 12 months, midpoint
  return { squares, low, high, days, monthly };
}

export const usd = (n: number) => '$' + n.toLocaleString('en-US');
