/* --- CLOCK --- header time and long uppercase date, e.g. TUESDAY 24 NOV 2026.
   Always the real time/date (also with ?date=, as before). */
export function formatLongDate(now) {
    const wd = now.toLocaleDateString('en-AU', { weekday: 'long' });
    const mon = now.toLocaleDateString('en-AU', { month: 'short' });
    return `${wd} ${now.getDate()} ${mon} ${now.getFullYear()}`.toUpperCase();
}

function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('date').textContent = formatLongDate(now);
}

export function start() {
    setInterval(updateClock, 1000); updateClock();
}
