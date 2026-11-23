import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePosters, formFields, parseIssueNotices } from '../assets/js/core/issuenotices.js';

const formBody = (msg, from, until) =>
  `### Message\n\n${msg}\n\n### Show from\n\n${from}\n\n### Show until\n\n${until}`;
const issue = (number, over = {}) => ({
  number, state: 'open', title: `Notice ${number}`, user: { login: 'moktan456' },
  labels: [{ name: 'notice' }], body: formBody('Hello', '_No response_', '_No response_'), ...over,
});

test('parsePosters: one login per line, comments and @ ignored, lower-cased', () => {
  assert.deepEqual(parsePosters('# staff\nMoktan456\n\n@Other-User  # reception\r\n'), ['moktan456', 'other-user']);
  assert.deepEqual(parsePosters(''), []);
});

test('formFields: reads issue-form sections, _No response_ is blank', () => {
  const f = formFields(formBody('Line one\nline two', '25/11/2026', '_No response_'));
  assert.equal(f.message, 'Line one\nline two');
  assert.equal(f['show from'], '25/11/2026');
  assert.equal(f['show until'], '');
});

test('parseIssueNotices: form issue by an allowed poster becomes a notice', () => {
  const { notices, skipped } = parseIssueNotices(
    [issue(3, { title: ' Graduation photos ', body: formBody('Meet in the\nMeeting Room at 4pm', '25/11/2026', '28/11/2026') })],
    ['moktan456']);
  assert.deepEqual(skipped, []);
  assert.deepEqual(notices, [{ title: 'Graduation photos', message: 'Meet in the Meeting Room at 4pm',
    start: '2026-11-25', end: '2026-11-28', row: 3, source: 'github', number: 3 }]);
});

test('parseIssueNotices: blank dates mean always shown', () => {
  const { notices } = parseIssueNotices([issue(1)], ['moktan456']);
  assert.equal(notices[0].start, null);
  assert.equal(notices[0].end, null);
});

test('parseIssueNotices: strangers, wrong label, PRs and closed issues are not shown', () => {
  const { notices, skipped } = parseIssueNotices([
    issue(1, { user: { login: 'stranger' } }),
    issue(2, { labels: [{ name: 'bug' }] }),
    issue(3, { pull_request: {} }),
    issue(4, { state: 'closed' }),
  ], ['moktan456']);
  assert.deepEqual(notices, []);
  assert.equal(skipped.length, 1);
  assert.match(skipped[0].reason, /stranger.*notice-posters/);
});

test('parseIssueNotices: bad dates are skipped with a reason', () => {
  const { notices, skipped } = parseIssueNotices([
    issue(1, { body: formBody('x', 'next Friday', '_No response_') }),
    issue(2, { body: formBody('x', '10/12/2026', '01/12/2026') }),
  ], ['moktan456']);
  assert.deepEqual(notices, []);
  assert.match(skipped[0].reason, /Show from.*not a date/);
  assert.match(skipped[1].reason, /before/);
});

test('parseIssueNotices: plain issue (no form) uses the body as the message; sorted by number', () => {
  const { notices } = parseIssueNotices([
    issue(9, { body: 'Library closes at 3pm today.' }),
    issue(2),
  ], ['MOKTAN456']);
  assert.deepEqual(notices.map(n => n.number), [2, 9]);
  assert.equal(notices[1].message, 'Library closes at 3pm today.');
});

test('parseIssueNotices: junk input gives nothing', () => {
  assert.deepEqual(parseIssueNotices(null, ['a']), { notices: [], skipped: [] });
  assert.deepEqual(parseIssueNotices({ message: 'API rate limit exceeded' }, ['a']), { notices: [], skipped: [] });
});
