import test from 'node:test';
import assert from 'node:assert/strict';
import { normaliseRow, parseCalendarRows, resolveDay } from '../assets/js/core/calendar.js';
import { rows } from './fixtures/calendar-rows.js';

const cal = parseCalendarRows(rows);

test('normaliseRow cleans keys and values, keeps __row', () => {
  const n = normaliseRow({ ' Banner  text ': ' hi ', Type: ' Exam ', __row: 7 });
  assert.deepEqual(n, { 'banner text': 'hi', type: 'Exam', __row: 7 });
});

test('parse', () => {
  assert.equal(cal.errors.length, 1);
  assert.equal(cal.errors[0].row, 18);
  assert.match(cal.errors[0].message, /Type/);
  assert.equal(cal.events.length, 2);
});

test('parse reports bad dates and reversed ranges', () => {
  const c = parseCalendarRows([
    { Type: 'Exam', Start: 'nope', End: '01/01/2027', __row: 2 },
    { Type: 'Exam', Start: '05/01/2027', End: '01/01/2027', __row: 3 },
    { Start: '01/01/2027', End: '02/01/2027', __row: 4 },
  ]);
  assert.equal(c.errors.length, 3);
  assert.equal(c.periods.length, 0);
});

test('modes on key dates', () => {
  const m = iso => resolveDay(cal, iso);
  assert.equal(m('2026-11-03').mode, 'study');
  assert.deepEqual(m('2026-11-03').countdown, { label: 'Exams Start In', target: '2026-11-09' });
  assert.equal(m('2026-11-10').mode, 'exam');
  assert.deepEqual(m('2026-11-10').block, { start: '2026-11-09', end: '2026-11-20' });
  assert.deepEqual(m('2026-11-10').countdown, { label: 'Exams Complete In', target: '2026-11-21' });
  assert.equal(m('2026-11-23').mode, 'summer');
  assert.equal(m('2026-11-23').countdown, null);
  assert.equal(m('2026-12-14').mode, 'assessment');
  assert.equal(m('2026-12-21').mode, 'christmas');
  assert.deepEqual(m('2026-12-21').countdown, { label: 'Campus Reopens In', target: '2027-01-11' });
  assert.equal(m('2027-01-05').mode, 'break');
  assert.deepEqual(m('2027-01-05').countdown, { label: 'Classes Resume In', target: '2027-01-11' });
  assert.deepEqual(m('2027-01-05').block, { start: '2027-01-02', end: '2027-01-10' });
  assert.deepEqual(m('2027-02-09').countdown, { label: 'Orientation Starts In', target: '2027-02-15' });
});

test('weekend inherits Friday', () => {
  assert.equal(resolveDay(cal, '2026-11-28').mode, 'summer');
  assert.equal(resolveDay(cal, '2027-01-02').mode, 'christmas');
});

test('gap week is break with countdown', () => {
  const s = resolveDay(cal, '2027-02-08');
  assert.equal(s.mode, 'break');
  assert.equal(s.countdown.target, '2027-02-15');
});

test('past last row is break without countdown', () => {
  const s = resolveDay(cal, '2028-06-01');
  assert.equal(s.mode, 'break'); assert.equal(s.countdown, null);
});

test('priority and events', () => {
  const extra = parseCalendarRows([...rows, { Type: 'Christmas', Name: 'X', Start: '14/12/2026', End: '14/12/2026', __row: 99 }]);
  assert.equal(resolveDay(extra, '2026-12-14').mode, 'christmas');
  const s = resolveDay(cal, '2026-11-24');
  assert.equal(s.mode, 'summer'); assert.equal(s.events[0].banner, 'Library closed today');
});

test('explicit Semester Break row is a break period with countdown', () => {
  const c = parseCalendarRows([
    { Type: 'semester break', Name: 'Break', Start: '04/01/2027', End: '08/01/2027', __row: 2 },
    { Type: 'Teaching', Name: 'T1', Start: '11/01/2027', End: '15/01/2027', __row: 3 },
  ]);
  const s = resolveDay(c, '2027-01-06');
  assert.equal(s.mode, 'break');
  assert.equal(s.period.type, 'break');
  assert.deepEqual(s.countdown, { label: 'Classes Resume In', target: '2027-01-11' });
});

test('empty calendar resolves to break', () => {
  const s = resolveDay(parseCalendarRows([]), '2026-11-20');
  assert.equal(s.mode, 'break'); assert.equal(s.countdown, null);
});
