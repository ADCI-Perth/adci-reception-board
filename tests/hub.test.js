import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tickerItems, dayCountText, calTile, showsCountdown } from '../assets/js/board/panels.js';
import { classStatuses, sentenceCase, dateRange, pickTips } from '../assets/js/board/hub.js';
import { welcomeLines, christmasLines } from '../assets/js/board/content.js';

test('tickerItems: banner only when there are no notices', () => {
  assert.deepEqual(tickerItems('WELCOME TO ADCI', []), ['WELCOME TO ADCI']);
  assert.deepEqual(tickerItems('WELCOME TO ADCI', undefined), ['WELCOME TO ADCI']);
});

test('tickerItems: banner then "title — message", title alone when no message', () => {
  const notices = [{ title: 'Census date', message: 'Last day to withdraw' }, { title: 'Library open', message: '' }];
  assert.deepEqual(tickerItems('EXAM WEEK', notices), ['EXAM WEEK', 'Census date — Last day to withdraw', 'Library open']);
});

test('dayCountText: singular and plural', () => {
  assert.equal(dayCountText(1), '1 day');
  assert.equal(dayCountText(7), '7 days');
});

test('calTile: 3-letter uppercase month and day number', () => {
  assert.deepEqual(calTile('2026-11-27'), { month: 'NOV', day: '27' });
  assert.deepEqual(calTile('2027-01-04'), { month: 'JAN', day: '4' });
});

test('showsCountdown: needs a countdown and is never shown in teaching/orientation/summer', () => {
  const cd = { label: 'X', target: '2026-12-01' };
  assert.equal(showsCountdown({ mode: 'exam', countdown: cd }), true);
  assert.equal(showsCountdown({ mode: 'assessment', countdown: cd }), true);
  assert.equal(showsCountdown({ mode: 'exam', countdown: null }), false);
  for (const mode of ['teaching', 'orientation', 'summer']) assert.equal(showsCountdown({ mode, countdown: cd }), false);
});

const cls = (unit, start, end) => ({ unit, start, end });

test('classStatuses: ended, live, first upcoming is next with time left, later ones upcoming', () => {
  const out = classStatuses([cls('A', '08:00', '09:00'), cls('B', '09:00', '12:00'), cls('C', '12:00', '13:00'), cls('D', '14:00', '16:00')], '09:42');
  assert.deepEqual(out.map(c => c.status), ['done', 'live', 'next', 'upcoming']);
  assert.deepEqual(out.map(c => c.tag), ['ENDED', '● LIVE NOW', 'NEXT · IN 2H 18M', 'UPCOMING']);
  assert.equal(out[1].unit, 'B');
});

test('classStatuses: time-left format for under an hour and whole hours; sorted by start', () => {
  assert.equal(classStatuses([cls('A', '10:00', '11:00')], '09:15')[0].tag, 'NEXT · IN 45M');
  assert.equal(classStatuses([cls('A', '11:00', '12:00')], '09:00')[0].tag, 'NEXT · IN 2H');
  assert.deepEqual(classStatuses([cls('B', '13:00', '14:00'), cls('A', '09:00', '10:00')], '08:00').map(c => c.unit), ['A', 'B']);
  assert.deepEqual(classStatuses([], '08:00'), []);
});

test('sentenceCase: lower-cases all but the first letter, keeps ID and IT', () => {
  assert.equal(sentenceCase('NO PHONES ALLOWED'), 'No phones allowed');
  assert.equal(sentenceCase('STUDENT ID REQUIRED'), 'Student ID required');
  assert.equal(sentenceCase('GROUP CHECK-IN'), 'Group check-in');
});

test('dateRange: same year shows the year once, different years show both', () => {
  assert.equal(dateRange({ start: '2026-11-09', end: '2026-11-20' }), '9 Nov – 20 Nov 2026');
  assert.equal(dateRange({ start: '2026-12-21', end: '2027-01-01' }), '21 Dec 2026 – 1 Jan 2027');
  assert.equal(dateRange(null), '');
});

test('pickTips: up to n distinct tips', () => {
  const tips = [1, 2, 3, 4, 5, 6, 7];
  const out = pickTips(tips, 4, () => 0.5);
  assert.equal(out.length, 4);
  assert.equal(new Set(out).size, 4);
  assert.ok(out.every(t => tips.includes(t)));
  assert.deepEqual(pickTips([1, 2], 4).sort(), [1, 2]);
});

test('welcome and christmas lines', () => {
  assert.deepEqual(welcomeLines.map(l => `${l.lead} ${l.text}`), [
    'Visiting us? Please take a seat — a team member will be with you shortly.',
    'Enrolling? Ask at reception for course information.',
  ]);
  assert.deepEqual(christmasLines(2026), [
    'Thank you to every student, lecturer and visitor who made 2026 a great year.',
    'Enjoy a safe and happy holiday season — see you in 2027!',
  ]);
});
