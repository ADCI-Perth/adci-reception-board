/* --- LIVE NEWS FEEDS + SHARED FETCH HELPERS ---
   Ported from Semester_Break_Hubv2.html 598-611 (fetchJsonWithTimeout) and 718-880.
   Only change: the immediate fetch/setInterval calls moved into start(). */

export function fetchJsonWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { cache: "no-store", signal: controller.signal })
        .then(response => {
            clearTimeout(timer);
            if (!response.ok) throw new Error("Feed returned " + response.status);
            return response.json();
        })
        .catch(error => {
            clearTimeout(timer);
            throw error;
        });
}

/* --- CYBER NEWS FEED (The Hacker News + BleepingComputer, via CORS proxy) --- */
const CYBER_NEWS_FEEDS = [
    { url: "https://feeds.feedburner.com/TheHackersNews", source: "The Hacker News" },
    { url: "https://www.bleepingcomputer.com/feed/", source: "BleepingComputer" }
];
let cyberNewsItems = [];
let cyberNewsIndex = 0;

export function proxiedUrl(url) {
    return "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
}

export function fetchTextWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { cache: "no-store", signal: controller.signal })
        .then(response => {
            clearTimeout(timer);
            if (!response.ok) throw new Error("Feed returned " + response.status);
            return response.text();
        })
        .catch(error => { clearTimeout(timer); throw error; });
}

function parseRssItems(xmlText, sourceName, limit) {
    const doc = new DOMParser().parseFromString(xmlText, "text/xml");
    const items = Array.from(doc.querySelectorAll("item")).slice(0, limit || 6);
    return items.map(item => ({
        title: (item.querySelector("title") ? item.querySelector("title").textContent : "").trim(),
        link: item.querySelector("link") ? item.querySelector("link").textContent.trim() : "",
        pubDate: item.querySelector("pubDate") ? item.querySelector("pubDate").textContent.trim() : "",
        source: sourceName
    })).filter(i => i.title);
}

function timeAgo(dateStr) {
    if (!dateStr) return "Live Feed";
    const d = new Date(dateStr);
    if (isNaN(d)) return "Live Feed";
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return mins + "m ago";
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    return Math.floor(hrs / 24) + "d ago";
}

export function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderNewsList(containerId, items, index, count, emptyText, emptySource) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (!items.length) {
        el.innerHTML = `
            <div class="news-item">
                <div class="news-item-title">${emptyText}</div>
                <div class="news-item-meta"><span>${emptySource}</span><span>Retrying</span></div>
            </div>`;
        return;
    }

    let html = "";
    const shown = Math.min(count, items.length);
    for (let i = 0; i < shown; i++) {
        const item = items[(index + i) % items.length];
        html += `
            <div class="news-item">
                <div class="news-item-title">${escapeHtml(item.title)}</div>
                <div class="news-item-meta"><span>${escapeHtml(item.source)}</span><span>${timeAgo(item.pubDate)}</span></div>
            </div>`;
    }
    el.innerHTML = html;
}

function showCyberNewsItem() {
    renderNewsList("cyber-news-list", cyberNewsItems, cyberNewsIndex, 3,
        "Live feed temporarily unavailable. Retrying automatically.", "Cyber News");
    cyberNewsIndex++;
}

function fetchCyberNews() {
    Promise.all(CYBER_NEWS_FEEDS.map(feed =>
        fetchTextWithTimeout(proxiedUrl(feed.url), 9000)
            .then(xml => parseRssItems(xml, feed.source, 6))
            .catch(() => [])
    )).then(results => {
        const merged = results.flat().sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        if (merged.length) {
            cyberNewsItems = merged.slice(0, 10);
            cyberNewsIndex = 0;
        }
        showCyberNewsItem();
    }).catch(() => showCyberNewsItem());
}

/* --- AI / DATA SCIENCE NEWS FEED (arXiv + Hacker News, via Algolia + CORS proxy) --- */
const ARXIV_FEED_URL = "http://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG&sortBy=submittedDate&sortOrder=descending&max_results=8";
const HN_AI_QUERIES = [
    "https://hn.algolia.com/api/v1/search_by_date?tags=story&query=artificial%20intelligence&hitsPerPage=6",
    "https://hn.algolia.com/api/v1/search_by_date?tags=story&query=machine%20learning&hitsPerPage=6"
];
let aiNewsItems = [];
let aiNewsIndex = 0;

function parseArxivItems(xmlText, limit) {
    const doc = new DOMParser().parseFromString(xmlText, "text/xml");
    const entries = Array.from(doc.querySelectorAll("entry")).slice(0, limit || 8);
    return entries.map(entry => {
        const linkEl = entry.querySelector("link[rel='alternate']") || entry.querySelector("link");
        return {
            title: (entry.querySelector("title") ? entry.querySelector("title").textContent : "").replace(/\s+/g, " ").trim(),
            link: linkEl ? linkEl.getAttribute("href") : "",
            pubDate: entry.querySelector("published") ? entry.querySelector("published").textContent.trim() : "",
            source: "arXiv"
        };
    }).filter(i => i.title);
}

function showAiNewsItem() {
    renderNewsList("ai-news-list", aiNewsItems, aiNewsIndex, 3,
        "Live feed temporarily unavailable. Retrying automatically.", "AI / Data Science");
    aiNewsIndex++;
}

function fetchAiNews() {
    const arxivPromise = fetchTextWithTimeout(proxiedUrl(ARXIV_FEED_URL), 9000)
        .then(xml => parseArxivItems(xml, 8))
        .catch(() => []);

    const hnPromise = Promise.all(HN_AI_QUERIES.map(url =>
        fetchJsonWithTimeout(url, 9000)
            .then(data => Array.isArray(data.hits) ? data.hits.map(hit => ({
                title: hit.title || hit.story_title || "",
                link: hit.url || hit.story_url || ("https://news.ycombinator.com/item?id=" + hit.objectID),
                pubDate: hit.created_at || "",
                source: "Hacker News"
            })) : [])
            .catch(() => [])
    )).then(arr => arr.flat());

    Promise.all([arxivPromise, hnPromise]).then(([arxivItems, hnItems]) => {
        const seen = new Set();
        const merged = arxivItems.concat(hnItems)
            .filter(i => i.title && !seen.has(i.title) && seen.add(i.title))
            .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        if (merged.length) {
            aiNewsItems = merged.slice(0, 12);
            aiNewsIndex = 0;
        }
        showAiNewsItem();
    }).catch(() => showAiNewsItem());
}

export function start() {
    fetchCyberNews();
    setInterval(showCyberNewsItem, 9000);
    setInterval(fetchCyberNews, 1800000);

    fetchAiNews();
    setInterval(showAiNewsItem, 9500);
    setInterval(fetchAiNews, 1800000);
}
