// Per-mode page layout: body mode/xmas flags, which right-column/centre panels show, and snowfall.
import { showsQR, showsRooms } from '../core/modes.js';
import { showsCountdown } from './panels.js';

const $ = id => document.getElementById(id);

export function applyLayout(state) {
    const mode = state.mode;
    document.body.dataset.mode = mode;
    const toggle = (id, show) => { const el = $(id); if (el) el.hidden = !show; };
    toggle('panel-qr', showsQR(mode));
    toggle('rooms-strip', showsRooms(mode));
    toggle('panel-countdown', showsCountdown(state));
    if (mode === 'christmas') {
        document.body.classList.add('xmas');
        createSnowflakes();
    }
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
