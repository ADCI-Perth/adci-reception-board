/* --- WEATHER (auto refresh 10 mins) --- forecast.json: current conditions plus
   the next two hours that are at least 2 h apart, UV and sunset. */
import { escapeHtml } from '../util.js';

let CONFIG;
let loaded = false;

export function uvLabel(uv) {
    if (uv >= 11) return 'Extreme';
    if (uv >= 8) return 'Very high';
    if (uv >= 6) return 'High';
    if (uv >= 3) return 'Moderate';
    return 'Low';
}

// '07:01 PM' -> '7:01'
export function sunsetShort(s) {
    const m = /^\s*(\d{1,2}):(\d{2})/.exec(String(s || ''));
    return m ? `${parseInt(m[1], 10)}:${m[2]}` : '--';
}

function hourLabel(date) {
    const h = date.getHours();
    return `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
}

// First hour >= 2 h after now, then the next >= 2 h after that (hours of today only).
export function pickHours(hours, now = new Date()) {
    const picks = [];
    let threshold = now.getTime() + 2 * 3600000;
    for (const h of hours || []) {
        const t = h.time_epoch ? h.time_epoch * 1000 : new Date(String(h.time).replace(' ', 'T')).getTime();
        if (t >= threshold) {
            picks.push({ label: hourLabel(new Date(t)), temp: Math.round(h.temp_c) });
            threshold = t + 2 * 3600000;
            if (picks.length === 2) break;
        }
    }
    return picks;
}

function conditionClass(text) {
    const txt = text.toLowerCase();
    if (txt.includes('thunder') || txt.includes('storm')) return 'weather-storm';
    if (txt.includes('rain') || txt.includes('drizzle') || txt.includes('shower')) return 'weather-rain';
    if (txt.includes('snow') || txt.includes('ice')) return 'weather-snow';
    if (txt.includes('cloud') || txt.includes('overcast')) return 'weather-cloudy';
    if (txt.includes('mist') || txt.includes('fog')) return 'weather-mist';
    return 'weather-sunny';
}

function fetchWeather() {
    fetch(`https://api.weatherapi.com/v1/forecast.json?key=${CONFIG.weatherKey}&q=${CONFIG.weatherCity}&days=1`)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }).then(d => {
        const card = document.getElementById('panel-weather');
        const cur = d.current;
        const day = d.forecast.forecastday[0];
        card.className = 'card weather ' + conditionClass(cur.condition.text);

        const tiles = pickHours(day.hour).map(p => `<div>${escapeHtml(p.label)}<b>${p.temp}°</b></div>`);
        const uvRaw = Number(cur.uv ?? day.day?.uv);
        const uvTile = Number.isFinite(uvRaw) ? `${Math.round(uvRaw)} <em>${uvLabel(Math.round(uvRaw))}</em>` : '--';
        tiles.push(`<div>UV<b>${uvTile}</b></div>`);
        tiles.push(`<div>Sunset<b>${escapeHtml(sunsetShort(day.astro.sunset))}</b></div>`);

        document.getElementById('weather-content').innerHTML = `
            <div class="wx-top">
                <img src="https:${escapeHtml(cur.condition.icon)}" alt="">
                <b>${Math.round(cur.temp_c)}°</b>
                <div><span>${escapeHtml(cur.condition.text)}</span><span>Feels like ${Math.round(cur.feelslike_c)}° · Wind ${Math.round(cur.wind_kph)} km/h</span></div>
            </div>
            <div class="wx-row">${tiles.join('')}</div>`;
        loaded = true;
    }).catch(() => {
        // Keep the last good render on a failed refresh; only show the message if nothing has loaded.
        if (!loaded) document.getElementById('weather-content').textContent = 'Weather unavailable';
    });
}

export function start(config) {
    CONFIG = config;
    fetchWeather();
    setInterval(fetchWeather, 600000);
}
