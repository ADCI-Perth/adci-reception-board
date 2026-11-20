// Auto-update: the deploy writes version.txt (the commit id). If it changes while the
// board is open, a new version was published, so reload. Locally version.txt does not
// exist; a missing file or failed request is simply ignored.
import { safeReload } from './reload.js';

export function watchVersion(intervalMs = 300000) {
    let known = null;
    const check = async () => {
        try {
            const res = await fetch(`version.txt?t=${Date.now()}`, { cache: 'no-store' });
            if (!res.ok) return;
            const value = (await res.text()).trim();
            if (!value) return;
            if (known === null) { known = value; return; }
            if (value !== known) {
                // safeReload only reloads when the site answers; if not, retry next tick.
                if (await safeReload()) known = value;
            }
        } catch (e) { /* offline or no version.txt: ignore */ }
    };
    check();
    return setInterval(check, intervalMs);
}
