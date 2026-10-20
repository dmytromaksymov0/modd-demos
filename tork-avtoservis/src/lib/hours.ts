// Opening status in Kyiv time. Pure functions — unit-tested in phase 5.
export type Day = { day: number; short: string; open: number; close: number };

export function nowIn(tz: string, d: Date = new Date()): { day: number; min: number } {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)!.value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, min: Number(get('hour')) * 60 + Number(get('minute')) };
}

export const fmt = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const dayName = ['у неділю', 'у понеділок', 'у вівторок', 'у середу', 'у четвер', 'у пʼятницю', 'у суботу'];

export function status(days: readonly Day[], day: number, min: number): { open: boolean; text: string; short: string } {
  const today = days.find((d) => d.day === day);
  if (today && min >= today.open && min < today.close) {
    return { open: true, text: `Відчинено до ${fmt(today.close)}`, short: `до ${fmt(today.close)}` };
  }
  if (today && min < today.open) return { open: false, text: `Зачинено · відкриємо о ${fmt(today.open)}`, short: `з ${fmt(today.open)}` };
  for (let i = 1; i <= 7; i++) {
    const next = days.find((d) => d.day === (day + i) % 7);
    if (next) {
      const when = i === 1 ? 'завтра' : dayName[next.day];
      return { open: false, text: `Зачинено · ${when} з ${fmt(next.open)}`, short: `${when} з ${fmt(next.open)}` };
    }
  }
  return { open: false, text: 'Зачинено', short: 'зачинено' };
}
