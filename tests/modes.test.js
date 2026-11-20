import test from 'node:test';
import assert from 'node:assert/strict';
import { showsQR, showsRooms, hubKind, chipText } from '../assets/js/core/modes.js';

const all = ['teaching', 'orientation', 'summer', 'assessment', 'exam', 'study', 'tuition'];
const schedule = ['teaching', 'orientation', 'summer', 'assessment'];

test('QR', () => {
  for (const m of all) assert.equal(showsQR(m), true, m);
  assert.equal(showsQR('break'), false);
  assert.equal(showsQR('christmas'), false);
});

test('rooms', () => {
  for (const m of all) assert.equal(showsRooms(m), schedule.includes(m), m);
  assert.equal(showsRooms('break'), false);
  assert.equal(showsRooms('christmas'), false);
});

test('hubKind', () => {
  assert.equal(hubKind('teaching'), 'classes');
  assert.equal(hubKind('assessment'), 'classes');
  assert.equal(hubKind('exam'), 'info');
  assert.equal(hubKind('christmas'), 'info');
});

test('chipText', () => {
  assert.equal(chipText({ mode: 'teaching', period: { name: 'Teaching Week 7' } }), 'TEACHING WEEK 7');
  assert.equal(chipText({ mode: 'exam', period: { name: 'Exam Week 1' } }), 'EXAM WEEK 1');
  assert.equal(chipText({ mode: 'break', period: { name: 'x' } }), 'SEMESTER BREAK');
  assert.equal(chipText({ mode: 'christmas', period: null }), 'CHRISTMAS CLOSURE');
  assert.equal(chipText({ mode: 'teaching', period: null }), 'WELCOME');
});
