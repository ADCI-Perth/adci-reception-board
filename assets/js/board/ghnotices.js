// Loads notices posted as GitHub Issues (label "notice") from the public GitHub API.
// Unauthenticated: 60 requests/hour per IP; the board asks every 5 minutes.
// Any failure keeps the last good list (localStorage), so the board never loses its notices.
import { parsePosters, parseIssueNotices } from '../core/issuenotices.js';

export const ISSUES_URL = 'https://api.github.com/repos/ADCI-Perth/adci-reception-board/issues?state=open&labels=notice&per_page=100';
const POSTERS_URL = 'data/notice-posters.txt';
const CACHE_KEY = 'adci.issueNotices';
const TIMEOUT_MS = 8000;

async function get(url, as) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
        if (!res.ok) throw new Error(`${url} returned ${res.status}`);
        return as === 'text' ? await res.text() : await res.json();
    } finally { clearTimeout(timer); }
}

function readCache() {
    try { const v = JSON.parse(localStorage.getItem(CACHE_KEY)); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
}

// -> { notices, skipped, live }  (live=false: from cache because GitHub could not be reached)
export async function loadIssueNotices() {
    try {
        const [postersText, issues] = await Promise.all([get(POSTERS_URL, 'text'), get(ISSUES_URL, 'json')]);
        if (!Array.isArray(issues)) throw new Error('Unexpected GitHub response');
        const result = parseIssueNotices(issues, parsePosters(postersText));
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(result.notices)); } catch (e) { /* storage blocked */ }
        return { ...result, live: true };
    } catch (e) {
        console.warn('GitHub notices unavailable; using the last good copy.', e);
        return { notices: readCache(), skipped: [], live: false };
    }
}
