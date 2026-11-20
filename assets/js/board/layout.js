// Per-mode layout: which existing panels go in the sidebar and the hub.
// Panels exist once in index.html and are moved with appendChild; unused ones are hidden.
const $ = id => document.getElementById(id);

const ALL_PANELS = ['panel-clock', 'panel-weather', 'panel-cyber-news', 'panel-ai-news', 'panel-threat', 'panel-dspulse', 'panel-qr'];

const STANDARD = {
    sidebar: ['panel-clock', 'panel-weather', 'panel-cyber-news', 'panel-ai-news'],
    hub: ['schedule-container', 'panel-qr'],
    newsInHub: false, schedule: true, countdown: false, badge: null,
};
const LIVE_SIDEBAR = ['panel-clock', 'panel-weather', 'panel-threat', 'panel-dspulse'];
const INFO = { sidebar: LIVE_SIDEBAR, hub: ['schedule-container'], newsInHub: false, schedule: false, countdown: true };

export const LAYOUTS = {
    teaching: STANDARD,
    orientation: STANDARD,
    summer: STANDARD,
    assessment: { ...STANDARD, countdown: true },
    // Hub title badges from the old boards: tuition "BREAK MODE", exam / SBv2 "LIVE".
    tuition: { ...INFO, badge: 'BREAK MODE' },
    exam: { ...INFO, badge: 'LIVE' },
    study: { ...INFO, newsInHub: true, badge: 'LIVE' },
    break: { ...INFO, newsInHub: true, badge: 'LIVE' },
    christmas: { ...INFO, sidebar: ['panel-clock', 'panel-weather', 'panel-qr'], badge: null },
};

export function layoutFor(mode) {
    return LAYOUTS[mode] || STANDARD;
}

// Returns the element the info hub renders into (null for schedule modes).
export function applyLayout(mode) {
    const layout = layoutFor(mode);
    document.body.dataset.mode = LAYOUTS[mode] ? mode : 'teaching';

    const used = new Set([...layout.sidebar, ...layout.hub]);
    if (layout.newsInHub) { used.add('panel-cyber-news'); used.add('panel-ai-news'); }
    for (const id of ALL_PANELS) if (!used.has(id)) $(id).hidden = true;
    for (const id of layout.sidebar) { $(id).hidden = false; $('slot-sidebar').appendChild($(id)); }
    for (const id of layout.hub) { $(id).hidden = false; $('slot-hub').appendChild($(id)); }

    const badge = $('hub-badge');
    badge.textContent = layout.badge || '';
    badge.hidden = !layout.badge;

    if (layout.schedule) return null;

    const container = $('schedule-container');
    container.classList.remove('busy-day', 'compact-day');
    if (!layout.newsInHub) return container;

    // Semester_Break_Hubv2.html 397-418: status block, then both news cards, inside the scroll area.
    const block = document.createElement('div');
    block.id = 'break-status-block';
    container.replaceChildren(block, $('panel-cyber-news'), $('panel-ai-news'));
    $('panel-cyber-news').hidden = false;
    $('panel-ai-news').hidden = false;
    return block;
}

/* --- SNOWFALL --- (ported from Christmas_Version.html 290-305; runs only in christmas mode) */
export function createSnowflakes() {
    const container = $('snow-container');
    if (!container) return;
    const count = 50;
    for (let i = 0; i < count; i++) {
        const flake = document.createElement('div');
        flake.className = 'snowflake';
        flake.innerHTML = '❄';
        flake.style.left = Math.random() * 100 + 'vw';
        flake.style.opacity = Math.random();
        flake.style.fontSize = (Math.random() * 20 + 10) + 'px';
        flake.style.animationDuration = (Math.random() * 5 + 5) + 's';
        flake.style.animationDelay = '-' + (Math.random() * 10) + 's';
        container.appendChild(flake);
    }
}
