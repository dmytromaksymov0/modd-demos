// Brightwater Plan family calculator (Insurance & Financing). Cash prices are demo values for Austin —
// confirm with the real practice. Pure: unit-tested in phase 5.
import { prices } from '../config/site.ts';

export const cash = {
  adult: { visit: 165, xrays: 95 },   // cleaning + exam per visit, X-rays once a year
  kid: { visit: 125, xrays: 65 },
};

export function yearly(adults: number, kids: number) {
  const without = adults * (cash.adult.visit * 2 + cash.adult.xrays) + kids * (cash.kid.visit * 2 + cash.kid.xrays);
  const plan = (adults * prices.planAdult + kids * prices.planKid) * 12;
  return { without, plan, saved: without - plan, perMonth: adults * prices.planAdult + kids * prices.planKid };
}
