// Left-column and footer panels: key dates, notice board + ticker, rooms strip, countdown.
// Spreadsheet text is set with textContent or escapeHtml, never as raw HTML.
import { DEFAULT_NOTICE } from '../core/boarddata.js';
import { formatLong, daysBetween } from '../core/dates.js';
import { escapeHtml } from './util.js';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const NO_COUNTDOWN = ['teaching', 'orientation', 'summer'];
const TICKER_PX_PER_S = 110;

/* ---------- pure helpers ---------- */

export function tickerItems(bannerText, notices) {
    return [bannerText, ...(notices || []).map(n => (n.message ? `${n.title} — ${n.message}` : n.title))];
}

export const dayCountText = n => `${n} day${n === 1 ? '' : 's'}`;

export function calTile(iso) {
    const [, m, d] = iso.split('-').map(Number);
    return { month: MONTHS[m - 1], day: String(d) };
}

// Only assessment of the schedule modes shows a countdown (as before the redesign).
export const showsCountdown = state => !!(state && state.countdown) && !NO_COUNTDOWN.includes(state.mode);

/* ---------- key dates ---------- */

export function renderKeyDates(el, items) {
    if (!el) return;
    if (!items || !items.length) {
        el.innerHTML = '<div class="empty-note">No upcoming dates</div>';
        return;
    }
    el.innerHTML = items.map(it => {
        const t = calTile(it.iso);
        return `<div class="date-item"><div class="cal"><i>${t.month}</i><b>${t.day}</b></div>`
            + `<div class="dtxt"><h4>${escapeHtml(it.title)}</h4><p>${escapeHtml(it.sub)}</p></div>`
            + `<div class="in">${dayCountText(it.days)}</div></div>`;
    }).join('');
}

/* ---------- notices + ticker ---------- */

let noticeTimer = null;

// cardEls = { title, message, pager }. Rotates every intervalMs; the ticker runs the banner
// followed by every active notice.
export function startNotices(cardEls, tickerEl, notices, bannerText, intervalMs = 10000) {
    const list = notices && notices.length ? notices : [DEFAULT_NOTICE];
    let i = 0;
    const show = () => {
        const n = list[i];
        if (cardEls.title) cardEls.title.textContent = n.title;
        if (cardEls.message) {
            cardEls.message.textContent = n.message || '';
            cardEls.message.hidden = !n.message;
        }
        if (cardEls.pager) {
            cardEls.pager.hidden = list.length < 2;
            cardEls.pager.innerHTML = list.length < 2 ? '' : list.map((_, k) => `<i${k === i ? ' class="on"' : ''}></i>`).join('');
        }
    };
    show();
    if (noticeTimer) clearInterval(noticeTimer);
    noticeTimer = list.length > 1 ? setInterval(() => { i = (i + 1) % list.length; show(); }, intervalMs) : null;

    renderTicker(tickerEl, tickerItems(bannerText, notices || []));
}

function renderTicker(el, items) {
    if (!el) return;
    el.innerHTML = items.map((t, k) => (k === 0 ? `<b>${escapeHtml(t)}</b>` : `<span>${escapeHtml(t)}</span>`))
        .join('<em>◆</em>');
    // Constant reading speed: the run travels the screen width plus its own width.
    const fit = () => {
        const distance = window.innerWidth + el.offsetWidth;
        el.style.animationDuration = `${Math.max(20, Math.round(distance / TICKER_PX_PER_S))}s`;
    };
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit).catch(() => {});
}

/* ---------- rooms strip ---------- */

const ROOM_TAG = { busy: 'IN USE', next: 'NEXT', free: 'FREE' };
const ROOM_CLASS = { busy: 'busy', next: 'soon', free: 'free' };

export function renderRooms(el, rooms) {
    if (!el) return;
    el.classList.toggle('many', (rooms || []).length > 3);
    el.innerHTML = (rooms || []).map(r =>
        `<div class="room ${ROOM_CLASS[r.status] || 'free'}"><i class="st"></i>`
        + `<div class="rtxt"><h4>${escapeHtml(r.room)}</h4><p>${escapeHtml(r.text)}</p></div>`
        + `<span class="tag">${ROOM_TAG[r.status] || 'FREE'}</span></div>`).join('');
}

/* ---------- countdown ---------- */

export function renderCountdown(els, state, iso) {
    if (!els.box) return;
    if (!showsCountdown(state)) { els.box.hidden = true; return; }
    const target = state.countdown.target;
    els.label.textContent = state.countdown.label;
    els.days.textContent = dayCountText(daysBetween(iso, target));
    els.sub.textContent = formatLong(target);
    els.box.hidden = false;
}
