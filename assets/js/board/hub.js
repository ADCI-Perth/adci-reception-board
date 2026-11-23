// Right-column hub card, per mode: "Today's classes" for schedule modes, otherwise a hero card
// plus tips (tuition/study), exam rules (exam), visitor lines + quote (break) or thank-you
// lines (christmas). Replaces schedule.js and infohub.js; the live/next/ended logic and the
// auto-scroll of a long class list are kept.
import { hubKind } from '../core/modes.js';
import { titlesFor } from '../core/banner.js';
import { formatShort } from '../core/dates.js';
import { escapeHtml } from './util.js';
import { welcomeLines, christmasLines } from './content.js';

/* ---------- pure helpers ---------- */

const minutes = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

function timeLeft(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (!h) return `${m}M`;
    return m ? `${h}H ${m}M` : `${h}H`;
}

// Classes sorted by start, each with status done | live | next | upcoming and its tag text.
export function classStatuses(classes, nowHHMM) {
    const now = minutes(nowHHMM);
    let nextSeen = false;
    return [...(classes || [])]
        .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
        .map(c => {
            const s = minutes(c.start);
            const e = minutes(c.end);
            if (now >= e) return { ...c, status: 'done', tag: 'ENDED' };
            if (now >= s) {
                // As the original board: % elapsed and "hour 2 of 3".
                const progress = {
                    pct: Math.round(((now - s) / (e - s)) * 100),
                    hour: Math.floor((now - s) / 60) + 1,
                    hours: Math.ceil((e - s) / 60),
                };
                return { ...c, status: 'live', tag: '● LIVE NOW', progress };
            }
            if (!nextSeen) { nextSeen = true; return { ...c, status: 'next', tag: `NEXT · IN ${timeLeft(s - now)}` }; }
            return { ...c, status: 'upcoming', tag: 'UPCOMING' };
        });
}

const KEEP_UPPER = ['ID', 'IT'];
export function sentenceCase(s) {
    const words = String(s || '').toLowerCase().split(' ');
    const out = words.map(w => (KEEP_UPPER.includes(w.toUpperCase()) ? w.toUpperCase() : w)).join(' ');
    return out.charAt(0).toUpperCase() + out.slice(1);
}

const titleCase = s => String(s || '').toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());

export function dateRange(block) {
    if (!block || !block.start || !block.end) return '';
    const a = formatShort(block.start);
    const b = formatShort(block.end);
    if (block.start.slice(0, 4) === block.end.slice(0, 4)) return `${a.replace(/ \d{4}$/, '')} – ${b}`;
    return `${a} – ${b}`;
}

// Up to n distinct items, random order.
export function pickTips(tips, n, rand = Math.random) {
    const pool = [...(tips || [])];
    const out = [];
    while (pool.length && out.length < n) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
    return out;
}

/* ---------- rendering ---------- */

function classRow(c) {
    const name = c.unitName ? ` ${escapeHtml(c.unitName)}` : '';
    const where = [c.lecturer, c.room].filter(Boolean).map(escapeHtml).join(' · ');
    // Live: heartbeat dot in the tag, progress stats beside it and a progress bar along the card's bottom.
    const p = c.progress;
    const tag = c.status === 'live'
        ? `<span class="s"><i class="beat"></i>LIVE NOW</span><span class="prog-stat">${p.pct}% · ${p.hour}/${p.hours} HRS</span>`
        : `<span class="s">${c.tag}</span>`;
    const bar = c.status === 'live' ? `<div class="cls-progress"><i style="width:${p.pct}%"></i></div>` : '';
    return `<div class="cls ${c.status}"><div class="t">${escapeHtml(c.start)}<small>${escapeHtml(c.end)}</small></div>`
        + `<div class="b"><h4><em>${escapeHtml(c.unit)}</em>${name}</h4>${where ? `<p>${where}</p>` : ''}`
        + `${tag}</div>${bar}</div>`;
}

function renderClasses(el, state, classes, now) {
    const rows = classStatuses(classes, now);
    const live = rows.filter(r => r.status === 'live').length;
    const empty = state.mode === 'assessment' ? 'Assessment week — no scheduled classes' : 'No classes scheduled today';
    const prev = el.querySelector('.classes');
    const scroll = prev ? prev.scrollTop : 0;
    el.className = 'card hub-main kind-classes';
    el.innerHTML = `<div class="hub-head"><h2>Today’s classes</h2>${live ? `<span class="badge badge-live"><i class="beat"></i>${live} LIVE</span>` : ''}</div>`
        + `<div class="classes">${rows.length ? rows.map(classRow).join('') : `<div class="empty-note hub-empty">${empty}</div>`}</div>`;
    const list = el.querySelector('.classes');
    if (list) list.scrollTop = scroll;
}

function hero(kicker, title, sub) {
    return `<div class="hero"><small>${escapeHtml(kicker)}</small><h3>${escapeHtml(title)}</h3>${sub ? `<p>${escapeHtml(sub)}</p>` : ''}</div>`;
}

function renderInfo(el, state, content) {
    const mode = state.mode;
    const range = dateRange(state.block);
    let html;
    if (mode === 'christmas') {
        const year = Number((state.block && state.block.start || '').slice(0, 4)) || new Date().getFullYear();
        html = hero('🎄 HOLIDAY CLOSURE', 'Merry Christmas', range)
            + `<div class="tips"><div class="label">From all of us</div>${christmasLines(year).map(l => `<p>${escapeHtml(l)}</p>`).join('')}</div>`;
    } else {
        html = hero('CURRENTLY ON', titleCase(titlesFor(mode).card || ''), range);
        if (mode === 'exam') {
            html += `<div class="rules">${(content.examRules || []).map(r =>
                `<div class="rule"><i>${r.icon}</i><span>${escapeHtml(sentenceCase(r.title))}</span></div>`).join('')}</div>`;
        } else if (mode === 'tuition' || mode === 'study') {
            html += `<div class="tiplist"><div class="label">Tips for the week</div>${pickTips(content.tuitionTips, 4).map((t, k) =>
                `<div class="tip"${k ? ' data-drop' : ''}><i>${t.icon}</i><div><h4>${escapeHtml(sentenceCase(t.title))}</h4><p>${escapeHtml(t.desc)}</p></div></div>`).join('')}</div>`;
        } else {
            html += `<div class="tips"><div class="label">Welcome to ADCI</div>${welcomeLines.map(l =>
                `<p>${l.icon} <b>${escapeHtml(l.lead)}</b> ${escapeHtml(l.text)}</p>`).join('')}</div>`;
            const quotes = content.quotes || [];
            if (quotes.length) html += `<div class="quote" data-drop>${escapeHtml(quotes[Math.floor(Math.random() * quotes.length)])}</div>`;
        }
    }
    el.className = `card hub-main kind-info${mode === 'exam' ? ' exam' : ''}${mode === 'christmas' ? ' xmas' : ''}`;
    el.innerHTML = html;
    // Never overflow the card: drop optional items (later tips, last first; the quote) until it fits.
    const drops = [...el.querySelectorAll('[data-drop]')];
    while (el.scrollHeight > el.clientHeight + 1 && drops.length) drops.pop().remove();
}

// now = 'HH:MM' (real current time).
export function renderHub(el, state, { classes = [], now = '00:00', content = {} } = {}) {
    if (!el) return;
    if (hubKind(state.mode) === 'classes') renderClasses(el, state, classes, now);
    else renderInfo(el, state, content);
}

// Ported from schedule.js autoScrollTimetable (v4): step down 100px, back to top at the end.
export function autoScrollTimetable(el) {
    if (el && el.scrollHeight > el.clientHeight) {
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) el.scrollTo({ top: 0, behavior: 'smooth' });
        else el.scrollBy({ top: 100, behavior: 'smooth' });
    }
}
