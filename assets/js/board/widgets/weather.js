/* --- WEATHER (Auto Refresh 10 mins) --- (ported from Semester_Break_Hubv2.html 530-556)
   Only change: the card is looked up by its panel id (#panel-weather, was #weather-card-bg). */
let CONFIG;

function fetchWeather() {
    fetch(`https://api.weatherapi.com/v1/current.json?key=${CONFIG.weatherKey}&q=${CONFIG.weatherCity}`)
    .then(r => r.json()).then(d => {
        const card = document.getElementById('panel-weather');
        const txt = d.current.condition.text.toLowerCase();
        card.className = 'info-card weather-card';
        if (txt.includes("rain") || txt.includes("drizzle") || txt.includes("shower")) card.classList.add("weather-rain");
        else if (txt.includes("thunder") || txt.includes("storm")) card.classList.add("weather-storm");
        else if (txt.includes("snow") || txt.includes("ice")) card.classList.add("weather-snow");
        else if (txt.includes("cloud") || txt.includes("overcast")) card.classList.add("weather-cloudy");
        else if (txt.includes("mist") || txt.includes("fog")) card.classList.add("weather-mist");
        else card.classList.add("weather-sunny");

        document.getElementById('weather-content').innerHTML = `
            <img src="https:${d.current.condition.icon}" class="weather-icon">
            <div class="weather-info">
                <div class="temp-big">${Math.round(d.current.temp_c)}°C</div>
                <div class="weather-text">${d.current.condition.text}</div>

            </div>
        `;
    }).catch(e => {});
}

export function start(config) {
    CONFIG = config;
    fetchWeather();
    setInterval(fetchWeather, 600000);
}
