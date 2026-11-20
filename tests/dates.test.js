import test from 'node:test';
import assert from 'node:assert/strict';
import { toISODate, toHHMM, addDays, daysBetween, dayCode, formatLong, formatShort, todayISO } from '../assets/js/core/dates.js';

test('toISODate accepts every format', () => {
  for (const v of ['9/11/2026', ' 09/11/2026 ', '2026-11-09', 46335, new Date(2026, 10, 9)])
    assert.equal(toISODate(v), '2026-11-09');
  assert.equal(toISODate('31/02/2026'), null);
  assert.equal(toISODate(''), null);
});
test('toHHMM', () => {
  assert.equal(toHHMM(0.375), '09:00');
  assert.equal(toHHMM('9:00'), '09:00');
  assert.equal(toHHMM('1:00 pm'), '13:00');
  assert.equal(toHHMM('12:00 pm'), '12:00');
  assert.equal(toHHMM('25:00'), null);
});
test('arithmetic and formatting', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(daysBetween('2026-11-10', '2026-11-21'), 11);
  assert.equal(dayCode('2026-11-23'), 'Mon');
  assert.equal(formatLong('2026-11-09'), '9 November 2026');
  assert.equal(formatShort('2026-11-09'), '9 Nov 2026');
  assert.equal(todayISO('?date=2026-12-14'), '2026-12-14');
});
test('todayISO falls back to local date on malformed or invalid ?date', () => {
  const local = todayISO('');
  assert.equal(todayISO('?date=%'), local);
  assert.equal(todayISO('?date=%E0%A4%A'), local);
  assert.equal(todayISO('?date=2026-13-45'), local);
});
