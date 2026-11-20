// Reload the page only when the site is reachable, so a network blip never swaps the
// board for the browser's offline error page. Resolves true if a reload was started;
// on false the caller retries later (e.g. on its next tick).
let pending = null;

export function safeReload() {
    if (pending) return pending;
    pending = fetch(location.href, { method: 'HEAD', cache: 'no-store' })
        .then(res => {
            if (!res.ok) return false;
            location.reload();
            return true;
        })
        .catch(() => false)
        .then(ok => { pending = null; return ok; });
    return pending;
}
