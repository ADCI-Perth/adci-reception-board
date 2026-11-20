import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCalendarRows } from '../assets/js/core/calendar.js';
import { rows } from './fixtures/calendar-rows.js';
import { keyDates } from '../assets/js/core/keydates.js';

const cal = parseCalendarRows(rows);

test('first key date is next block start', () => {
  const out = keyDates(cal, '2026-11-19');
  assert.deepEqual(out[0], { iso: '2026-11-23', title: 'Summer 1 2026-27 classes start', sub: '23 November 2026', days: 4 });
});

test('events included with event name and sorted by date', () => {
  const out = keyDates(cal, '2026-11-19');
  assert.equal(out[1].title, 'Test Event');
  assert.equal(out[1].iso, '2026-11-24');
});

test('no duplicate for continuing block weeks', () => {
  const out = keyDates(cal, '2026-11-19', { limit: 20 });
  assert.equal(out.filter((k) => k.title.startsWith('Summer 1 2026-27 classes')).length, 1);
  assert.ok(out.some((k) => k.title === 'Assessment week'));
  assert.ok(out.some((k) => k.title === 'Christmas closure'));
});

test('empty term drops prefix and capitalises', () => {
  const out = keyDates(cal, '2027-02-10', { limit: 5 });
  assert.equal(out[0].title, 'Orientation');
  assert.equal(out[1].title, 'Feb 2027 classes start');
});

test('after last row gives empty', () => {
  assert.deepEqual(keyDates(cal, '2027-03-01'), []);
});

test('event beyond horizon excluded; event today excluded', () => {
  const far = { periods: [], events: [{ type: 'event', name: 'Far', start: '2027-06-08', end: '2027-06-08', term: '', banner: '', row: 1 }] };
  assert.deepEqual(keyDates(far, '2026-11-20'), []);
  const today = { periods: [], events: [{ type: 'event', name: 'T', start: '2026-11-20', end: '2026-11-20', term: '', banner: '', row: 1 }] };
  assert.deepEqual(keyDates(today, '2026-11-20'), []);
});

test('limit applies', () => {
  assert.equal(keyDates(cal, '2026-08-01', { limit: 2 }).length, 2);
});
