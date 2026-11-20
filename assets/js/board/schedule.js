/* --- TIMETABLE --- (ported from Standard_reception_hub - v4.html 698-770)
   Changes: takes the container and today's classes (from Timetable.xlsx) instead of
   reading CONFIG.schedule; class text is HTML-escaped because it now comes from a spreadsheet. */
import { displayName } from '../core/timetable.js';
import { escapeHtml } from './util.js';

export function renderSchedule(container, classes) {
    try {
        if(!container) return;
        let events = (classes || []).map(c => ({
            time: c.start, end: c.end, name: displayName(c), room: c.room, lect: c.lecturer
        }));
        container.classList.add("busy-day");
        container.innerHTML = "";

        if(events.length === 0) {
            container.innerHTML = `<div style="text-align:center; margin-top:60px; color:#888;"><div style="font-size:50px; margin-bottom:20px;">☕</div><div style="font-size:24px; font-weight:600;">No classes scheduled</div></div>`;
            return;
        }

        events.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
        const now = new Date();
        const currentHr = now.getHours() + now.getMinutes()/60;

        events.forEach(ev => {
            let [sH, sM] = ev.time.split(":").map(Number);
            let [eH, eM] = ev.end.split(":").map(Number);
            let startVal = sH + sM/60;
            let endVal = eH + eM/60;
            let duration = endVal - startVal;

            let isActive = (currentHr >= startVal && currentHr < endVal);
            let statusClass = "";
            let badgeHtml = "";
            let progressHtml = "";
            let statsHtml = "";

            if (currentHr >= endVal) {
                statusClass = "status-past";
                badgeHtml = `<span class="badge" style="background:#ccc; color:#555;">Ended</span>`;
            } else if (isActive) {
                statusClass = "status-active";
                badgeHtml = `<span class="badge badge-live">● LIVE NOW</span>`;

                // MATH FOR 45% | 1/3 hrs
                let elapsed = currentHr - startVal;
                let pct = Math.min(100, Math.max(0, (elapsed / duration) * 100));
                let currentHrBlock = Math.floor(elapsed) + 1;
                let totalHrBlock = Math.ceil(duration);

                statsHtml = `<span class="progress-stats">${Math.round(pct)}% | ${currentHrBlock}/${totalHrBlock} hrs</span>`;
                progressHtml = `<div class="progress-bg"><div class="progress-fill" style="width:${pct}%"></div></div>`;
            } else {
                statusClass = "status-next";
                badgeHtml = `<span class="badge badge-next">UPCOMING</span>`;
            }

            container.innerHTML += `
            <div class="event-row ${statusClass}">
                ${progressHtml}
                <div class="event-time"><span>${ev.time}</span><span class="end-time">${ev.end}</span></div>
                <div class="event-details">
                    <h4>${escapeHtml(ev.name)}</h4>
                    <p>📍 ${escapeHtml(ev.room)}${ev.lect ? " &nbsp;·&nbsp; 👤 " + escapeHtml(ev.lect) : ""} &nbsp; ${badgeHtml} ${statsHtml}</p>
                </div>
            </div>`;
        });
    } catch(error) { console.error(error); }
}

export function autoScrollTimetable(el) {
    if(el.scrollHeight > el.clientHeight) {
        if(el.scrollTop + el.clientHeight >= el.scrollHeight - 5) el.scrollTo({ top: 0, behavior: 'smooth' });
        else el.scrollBy({ top: 100, behavior: 'smooth' });
    }
}
