// Day / night / curfew by Europe/Kyiv time — the logic of moment 4.2. Pure; unit-tested in tests/time.test.ts.
// The inline <head> script in BaseLayout is generated from `stateAt` (Function.prototype.toString), so the browser runs
// exactly the tested code.
export type TimeState = 'day' | 'night' | 'curfew';
export interface Bounds { nightFrom: number; nightTo: number; curfewFrom: number; curfewTo: number }

/** Minutes after midnight → state. Curfew wins over night; night wraps over midnight. */
export function stateAt(m: number, b: Bounds): TimeState {
  if (m >= b.curfewFrom && m < b.curfewTo) return 'curfew';
  if (m >= b.nightFrom || m < b.nightTo) return 'night';
  return 'day';
}

/** Minutes after midnight in a time zone (Europe/Kyiv handles DST itself). */
export function minutesIn(tz: string, d: Date = new Date()): number {
  const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d).split(':').map(Number);
  return h * 60 + m;
}
