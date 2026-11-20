// Auto-update: the deploy writes version.txt (the commit id). If it changes while the
// board is open, a new version was published, so reload. Locally version.txt does not
// exist; a missing file or failed request is simply ignored.
//
// GitHub Pages lets browsers cache JS/CSS for 10 minutes, so the first reload may still
// run old code. Before reloading we note (in sessionStorage, which survives a reload of
// the same tab) that a second reload is due 11 minutes later; the reloaded page picks
// that up and reloads once more, by then with fresh files.
import { safeReload } from './reload.js';

const FLAG = 'adci.pendingRefreshAt';
const SECOND_RELOAD_DELAY_MS = 11 * 60 * 1000;

function readFlag() {
    try {
        const at = Number(sessionStorage.getItem(FLAG));
        return at > 0 ? at : null;
    } catch (e) {
        return null;
    }
}

function writeFlag(at) {
    try {
        if (at === null) sessionStorage.removeItem(FLAG);
        else sessionStorage.setItem(FLAG, String(at));
    } catch (e) { /* storage blocked: no second reload */ }
}

// At most one pending timer; called on start and on every version-check tick, so a
// failed attempt is retried on the next tick.
let secondReloadTimer = null;
function scheduleSecondReload() {
    if (secondReloadTimer) return;
    const at = readFlag();
    if (at === null) return;
    secondReloadTimer = setTimeout(async () => {
        secondReloadTimer = null;
        writeFlag(null);
        // If the site is unreachable, keep the flag so the next tick tries again.
        if (!(await safeReload())) writeFlag(Date.now());
    }, Math.max(0, at - Date.now()));
}

export function watchVersion(intervalMs = 300000) {
    let known = null;
    const check = async () => {
        scheduleSecondReload();
        try {
            const res = await fetch(`version.txt?t=${Date.now()}`, { cache: 'no-store' });
            if (!res.ok) return;
            const value = (await res.text()).trim();
            if (!value) return;
            if (known === null) { known = value; return; }
            if (value !== known) {
                const previous = readFlag();
                writeFlag(Date.now() + SECOND_RELOAD_DELAY_MS);
                // safeReload only reloads when the site answers; if not, retry next tick.
                if (await safeReload()) known = value;
                else writeFlag(previous);
            }
        } catch (e) { /* offline or no version.txt: ignore */ }
    };
    check();
    return setInterval(check, intervalMs);
}
