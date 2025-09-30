// API Configuration 
const API_KEYS = {
    unsplash: 'YOUR_UNSPLASH_ACCESS_KEY', 
    openWeather: 'YOUR_OPENWEATHERMAP_API_KEY'  
};

// DOM Elements
const destinationInput = document.getElementById('destinationInput');
const searchBtn = document.getElementById('searchBtn');
const loadingState = document.getElementById('loadingState');
const resultsSection = document.getElementById('resultsSection');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');
const destinationName = document.getElementById('destinationName');
const destinationDescription = document.getElementById('destinationDescription');
const photosGrid = document.getElementById('photosGrid');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const weatherIcon = document.getElementById('weatherIcon');

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
destinationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
retryBtn.addEventListener('click', () => {
    hideError();
    destinationInput.focus();
});

// Popular destination tags
document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', () => {
        destinationInput.value = tag.dataset.destination;
        handleSearch();
    });
});

// Main Search Handler
async function handleSearch() {
    const destination = destinationInput.value.trim();
    
    if (!destination) {
        showError('Please enter a destination name');
        return;
    }

    // Check if API keys are set
    if (!API_KEYS.unsplash || !API_KEYS.openWeather) {
        showError('Please configure your API keys in script.js. You need both Unsplash and OpenWeatherMap API keys.');
        return;
    }

    showLoading();
    hideError();
    hideResults();

    try {
        // Fetch data from both APIs in parallel
        const [photosData, weatherData] = await Promise.all([
            fetchPhotos(destination),
            fetchWeather(destination)
        ]);

        // Display the results
        displayResults(destination, photosData, weatherData);
        showResults();
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Failed to fetch destination information. Please try again.');
    } finally {
        hideLoading();
    }
}

// Fetch Photos from Unsplash API
async function fetchPhotos(destination) {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(destination)}&per_page=9&orientation=landscape`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Client-ID ${API_KEYS.unsplash}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch photos. Please check your Unsplash API key.');
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
        throw new Error('No photos found for this destination.');
    }

    return data.results;
}

// Fetch Weather from OpenWeatherMap API
async function fetchWeather(destination) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(destination)}&units=metric&appid=${API_KEYS.openWeather}`;
    
    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Destination not found. Please check the spelling and try again.');
        }
        throw new Error('Failed to fetch weather data. Please check your OpenWeatherMap API key.');
    }

    const data = await response.json();
    return data;
}

// Display Results
function displayResults(destination, photos, weather) {
    // Set destination name
    destinationName.textContent = destination;
    
    // Set destination description
    destinationDescription.textContent = `Explore the beauty of ${destination} through stunning photography and current weather conditions. Plan your perfect trip with real-time information.`;

    // Display weather
    displayWeather(weather);

    // Display photos
    displayPhotos(photos);

    // Update travel tips based on weather
    updateTravelTips(weather);
}

// Display Weather Information
function displayWeather(weather) {
    temperature.textContent = Math.round(weather.main.temp);
    description.textContent = weather.weather[0].description.charAt(0).toUpperCase() + weather.weather[0].description.slice(1);
    humidity.textContent = weather.main.humidity;
    windSpeed.textContent = weather.wind.speed.toFixed(1);

    // Update weather icon based on conditions
    const iconCode = weather.weather[0].icon;
    const iconMap = {
        '01d': 'fa-sun',
        '01n': 'fa-moon',
        '02d': 'fa-cloud-sun',
        '02n': 'fa-cloud-moon',
        '03d': 'fa-cloud',
        '03n': 'fa-cloud',
        '04d': 'fa-cloud',
        '04n': 'fa-cloud',
        '09d': 'fa-cloud-showers-heavy',
        '09n': 'fa-cloud-showers-heavy',
        '10d': 'fa-cloud-sun-rain',
        '10n': 'fa-cloud-moon-rain',
        '11d': 'fa-bolt',
        '11n': 'fa-bolt',
        '13d': 'fa-snowflake',
        '13n': 'fa-snowflake',
        '50d': 'fa-smog',
        '50n': 'fa-smog'
    };

    weatherIcon.className = `fas ${iconMap[iconCode] || 'fa-sun'}`;
}

// Display Photos
function displayPhotos(photos) {
    photosGrid.innerHTML = '';

    photos.forEach(photo => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        
        photoItem.innerHTML = `
            <img src="${photo.urls.regular}" alt="${photo.alt_description || 'Destination photo'}" loading="lazy">
            <div class="photo-overlay">
                <p class="photo-author">Photo by ${photo.user.name}</p>
            </div>
        `;

        // Add click event to view photo in new tab
        photoItem.addEventListener('click', () => {
            window.open(photo.links.html, '_blank');
        });

        photosGrid.appendChild(photoItem);
    });
}

// Update Travel Tips based on weather
function updateTravelTips(weather) {
    const temp = weather.main.temp;
    const bestTimeTip = document.getElementById('bestTimeTip');

    if (temp > 25) {
        bestTimeTip.textContent = 'Current weather is warm. Consider visiting during early morning or evening hours to avoid peak heat.';
    } else if (temp < 10) {
        bestTimeTip.textContent = 'Current weather is cool. Pack warm clothing and consider indoor attractions during your visit.';
    } else {
        bestTimeTip.textContent = 'Current weather is pleasant! Perfect time for outdoor activities and sightseeing.';
    }
}

// UI State Management
function showLoading() {
    loadingState.classList.remove('hidden');
}

function hideLoading() {
    loadingState.classList.add('hidden');
}

function showResults() {
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideResults() {
    resultsSection.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
}

function hideError() {
    errorState.classList.add('hidden');
}

// Custom Cursor Functionality
const cursor = document.querySelector('.custom-cursor');
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');

let mouseX = 0, mouseY = 0;
let outlineX = 0, outlineY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';
});

function animateCursor() {
    outlineX += (mouseX - outlineX) * 0.3;
    outlineY += (mouseY - outlineY) * 0.3;
    
    cursorOutline.style.left = outlineX + 'px';
    cursorOutline.style.top = outlineY + 'px';
    
    requestAnimationFrame(animateCursor);
}

animateCursor();

// Cursor hover effects
const hoverableElements = document.querySelectorAll('.search-btn, .tag, .photo-item, .retry-btn, .tip-card');

hoverableElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
        cursorOutline.style.width = '50px';
        cursorOutline.style.height = '50px';
        cursorOutline.style.background = 'rgba(79, 70, 229, 0.1)';
        cursorDot.style.width = '10px';
        cursorDot.style.height = '10px';
        cursorDot.style.background = '#4f46e5';
    });
    
    element.addEventListener('mouseleave', () => {
        cursorOutline.style.width = '40px';
        cursorOutline.style.height = '40px';
        cursorOutline.style.background = 'transparent';
        cursorDot.style.width = '8px';
        cursorDot.style.height = '8px';
        cursorDot.style.background = '#fff';
    });
});

// Category Cards Click Events
document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
        const category = card.querySelector('h3').textContent.toLowerCase();
        destinationInput.value = category;
        handleSearch();
    });
});

// Initial focus
destinationInput.focus();

