import test from 'node:test';
import assert from 'node:assert/strict';
import { roomsNow } from '../assets/js/core/rooms.js';

const classes = [
  { unit: 'ORG303', room: 'R1', start: '09:00', end: '12:00' },
  { unit: 'CYB306', room: 'R1', start: '13:00', end: '16:00' },
];

test('busy and free', () => {
  assert.deepEqual(roomsNow(classes, ['R2'], '10:00'), [
    { room: 'R1', status: 'busy', text: 'ORG303 · until 12:00' },
    { room: 'R2', status: 'free', text: 'Free' },
  ]);
});
test('next', () => {
  assert.deepEqual(roomsNow(classes, ['R2'], '12:30')[0], { room: 'R1', status: 'next', text: 'CYB306 from 13:00' });
});
test('free after last class', () => {
  assert.deepEqual(roomsNow(classes, [], '17:00'), [{ room: 'R1', status: 'free', text: 'No more classes today' }]);
});
test('end is exclusive, start inclusive; blanks and duplicates ignored', () => {
  assert.equal(roomsNow(classes, [], '12:00')[0].status, 'next');
  assert.equal(roomsNow(classes, [], '09:00')[0].status, 'busy');
  const out = roomsNow([{ unit: 'A', room: '', start: '09:00', end: '10:00' }], ['R1', 'R1'], '09:30');
  assert.equal(out.length, 1);
});
test('extra room already present is not duplicated', () => {
  assert.equal(roomsNow(classes, ['R1'], '10:00').length, 1);
});
