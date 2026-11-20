// Data check page: fetches the spreadsheets live (never the cache), lists problems,
// and previews what the board will show for the next 21 days.
import { sheetRows } from './core/workbook.js';
import { parseCalendarRows } from './core/calendar.js';
import { parseTimetableRows, classesForDay } from './core/timetable.js';
import { checkData, previewDays } from './core/checks.js';
import { resolveDay } from './core/calendar.js';
import { todayISO, formatShort, dayCode } from './core/dates.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = id => document.getElementById(id);

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

function fileLine(f) {
  const name = esc(f.url.replace('data/', ''));
  if (f.error) return `<li class="file-bad">${name}: could not be read - ${esc(f.error)}</li>`;
  const when = f.modified ? new Date(f.modified).toLocaleString() : 'not reported by the server';
  return `<li class="file-ok">${name}: loaded, ${f.rows.length} rows <span class="muted">(last modified: ${esc(when)})</span></li>`;
}

async function main() {
  const [calFile, ttFile] = await Promise.all([
    loadFile('data/Calendar.xlsx', 'Calendar'),
    loadFile('data/Timetable.xlsx', 'Timetable'),
  ]);
  $('files').innerHTML = fileLine(calFile) + fileLine(ttFile);

  if (calFile.error || ttFile.error) {
    $('issues').innerHTML = '<li class="error">A file could not be read, so the checks cannot run. Fix the file problem above and reload this page.</li>';
    $('preview').textContent = 'Not available until both files load.';
    return;
  }

  const cal = parseCalendarRows(calFile.rows);
  const tt = parseTimetableRows(ttFile.rows, cal);
  const issues = checkData(cal, tt);
  const errors = issues.filter(i => i.level === 'error');
  let html = '';
  if (!errors.length) html += '<li class="ok">No problems found</li>';
  for (const i of issues) html += `<li class="${i.level === 'error' ? 'error' : 'warning'}">${i.level === 'error' ? 'Problem' : 'Warning'}: ${esc(i.message)}</li>`;
  $('issues').innerHTML = html;

  const today = todayISO(location.search);
  const rows = previewDays(cal, today, 21).map(d => {
    const state = resolveDay(cal, d.date);
    const units = classesForDay(tt.classes, state.period?.term ?? null, d.date).map(c => c.unit).join(', ');
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
