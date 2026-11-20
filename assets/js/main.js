// Board entry point: works out today's mode from Calendar.xlsx and fills the board shell.
import { todayISO } from './core/dates.js';
import { parseCalendarRows, resolveDay } from './core/calendar.js';
import { titlesFor, bannerFor } from './core/banner.js';
import { chipText, showsRooms, hubKind } from './core/modes.js';
import { keyDates } from './core/keydates.js';
import { roomsNow } from './core/rooms.js';
import { activeNotices } from './core/boarddata.js';
import { classesForDay } from './core/timetable.js';
import { CONFIG } from './board/config.js';
import { loadData } from './board/data.js';
import { safeReload } from './board/reload.js';
import { watchVersion } from './board/version-watch.js';
import { applyLayout } from './board/layout.js';
import { renderKeyDates, startNotices, renderRooms, renderCountdown } from './board/panels.js';
import { renderHub, autoScrollTimetable } from './board/hub.js';
import * as content from './board/content.js';
import * as clock from './board/widgets/clock.js';
import * as weather from './board/widgets/weather.js';
import { startCarousel } from './board/widgets/carousel.js';

const $ = id => document.getElementById(id);

/* --- AUTO REFRESH SYSTEM --- */
// Refresh the entire page every 13 hours (46,800,000 ms); if the site is unreachable
// at that moment, keep the current board and try again a minute later.
setTimeout(function tryReload() {
    safeReload().then(ok => { if (!ok) setTimeout(tryReload, 60000); });
}, CONFIG.reloadAfterMs);

// Reload when a new version is published (version.txt changes after each deploy).
watchVersion();

// One failing widget must not stop the others.
function startWidgets() {
    for (const [name, widget] of Object.entries({ clock, weather })) {
        try { widget.start(CONFIG); } catch (e) { console.error(`Widget ${name} failed to start`, e); }
    }
}

function applyHeader(state) {
    const header = titlesFor(state.mode).header.replace(/\|/g, '').replace(/\s+/g, ' ').trim();
    document.title = header;
    $('header-title').textContent = header;
    $('mode-chip-text').textContent = chipText(state);
}

// One failing panel must not stop the others.
function safely(name, fn) {
    try { fn(); } catch (e) { console.error(`${name} failed`, e); }
}

const nowHHMM = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

function startPanels(data, state, iso) {
    const board = data.board || {};
    let notices = [];
    safely('Active notices', () => { notices = activeNotices(board.notices, iso); });
    safely('Key dates', () => renderKeyDates($('keydates-list'), keyDates(data.cal, iso)));
    safely('Notices', () => startNotices(
        { title: $('notice-title'), message: $('notice-message'), pager: $('notice-pager') },
        $('ticker-run'), notices, bannerFor(state)));
    safely('Countdown', () => renderCountdown(
        { box: $('panel-countdown'), label: $('countdown-label'), days: $('days-count'), sub: $('countdown-sub') }, state, iso));

    let classes = [];
    safely('Classes', () => { classes = classesForDay(data.tt?.classes, state.period?.term ?? null, iso); });
    const hubEl = $('hub-main');
    // Schedule tick (30 s): live/next/ended rows and the rooms strip use the real time.
    // Past midnight: reload so the mode, banner and classes are recomputed for the new day.
    const isClasses = hubKind(state.mode) === 'classes';
    const drawHub = () => safely('Hub', () => renderHub(hubEl, state, { classes, now: nowHHMM(), content }));
    const tick = () => safely('Schedule tick', () => {
        if (todayISO(location.search) !== iso) safeReload();
        const now = nowHHMM();
        if (isClasses) drawHub();
        if (showsRooms(state.mode)) {
            safely('Rooms', () => {
                const strip = $('rooms-strip');
                const rooms = roomsNow(classes, board.rooms, now);
                renderRooms(strip, rooms);
                strip.hidden = rooms.length === 0;
            });
        }
    });
    if (!isClasses) drawHub();
    tick();
    setInterval(tick, CONFIG.scheduleRefreshMs);
    // Info hubs re-roll their tips and quote hourly (as the old boards did); the 30 s tick
    // only re-renders the classes hub.
    if (!isClasses) setInterval(drawHub, 3600000);
    // Re-render once web fonts are loaded so overflow fitting measures the real glyph widths.
    if (!isClasses && document.fonts?.ready) document.fonts.ready.then(drawHub).catch(() => {});
    setInterval(() => autoScrollTimetable(hubEl?.querySelector('.classes')), 10000);
}

// Every hour: if the calendar now gives a different mode or period, or the day has changed,
// reload. safeReload keeps the current board when the site is unreachable; the next check retries.
function watchModeChange(cal, state, iso) {
    setInterval(() => {
        const nowIso = todayISO(location.search);
        let fresh;
        try { fresh = resolveDay(cal, nowIso); } catch (e) { return; }
        const changed = fresh.mode !== state.mode
            || (fresh.period?.name ?? null) !== (state.period?.name ?? null)
            || nowIso !== iso;
        if (changed) safeReload();
    }, 3600000);
}

async function boot() {
    startWidgets();

    const iso = todayISO(location.search);
    let data;
    try {
        data = await loadData(window.XLSX);
    } catch (e) {
        console.error('Data load failed; showing generic board.', e);
        data = { cal: parseCalendarRows([]), tt: { classes: [], errors: [] }, source: 'none', loadedAt: null };
    }

    let state;
    try {
        state = resolveDay(data.cal, iso);
    } catch (e) {
        console.error('Could not resolve today; showing generic board.', e);
        state = { mode: 'break', period: null, block: null, next: null, countdown: null, events: [] };
    }

    applyHeader(state);
    safely('Layout', () => applyLayout(state));
    safely('Panels', () => startPanels(data, state, iso));
    try {
        startCarousel($('stage'), {
            courses: data.board?.courses || [], captions: data.board?.captions || {}, mode: state.mode,
            mapDuration: CONFIG.mapDuration, photoDuration: CONFIG.photoDuration
        }).catch(e => console.error('Carousel failed', e));
    } catch (e) { console.error('Carousel failed to start', e); }
    watchModeChange(data.cal, state, iso);
    console.info(`Board: ${iso} mode=${state.mode} data=${data.source}`, data.loadedAt || '');
}

boot();
