// Data check page: fetches the spreadsheets live (never the cache), lists problems,
// and previews what the board will show for the next 21 days.
import { sheetRows } from './core/workbook.js';
import { parseCalendarRows } from './core/calendar.js';
import { parseTimetableRows, classesForDay } from './core/timetable.js';
import { checkData, previewDays } from './core/checks.js';
import { resolveDay } from './core/calendar.js';
import { todayISO, formatShort, dayCode, addDays } from './core/dates.js';
import { parseBoardSheets } from './core/boarddata.js';

const BOARD_SHEETS = { notices: 'Notices', courses: 'Courses', rooms: 'Rooms', media: 'Media' };
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MEDIA_FOLDERS = [['photos', 'Photos'], ['videos', 'Videos'], ['christmas', 'Christmas photos']];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = id => document.getElementById(id);
// Modes whose board layout shows a class schedule; other days list no classes.
const SCHEDULE_MODES = ['teaching', 'summer', 'orientation', 'assessment'];

async function loadFile(url, sheetName) {
  const result = { url, sheetName, rows: null, modified: null, error: null };
  try {
    if (typeof XLSX === 'undefined') throw new Error('the spreadsheet reader (SheetJS) could not be loaded - check the internet connection');
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status === 404 ? 'file not found - has it been uploaded to the data folder?' : `the server returned ${res.status}`);
    result.modified = res.headers.get('Last-Modified');
    result.rows = sheetRows(XLSX, await res.arrayBuffer(), sheetName);
  } catch (e) {
    result.error = /Sheet ".*" not found/.test(e.message) ? `the sheet "${sheetName}" is missing from the workbook` : e.message;
  }
  return result;
}

// Board.xlsx: every sheet is optional (missing -> null), so it is read separately from the others.
async function loadBoardFile() {
  const result = { url: 'data/Board.xlsx', sheets: null, modified: null, error: null };
  try {
    if (typeof XLSX === 'undefined') throw new Error('the spreadsheet reader (SheetJS) could not be loaded - check the internet connection');
    const res = await fetch(result.url, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status === 404 ? 'file not found - has it been uploaded to the data folder?' : `the server returned ${res.status}`);
    result.modified = res.headers.get('Last-Modified');
    const wb = XLSX.read(await res.arrayBuffer(), { type: 'array' });
    result.sheets = {};
    for (const [key, name] of Object.entries(BOARD_SHEETS)) {
      const ws = wb.Sheets[name];
      result.sheets[key] = ws ? XLSX.utils.sheet_to_json(ws, { raw: true, defval: '' }).map((row, i) => ({ ...row, __row: i + 2 })) : null;
    }
  } catch (e) {
    result.error = e.message;
  }
  return result;
}

function boardFileLine(f) {
  const name = esc(f.url.replace('data/', ''));
  if (f.error) return `<li class="file-bad">${name}: could not be read - ${esc(f.error)}</li>`;
  const when = f.modified ? new Date(f.modified).toLocaleString() : 'not reported by the server';
  const counts = Object.entries(BOARD_SHEETS).map(([k, n]) => `${n}: ${f.sheets[k] ? f.sheets[k].length + ' rows' : 'sheet not present'}`).join(', ');
  return `<li class="file-ok">${name}: loaded <span class="muted">(${esc(counts)}; last modified: ${esc(when)})</span></li>`;
}

function noticesHtml(board, today) {
  const end = addDays(today, 20);
  const list = board.notices.filter(n => (!n.start || n.start <= end) && (!n.end || n.end >= today));
  if (!list.length) return '<li class="muted">No notices are active in the next 21 days. The board shows its default welcome notice.</li>';
  return list.map(n => {
    const range = !n.start && !n.end ? 'always' : `${n.start ? formatShort(n.start) : 'always'} to ${n.end ? formatShort(n.end) : 'always'}`;
    return `<li class="file-ok">${esc(n.title)} <span class="muted">(${esc(range)})${n.message ? ' - ' + esc(n.message) : ''}</span></li>`;
  }).join('');
}

const mb = bytes => (bytes / (1024 * 1024)).toFixed(1);

async function mediaHtml() {
  let manifest;
  try {
    const res = await fetch('media/manifest.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    manifest = await res.json();
  } catch {
    return '<li class="warning">media/manifest.json not found — it is built during deploy (locally: node tools/build-media-manifest.mjs .)</li>';
  }
  let html = '';
  for (const [key, label] of MEDIA_FOLDERS) {
    const files = Array.isArray(manifest[key]) ? manifest[key] : [];
    html += `<li class="file-ok">${esc(label)} (media/${esc(key)}): ${files.length} file${files.length === 1 ? '' : 's'}</li>`;
    for (const f of files) {
      if (f.size > MAX_UPLOAD_BYTES) {
        html += `<li class="warning">${esc(f.file)} is ${mb(f.size)} MB — too big to replace through the github.com upload page (limit 25 MB)</li>`;
      } else {
        html += `<li class="muted">${esc(f.file)}: ${mb(f.size)} MB</li>`;
      }
    }
  }
  return html;
}

function fileLine(f) {
  const name = esc(f.url.replace('data/', ''));
  if (f.error) return `<li class="file-bad">${name}: could not be read - ${esc(f.error)}</li>`;
  const when = f.modified ? new Date(f.modified).toLocaleString() : 'not reported by the server';
  return `<li class="file-ok">${name}: loaded, ${f.rows.length} rows <span class="muted">(last modified: ${esc(when)})</span></li>`;
}

async function main() {
  const [calFile, ttFile, boardFile] = await Promise.all([
    loadFile('data/Calendar.xlsx', 'Calendar'),
    loadFile('data/Timetable.xlsx', 'Timetable'),
    loadBoardFile(),
  ]);
  $('files').innerHTML = fileLine(calFile) + fileLine(ttFile) + boardFileLine(boardFile);
  $('media').innerHTML = await mediaHtml();
  const board = boardFile.sheets ? parseBoardSheets(boardFile.sheets) : parseBoardSheets({});
  const today = todayISO(location.search);
  $('notices').innerHTML = boardFile.error ? '<li class="muted">Not available - Board.xlsx could not be read.</li>' : noticesHtml(board, today);

  if (calFile.error || ttFile.error) {
    $('issues').innerHTML = '<li class="error">A file could not be read, so the checks cannot run. Fix the file problem above and reload this page.</li>';
    $('preview').textContent = 'Not available until both files load.';
    return;
  }

  const cal = parseCalendarRows(calFile.rows);
  const tt = parseTimetableRows(ttFile.rows, cal);
  const issues = checkData(cal, tt, today);
  const errors = issues.filter(i => i.level === 'error');
  let html = '';
  if (!errors.length && !board.errors.length) html += '<li class="ok">No problems found</li>';
  for (const i of issues) html += `<li class="${i.level === 'error' ? 'error' : 'warning'}">${i.level === 'error' ? 'Problem' : 'Warning'}: ${esc(i.message)}</li>`;
  for (const e of board.errors) html += `<li class="error">Problem: ${esc(`Board.xlsx › ${e.sheet} row ${e.row}: ${e.message}`)}</li>`;
  $('issues').innerHTML = html;

  const rows = previewDays(cal, today, 21).map(d => {
    const state = resolveDay(cal, d.date);
    const units = !SCHEDULE_MODES.includes(d.mode) ? '' : classesForDay(tt.classes, state.period?.term ?? null, d.date).map(c => c.unit).join(', ');
    return `<tr><td><a href="index.html?date=${esc(d.date)}">${esc(dayCode(d.date))} ${esc(formatShort(d.date))}</a></td>` +
      `<td class="mode">${esc(d.mode)}</td><td>${esc(d.banner)}</td><td>${esc(units)}</td></tr>`;
  }).join('');
  $('preview').className = '';
  $('preview').innerHTML = `<table><thead><tr><th>Date</th><th>Mode</th><th>Banner</th><th>Classes</th></tr></thead><tbody>${rows}</tbody></table>`;
}

main().catch(e => {
  console.error(e);
  $('issues').innerHTML = `<li class="error">The check page hit an unexpected problem: ${esc(e.message)}</li>`;
});
