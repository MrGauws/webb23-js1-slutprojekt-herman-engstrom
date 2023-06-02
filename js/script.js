// ------------ Variable declarations ------------ //

// The API key used to access the OpenWeatherMap API. 
const apiKey = "087dd72990ff1dacfef4966e28455ebd"; 

// DOM elements
const form = document.getElementById("cityForm"); 
const cityInput = document.getElementById("cityInput"); 
const weatherInfo = document.getElementById("weatherInfo"); 
const forecastContainer = document.getElementById("forecastContainer"); 
const forecastHoursSelect = document.getElementById("forecastHours"); 

// ------------ Event listener for form submission ------------ //
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = cityInput.value;
  // Collects the selected value from the forecast hours select element.
  const forecastHours = forecastHoursSelect.value; 
  getWeather(city);
  // Collects the entered city and selected forecast hours and fetches and displays the weather forecast.
  getForecast(city, forecastHours); 
  // Clears the value of the city input field after submitting the form.
  cityInput.value = ""; 
});

// Retrieve coordinates for a given city. Using async to handle asynchronous operations since im using await.
async function getCoordinatesByCity(city) {
  try {
    // Request OpenWeatherMap API to fetch the coordinates of the specified city.
    const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`);
    // Converts the response data into JSON format.
    const data = await response.json();
    if (data.length > 0) {
      const { lat, lon } = data[0];
      return { latitude: lat, longitude: lon }; // Returns latitude and longitude of the city.
    } else {
      // Throws an error if no coordinates are found for the city.
      throw new Error('Kunde inte hitta koordinater för staden.');
    }
  } catch (error) {
    throw new Error('Kunde inte hämta koordinater för staden.');
  }
}

// Retrieve current weather data for a city
async function getWeather(city) {
  try {
    let coordinates = {};
    if (city) {
      // If a city name is provided, asynchronously fetch its coordinates. Using await to pause execution until coordinates are fetched
      coordinates = await getCoordinatesByCity(city);
    } else {
      // If no city name is provided, throw an error indicating it is mandatory
      throw new Error('Stadens namn är obligatoriskt.');
    }

    const { latitude, longitude } = coordinates;
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=sv`);
    const data = await response.json();
    displayWeather(data);
  } catch (error) {
    displayError(error.message);
  }
}

// Retrieves the weather forecast data for a city
async function getForecast(city, forecastHours) {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=sv`);
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

// Displays the current weather information
function displayWeather(data) {
  if (data.cod === "404") {
    displayError("Staden hittades inte.");
    return;
  }

  // Extracts the weather data
  const temperature = data.main.temp;
  const weatherIcon = data.weather[0].icon;
  const description = data.weather[0].description;
  const windSpeed = data.wind.speed;
  const weatherCode = data.weather[0].id;

  // Determines the weather class based on weather code and changes color accordingly
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

  // Gets the current day
  const date = new Date();
  const day = getDayOfWeek(date);
  
  // Builds the weather HTML content
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

// Displays the weather forecast information
function displayForecast(data, forecastHours) {
  if (data.cod === "404") {
    displayError("Staden hittades inte.");
    return;
  }

  // Extracts the forecast data
  const forecastList = data.list;
  const hoursInterval = 3;
  const numIntervals = forecastHours / hoursInterval;
  let forecastHTML = "<h2>Väderprognos</h2>";

  // Iterates through forecast intervals
  for (let i = 0; i < numIntervals; i++) {
    // Gathers the forecast data for the current interval
    const forecast = forecastList[i];
    // Convert the forecast time to a Date object
    const forecastTime = new Date(forecast.dt_txt);
    const day = getDayOfWeek(forecastTime);
    // Formats the forecast time as a string in the desired format
    const forecastTimeFormatted = forecastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const forecastTemperature = forecast.main.temp;
    const forecastWeatherCode = forecast.weather[0].id;
    const forecastDescription = forecast.weather[0].description;
    const forecastWindSpeed = forecast.wind.speed;

    // Determine weather class for forecast. I've used an if else statement here since there was no other way to get the boxes to change colour accordingly.
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

    // Builds the forecast HTML content
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

// Gets the day of the week for a given date. Created an array to show what day it is.
function getDayOfWeek(date) {
  const days = ["Sön", "Mån", "Tis", "Ons", "Tors", "Fre", "Lör"];
  return days[date.getDay()];
}

// Displays the error message and checks for network.
function displayError(errorMessage) {
  if (navigator.onLine) {
    alert(errorMessage);
  } else {
    alert("Det uppstod ett nätverksfel. Kontrollera din anslutning och försök igen.");
  }
}
