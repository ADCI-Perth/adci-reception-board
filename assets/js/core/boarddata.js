// Parses the Board.xlsx sheets (Notices, Courses, Rooms, Media). Every sheet is optional:
// a null sheet gives empty results. Mirrors calendar.js: rows carry __row, errors are
// { sheet, row, message } and never throw.
import { toISODate } from './dates.js';
import { normaliseRow } from './calendar.js';

export const DEFAULT_NOTICE = Object.freeze({
  title: 'Welcome to ADCI',
  message: 'Please see reception for any enquiries.',
});

const isBlank = v => v === undefined || v === null || v === '';
const text = v => (isBlank(v) ? '' : String(v).trim());

export function emptyBoard() {
  return { notices: [], courses: [], rooms: [], captions: {}, errors: [] };
}

const dataRows = rows => (rows || []).map(normaliseRow)
  .filter(r => Object.entries(r).some(([k, v]) => k !== '__row' && !isBlank(v) && text(v) !== ''));

function parseNotices(rows, board) {
  for (const r of dataRows(rows)) {
    const err = message => board.errors.push({ sheet: 'Notices', row: r.__row, message });
    const title = text(r.title);
    if (!title) { err('Missing Title'); continue; }
    const start = isBlank(r.start) || text(r.start) === '' ? null : toISODate(r.start);
    if (start === null && !isBlank(r.start) && text(r.start) !== '') { err('Invalid Start date'); continue; }
    const end = isBlank(r.end) || text(r.end) === '' ? null : toISODate(r.end);
    if (end === null && !isBlank(r.end) && text(r.end) !== '') { err('Invalid End date'); continue; }
    if (start && end && end < start) { err('End date is before Start date'); continue; }
    board.notices.push({ title, message: text(r.message), start, end, row: r.__row });
  }
}

function parseCourses(rows, board) {
  for (const r of dataRows(rows)) {
    const course = text(r.course);
    if (!course) { board.errors.push({ sheet: 'Courses', row: r.__row, message: 'Missing Course' }); continue; }
    board.courses.push({
      course, tagline: text(r.tagline), duration: text(r.duration), intakes: text(r.intakes),
      location: text(r.location), photo: text(r.photo), row: r.__row,
    });
  }
}

export function parseBoardSheets({ notices, courses, rooms, media } = {}) {
  const board = emptyBoard();
  parseNotices(notices, board);
  parseCourses(courses, board);
  for (const r of dataRows(rooms)) {
    const room = text(r.room);
    if (room && !board.rooms.includes(room)) board.rooms.push(room);
  }
  for (const r of dataRows(media)) {
    const file = text(r.file);
    const caption = text(r.caption);
    if (file && caption) board.captions[file] = caption;
  }
  return board;
}

// start null = shown from always, end null = shown forever.
export function activeNotices(notices, iso) {
  return (notices || []).filter(n => (!n.start || n.start <= iso) && (!n.end || iso <= n.end));
}
