// /js/script.js
// --- DOM Elements ---
const playPauseBtn = document.getElementById('playPauseBtn');
const playPauseIcon = playPauseBtn.querySelector('i');
const volumeSlider = document.getElementById('volumeSlider');
const audio = document.getElementById('radioStream');

// New: References to Volume Icons
const volumeDownIcon = document.getElementById('volumeDownIcon');
const volumeUpIcon = document.getElementById('volumeUpIcon');

// Menu elements
const menuToggle = document.getElementById('menuToggle');
const sidebarMenu = document.getElementById('sidebarMenu');

// Wallpaper change elements
const wallpaperFileInput = document.getElementById('wallpaperFileInput');
const wallpaperUrlInput = document.getElementById('wallpaperUrlInput');
const applyWallpaperUrlBtn = document.getElementById('applyWallpaperUrlBtn');
const resetWallpaperBtn = document.getElementById('resetWallpaperBtn');
const body = document.body; // Reference to the body element

// --- Web Audio API Setup ---
let audioContext;
let analyser;
let source;
let isPlaying = false;
let isInitialized = false;

// Variable to store previous volume before muting
let previousVolume = 0.5; // Default to 0.5 if no previous volume is set

// Set initial volume for the audio element (will be overridden by persisted value if any)
audio.volume = 0.5;

// --- Canvas Visualizer Setup ---
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function initializeAudio() {
    if (isInitialized) return;
    
    // Create AudioContext after a user gesture (the first click)
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    
    // Link the audio element to the analyser
    source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    // Configure analyser
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    isInitialized = true;
    
    // Start the visualizer drawing loop
    drawVisualizer(analyser, dataArray, bufferLength);
}

// --- Main Drawing Function ---
function drawVisualizer(analyser, dataArray, bufferLength) {
    requestAnimationFrame(() => drawVisualizer(analyser, dataArray, bufferLength));

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 1.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.6;

        // Create a gradient for the bars
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, 'rgba(100, 100, 255, 0.4)'); // Base color
        gradient.addColorStop(1, 'rgba(255, 100, 200, 0.7)'); // Tip color

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 2; // Add 2 for spacing between bars
    }
}

// --- Event Listeners ---
playPauseBtn.addEventListener('click', () => {
    // Initialize audio on the first click
    if (!isInitialized) {
        initializeAudio();
    }
    
    // Resume AudioContext if it was suspended
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    // Toggle play/pause
    if (isPlaying) {
        audio.pause();
        playPauseIcon.classList.remove('fa-pause');
        playPauseIcon.classList.add('fa-play');
    } else {
        audio.play().catch(e => console.error("Error playing audio:", e));
        playPauseIcon.classList.remove('fa-play');
        playPauseIcon.classList.add('fa-pause');
    }
    isPlaying = !isPlaying;
});

/**
 * Updates the volume icons based on the current volume/muted state.
 */
function updateVolumeIcons() {
    // Remove all specific volume icons first to ensure clean state
    volumeDownIcon.classList.remove('fa-volume-xmark', 'fa-volume-down', 'fa-volume-off');
    volumeUpIcon.classList.remove('fa-volume-xmark', 'fa-volume-up', 'fa-volume-off');

    if (audio.muted || audio.volume === 0) {
        volumeDownIcon.classList.add('fa-volume-xmark'); // Muted icon
        volumeUpIcon.classList.add('fa-volume-xmark');   // Muted icon
    } else if (audio.volume > 0 && audio.volume <= 0.5) {
        volumeDownIcon.classList.add('fa-volume-down'); // Low/Mid volume icon
        volumeUpIcon.classList.add('fa-volume-up');
    } else { // audio.volume > 0.5
        volumeDownIcon.classList.add('fa-volume-down');
        volumeUpIcon.classList.add('fa-volume-up'); // High volume icon
    }
}


// Volume Slider Event Listener
volumeSlider.addEventListener('input', (e) => {
    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;

    if (newVolume > 0) {
        audio.muted = false;
        previousVolume = newVolume; // Store this as the last non-zero volume
    } else { // newVolume === 0
        audio.muted = true;
    }
    updateVolumeIcons(); // Update icons after volume change
});

// Click handlers for volume icons to toggle mute
function toggleMute() {
    if (audio.muted) {
        // Was muted, unmute
        audio.muted = false;
        // Restore previous volume, or default to 0.5 if previous was 0 (or not set)
        audio.volume = previousVolume > 0 ? previousVolume : 0.5; 
        volumeSlider.value = audio.volume; // Update slider position
    } else {
        // Was unmuted, mute
        previousVolume = audio.volume; // Store current volume before muting
        audio.muted = true;
        audio.volume = 0;
        volumeSlider.value = 0; // Move slider to 0
    }
    updateVolumeIcons(); // Update icons after mute toggle
}

volumeDownIcon.addEventListener('click', toggleMute);
volumeUpIcon.addEventListener('click', toggleMute);


window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// --- Sidebar Menu Functionality ---
menuToggle.addEventListener('click', () => {
    sidebarMenu.classList.toggle('active'); // Toggle the 'active' class
    const icon = menuToggle.querySelector('i');
    if (sidebarMenu.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times'); // Change to 'X' icon
    } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars'); // Change back to hamburger icon
    }
});

// Close sidebar if clicking outside (now also toggles icon back)
document.addEventListener('click', (event) => {
    if (sidebarMenu.classList.contains('active') && !sidebarMenu.contains(event.target) && !menuToggle.contains(event.target)) {
        sidebarMenu.classList.remove('active');
        // Make sure to change the icon back if closed by clicking outside
        const icon = menuToggle.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
});


// --- Wallpaper Change and Dynamic Color Functionality ---
// Default background image from CSS :root variable (ensure it's defined there)
// This will contain the full CSS value, e.g., 'url("...") no-repeat center center'
const DEFAULT_BACKGROUND_IMAGE_CSS_VALUE = getComputedStyle(document.documentElement).getPropertyValue('--default-bg-image').trim();
// Extract just the URL part for analysis and for setting backgroundImage property
const DEFAULT_BACKGROUND_IMAGE_URL = DEFAULT_BACKGROUND_IMAGE_CSS_VALUE.replace(/url\(['"]?(.*?)['"]?\).*$/, '$1');

const BRIGHTNESS_THRESHOLD = 128; // Value between 0-255. Adjust as needed.
const LAST_WALLPAPER_KEY = 'lastWallpaper'; // Key for localStorage

/**
 * Sets the player UI theme based on background brightness.
 * Adds 'light-theme-active' class to body if background is light, otherwise removes it.
 * @param {boolean} isLightBackground True if the background image is considered light.
 */
function setPlayerTheme(isLightBackground) {
    if (isLightBackground) {
        body.classList.add('light-theme-active');
    } else {
        body.classList.remove('light-theme-active');
    }
}

/**
 * Analyzes the brightness of an image from a given URL.
 * @param {string} imageUrl The URL of the image (can be data:URL or http/https URL).
 * @param {function(boolean): void} callback Function to call with true (light) or false (dark).
 */
function analyzeImageBrightness(imageUrl, callback) {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Crucial for CORS to read pixel data from external URLs
    img.src = imageUrl;

    img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);

        try {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            let sumBrightness = 0;

            for (let i = 0; i < data.length; i += 4) {
                // Calculate perceived brightness using a common formula
                const brightness = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
                sumBrightness += brightness;
            }

            const averageBrightness = sumBrightness / (data.length / 4);
            const isLight = averageBrightness > BRIGHTNESS_THRESHOLD;
            callback(isLight);
        } catch (e) {
            console.warn("Could not read image data (likely CORS issue or security error for local file):", e);
            // Fallback: Assume dark background if cannot analyze (defaulting to light UI)
            callback(false);
        }
    };

    img.onerror = () => {
        console.error("Failed to load image for brightness analysis:", imageUrl);
        // Fallback: Assume dark background if image fails to load (defaulting to light UI)
        callback(false);
    };
}

/**
 * Applies a new wallpaper, analyzes its brightness, and saves to local storage.
 * @param {string} newBackgroundImageUrlCss The CSS background-image url() string (e.g., 'url("...")').
 * @param {string} imageUrlForAnalysis The direct URL of the image for analysis (can be data:URL).
 * @param {boolean} [shouldSave=true] Optional: Whether to save the wallpaper to local storage. Defaults to true.
 */
function applyWallpaperAndAnalyze(newBackgroundImageUrlCss, imageUrlForAnalysis, shouldSave = true) {
    body.style.backgroundImage = newBackgroundImageUrlCss;
    body.style.backgroundSize = 'cover';
    body.style.backgroundRepeat = 'no-repeat';
    body.style.backgroundPosition = 'center center';
    
    // Save the image URL/data URL to localStorage for persistence
    if (shouldSave) {
        localStorage.setItem(LAST_WALLPAPER_KEY, imageUrlForAnalysis);
    } else {
        localStorage.removeItem(LAST_WALLPAPER_KEY); // Clear if not saving
    }

    // Analyze the brightness of the new image
    analyzeImageBrightness(imageUrlForAnalysis, (isLight) => {
        setPlayerTheme(isLight);
    });

    sidebarMenu.classList.remove('active'); // Close menu after selection
    menuToggle.querySelector('i').classList.replace('fa-times', 'fa-bars'); // Reset icon
}


// Local file upload
wallpaperFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            // For local files, the data URL is used for both background and analysis
            applyWallpaperAndAnalyze(`url('${dataUrl}')`, dataUrl);
        };
        reader.readAsDataURL(file);
    }
});

// URL input
applyWallpaperUrlBtn.addEventListener('click', () => {
    const imageUrl = wallpaperUrlInput.value.trim();
    if (imageUrl) {
        // First, clear the file input field, as we're using a URL
        wallpaperFileInput.value = ''; 

        const testImg = new Image();
        testImg.src = imageUrl;
        testImg.onload = () => {
            applyWallpaperAndAnalyze(`url('${imageUrl}')`, imageUrl);
        };
        testImg.onerror = () => {
            alert('Invalid image URL or unable to load image. Please check the URL.');
        };
    } else {
        alert('Please enter an image URL.');
    }
});

// Reset to default wallpaper
resetWallpaperBtn.addEventListener('click', () => {
    // Clear input fields
    wallpaperFileInput.value = ''; // Clear file input
    wallpaperUrlInput.value = ''; // Clear URL input

    // Reset to the original image and re-analyze its brightness. Pass `false` to not save to localStorage.
    // IMPORTANT FIX: Ensure we pass only the url() string to applyWallpaperAndAnalyze's first argument
    applyWallpaperAndAnalyze(`url('${DEFAULT_BACKGROUND_IMAGE_URL}')`, DEFAULT_BACKGROUND_IMAGE_URL, false);
});


// --- Initial Setup on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Last Wallpaper (if any) and set theme
    const savedWallpaperUrl = localStorage.getItem(LAST_WALLPAPER_KEY);
    if (savedWallpaperUrl) {
        applyWallpaperAndAnalyze(`url('${savedWallpaperUrl}')`, savedWallpaperUrl);
    } else {
        // If no wallpaper saved, apply default without saving it again
        // IMPORTANT FIX: Ensure we pass only the url() string to applyWallpaperAndAnalyze's first argument
        applyWallpaperAndAnalyze(`url('${DEFAULT_BACKGROUND_IMAGE_URL}')`, DEFAULT_BACKGROUND_IMAGE_URL, false);
    }

    // 2. Set initial volume from slider (0.5 or persisted value)
    // IMPORTANT: Make sure the audio element's volume is set before updating slider/icons
    // If you persist volume, load it here. For now, it defaults to 0.5 from HTML or initial previousVolume.
    audio.volume = parseFloat(volumeSlider.value); // Use the value from HTML or previous script set
    previousVolume = audio.volume; // Store initial volume

    // 3. Update volume icon initially
    updateVolumeIcons(); // Call this once on load to set correct icon
});
