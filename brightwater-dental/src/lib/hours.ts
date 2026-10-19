// Opening-hours logic shared by the live status, the week lanes and (later) the booking widget.
// Pure functions: unit-testable with node --test.
export type Day = { day: number; short: string; open: number; close: number };

export function fmt(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`;
}

/** Weekday (0 = Sun) and minutes after midnight in the practice's timezone. */
export function nowIn(tz: string, date = new Date()): { day: number; min: number } {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, min: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
}

export function status(days: readonly Day[], day: number, min: number): { open: boolean; text: string; short: string } {
  const today = days.find((d) => d.day === day);
  if (today && min >= today.open && min < today.close) return { open: true, text: `Open now · until ${fmt(today.close)}`, short: `Open till ${fmt(today.close)}` };
  if (today && min < today.open) return { open: false, text: `Opens today at ${fmt(today.open)}`, short: `Opens ${fmt(today.open)}` };
  for (let i = 1; i <= 7; i++) {
    const next = days.find((d) => d.day === (day + i) % 7);
    if (next) {
      const when = i === 1 ? 'tomorrow' : next.short;
      return { open: false, text: `Closed · opens ${when} ${fmt(next.open)}`, short: `Opens ${when} ${fmt(next.open)}` };
    }
  }
  return { open: false, text: 'Closed', short: 'Closed' };
}
