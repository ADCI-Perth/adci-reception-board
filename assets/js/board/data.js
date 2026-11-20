// Loads Calendar.xlsx and Timetable.xlsx. Each file falls back independently to the
// last good copy in localStorage; with neither, the board runs on empty data (break mode).
import { sheetRows } from '../core/workbook.js';
import { parseCalendarRows } from '../core/calendar.js';
import { parseTimetableRows } from '../core/timetable.js';

const KEYS = { calendar: 'adci.calendarRows', timetable: 'adci.timetableRows', loadedAt: 'adci.loadedAt' };

function readCache(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function writeCache(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage full or blocked */ }
}

async function fetchRows(XLSX, url, sheetName) {
    if (!XLSX) throw new Error('SheetJS not loaded');
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${url} returned ${res.status}`);
    return sheetRows(XLSX, await res.arrayBuffer(), sheetName);
}

// -> { rows, live }; rows is null when neither a live nor a cached copy exists.
async function loadRows(XLSX, url, sheetName, key) {
    try {
        const rows = await fetchRows(XLSX, url, sheetName);
        writeCache(key, rows);
        return { rows, live: true };
    } catch (e) {
        console.warn(`Could not load ${url}; using cached copy if available.`, e);
        const rows = readCache(key);
        return { rows: Array.isArray(rows) ? rows : null, live: false };
    }
}

export async function loadData(XLSX) {
    const [calFile, ttFile] = await Promise.all([
        loadRows(XLSX, 'data/Calendar.xlsx', 'Calendar', KEYS.calendar),
        loadRows(XLSX, 'data/Timetable.xlsx', 'Timetable', KEYS.timetable),
    ]);

    let source;
    let loadedAt;
    if (calFile.live && ttFile.live) {
        source = 'live';
        loadedAt = new Date().toISOString();
        writeCache(KEYS.loadedAt, loadedAt);
    } else if (calFile.rows || ttFile.rows) {
        source = 'cache';
        loadedAt = readCache(KEYS.loadedAt);
    } else {
        source = 'none';
        loadedAt = null;
    }

    let cal;
    let tt;
    try { cal = parseCalendarRows(calFile.rows || []); } catch (e) { console.error(e); cal = parseCalendarRows([]); }
    try { tt = parseTimetableRows(ttFile.rows || [], cal); } catch (e) { console.error(e); tt = { classes: [], errors: [] }; }
    return { cal, tt, source, loadedAt };
}
