import { toISODate, toHHMM, dayCode } from './dates.js';
import { normaliseRow } from './calendar.js';

const DAYS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

const isBlank = v => v === undefined || v === null || v === '';
const text = v => (isBlank(v) ? '' : String(v).trim());

function termRange(cal, term) {
  const ps = ((cal && cal.periods) || []).filter(p => p.term === term);
  if (!ps.length) return null;
  return {
    from: ps.reduce((m, p) => (p.start < m ? p.start : m), ps[0].start),
    to: ps.reduce((m, p) => (p.end > m ? p.end : m), ps[0].end),
  };
}

export function parseTimetableRows(rows, cal) {
  const classes = [];
  const errors = [];

  for (const raw of rows || []) {
    const r = normaliseRow(raw);
    const row = r.__row;
    if (Object.entries(r).every(([k, v]) => k === '__row' || isBlank(v))) continue;
    const fail = message => errors.push({ row, message });

    const term = text(r.term);
    const unit = text(r.unit);
    if (!term) { fail('Missing Term'); continue; }
    if (!unit) { fail('Missing Unit'); continue; }

    const day = DAYS[text(r.day).slice(0, 3).toLowerCase()];
    if (!day) { fail(`Invalid Day "${text(r.day)}"`); continue; }

    const start = toHHMM(r.start);
    if (!start) { fail('Invalid Start time'); continue; }
    const end = toHHMM(r.end);
    if (!end) { fail('Invalid End time'); continue; }
    if (end <= start) { fail('End time must be after Start time'); continue; }

    let from = null;
    let to = null;
    if (!isBlank(r.from)) {
      from = toISODate(r.from);
      if (!from) { fail('Invalid From date'); continue; }
    }
    if (!isBlank(r.to)) {
      to = toISODate(r.to);
      if (!to) { fail('Invalid To date'); continue; }
    }
    if (!from || !to) {
      const range = termRange(cal, term);
      if (!range) { fail(`Term ${term} not in calendar and no From/To`); continue; }
      from = from || range.from;
      to = to || range.to;
    }
    if (to < from) { fail('To date is before From date'); continue; }

    classes.push({
      term, unit, unitName: text(r['unit name']), lecturer: text(r.lecturer),
      day, start, end, room: text(r.room), from, to, row,
    });
  }
  return { classes, errors };
}

export function classesForDay(classes, term, iso) {
  if (!term) return [];
  const code = dayCode(iso);
  return (classes || [])
    .filter(c => c.term === term && c.day === code && c.from <= iso && iso <= c.to)
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
}

export function displayName(c) {
  return c.unitName ? `${c.unit}: ${c.unitName}` : c.unit;
}
