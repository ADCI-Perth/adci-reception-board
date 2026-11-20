// Board entry point: works out today's mode from Calendar.xlsx and fills the board shell.
import { todayISO } from './core/dates.js';
import { parseCalendarRows, resolveDay } from './core/calendar.js';
import { titlesFor } from './core/banner.js';
import { chipText } from './core/modes.js';
import { CONFIG } from './board/config.js';
import { loadData } from './board/data.js';
import { safeReload } from './board/reload.js';
import { watchVersion } from './board/version-watch.js';
import { createSnowflakes } from './board/layout.js';
import * as clock from './board/widgets/clock.js';
import * as weather from './board/widgets/weather.js';

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
    document.body.dataset.mode = state.mode;
    if (state.mode === 'christmas') {
        document.body.classList.add('xmas');
        createSnowflakes();
    }
    watchModeChange(data.cal, state, iso);
    console.info(`Board: ${iso} mode=${state.mode} data=${data.source}`, data.loadedAt || '');
}

boot();
