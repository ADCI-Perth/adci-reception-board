import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBoardSheets, emptyBoard, activeNotices, DEFAULT_NOTICE } from '../assets/js/core/boarddata.js';

const none = { notices: null, courses: null, rooms: null, media: null };
const withRows = o => ({ ...none, ...o });

test('notices: validates title and dates', () => {
  const b = parseBoardSheets(withRows({ notices: [
    { Title: 'A', Message: 'm', Start: '', End: '', __row: 2 },
    { Title: '', Message: 'x', __row: 3 },
    { Title: 'B', Start: '10/12/2026', End: '01/12/2026', __row: 4 },
    { Title: 'C', Start: 'xx', __row: 5 },
  ] }));
  assert.equal(b.notices.length, 1);
  assert.deepEqual(b.notices[0], { title: 'A', message: 'm', start: null, end: null, row: 2 });
  assert.equal(b.errors.length, 3);
  assert.ok(b.errors.every(e => e.sheet === 'Notices'));
  assert.deepEqual(b.errors.map(e => [e.row, e.message]), [
    [3, 'Missing Title'], [4, 'End date is before Start date'], [5, 'Invalid Start date'],
  ]);
});

test('activeNotices respects start/end', () => {
  const n = [
    { title: 'a', message: '', start: null, end: null, row: 2 },
    { title: 'b', message: '', start: '2026-12-01', end: '2026-12-05', row: 3 },
  ];
  assert.equal(activeNotices(n, '2026-12-03').length, 2);
  assert.equal(activeNotices(n, '2026-12-06').length, 1);
});

test('rooms trimmed and de-duplicated', () => {
  const b = parseBoardSheets(withRows({ rooms: [' Room A ', 'Room A', '', 'Room B'].map((Room, i) => ({ Room, __row: i + 2 })) }));
  assert.deepEqual(b.rooms, ['Room A', 'Room B']);
});

test('captions ignore blank caption', () => {
  const b = parseBoardSheets(withRows({ media: [
    { File: 'a.jpg', Caption: 'Hello', __row: 2 },
    { File: 'b.jpg', Caption: '', __row: 3 },
  ] }));
  assert.deepEqual(b.captions, { 'a.jpg': 'Hello' });
  assert.deepEqual(b.errors, []);
});

test('all-null sheets give emptyBoard', () => {
  assert.deepEqual(parseBoardSheets(none), emptyBoard());
});

test('courses require a name', () => {
  const b = parseBoardSheets(withRows({ courses: [
    { Course: 'Cyber', Tagline: 't', Duration: '2y', Intakes: 'Jul', Location: 'Perth', Photo: 'p.jpg', __row: 2 },
    { Course: '', Tagline: 'orphan', __row: 3 },
  ] }));
  assert.deepEqual(b.courses, [{ course: 'Cyber', tagline: 't', duration: '2y', intakes: 'Jul', location: 'Perth', photo: 'p.jpg', row: 2 }]);
  assert.deepEqual(b.errors, [{ sheet: 'Courses', row: 3, message: 'Missing Course' }]);
});

test('DEFAULT_NOTICE', () => {
  assert.equal(DEFAULT_NOTICE.title, 'Welcome to ADCI');
});
