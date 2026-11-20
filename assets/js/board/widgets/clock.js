/* --- CLOCK --- (ported from Semester_Break_Hubv2.html 522-529) */
function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    document.getElementById('date').innerText = now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' });
}

export function start() {
    setInterval(updateClock, 1000); updateClock();
}
