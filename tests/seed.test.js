import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as XLSX from 'xlsx';
import { parseCalendarRows, resolveDay } from '../assets/js/core/calendar.js';
import { parseTimetableRows, classesForDay } from '../assets/js/core/timetable.js';
import { sheetRows } from '../assets/js/core/workbook.js';
import { checkData } from '../assets/js/core/checks.js';
import { parseBoardSheets } from '../assets/js/core/boarddata.js';

const read = (file, sheet) => sheetRows(XLSX, new Uint8Array(fs.readFileSync(file)), sheet);
const cal = parseCalendarRows(read('data/Calendar.xlsx', 'Calendar'));
const tt = parseTimetableRows(read('data/Timetable.xlsx', 'Timetable'), cal);

test('seed workbooks parse with zero errors', () => {
  assert.deepEqual(cal.errors, []);
  assert.deepEqual(tt.errors, []);
  assert.ok(cal.periods.length > 0 && tt.classes.length > 0);
});

test('seed calendar resolves key days', () => {
  assert.equal(resolveDay(cal, '2027-03-31').period.name, 'Tuition Free Week');
  assert.equal(resolveDay(cal, '2026-11-23').mode, 'summer');
});

test('seed timetable has Summer 2 classes', () => {
  assert.deepEqual(classesForDay(tt.classes, 'Summer 2 2026-27', '2027-01-12').map(c => c.unit), ['SEC101', 'CYB201']);
});

test('seed data has no error-level checks', () => {
  const errs = checkData(cal, tt).filter(i => i.level === 'error');
  assert.deepEqual(errs, []);
});

test('templates parse to zero rows', () => {
  assert.equal(read('templates/Calendar_TEMPLATE.xlsx', 'Calendar').length, 0);
  assert.equal(read('templates/Timetable_TEMPLATE.xlsx', 'Timetable').length, 0);
});

test('seed: Orientation Week shows no classes; Teaching Week 1 does', () => {
  assert.equal(resolveDay(cal, '2026-07-21').mode, 'orientation');
  assert.deepEqual(classesForDay(tt.classes, 'Jul 2026', '2026-07-21'), []);
  assert.equal(resolveDay(cal, '2026-07-28').mode, 'teaching');
  assert.ok(classesForDay(tt.classes, 'Jul 2026', '2026-07-28').length > 0);
});

test('seed Board.xlsx parses with zero errors and one room', () => {
  const wb = XLSX.read(new Uint8Array(fs.readFileSync('data/Board.xlsx')), { type: 'array' });
  const rows = Object.fromEntries(['Notices', 'Courses', 'Rooms', 'Media'].map(s => [s.toLowerCase(), sheetRows(XLSX, new Uint8Array(fs.readFileSync('data/Board.xlsx')), s)]));
  assert.deepEqual(wb.SheetNames, ['Notices', 'Courses', 'Rooms', 'Media', 'How to use']);
  const board = parseBoardSheets(rows);
  assert.deepEqual(board.errors, []);
  assert.deepEqual(board.rooms, ['ADCI Classroom 1']);
  assert.deepEqual(board.notices, []);
  assert.deepEqual(board.courses, []);
});

test('Board template has no rows', () => {
  const t = new Uint8Array(fs.readFileSync('templates/Board_TEMPLATE.xlsx'));
  for (const s of ['Notices', 'Courses', 'Rooms', 'Media']) assert.equal(sheetRows(XLSX, t, s).length, 0);
});
