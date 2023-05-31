const apiKey = "087dd72990ff1dacfef4966e28455ebd";
const form = document.getElementById("cityForm");
const cityInput = document.getElementById("cityInput");
const weatherInfo = document.getElementById("weatherInfo");
const forecastContainer = document.getElementById("forecastContainer");
const forecastHoursSelect = document.getElementById("forecastHours");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = cityInput.value;
  const forecastHours = forecastHoursSelect.value;
  getWeather(city);
  getForecast(city, forecastHours);
  cityInput.value = "";
});

async function getCoordinatesByCity(city) {
  try {
    const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`);
    const data = await response.json();
    if (data.length > 0) {
      const { lat, lon } = data[0];
      return { latitude: lat, longitude: lon };
    } else {
      throw new Error('Kunde inte hitta koordinater för staden.');
    }
  } catch (error) {
    throw new Error('Kunde inte hämta koordinater för staden.');
  }
}

async function getWeather(city) {
  try {
    let coordinates = {};
    if (city) {
      coordinates = await getCoordinatesByCity(city);
    } else {
      throw new Error('Stadens namn är obligatoriskt.');
    }

    const { latitude, longitude } = coordinates;
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`);
    const data = await response.json();
    displayWeather(data);
  } catch (error) {
    displayError(error.message);
  }
}

async function getForecast(city, forecastHours) {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`);
    if (response.ok) {
      const data = await response.json();
      displayForecast(data, forecastHours);
    } else {
      throw new Error('Fel vid hämtning av väderprognosen');
    }
  } catch (error) {
    displayError(error.message);
  }
}

function displayWeather(data) {
  if (data.cod === "404") {
    displayError("Staden hittades inte.");
    return;
  }

  const temperature = data.main.temp;
  const weatherIcon = data.weather[0].icon;
  const description = data.weather[0].description;
  const windSpeed = data.wind.speed;
  const weatherCode = data.weather[0].id;

  let weatherClass = "";
  if (weatherCode >= 200 && weatherCode < 600) {
    weatherClass = "rainy";
  } else if (weatherCode >= 600 && weatherCode < 700) {
    weatherClass = "snowy";
  } else if (weatherCode === 800) {
    weatherClass = "sunny";
  } else {
    weatherClass = "cloudy";
  }

  const date = new Date();
  const day = getDayOfWeek(date);

  const weatherHTML = `
    <h2>Aktuellt väder (${day})</h2>
    <div class="forecast-box ${weatherClass}">
      <img src="https://openweathermap.org/img/wn/${weatherIcon}.png" alt="Väderikon">
      <p>${temperature}°C</p>
      <p>${description}</p>
      <p>Vindhastighet: ${windSpeed} m/s</p>
    </div>
  `;

  weatherInfo.innerHTML = weatherHTML;
}

function displayForecast(data, forecastHours) {
  if (data.cod === "404") {
    displayError("Staden hittades inte.");
    return;
  }

  const forecastList = data.list;
  const hoursInterval = 3;
  const numIntervals = forecastHours / hoursInterval;
  let forecastHTML = "<h2>Väderprognos</h2>";

  for (let i = 0; i < numIntervals; i++) {
    const forecast = forecastList[i];
    const forecastTime = new Date(forecast.dt_txt);
    const day = getDayOfWeek(forecastTime);
    const forecastTimeFormatted = forecastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const forecastTemperature = forecast.main.temp;
    const forecastWeatherCode = forecast.weather[0].id;
    const forecastDescription = forecast.weather[0].description;
    const forecastWindSpeed = forecast.wind.speed;

    let weatherClass = "";
    if (forecastWeatherCode >= 200 && forecastWeatherCode < 600) {
      weatherClass = "rainy";
    } else if (forecastWeatherCode >= 600 && forecastWeatherCode < 700) {
      weatherClass = "snowy";
    } else if (forecastWeatherCode === 800) {
      weatherClass = "sunny";
    } else {
      weatherClass = "cloudy";
    }

    forecastHTML += `
      <div class="forecast-box ${weatherClass}">
        <p><strong>${day}</strong></p>
        <p>${forecastTimeFormatted}</p>
        <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" alt="Väderikon">
        <p>${forecastTemperature}°C</p>
        <p>${forecastDescription}</p>
        <p>Vindhastighet: ${forecastWindSpeed} m/s</p>
      </div>
    `;
  }

  forecastContainer.innerHTML = forecastHTML;
}

function displayError(message) {
  weatherInfo.innerHTML = `<p class="error">${message}</p>`;
  forecastContainer.innerHTML = "";
}

function getDayOfWeek(date) {
  const days = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];
  const dayIndex = date.getDay();
  return days[dayIndex];
}