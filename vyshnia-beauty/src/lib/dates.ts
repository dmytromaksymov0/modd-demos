// Dates for the booking summary. Guarantee = visit date + 21 days (site.guaranteeDays), shown as «до 12 листопада».
const MONTHS_GEN = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
const WD_SHORT = ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const dayMonth = (d: Date) => `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
export const weekdayShort = (d: Date) => WD_SHORT[d.getDay()];
export const guaranteeUntil = (visit: Date, days = 21) => dayMonth(addDays(visit, days));
