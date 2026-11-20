import { toISODate, addDays, daysBetween, weekday } from './dates.js';

const TYPE_MAP = Object.freeze({
  orientation: 'orientation',
  teaching: 'teaching',
  'tuition free': 'tuition',
  study: 'study',
  exam: 'exam',
  assessment: 'assessment',
  'semester break': 'break',
  summer: 'summer',
  christmas: 'christmas',
  event: 'event',
});

// Own keys only, so "constructor"/"toString" are rejected; inner whitespace collapsed.
function lookupType(value) {
  const key = text(value).trim().replace(/\s+/g, ' ').toLowerCase();
  return Object.hasOwn(TYPE_MAP, key) ? TYPE_MAP[key] : null;
}

// Highest priority first.
const PRIORITY = ['christmas', 'exam', 'study', 'assessment', 'tuition', 'summer', 'orientation', 'teaching', 'break'];

const NEXT_LABEL = {
  orientation: 'Orientation Starts In',
  teaching: 'Classes Resume In',
  summer: 'Classes Resume In',
  exam: 'Exams Start In',
  study: 'Study Week Starts In',
  tuition: 'Tuition-Free Week Starts In',
  assessment: 'Assessment Week Starts In',
  christmas: 'Holiday Break Starts In',
  break: 'Classes Resume In',
};

export function normaliseRow(row) {
  const out = {};
  for (const [key, value] of Object.entries(row || {})) {
    const k = key === '__row' ? key : String(key).trim().replace(/\s+/g, ' ').toLowerCase();
    out[k] = typeof value === 'string' ? value.trim() : value;
  }
  return out;
}

const isBlank = v => v === undefined || v === null || v === '';
const text = v => (isBlank(v) ? '' : String(v));

export function parseCalendarRows(rows) {
  const periods = [];
  const events = [];
  const errors = [];

  for (const raw of rows || []) {
    const r = normaliseRow(raw);
    const row = r.__row;
    if (Object.entries(r).every(([k, v]) => k === '__row' || isBlank(v))) continue;

    const type = lookupType(r.type);
    if (!type) {
      errors.push({ row, message: `Unknown or missing Type "${text(r.type)}"` });
      continue;
    }
    const start = toISODate(r.start);
    const end = toISODate(r.end);
    if (!start || !end) {
      errors.push({ row, message: `Invalid ${!start ? 'Start' : 'End'} date` });
      continue;
    }
    if (end < start) {
      errors.push({ row, message: 'End date is before Start date' });
      continue;
    }
    const period = {
      type, name: text(r.name), start, end, term: text(r.term), banner: text(r['banner text']), row,
    };
    (type === 'event' ? events : periods).push(period);
  }

  const byStart = (a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0);
  periods.sort(byStart);
  events.sort(byStart);
  return { periods, events, errors };
}

function covering(periods, iso) {
  const hits = periods.filter(p => p.start <= iso && iso <= p.end);
  hits.sort((a, b) => PRIORITY.indexOf(a.type) - PRIORITY.indexOf(b.type));
  return hits[0] || null;
}

function mergedBlock(periods, period) {
  const same = periods.filter(p => p.type === period.type);
  const i = same.indexOf(period);
  let start = period.start;
  let end = period.end;
  for (let j = i - 1; j >= 0 && daysBetween(same[j].end, start) <= 3; j--) start = same[j].start < start ? same[j].start : start;
  for (let j = i + 1; j < same.length && daysBetween(end, same[j].start) <= 3; j++) end = same[j].end > end ? same[j].end : end;
  return { start, end };
}

function firstWeekdayAfter(iso) {
  let d = addDays(iso, 1);
  while (weekday(d) === 0 || weekday(d) === 6) d = addDays(d, 1);
  return d;
}

export function resolveDay(cal, iso) {
  const periods = (cal && cal.periods) || [];
  const dayEvents = ((cal && cal.events) || []).filter(e => e.start <= iso && iso <= e.end);

  let period = covering(periods, iso);
  if (!period) {
    const wd = weekday(iso);
    if (wd === 0 || wd === 6) period = covering(periods, addDays(iso, wd === 6 ? -1 : -2));
  }

  let mode;
  let block = null;
  let next = null;

  if (period) {
    mode = period.type;
    block = mergedBlock(periods, period);
    next = periods.find(p => p.start > block.end) || null;
  } else {
    mode = 'break';
    const prev = periods.filter(p => p.end < iso).sort((a, b) => (a.end < b.end ? 1 : -1))[0] || null;
    next = periods.find(p => p.start > iso) || null;
    if (prev || next) {
      block = {
        start: prev ? addDays(prev.end, 1) : iso,
        end: next ? addDays(next.start, -1) : iso,
      };
    }
  }

  let countdown = null;
  if (mode === 'exam') {
    countdown = { label: 'Exams Complete In', target: addDays(block.end, 1) };
  } else if (mode === 'tuition') {
    if (next) countdown = { label: 'Classes Resume In', target: next.start };
  } else if (mode === 'christmas') {
    // Campus (reception/office) reopens on the first weekday after the closure,
    // even if classes resume later.
    countdown = { label: 'Campus Reopens In', target: firstWeekdayAfter(block.end) };
  } else if (mode === 'study' || mode === 'assessment' || mode === 'break') {
    if (next) countdown = { label: NEXT_LABEL[next.type], target: next.start };
  }
  if (countdown && daysBetween(iso, countdown.target) <= 0) countdown = null;

  return { mode, period: period || null, block, next, countdown, events: dayEvents };
}
