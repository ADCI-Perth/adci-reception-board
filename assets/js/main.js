// Board entry point: works out today's mode from Calendar.xlsx and fills the board.
import { todayISO, daysBetween } from './core/dates.js';
import { parseCalendarRows, resolveDay } from './core/calendar.js';
import { classesForDay } from './core/timetable.js';
import { bannerFor, titlesFor } from './core/banner.js';
import { CONFIG } from './board/config.js';
import { loadData } from './board/data.js';
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
// Refresh the entire page every 13 hours (46,800,000 ms)
setTimeout(() => {
    window.location.reload();
}, CONFIG.reloadAfterMs);

// One failing widget (e.g. a CDN library that did not load) must not stop the others.
function startWidgets() {
    for (const [name, widget] of Object.entries({ clock, weather, threat, dspulse, news, map, carousel })) {
        try { widget.start(CONFIG); } catch (e) { console.error(`Widget ${name} failed to start`, e); }
    }
}

// Standard layout (teaching family). Task 8 replaces this with applyLayout(mode) from layout.js.
const STANDARD = {
    sidebar: ['panel-clock', 'panel-weather', 'panel-cyber-news', 'panel-ai-news'],
    hub: ['schedule-container', 'panel-qr'],
};
const ALL_PANELS = ['panel-clock', 'panel-weather', 'panel-cyber-news', 'panel-ai-news', 'panel-threat', 'panel-dspulse', 'panel-qr'];

function applyStandardLayout() {
    const used = new Set([...STANDARD.sidebar, ...STANDARD.hub]);
    for (const id of ALL_PANELS) if (!used.has(id)) $(id).hidden = true;
    for (const id of STANDARD.sidebar) { $(id).hidden = false; $('slot-sidebar').appendChild($(id)); }
    for (const id of STANDARD.hub) { $(id).hidden = false; $('slot-hub').appendChild($(id)); }
}

function applyTexts(state) {
    const titles = titlesFor(state.mode);
    document.title = titles.header;
    $('header-title').textContent = titles.header;
    $('hub-title').textContent = titles.hub;
    $('ticker-text').textContent = bannerFor(state);
}

function renderCountdown(state, iso) {
    const box = $('term-countdown');
    if (!state.countdown) { box.hidden = true; return; }
    const days = daysBetween(iso, state.countdown.target);
    $('countdown-label').textContent = state.countdown.label;
    $('days-count').textContent = `${days} Day${days !== 1 ? 's' : ''}`;
    box.hidden = false;
}

function startSchedule(data, state, iso) {
    const container = $('schedule-container');
    const term = state.period?.term ?? null;
    const render = () => renderSchedule(container, classesForDay(data.tt.classes, term, iso));
    render();
    setInterval(render, CONFIG.scheduleRefreshMs);
    setInterval(() => autoScrollTimetable(container), 10000);
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
    applyStandardLayout();
    renderCountdown(state, iso);
    startSchedule(data, state, iso);
    console.info(`Board: ${iso} mode=${state.mode} data=${data.source}`, data.loadedAt || '');
}

boot();
