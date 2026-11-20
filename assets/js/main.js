// Board entry point: works out today's mode from Calendar.xlsx and fills the board.
import { todayISO, daysBetween } from './core/dates.js';
import { parseCalendarRows, resolveDay } from './core/calendar.js';
import { classesForDay } from './core/timetable.js';
import { bannerFor, titlesFor } from './core/banner.js';
import { CONFIG } from './board/config.js';
import { loadData } from './board/data.js';
import { safeReload } from './board/reload.js';
import { watchVersion } from './board/version-watch.js';
import { applyLayout, layoutFor, createSnowflakes } from './board/layout.js';
import { renderInfoHub, renderAssessmentEmpty } from './board/infohub.js';
import * as content from './board/content.js';
import { renderSchedule, autoScrollTimetable } from './board/schedule.js';
import * as clock from './board/widgets/clock.js';
import * as weather from './board/widgets/weather.js';
import * as threat from './board/widgets/threat.js';
import * as dspulse from './board/widgets/dspulse.js';
import * as news from './board/widgets/news.js';
import * as map from './board/widgets/map.js';
import * as carousel from './board/widgets/carousel.js';

const $ = id => document.getElementById(id);

/* --- AUTO REFRESH SYSTEM --- */
// Refresh the entire page every 13 hours (46,800,000 ms); if the site is unreachable
// at that moment, keep the current board and try again a minute later.
setTimeout(function tryReload() {
    safeReload().then(ok => { if (!ok) setTimeout(tryReload, 60000); });
}, CONFIG.reloadAfterMs);

// Reload when a new version is published (version.txt changes after each deploy).
watchVersion();

// One failing widget (e.g. a CDN library that did not load) must not stop the others.
function startWidgets() {
    for (const [name, widget] of Object.entries({ clock, weather, threat, dspulse, news, map, carousel })) {
        try { widget.start(CONFIG); } catch (e) { console.error(`Widget ${name} failed to start`, e); }
    }
}

function applyTexts(state) {
    const titles = titlesFor(state.mode);
    document.title = titles.header;
    $('header-title').textContent = titles.header;
    $('hub-title-text').textContent = titles.hub;
    $('ticker-text').textContent = bannerFor(state);
}

function renderCountdown(state, iso) {
    const box = $('term-countdown');
    if (!layoutFor(state.mode).countdown || !state.countdown) { box.hidden = true; return; }
    const days = daysBetween(iso, state.countdown.target);
    $('countdown-label').textContent = state.countdown.label;
    $('days-count').textContent = `${days} Day${days !== 1 ? 's' : ''}`;
    box.hidden = false;
}

function startSchedule(data, state, iso) {
    const container = $('schedule-container');
    const term = state.period?.term ?? null;
    const render = () => {
        // Past midnight: reload so the mode, banner and classes are recomputed for the new day
        // (v4 picked the weekday on every render). With ?date= the day never changes.
        // safeReload only reloads when the site answers; otherwise the next tick retries.
        if (todayISO(location.search) !== iso) safeReload();
        const classes = classesForDay(data.tt.classes, term, iso);
        if (state.mode === 'assessment' && classes.length === 0) renderAssessmentEmpty(container);
        else renderSchedule(container, classes);
    };
    render();
    setInterval(render, CONFIG.scheduleRefreshMs);
}

// Info-hub modes: card, tips and quote; re-rendered hourly for a fresh quote (as the old boards did).
function startInfoHub(target, state) {
    const render = () => {
        try { renderInfoHub(target, state, content); } catch (e) { console.error('Info hub failed', e); }
    };
    render();
    setInterval(render, 3600000);
}

// Every hour: if the calendar now gives a different mode or period, or the day has changed
// (info-hub modes have no schedule tick to notice midnight), reload. safeReload keeps the
// current board when the site is unreachable; the next hourly check retries.
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

    applyTexts(state);
    let infoTarget = null;
    try {
        infoTarget = applyLayout(state.mode);
    } catch (e) {
        console.error('Layout failed; keeping the default panels.', e);
    }
    renderCountdown(state, iso);
    if (infoTarget) startInfoHub(infoTarget, state);
    else startSchedule(data, state, iso);
    if (state.mode === 'christmas') createSnowflakes();
    const container = $('schedule-container');
    setInterval(() => autoScrollTimetable(container), 10000);
    watchModeChange(data.cal, state, iso);
    console.info(`Board: ${iso} mode=${state.mode} data=${data.source}`, data.loadedAt || '');
}

boot();
