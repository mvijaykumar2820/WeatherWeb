const API_KEY = 'ec61604a06f703c9ae7cb39a5a3e014f';

const cityName = document.querySelector('.city-name');
const conditionText = document.querySelector('.condition-text');
const conditionIcon = document.querySelector('.condition-icon');
const localTime = document.querySelector('.local-time p span');
const tempValue = document.querySelector('.temp-value');
const windValue = document.querySelector('.wind-value');
const visibilityValue = document.querySelector('.visibility-value');
const airQualityValue = document.querySelector('.air-quality-value');
const humidityValue = document.querySelector('.humidity-value');
const searchForm = document.querySelector('form');
const searchInput = document.querySelector('input[type="search"]');
const forecastContainer = document.querySelector('.forecast-container');

document.addEventListener('DOMContentLoaded', () => {
  cityName.textContent = "Weather App";
  conditionText.textContent = "Waiting for permission...";
  
  // Check if the browser supports the Permissions API
  if (navigator.permissions && navigator.permissions.query) {
    // Modern browsers support checking permission state
    navigator.permissions.query({ name: 'geolocation' })
      .then(permissionStatus => {
        handlePermissionStatus(permissionStatus);
        
        // Set up listener for permission changes
        permissionStatus.onchange = () => {
          handlePermissionStatus(permissionStatus);
        };
      })
      .catch(error => {
        // Fall back to standard geolocation request
        requestGeolocation();
      });
  } else {
    // Older browsers don't support permission checking
    requestGeolocation();
  }
});

function handlePermissionStatus(permissionStatus) {
  switch(permissionStatus.state) {
    case 'granted':
      // User has already granted permission
      cityName.textContent = "Getting your location...";
      getGeolocation();
      break;
    case 'prompt':
      // User hasn't made a decision yet
      cityName.textContent = "Location Permission Required";
      conditionText.textContent = "Please allow access to see your local weather";
      displayLocationPrompt();
      break;
    case 'denied':
      // User has denied permission
      cityName.textContent = "Location Access Denied";
      conditionText.textContent = "Please enable location permission in your browser settings";
      displayPermissionInstructions();
      break;
  }
}

function displayLocationPrompt() {
  // Create a modal overlay for permission request
  const permissionModal = document.createElement('div');
  permissionModal.className = 'permission-modal';
  
  permissionModal.innerHTML = `
    <div class="permission-dialog">
      <div class="permission-header">
        <img src="https://cdn-icons-png.flaticon.com/512/1146/1146869.png" alt="Weather icon" class="permission-icon">
        <h3>Location Access</h3>
      </div>
      <div class="permission-body">
        <p>This app needs your location to show accurate weather information for your area.</p>
      </div>
      <div class="permission-footer">
        <button class="btn btn-secondary" id="deny-location">Not Now</button>
        <button class="btn btn-primary" id="allow-location">Allow Access</button>
      </div>
    </div>
  `;
  
  // Add to body (not inside the weather container)
  document.body.appendChild(permissionModal);
  
  // Add CSS for animation
  setTimeout(() => {
    permissionModal.classList.add('visible');
  }, 10);
  
  // Add event listeners
  document.getElementById('allow-location').addEventListener('click', () => {
    permissionModal.classList.remove('visible');
    setTimeout(() => {
      permissionModal.remove();
      getGeolocation();
    }, 300); // Matches transition duration
  });
  
  document.getElementById('deny-location').addEventListener('click', () => {
    permissionModal.classList.remove('visible');
    setTimeout(() => {
      permissionModal.remove();
      cityName.textContent = "Search for a city";
      conditionText.textContent = "Use the search box above";
    }, 300);
  });
}

function displayPermissionInstructions() {
  const instructionsContainer = document.createElement('div');
  instructionsContainer.className = 'permission-container';
  instructionsContainer.innerHTML = `
    <p>You've denied location access. To see your local weather, you'll need to:</p>
    <ol>
      <li>Click the lock/info icon in your browser's address bar</li>
      <li>Find "Location" or "Site Settings"</li>
      <li>Change the permission to "Allow"</li>
      <li>Refresh this page</li>
    </ol>
    <p>Or use the search box above to look up a location manually.</p>
  `;
  
  // Insert the container before the weather details
  const weatherDetails = document.querySelector('.weather-details');
  weatherDetails.parentNode.insertBefore(instructionsContainer, weatherDetails);
}

function requestGeolocation() {
  cityName.textContent = "Weather App";
  conditionText.textContent = "Waiting for permission...";
  
  if (navigator.geolocation) {
    const locationRequestButton = document.createElement('button');
    locationRequestButton.textContent = "Allow Location Access";
    locationRequestButton.className = "btn btn-primary location-button";
    locationRequestButton.addEventListener('click', getGeolocation);
    
    const weatherContainer = document.querySelector('.weather-condition');
    weatherContainer.appendChild(locationRequestButton);
  } else {
    cityName.textContent = "Location Unavailable";
    conditionText.textContent = "Your browser doesn't support geolocation";
  }
}

function getGeolocation() {
  cityName.textContent = "Getting your location...";
  conditionText.textContent = "Please wait...";
  
  // Remove any location buttons if they exist
  const locationButton = document.querySelector('.location-button');
  if (locationButton) locationButton.remove();
  
  if (navigator.geolocation) {
    const locationTimeout = setTimeout(() => {
      console.warn("Geolocation timed out");
      cityName.textContent = "Location Timeout";
      conditionText.textContent = "Please try searching for your city";
    }, 10000);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(locationTimeout);
        const { latitude, longitude } = position.coords;
        getLocationNameByCoords(latitude, longitude);
      },
      (error) => {
        clearTimeout(locationTimeout);
        console.error('Error getting location:', error);
        cityName.textContent = "Location Error";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            conditionText.textContent = "Location permission denied";
            displayPermissionInstructions();
            break;
          case error.POSITION_UNAVAILABLE:
            conditionText.textContent = "Location information unavailable";
            break;
          case error.TIMEOUT:
            conditionText.textContent = "Location request timed out";
            break;
          default:
            conditionText.textContent = "Unknown error getting location";
        }
      },
      { timeout: 8000 } 
    );
  } else {
    console.error('Geolocation is not supported by this browser');
    cityName.textContent = "Not Supported";
    conditionText.textContent = "Geolocation not available in your browser";
  }
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const city = searchInput.value.trim();
  if (city) {
    getWeatherByCity(city);
    searchInput.value = '';
  }
});

async function getLocationNameByCoords(lat, lon) {
  try {
    cityName.textContent = "Getting your location...";
    conditionText.textContent = "Please wait or allow location access";
    
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      let locationName = data[0].name;

      getWeatherByCoords(lat, lon, locationName);
    } else {
      throw new Error('Location not found');
    }
  } catch (error) {
    console.error('Error fetching location name:', error);
    cityName.textContent = "Location unavailable";
    conditionText.textContent = "Try searching for a city";
    setTimeout(() => getWeatherByCity('Hyderabad'), 2000); // Change from 'New York' to 'Hyderabad'
  }
}

async function getWeatherByCoords(lat, lon, displayName) {
  try {
    cityName.textContent = `Loading ${displayName}...`;
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    updateWeatherDisplay(data);
  } catch (error) {
    console.error('Error fetching weather data by coordinates:', error);
    showError(`Couldn't find weather for ${displayName || 'this location'}`);
    getNearestCityWeather(lat, lon);
  }
}

async function getNearestCityWeather(lat, lon) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=5&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    

    let cityFound = false;
    for (const location of data) {

      try {
        const weatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${location.name}&units=metric&appid=${API_KEY}`
        );
        
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          updateWeatherDisplay(weatherData);
          cityFound = true;
          break;
        }
      } catch (e) {
        console.error(`Failed to get weather for ${location.name}`, e);
      }
    }
    
    if (!cityFound) {
      getWeatherByCity('Hyderabad');
    }
    
  } catch (error) {
    console.error('Error finding nearest city:', error);
    getWeatherByCity('Hyderabad');
  }
}

async function getWeatherByCity(city) {
  try {
    cityName.textContent = `Loading ${city}...`;
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('City not found');
      } else {
        throw new Error(`Error: ${response.status}`);
      }
    }
    
    const data = await response.json();
    updateWeatherDisplay(data);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    showError(`Couldn't find weather for ${city}`);
  }
}

let currentCity = null;
let forecastData = null;

document.querySelector('.weather-container').addEventListener('mouseenter', function() {
  if (currentCity && !forecastData) {
    getForecastData(currentCity);
  }
});

let clockInterval;

function updateWeatherDisplay(data) {
  currentCity = data.name;
  forecastData = null;

  cityName.textContent = data.name;
  
  const condition = data.weather[0].main;
  conditionText.textContent = condition;
  
  const iconCode = data.weather[0].icon;
  conditionIcon.src = getWeatherIcon(condition.toLowerCase());
  
  // Clear any existing clock interval
  if (clockInterval) {
    clearInterval(clockInterval);
  }
  
  // Calculate the local time in the city based on timezone offset from API
  updateLocationClock(data.timezone);
  clockInterval = setInterval(() => updateLocationClock(data.timezone), 1000);
  
  tempValue.textContent = Math.round(data.main.temp);
  
  windValue.textContent = `${data.wind.speed} m/s`;
  visibilityValue.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
  humidityValue.textContent = `${data.main.humidity}%`;
  
  const airQuality = calculateAirQuality(data.main.humidity, data.wind.speed);
  airQualityValue.textContent = airQuality;
}

function updateLocationClock(timezoneOffset) {
  // Get current UTC time directly without local timezone conversion
  const now = new Date();
  const utcTimestamp = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  );
  
  // Apply the location's timezone offset (convert from seconds to milliseconds)
  const cityTimestamp = utcTimestamp + (timezoneOffset * 1000);
  const cityTime = new Date(cityTimestamp);
  
  // Format time with explicit UTC methods to avoid browser timezone influence
  const hours = cityTime.getUTCHours().toString().padStart(2, '0');
  const minutes = cityTime.getUTCMinutes().toString().padStart(2, '0');
  const seconds = cityTime.getUTCSeconds().toString().padStart(2, '0');
  
  // Format 12-hour time with AM/PM
  let hour12 = hours % 12;
  if (hour12 === 0) hour12 = 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  const timeString = `${hour12}:${minutes}:${seconds} ${ampm}`;
  
  localTime.textContent = timeString;
}

async function getForecastData(city) {
  try {
    forecastContainer.innerHTML = '<div class="forecast-loading">Loading forecast data...</div>';
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    forecastData = data; 
    
    displayForecast(data);
    
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    forecastContainer.innerHTML = '<div class="forecast-loading">Could not load forecast data</div>';
  }
}

function displayForecast(data) {

  forecastContainer.innerHTML = '';
  
  const dailyForecasts = {};
  
  data.list.forEach(forecast => {
    const date = new Date(forecast.dt * 1000);
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    if (!dailyForecasts[day]) {
      dailyForecasts[day] = {
        date: date,
        temp: Math.round(forecast.main.temp),
        condition: forecast.weather[0].main,
        icon: forecast.weather[0].main.toLowerCase()
      };
    }
  });
  
  const forecastArray = Object.values(dailyForecasts).slice(0, 5);
  
  forecastArray.forEach(forecast => {
    const forecastItem = document.createElement('div');
    forecastItem.className = 'forecast-item';
    
    forecastItem.innerHTML = `
      <div class="forecast-day">${forecast.date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
      <img src="${getWeatherIcon(forecast.icon)}" alt="${forecast.condition}" class="forecast-icon">
      <div class="forecast-temp">${forecast.temp}°C</div>
      <div class="forecast-condition">${forecast.condition}</div>
    `;
    
    forecastContainer.appendChild(forecastItem);
  });
}

function calculateAirQuality(humidity, windSpeed) {
  if (windSpeed > 5 && humidity < 70) return 'Good';
  if (windSpeed > 3 && humidity < 85) return 'Moderate';
  return 'Poor';
}

function getWeatherIcon(condition) {
  const icons = {
    'clear': 'https://cdn-icons-png.flaticon.com/512/3222/3222800.png',
    'clouds': 'https://cdn-icons-png.flaticon.com/512/414/414825.png',
    'rain': 'https://cdn-icons-png.flaticon.com/512/3351/3351979.png',
    'drizzle': 'https://cdn-icons-png.flaticon.com/512/3351/3351979.png',
    'thunderstorm': 'https://cdn-icons-png.flaticon.com/512/1779/1779940.png',
    'snow': 'https://cdn-icons-png.flaticon.com/512/642/642102.png',
    'mist': 'https://cdn-icons-png.flaticon.com/512/4005/4005901.png',
    'fog': 'https://cdn-icons-png.flaticon.com/512/4005/4005901.png',
    'haze': 'https://cdn-icons-png.flaticon.com/512/4005/4005901.png'
  };
  
  return icons[condition] || 'https://cdn-icons-png.flaticon.com/512/1146/1146869.png';
}

function showError(message) {
  cityName.textContent = 'Error';
  conditionText.textContent = message;
  localTime.textContent = "--:--";
  tempValue.textContent = "--";
  windValue.textContent = "-- m/s";
  visibilityValue.textContent = "-- km";
  airQualityValue.textContent = "--";
  humidityValue.textContent = "--%";
}

document.addEventListener('DOMContentLoaded', () => {
  
  const weatherContainer = document.querySelector('.weather-container');
  let touchStartY = 0;
  let touchEndY = 0;
  
  const isMobile = window.matchMedia("(max-width: 480px)").matches;
  
  if (isMobile) {
    weatherContainer.addEventListener('click', function(e) {
      const forecastPanel = this.querySelector('.forecast-panel');
      
      if (forecastPanel.classList.contains('mobile-visible')) {
        forecastPanel.classList.remove('mobile-visible');
      } else {
        forecastPanel.classList.add('mobile-visible');
        
        if (currentCity && !forecastData) {
          getForecastData(currentCity);
        }
      }
    });
    
    document.body.classList.add('mobile-view');
  } else {
    weatherContainer.addEventListener('mouseenter', function() {
      if (currentCity && !forecastData) {
        getForecastData(currentCity);
      }
    });
  }
});
