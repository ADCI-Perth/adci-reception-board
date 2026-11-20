import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCalendarRows, resolveDay } from '../assets/js/core/calendar.js';
import { bannerFor, titlesFor } from '../assets/js/core/banner.js';
import { rows } from './fixtures/calendar-rows.js';

const cal = parseCalendarRows(rows);
const b = iso => bannerFor(resolveDay(cal, iso));

test('study banner uses countdown date', () => {
  assert.equal(b('2026-11-03'), 'STUDY WEEK — EXAMS START 9 NOVEMBER 2026');
});

test('break banner strips " In" from countdown label', () => {
  assert.equal(b('2027-01-05'), 'SEMESTER BREAK — CLASSES RESUME 11 JANUARY 2027');
});

test('summer banner with event banner appended', () => {
  assert.equal(b('2026-11-24'), 'SUMMER SEMESTER — SUMMER 1 WEEK 1 • TODAY: LIBRARY CLOSED TODAY');
});

test('exam, assessment, christmas banners', () => {
  assert.equal(b('2026-11-10'), 'EXAM WEEK IN PROGRESS — GOOD LUCK TO ALL STUDENTS');
  assert.equal(b('2026-12-14'), 'ASSESSMENT WEEK — GOOD LUCK WITH YOUR ASSESSMENTS');
  assert.match(b('2026-12-21'), /^MERRY CHRISTMAS & HAPPY HOLIDAYS! • CAMPUS REOPENS /);
});

test('empty calendar gives welcome banner', () => {
  assert.equal(bannerFor(resolveDay(parseCalendarRows([]), '2026-11-03')), 'WELCOME TO ADCI');
});

test('row banner overrides mode text; events still append', () => {
  const s = { mode: 'teaching', period: { name: 'Teaching Week 7', banner: 'custom text' }, countdown: null, events: [{ name: 'Fair', banner: '' }] };
  assert.equal(bannerFor(s), 'CUSTOM TEXT • TODAY: FAIR');
  s.period.banner = '';
  s.events = [];
  assert.equal(bannerFor(s), 'TEACHING WEEK 7');
});

test('titlesFor', () => {
  assert.equal(titlesFor('exam').header, 'ADCI | Exam Week Hub');
  assert.deepEqual(titlesFor('teaching'), { header: 'ADCI | Information Hub', hub: "TODAY'S SCHEDULE", card: null });
  assert.equal(titlesFor('assessment').card, 'ASSESSMENT WEEK');
  assert.deepEqual(titlesFor('christmas'), { header: 'ADCI | Information Hub', hub: 'HOLIDAY BREAK', card: 'HOLIDAY BREAK' });
  assert.equal(titlesFor('break').hub, 'SEMESTER BREAK HUB');
});
