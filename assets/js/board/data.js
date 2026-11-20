// Loads Calendar.xlsx, Timetable.xlsx and (optional) Board.xlsx. Each file falls back independently to the
// last good copy in localStorage (if it cannot be downloaded/opened, or has rows but none
// valid); with neither, the board runs on empty data (break mode).
import { sheetRows } from '../core/workbook.js';
import { parseCalendarRows } from '../core/calendar.js';
import { parseTimetableRows } from '../core/timetable.js';
import { parseBoardSheets, emptyBoard } from '../core/boarddata.js';

const KEYS = { calendar: 'adci.calendarRows', timetable: 'adci.timetableRows', boardRows: 'adci.boardRows', loadedAt: 'adci.loadedAt' };
const BOARD_SHEETS = { notices: 'Notices', courses: 'Courses', rooms: 'Rooms', media: 'Media' };

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

// -> { rows, live }; rows is null when the file could not be downloaded or opened.
// The cache is NOT written here: loadData first checks the rows are usable.
async function fetchLive(XLSX, url, sheetName) {
    try {
        return await fetchRows(XLSX, url, sheetName);
    } catch (e) {
        console.warn(`Could not load ${url}; using cached copy if available.`, e);
        return null;
    }
}

// Board.xlsx: every sheet is optional (missing -> null). -> { notices, courses, rooms, media } or null
// when the file could not be downloaded or opened. Never throws.
async function fetchBoardLive(XLSX) {
    try {
        if (!XLSX) throw new Error('SheetJS not loaded');
        const res = await fetch('data/Board.xlsx', { cache: 'no-store' });
        if (!res.ok) throw new Error(`data/Board.xlsx returned ${res.status}`);
        const wb = XLSX.read(await res.arrayBuffer(), { type: 'array' });
        const out = {};
        for (const [key, name] of Object.entries(BOARD_SHEETS)) {
            const ws = wb.Sheets[name];
            out[key] = ws
                ? XLSX.utils.sheet_to_json(ws, { raw: true, defval: '' }).map((row, i) => ({ ...row, __row: i + 2 }))
                : null;
        }
        return out;
    } catch (e) {
        console.warn('Could not load data/Board.xlsx; using cached copy if available.', e);
        return null;
    }
}

function cachedBoard() {
    const rows = readCache(KEYS.boardRows);
    return rows && typeof rows === 'object' && !Array.isArray(rows) ? rows : null;
}

// Same rule as choose(): live rows that parse to nothing but errors never replace a good cache.
function loadBoard(liveRows) {
    const parse = rows => safeParse(() => parseBoardSheets(rows), emptyBoard);
    const isEmpty = b => !b.notices.length && !b.courses.length && !b.rooms.length && !Object.keys(b.captions).length;
    if (liveRows) {
        const parsed = parse(liveRows);
        if (!(isEmpty(parsed) && parsed.errors.length > 0)) {
            writeCache(KEYS.boardRows, liveRows);
            return parsed;
        }
        const cached = cachedBoard();
        if (!cached) return parsed;
        console.warn(`${KEYS.boardRows}: the live file has no valid rows; keeping the cached copy.`);
        return parse(cached);
    }
    const cached = cachedBoard();
    return cached ? parse(cached) : emptyBoard();
}

function cachedRows(key) {
    const rows = readCache(key);
    return Array.isArray(rows) ? rows : null;
}

function safeParse(fn, fallback) {
    try { return fn(); } catch (e) { console.error(e); return fallback(); }
}

// Picks live rows when usable, else the cached copy. A live file that has rows but
// parses to nothing valid (only errors) is treated like a failed download, so one bad
// upload never overwrites the last good copy. -> { rows, parsed, live }
function choose(liveRows, key, parse, isEmpty) {
    if (liveRows) {
        const parsed = parse(liveRows);
        const unusable = isEmpty(parsed) && parsed.errors.length > 0;
        if (!unusable) {
            writeCache(key, liveRows);
            return { rows: liveRows, parsed, live: true };
        }
        const cached = cachedRows(key);
        if (!cached) return { rows: liveRows, parsed, live: true };
        console.warn(`${key}: the live file has no valid rows; keeping the cached copy.`);
        return { rows: cached, parsed: parse(cached), live: false };
    }
    const cached = cachedRows(key);
    return { rows: cached, parsed: parse(cached || []), live: false };
}

export async function loadData(XLSX) {
    const [calLive, ttLive, boardLive] = await Promise.all([
        fetchLive(XLSX, 'data/Calendar.xlsx', 'Calendar'),
        fetchLive(XLSX, 'data/Timetable.xlsx', 'Timetable'),
        fetchBoardLive(XLSX),
    ]);

    const emptyCal = () => parseCalendarRows([]);
    const parseCal = rows => safeParse(() => parseCalendarRows(rows), emptyCal);
    const calFile = choose(calLive, KEYS.calendar, parseCal, c => c.periods.length === 0);
    const cal = calFile.parsed;

    const parseTt = rows => safeParse(() => parseTimetableRows(rows, cal), () => ({ classes: [], errors: [] }));
    const ttFile = choose(ttLive, KEYS.timetable, parseTt, t => t.classes.length === 0);
    const tt = ttFile.parsed;
    const board = loadBoard(boardLive);

    // source: 'live' only when both files came from the server and were used;
    // 'cache' when either fell back to the saved copy (download failed or file unusable).
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
    return { cal, tt, board, source, loadedAt };
}
