import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCalendarRows } from '../assets/js/core/calendar.js';
import { parseTimetableRows, classesForDay, displayName } from '../assets/js/core/timetable.js';
import { rows as calRows } from './fixtures/calendar-rows.js';
import { rows } from './fixtures/timetable-rows.js';

const cal = parseCalendarRows(calRows);
const S1 = 'Summer 1 2026-27';
const ids = (tt, iso) => classesForDay(tt.classes, S1, iso).map(c => c.unit);

test('summer 1 days', () => {
  const tt = parseTimetableRows(rows, cal);
  assert.equal(tt.errors.length, 0);
  assert.deepEqual(ids(tt, '2026-11-23'), ['CAP302']);
  assert.deepEqual(ids(tt, '2026-11-24'), ['ORG303', 'CYB306']);
  assert.deepEqual(ids(tt, '2026-12-15'), []);
  assert.deepEqual(ids(tt, '2026-12-18'), ['CAP302']);
  assert.deepEqual(classesForDay(tt.classes, null, '2026-11-23'), []);
  assert.deepEqual(classesForDay(tt.classes, 'Other', '2026-11-23'), []);
});

test('class shape', () => {
  const c = parseTimetableRows(rows, cal).classes[0];
  assert.deepEqual(c, {
    term: S1, unit: 'CAP302', unitName: 'Industry Capstone', lecturer: 'Dr Anna Griffin',
    day: 'Mon', start: '09:00', end: '13:00', room: 'ADCI Classroom 1',
    from: '2026-11-23', to: '2026-12-18', row: 2,
  });
});

test('header normalisation', () => {
  const tt = parseTimetableRows([
    { ' TERM ': S1, unit: 'X1', 'DAY ': 'monday', ' Start': '09:00', END: '10:00', ' unit  NAME': 'Ex', __row: 2 },
  ], cal);
  assert.equal(tt.errors.length, 0);
  assert.equal(tt.classes[0].day, 'Mon');
  assert.equal(tt.classes[0].unitName, 'Ex');
});

test('blank rows skipped', () => {
  const tt = parseTimetableRows([{ Term: '', Unit: '', Day: '', Start: '', End: '', __row: 2 }], cal);
  assert.deepEqual(tt, { classes: [], errors: [] });
});

test('time formats', () => {
  const tt = parseTimetableRows([
    { Term: S1, Unit: 'X1', Day: 'Mon', Start: '9:00 am', End: 0.5, __row: 2 },
  ], cal);
  assert.equal(tt.classes[0].start, '09:00');
  assert.equal(tt.classes[0].end, '12:00');
});

test('From/To default to whole term', () => {
  const tt = parseTimetableRows([
    { Term: S1, Unit: 'X1', Day: 'Mon', Start: '09:00', End: '10:00', __row: 2 },
  ], cal);
  assert.equal(tt.classes[0].from, '2026-11-23');
  assert.equal(tt.classes[0].to, '2026-12-18');
});

test('term not in calendar', () => {
  const tt = parseTimetableRows([
    { Term: 'Nope', Unit: 'X1', Day: 'Mon', Start: '09:00', End: '10:00', __row: 4 },
    { Term: 'Nope', Unit: 'X2', Day: 'Mon', Start: '09:00', End: '10:00', From: '01/01/2027', To: '02/01/2027', __row: 5 },
  ], cal);
  assert.equal(tt.classes.length, 1);
  assert.deepEqual(tt.errors, [{ row: 4, message: 'Term Nope not in calendar and no From/To' }]);
});

test('errors', () => {
  const tt = parseTimetableRows([
    { Term: S1, Unit: 'X1', Day: 'Funday', Start: '09:00', End: '10:00', __row: 2 },
    { Term: S1, Unit: 'X2', Day: 'Mon', Start: '11:00', End: '10:00', __row: 3 },
    { Term: S1, Day: 'Mon', Start: '09:00', End: '10:00', __row: 4 },
    { Term: S1, Unit: 'X4', Day: 'Mon', Start: 'zzz', End: '10:00', __row: 5 },
  ], cal);
  assert.equal(tt.classes.length, 0);
  assert.deepEqual(tt.errors.map(e => e.row), [2, 3, 4, 5]);
  assert.match(tt.errors[0].message, /Day/);
  assert.match(tt.errors[1].message, /End/);
});

test('classesForDay is stable for equal start', () => {
  const mk = unit => ({ Term: S1, Unit: unit, Day: 'Mon', Start: '09:00', End: '10:00' });
  const tt = parseTimetableRows([{ ...mk('B'), __row: 2 }, { ...mk('A'), __row: 3 }], cal);
  assert.deepEqual(ids(tt, '2026-11-23'), ['B', 'A']);
});

test('displayName', () => {
  assert.equal(displayName({ unit: 'CAP302', unitName: 'Industry Capstone' }), 'CAP302: Industry Capstone');
  assert.equal(displayName({ unit: 'CAP302', unitName: '' }), 'CAP302');
});
