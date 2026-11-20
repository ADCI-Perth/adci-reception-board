import { addDays, weekday, formatShort } from './dates.js';
import { resolveDay } from './calendar.js';
import { bannerFor } from './banner.js';

const TEACHING_TYPES = ['teaching', 'summer'];

export function checkData(cal, tt) {
  const issues = [];
  const add = (level, message) => issues.push({ level, message });
  const periods = (cal && cal.periods) || [];
  const classes = (tt && tt.classes) || [];

  for (const e of (cal && cal.errors) || []) add('error', `Calendar row ${e.row}: ${e.message}`);
  for (const e of (tt && tt.errors) || []) add('error', `Timetable row ${e.row}: ${e.message}`);

  // Overlapping periods of the same type.
  for (let i = 0; i < periods.length; i++) {
    for (let j = i + 1; j < periods.length; j++) {
      const a = periods[i];
      const b = periods[j];
      if (a.type === b.type && a.start <= b.end && b.start <= a.end) {
        add('warning', `Overlapping ${a.type} periods: "${a.name}" (row ${a.row}) and "${b.name}" (row ${b.row})`);
      }
    }
  }

  const calTerms = new Set(periods.map(p => p.term).filter(Boolean));
  const classTerms = new Set(classes.map(c => c.term));

  for (const term of classTerms) {
    if (!calTerms.has(term)) add('warning', `Timetable term ${term} not in calendar`);
  }
  for (const term of calTerms) {
    const teaches = periods.some(p => p.term === term && TEACHING_TYPES.includes(p.type));
    if (teaches && !classTerms.has(term)) add('warning', `No classes for term ${term}`);
  }

  // Uncovered weekdays between first and last period.
  if (periods.length) {
    const first = periods.reduce((m, p) => (p.start < m ? p.start : m), periods[0].start);
    const last = periods.reduce((m, p) => (p.end > m ? p.end : m), periods[0].end);
    let rangeStart = null;
    let rangeEnd = null;
    const flush = () => {
      if (rangeStart) {
        add('warning', `No period set for ${formatShort(rangeStart)} – ${formatShort(rangeEnd)} (board shows Semester Break)`);
      }
      rangeStart = null;
      rangeEnd = null;
    };
    for (let d = first; d <= last; d = addDays(d, 1)) {
      const wd = weekday(d);
      if (wd === 0 || wd === 6) continue;
      if (periods.some(p => p.start <= d && d <= p.end)) {
        flush();
      } else {
        rangeStart = rangeStart || d;
        rangeEnd = d;
      }
    }
    flush();
  }

  return issues;
}

export function previewDays(cal, fromIso, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const date = addDays(fromIso, i);
    const state = resolveDay(cal, date);
    out.push({ date, mode: state.mode, banner: bannerFor(state) });
  }
  return out;
}
