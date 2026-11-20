import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { parseCalendarRows } from '../assets/js/core/calendar.js';
import { parseTimetableRows } from '../assets/js/core/timetable.js';
import { sheetRows } from '../assets/js/core/workbook.js';
import { checkData, previewDays } from '../assets/js/core/checks.js';
import { rows as calRows } from './fixtures/calendar-rows.js';
import { rows as ttRows } from './fixtures/timetable-rows.js';

const cal = parseCalendarRows(calRows);
const tt = parseTimetableRows(ttRows, cal);
const msgs = list => list.map(i => i.message);

test('checkData reports parse errors with row prefix and error level', () => {
  const out = checkData(cal, tt);
  const hit = out.find(i => /^Calendar row \d+: .*Type/.test(i.message));
  assert.ok(hit);
  assert.equal(hit.level, 'error');
});

test('checkData flags terms with no classes', () => {
  const out = checkData(cal, tt);
  const hit = out.find(i => i.message.includes('No classes for term Feb 2027'));
  assert.ok(hit);
  assert.equal(hit.level, 'warning');
});

test('checkData flags uncovered weekday ranges', () => {
  const out = checkData(cal, tt);
  const hit = out.find(i => i.message.includes('4 Jan 2027'));
  assert.ok(hit);
  assert.equal(hit.level, 'warning');
  assert.match(hit.message, /^No period set for 4 Jan 2027 – 8 Jan 2027 \(board shows Semester Break\)$/);
});

test('checkData flags timetable term missing from calendar and overlaps', () => {
  const c = parseCalendarRows([
    { Type: 'Teaching', Name: 'A', Start: '01/03/2027', End: '05/03/2027', Term: 'X', __row: 2 },
    { Type: 'Teaching', Name: 'B', Start: '03/03/2027', End: '10/03/2027', Term: 'X', __row: 3 },
    { Type: 'Event', Name: 'E', Start: '03/03/2027', End: '04/03/2027', __row: 4 },
  ]);
  const t = { classes: [{ term: 'Y', unit: 'U', day: 'Mon', start: '09:00', end: '10:00', from: '2027-03-01', to: '2027-03-10', row: 2 }], errors: [{ row: 5, message: 'Bad' }] };
  const out = checkData(c, t);
  const m = msgs(out);
  assert.ok(m.includes('Timetable row 5: Bad'));
  assert.ok(m.some(x => x.includes('Timetable term Y not in calendar')));
  assert.ok(m.some(x => /overlap/i.test(x)));
  assert.equal(out.filter(i => /overlap/i.test(i.message)).length, 1);
  assert.ok(m.includes('No classes for term X'));
});

test('previewDays gives mode and banner per day', () => {
  const days = previewDays(cal, '2026-12-18', 4);
  assert.deepEqual(days.map(d => d.mode), ['assessment', 'assessment', 'assessment', 'christmas']);
  assert.equal(days[0].date, '2026-12-18');
  assert.equal(typeof days[0].banner, 'string');
});

test('sheetRows reads rows with __row and throws on missing sheet', () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Type', 'Name'], ['Teaching', 'W1'], ['Exam', 'W2']]), 'Calendar');
  const data = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const out = sheetRows(XLSX, data, 'Calendar');
  assert.equal(out[0].__row, 2);
  assert.equal(out[1].__row, 3);
  assert.equal(out[0].Type, 'Teaching');
  assert.throws(() => sheetRows(XLSX, data, 'Nope'), /Sheet "Nope" not found/);
});
