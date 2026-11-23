// Notices posted as GitHub Issues with the "Notice" form (.github/ISSUE_TEMPLATE/notice.yml).
// Pure functions: no fetch, no DOM. Only issues by GitHub users listed in
// data/notice-posters.txt are used — the repository is public, so anyone can open an issue.
import { toISODate } from './dates.js';

// data/notice-posters.txt: one GitHub username per line; blank lines and # comments ignored.
export function parsePosters(text) {
    return String(text || '')
        .split(/\r?\n/)
        .map(line => line.replace(/#.*/, '').trim().replace(/^@/, '').toLowerCase())
        .filter(Boolean);
}

const NO_RESPONSE = /^_no response_$/i;

// Issue-form bodies are "### Heading\n\nvalue" blocks. -> { 'message': '...', 'show from': '...' }
export function formFields(body) {
    const out = {};
    const parts = String(body || '').replace(/\r\n/g, '\n').split(/^###\s+/m).slice(1);
    for (const part of parts) {
        const nl = part.indexOf('\n');
        const key = (nl === -1 ? part : part.slice(0, nl)).trim().toLowerCase();
        const value = (nl === -1 ? '' : part.slice(nl + 1)).trim();
        out[key] = NO_RESPONSE.test(value) ? '' : value;
    }
    return out;
}

// issues: GitHub REST "list repository issues" items. posters: from parsePosters.
// -> { notices: Notice[], skipped: { number, title, reason }[] }
// Notice = { title, message, start, end, row, source: 'github', number }  (same shape as Board.xlsx notices)
export function parseIssueNotices(issues, posters) {
    const allowed = new Set((posters || []).map(p => p.toLowerCase()));
    const notices = [];
    const skipped = [];
    for (const issue of Array.isArray(issues) ? issues : []) {
        if (!issue || issue.pull_request || issue.state !== 'open') continue;
        const hasLabel = (issue.labels || []).some(l => String(l && (l.name ?? l)).toLowerCase() === 'notice');
        if (!hasLabel) continue;
        const number = issue.number;
        const title = String(issue.title || '').trim();
        const login = String(issue.user && issue.user.login || '').toLowerCase();
        const skip = reason => skipped.push({ number, title, reason });

        if (!allowed.has(login)) { skip(`posted by ${issue.user && issue.user.login || 'unknown'}, who is not in data/notice-posters.txt`); continue; }
        if (!title) { skip('missing title'); continue; }

        const f = formFields(issue.body);
        const fromText = f['show from'] || '';
        const untilText = f['show until'] || '';
        const start = fromText ? toISODate(fromText) : null;
        const end = untilText ? toISODate(untilText) : null;
        if (fromText && !start) { skip(`"Show from" is not a date (use dd/mm/yyyy): ${fromText}`); continue; }
        if (untilText && !end) { skip(`"Show until" is not a date (use dd/mm/yyyy): ${untilText}`); continue; }
        if (start && end && end < start) { skip('"Show until" is before "Show from"'); continue; }

        // Without the form (plain issue), the whole body is the message.
        const message = ('message' in f ? f.message : String(issue.body || '').trim()).replace(/\s+/g, ' ').trim();
        notices.push({ title, message, start, end, row: number, source: 'github', number });
    }
    notices.sort((a, b) => a.number - b.number);
    return { notices, skipped };
}
