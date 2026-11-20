import { formatLong, daysBetween, addDays } from './dates.js';

const FIXED = {
  exam: 'Exam week',
  study: 'Study week',
  tuition: 'Tuition-free week',
  assessment: 'Assessment week',
  christmas: 'Christmas closure',
};
const WITH_TERM = {
  teaching: 'classes start',
  summer: 'classes start',
  orientation: 'orientation',
};

function titleFor(period) {
  if (FIXED[period.type]) return FIXED[period.type];
  const phrase = WITH_TERM[period.type];
  if (!phrase) return null;
  const term = (period.term || '').trim();
  if (!term) return phrase.charAt(0).toUpperCase() + phrase.slice(1);
  return `${term} ${phrase}`;
}

export function keyDates(cal, iso, { limit = 3, horizonDays = 120 } = {}) {
  const horizon = addDays(iso, horizonDays);
  const out = [];
  const add = (date, title) => {
    if (date > iso && date <= horizon) {
      out.push({ iso: date, title, sub: formatLong(date), days: daysBetween(iso, date) });
    }
  };
  for (const e of cal.events || []) add(e.start, e.name);
  const periods = cal.periods || [];
  periods.forEach((p, i) => {
    const prev = periods[i - 1];
    const changed = !prev || prev.type !== p.type || daysBetween(prev.end, p.start) > 3;
    if (!changed || p.type === 'break') return;
    const title = titleFor(p);
    if (title) add(p.start, title);
  });
  out.sort((a, b) => (a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : a.title < b.title ? -1 : a.title > b.title ? 1 : 0));
  return out.slice(0, limit);
}
