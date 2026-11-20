// Christmas snowfall. (Per-mode panel layout was removed in the 2026 redesign; Task 6 rebuilds panels.)
const $ = id => document.getElementById(id);

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
