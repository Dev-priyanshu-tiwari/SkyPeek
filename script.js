// ============================================================
//  SkyPeek — Weather Dashboard
//  Replace API_KEY with your OpenWeatherMap key for live data
//  Get a FREE key at: https://openweathermap.org/api
// ============================================================

const API_KEY = '4f4d796bae2b8a2e249216326b917a68'; // <-- Replace this
const USE_MOCK = API_KEY === '4f4d796bae2b8a2e249216326b917a68'; // auto-switches to mock

// ============================================================
//  DOM REFS
// ============================================================
const cityInput   = document.getElementById('cityInput');
const searchBtn   = document.getElementById('searchBtn');
const errorBox    = document.getElementById('errorBox');
const loader      = document.getElementById('loader');
const results     = document.getElementById('results');
const forecastRow = document.getElementById('forecastRow');

// ============================================================
//  DATE CHIP
// ============================================================
document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
  weekday: 'short', month: 'short', day: 'numeric'
});

// ============================================================
//  WEATHER EMOJI MAP
// ============================================================
function getEmoji(code) {
  if (code >= 200 && code < 300) return '⛈️';
  if (code >= 300 && code < 400) return '🌦️';
  if (code >= 500 && code < 600) return '🌧️';
  if (code >= 600 && code < 700) return '❄️';
  if (code >= 700 && code < 800) return '🌫️';
  if (code === 800)               return '☀️';
  if (code === 801)               return '🌤️';
  if (code >= 802 && code < 900) return '☁️';
  return '🌡️';
}

// ============================================================
//  MOCK DATA GENERATOR (realistic, city-aware)
// ============================================================
const mockCities = {
  delhi:      { temp: 32, humidity: 55, wind: 12, desc: 'haze', code: 721, country: 'IN', lat: 28.6, lon: 77.2 },
  mumbai:     { temp: 29, humidity: 80, wind: 18, desc: 'scattered clouds', code: 802, country: 'IN', lat: 19.0, lon: 72.8 },
  prayagraj:  { temp: 35, humidity: 48, wind: 10, desc: 'clear sky', code: 800, country: 'IN', lat: 25.4, lon: 81.8 },
  london:     { temp: 14, humidity: 72, wind: 22, desc: 'overcast clouds', code: 804, country: 'GB', lat: 51.5, lon: -0.1 },
  tokyo:      { temp: 22, humidity: 61, wind: 8,  desc: 'few clouds', code: 801, country: 'JP', lat: 35.7, lon: 139.7 },
  default:    { temp: 25, humidity: 60, wind: 15, desc: 'partly cloudy', code: 801, country: '--', lat: 0,    lon: 0 },
};

function getMock(city) {
  const key  = city.toLowerCase();
  const base = mockCities[key] || mockCities.default;
  const now  = Math.floor(Date.now() / 1000);
  return {
    name: city.charAt(0).toUpperCase() + city.slice(1),
    sys: { country: base.country, sunrise: now - 21600, sunset: now + 21600 },
    coord: { lat: base.lat, lon: base.lon },
    main: {
      temp: base.temp, feels_like: base.temp - 2,
      temp_min: base.temp - 4, temp_max: base.temp + 3,
      humidity: base.humidity, pressure: 1013,
    },
    weather: [{ description: base.desc, id: base.code }],
    wind:    { speed: base.wind },
    clouds:  { all: 35 },
    visibility: 9000,
  };
}

function getMockForecast(city) {
  const key  = city.toLowerCase();
  const base = mockCities[key] || mockCities.default;
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const weatherVariants = [
    { desc: 'sunny',          code: 800 },
    { desc: 'partly cloudy',  code: 801 },
    { desc: 'cloudy',         code: 803 },
    { desc: 'light rain',     code: 500 },
    { desc: 'thunderstorm',   code: 200 },
  ];
  return Array.from({ length: 5 }, (_, i) => {
    const d   = new Date(); d.setDate(d.getDate() + i + 1);
    const wv  = weatherVariants[(i + (base.temp % 3)) % weatherVariants.length];
    const variation = Math.round((Math.random() - 0.5) * 6);
    return {
      day:      days[d.getDay()],
      tempHigh: base.temp + variation + 2,
      tempLow:  base.temp + variation - 3,
      desc:     wv.desc,
      code:     wv.code,
    };
  });
}

// ============================================================
//  TEMPERATURE UNIT TOGGLE
// ============================================================
let currentTempC = null;
let isCelsius    = true;

document.getElementById('btnC').addEventListener('click', () => {
  isCelsius = true;
  document.getElementById('btnC').classList.add('active');
  document.getElementById('btnF').classList.remove('active');
  if (currentTempC !== null) updateTempDisplay();
});

document.getElementById('btnF').addEventListener('click', () => {
  isCelsius = false;
  document.getElementById('btnF').classList.add('active');
  document.getElementById('btnC').classList.remove('active');
  if (currentTempC !== null) updateTempDisplay();
});

function updateTempDisplay() {
  const temp = isCelsius ? Math.round(currentTempC) : Math.round(currentTempC * 9/5 + 32);
  const unit = isCelsius ? '°C' : '°F';
  document.getElementById('tempBig').textContent = temp + unit;
}

// ============================================================
//  SHOW / HIDE HELPERS
// ============================================================
function showLoader()  { loader.style.display = 'flex';  results.style.display = 'none';  errorBox.style.display = 'none'; }
function showResults() { loader.style.display = 'none';  results.style.display = 'block'; errorBox.style.display = 'none'; }
function showError()   { loader.style.display = 'none';  results.style.display = 'none';  errorBox.style.display = 'block'; }

// ============================================================
//  RENDER WEATHER
// ============================================================
function renderWeather(data, forecast) {
  const { name, sys, coord, main, weather, wind, clouds, visibility } = data;
  const w = weather[0];

  currentTempC = main.temp;

  // Main card
  document.getElementById('cityName').textContent     = name;
  document.getElementById('countryChip').textContent  = sys.country;
  document.getElementById('weatherEmoji').textContent = getEmoji(w.id);
  document.getElementById('description').textContent  = w.description;
  document.getElementById('feelsLike').textContent    = `Feels like ${Math.round(main.feels_like)}°C`;
  document.getElementById('humidity').textContent     = main.humidity + '%';
  document.getElementById('wind').textContent         = wind.speed + ' km/h';
  document.getElementById('visibility').textContent   = (visibility / 1000).toFixed(1) + ' km';
  document.getElementById('pressure').textContent     = main.pressure + ' hPa';

  const fmt = ts => new Date(ts * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('sunrise').textContent      = fmt(sys.sunrise);
  document.getElementById('sunset').textContent       = fmt(sys.sunset);

  updateTempDisplay();

  // Extra stats
  document.getElementById('minMax').textContent   = `${Math.round(main.temp_min)}° / ${Math.round(main.temp_max)}°C`;
  document.getElementById('clouds').textContent   = clouds.all + '%';
  document.getElementById('coords').textContent   = `${coord.lat.toFixed(1)}, ${coord.lon.toFixed(1)}`;

  // UV mock (can't get from free current endpoint without extra call)
  const uvMock = Math.floor(Math.random() * 10) + 1;
  document.getElementById('uvVal').textContent = uvMock;
  document.getElementById('uvSub').textContent = uvMock <= 2 ? 'Low' : uvMock <= 5 ? 'Moderate' : uvMock <= 7 ? 'High' : 'Very High';

  // Forecast
  forecastRow.innerHTML = '';
  forecast.forEach(day => {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <div class="fc-day">${day.day}</div>
      <div class="fc-emoji">${getEmoji(day.code)}</div>
      <div class="fc-temp-high">${Math.round(day.tempHigh)}°</div>
      <div class="fc-temp-low">${Math.round(day.tempLow)}°</div>
      <div class="fc-desc">${day.desc}</div>
    `;
    forecastRow.appendChild(card);
  });

  showResults();
}

// ============================================================
//  FETCH (real API or mock)
// ============================================================
async function fetchWeather(city) {
  showLoader();
  errorBox.style.display = 'none';

  if (USE_MOCK) {
    // Simulate network delay for realism
    await new Promise(r => setTimeout(r, 900));
    const data     = getMock(city);
    const forecast = getMockForecast(city);
    renderWeather(data, forecast);
    return;
  }

  try {
    const currentRes  = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );
    if (!currentRes.ok) throw new Error('City not found');
    const currentData = await currentRes.json();

    const forecastRes  = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );
    const forecastData = await forecastRes.json();

    // Process 5-day forecast (noon reading per day)
    const days   = ['Sun','Mon','Tue','Wed','Thu','Sat'];
    const seen   = new Set();
    const fItems = [];

    for (const item of forecastData.list) {
      const date = new Date(item.dt * 1000);
      const day  = days[date.getDay()];
      const hour = date.getHours();
      if (!seen.has(day) && hour >= 11 && hour <= 14) {
        seen.add(day);
        fItems.push({
          day,
          tempHigh: item.main.temp_max,
          tempLow:  item.main.temp_min,
          desc:     item.weather[0].description,
          code:     item.weather[0].id,
        });
      }
      if (fItems.length === 5) break;
    }

    renderWeather(currentData, fItems);
  } catch {
    showError();
  }
}

// ============================================================
//  EVENT LISTENERS
// ============================================================
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) fetchWeather(city);
});

cityInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const city = cityInput.value.trim();
    if (city) fetchWeather(city);
  }
});

document.querySelectorAll('.qc-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const city = btn.getAttribute('data-city');
    cityInput.value = city;
    fetchWeather(city);
  });
});

// ============================================================
//  AUTO-LOAD on page open (using home city)
// ============================================================
fetchWeather('Gorakhpur');
