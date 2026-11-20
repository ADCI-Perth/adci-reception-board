/* Playlist carousel: map -> course spotlights -> photos/videos, driven by media/manifest.json.
   One photo slide, one video slide and one spotlight slide are created once and reused. */
import { buildPlaylist } from '../../core/playlist.js';
import { escapeHtml } from '../util.js';
import { drawMap, start as startMap } from './map.js';

const MAX_BARS = 12;
const VIDEO_STALL_MS = 5000;

const MANIFEST_TIMEOUT_MS = 8000;

// Any failure, including a fetch that stalls past the timeout, gives null (map-only playlist).
async function fetchManifest(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), MANIFEST_TIMEOUT_MS);
    try {
        const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) { return null; }
    finally { clearTimeout(timer); }
}

function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstChild;
}

export async function startCarousel(stageEl, opts = {}) {
    const { manifestUrl = 'media/manifest.json', courses = [], captions = {}, mode,
            mapDuration = 30000, photoDuration = 6000 } = opts;

    const mapView = stageEl.querySelector('#view-map');
    const photoView = el('<div class="center-slide" id="view-photo"><img class="photo" alt=""><div class="caption" hidden><small>OUR CAMPUS</small><h2></h2></div></div>');
    const videoView = el('<div class="center-slide" id="view-video"><video muted playsinline style="width:100%;height:100%;object-fit:cover;background:#000"></video></div>');
    const spotView = el('<div class="center-slide" id="view-spot"><div class="spot"><div class="txt"></div><div class="spot-photo"></div></div></div>');
    const barsEl = el('<div class="bars"></div>');
    barsEl.style.zIndex = '20';
    stageEl.append(photoView, videoView, spotView, barsEl);
    const views = [mapView, photoView, videoView, spotView];
    const img = photoView.querySelector('img');
    const capBox = photoView.querySelector('.caption');
    const capTitle = capBox.querySelector('h2');
    const video = videoView.querySelector('video');
    const spotTxt = spotView.querySelector('.txt');
    const spotPhoto = spotView.querySelector('.spot-photo');

    try { startMap(); } catch (e) { console.error('Map start failed', e); }

    // The map slide is already active in index.html; draw it now so the stage is never blank while the manifest loads.
    try { drawMap(); } catch (e) { console.error('drawMap failed', e); }

    let manifest = await fetchManifest(manifestUrl);
    let slides = buildPlaylist({ manifest, courses, captions, mode });
    let index = 0;
    let cleanup = null;      // undoes the current slide's timers/listeners
    let token = 0;           // guards against stale callbacks

    function renderBars(current, durationMs) {
        const n = slides.length;
        const shown = Math.min(n, MAX_BARS);
        let first = 0;
        if (n > MAX_BARS) first = Math.min(Math.floor(current / MAX_BARS) * MAX_BARS, n - MAX_BARS);
        barsEl.innerHTML = '';
        let fill = null;
        for (let i = first; i < first + shown; i++) {
            const seg = document.createElement('i');
            if (i < current) seg.style.background = '#fff';
            else if (i === current) {
                fill = document.createElement('span');
                fill.style.cssText = 'display:block;height:100%;width:0;background:#fff;border-radius:4px';
                seg.appendChild(fill);
            }
            barsEl.appendChild(seg);
        }
        if (fill && durationMs) {
            void fill.offsetWidth;
            fill.style.transition = `width ${durationMs}ms linear`;
            fill.style.width = '100%';
        } else if (fill) fill.style.width = '100%';
    }

    function show(view) {
        for (const v of views) v.classList.toggle('active-view', v === view);
    }

    function next() {
        if (cleanup) { cleanup(); cleanup = null; }
        index++;
        if (index >= slides.length) {
            index = 0;
            if (!manifest) {
                // A failed manifest fetch is retried once per wrap, then play on with whatever we have.
                fetchManifest(manifestUrl).then(m => {
                    if (m) { manifest = m; slides = buildPlaylist({ manifest, courses, captions, mode }); }
                    play();
                }, play);
                return;
            }
        }
        play();
    }

    function play() {
        if (cleanup) { cleanup(); cleanup = null; }
        const my = ++token;
        const slide = slides[index] || slides[0];
        const go = () => { if (my === token) next(); };
        const timers = [];
        const after = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
        cleanup = () => { timers.forEach(clearTimeout); };

        try {
            if (slide.kind === 'map') {
                show(mapView);
                renderBars(index, mapDuration);
                after(() => { try { drawMap(); } catch (e) { console.error('drawMap failed', e); } }, 100);
                after(go, mapDuration);
            } else if (slide.kind === 'photo') {
                img.onerror = go;
                img.src = slide.url;
                if (slide.caption) { capTitle.textContent = slide.caption; capBox.hidden = false; }
                else { capTitle.textContent = ''; capBox.hidden = true; }
                show(photoView);
                renderBars(index, photoDuration);
                after(go, photoDuration);
                cleanup = () => { timers.forEach(clearTimeout); img.onerror = null; };
            } else if (slide.kind === 'course') {
                const c = slide.course;
                const facts = [[c.duration, 'Duration'], [c.intakes, 'Intakes'], [c.location, 'Location']]
                    .filter(([v]) => v && String(v).trim())
                    .map(([v, l]) => `<div><b>${escapeHtml(v)}</b>${l}</div>`).join('');
                spotTxt.innerHTML = `<small>COURSE SPOTLIGHT</small><h2>${escapeHtml(c.course)}</h2>`
                    + (c.tagline ? `<p>${escapeHtml(c.tagline)}</p>` : '')
                    + (facts ? `<div class="facts">${facts}</div>` : '');
                spotPhoto.innerHTML = '';
                if (slide.photoUrl) {
                    const im = document.createElement('img');
                    im.alt = '';
                    im.src = slide.photoUrl;
                    spotPhoto.appendChild(im);
                    spotPhoto.style.background = '';
                } else {
                    spotPhoto.style.background = 'linear-gradient(135deg,var(--teal),var(--navy))';
                }
                show(spotView);
                renderBars(index, photoDuration * 2);
                after(go, photoDuration * 2);
            } else if (slide.kind === 'video') {
                let started = false;
                const onPlaying = () => {
                    if (started) return;
                    started = true;
                    clearTimeout(stall);
                    if (isFinite(video.duration) && video.duration > 0) renderBars(index, video.duration * 1000);
                };
                const stall = setTimeout(go, VIDEO_STALL_MS);
                timers.push(stall);
                video.addEventListener('ended', go);
                video.addEventListener('error', go);
                video.addEventListener('playing', onPlaying);
                cleanup = () => {
                    timers.forEach(clearTimeout);
                    video.removeEventListener('ended', go);
                    video.removeEventListener('error', go);
                    video.removeEventListener('playing', onPlaying);
                    video.pause();
                };
                video.muted = true;
                video.src = slide.url;
                show(videoView);
                renderBars(index, 0);
                const p = video.play();
                if (p && p.catch) p.catch(go);
            }
        } catch (e) {
            console.error('Carousel slide failed', e);
            after(go, 1000);
        }
    }

    play();
}
