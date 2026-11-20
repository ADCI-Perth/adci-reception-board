/* --- INFO HUB --- (ported from Exam_Week_Hub.html 664-701 renderBreakHub and
   Semester_Break_Hubv2.html 887-913)
   Changes: the card label is "CURRENTLY ON" (SBv2), its title comes from titlesFor(mode).card
   (the old tuition file said "EXAM WEEK" by mistake), the date range is the calendar block,
   and the countdown is filled by main.js. Tips only for tuition/exam; quote always. */
import { titlesFor } from '../core/banner.js';
import { formatShort } from '../core/dates.js';
import { escapeHtml } from './util.js';

export function tipsFor(mode, content) {
    if (mode === 'tuition') return content.tuitionTips;
    if (mode === 'exam') return content.examRules;
    return [];
}

export function renderInfoHub(container, state, content) {
    if (!container) return;
    const card = titlesFor(state.mode).card || '';
    const dateRange = state.block ? `${formatShort(state.block.start)} — ${formatShort(state.block.end)}` : '';

    let html = `
        <div class="tuition-free-card">
            <div style="font-size:12px; color:var(--brand-blue); font-weight:800; letter-spacing:1px;">CURRENTLY ON</div>
            <div style="font-size:22px; font-weight:800; font-family:'Oswald';">${escapeHtml(card)}</div>
            ${dateRange ? `<div style="font-size:13px; margin-top:6px; color:var(--text-muted); font-weight:600;">${dateRange}</div>` : ''}
        </div>
    `;

    tipsFor(state.mode, content).forEach(item => {
        html += `
            <div class="event-row" style="border-left-color: ${item.color};">
                <div class="event-time">${item.icon}</div>
                <div class="event-details">
                    <h4>${item.title}</h4>
                    <p>${item.desc}</p>
                </div>
            </div>`;
    });

    const quotes = content.quotes || [];
    if (quotes.length) {
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        html += `<div class="hub-quote" style="padding:15px; background:#f8f9fa; border-radius:12px; border:1px dashed #ccc; text-align:center; font-style:italic; font-size:13px; color:#666;">${quote}</div>`;
    }
    container.innerHTML = html;
}

// Assessment week with no classes: the card replaces v4's ☕ "No classes scheduled" block.
export function renderAssessmentEmpty(container) {
    if (!container) return;
    container.classList.add('busy-day');   // same sizing as renderSchedule's empty-day block
    container.innerHTML = `
        <div class="tuition-free-card">
            <div style="font-size:22px; font-weight:800; font-family:'Oswald';">${escapeHtml(titlesFor('assessment').card)}</div>
            <div style="font-size:13px; margin-top:6px; color:var(--text-muted); font-weight:600;">No scheduled classes</div>
        </div>
    `;
}
