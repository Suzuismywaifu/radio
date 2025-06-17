// Get references to HTML elements
const audioPlayer = document.getElementById('audioPlayer');
const playPauseButton = document.getElementById('playPauseButton');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const volumeSlider = document.getElementById('volumeSlider');
const playerStatus = document.getElementById('playerStatus');
const progressFill = document.getElementById('progressFill');
const errorMessage = document.getElementById('errorMessage');
const volumeValue = document.getElementById('volumeValue');

// New elements for the hamburger menu and background settings
const hamburgerButton = document.getElementById('hamburgerButton');
const hamburgerIcon = document.getElementById('hamburgerIcon');
const sideMenu = document.getElementById('sideMenu');
const closeMenuButton = document.getElementById('closeMenuButton');
const imageUrlInput = document.getElementById('imageUrlInput');
const imageFileInput = document.getElementById('imageFileInput');
const applyBgButton = document.getElementById('applyBgButton');
const clearBgButton = document.getElementById('clearBgButton');
const overlay = document.getElementById('overlay');
const body = document.body;

const fileErrorMessage = document.getElementById('fileErrorMessage');

// New elements for mute functionality
const muteToggleButton = document.getElementById('muteToggleButton');
const volumeIcon = document.getElementById('volumeIcon');
const muteIcon = document.getElementById('muteIcon');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
let previousVolume = 0.5; // Store previous volume for mute/unmute - DEFAULT TO 50%

// Set initial volume from slider and update display
audioPlayer.volume = volumeSlider.value;
volumeValue.textContent = `${Math.round(audioPlayer.volume * 100)}%`;

// Function to update the play/pause button state
function updatePlayPauseButton() {
    if (audioPlayer.paused) {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
    } else {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
    }
}

// Function to update the mute button and volume slider state
function updateMuteButton() {
    if (audioPlayer.muted) {
        volumeIcon.classList.add('hidden');
        muteIcon.classList.remove('hidden');
        volumeSlider.value = 0; // Set slider to 0 when muted
        volumeSlider.disabled = true; // Disable slider when muted
        volumeValue.textContent = 'Muted';
        muteToggleButton.setAttribute('aria-label', 'Unmute audio');
    } else {
        volumeIcon.classList.remove('hidden');
        muteIcon.classList.add('hidden');
        volumeSlider.value = audioPlayer.volume > 0 ? audioPlayer.volume : previousVolume; // Restore actual volume or last non-zero volume
        volumeSlider.disabled = false; // Enable slider when unmuted
        volumeValue.textContent = `${Math.round(audioPlayer.volume * 100)}%`;
        muteToggleButton.setAttribute('aria-label', 'Mute audio');
    }
}

// Function to display messages in the UI (unified)
function showMessage(element, message, type = 'info') {
    element.textContent = message;
    element.classList.remove('hidden', 'error', 'info'); // Clear previous types
    element.classList.add(type);
    element.style.display = 'block'; // Make it visible
}

// Function to hide messages (unified)
function hideMessage(element) {
    element.classList.remove('error', 'info');
    element.style.display = 'none'; // Hide it
    element.textContent = ''; // Clear text
}

// Function to update apply button state
function updateApplyButtonState() {
    const hasImageUrl = imageUrlInput.value.trim() !== '';
    const hasFile = imageFileInput.files.length > 0;
    const isDisabled = !(hasImageUrl || hasFile);

    applyBgButton.disabled = isDisabled;
    applyBgButton.setAttribute('aria-disabled', isDisabled);

    if (isDisabled) {
        applyBgButton.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        applyBgButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// Event Listener for Play/Pause Button
playPauseButton.addEventListener('click', () => {
    if (audioPlayer.paused) {
        audioPlayer.play().catch(error => {
            console.error('Error playing audio:', error);
            showMessage(errorMessage, `Failed to play stream: ${error.message}. Please ensure your browser allows autoplay or try again.`, 'error');
        });
    } else {
        audioPlayer.pause();
    }
});

// Event Listener for Volume Slider
volumeSlider.addEventListener('input', () => {
    audioPlayer.volume = volumeSlider.value;
    // If slider moves from 0, unmute
    if (audioPlayer.muted && audioPlayer.volume > 0) {
        audioPlayer.muted = false;
    }
    // Store previous volume only if not muted and volume is greater than 0
    if (!audioPlayer.muted && audioPlayer.volume > 0) {
        previousVolume = audioPlayer.volume;
    }
    updateMuteButton(); // Update mute icon/text based on current volume/mute state
});

// Event Listener for Mute/Unmute Button
muteToggleButton.addEventListener('click', () => {
    if (audioPlayer.muted) {
        audioPlayer.muted = false;
        // Restore previous volume, but ensure it's not 0 unless it was intentionally 0 before muting
        audioPlayer.volume = previousVolume > 0 ? previousVolume : 0.5; // Restore previous volume or default (50%)
    } else {
        previousVolume = audioPlayer.volume; // Save current volume before muting
        audioPlayer.muted = true;
    }
    updateMuteButton();
});


// Audio Player Event Listeners
audioPlayer.addEventListener('play', () => {
    updatePlayPauseButton();
    hideMessage(errorMessage); // Hide general error message
});

audioPlayer.addEventListener('playing', () => {
    playerStatus.classList.add('hidden'); // Hide status text when actually playing
});

audioPlayer.addEventListener('pause', () => {
    updatePlayPauseButton();
    playerStatus.textContent = 'Paused';
    playerStatus.classList.remove('hidden'); // Show status text when paused
    progressFill.style.width = '0%';
});

audioPlayer.addEventListener('volumechange', () => {
    localStorage.setItem('playerVolume', audioPlayer.volume); // Save volume
    localStorage.setItem('playerMuted', audioPlayer.muted); // Save mute state
    updateMuteButton(); // Ensure mute icon/slider reflects actual volume/mute state
});

audioPlayer.addEventListener('waiting', () => {
    playerStatus.textContent = 'Buffering...';
    playerStatus.classList.remove('hidden'); // Show status text when buffering
});

audioPlayer.addEventListener('error', (e) => {
    console.error('Audio error:', e);
    let message = 'An unknown audio error occurred.';
    switch (e.target.error.code) {
        case e.target.error.MEDIA_ERR_ABORTED:
            message = 'Audio playback aborted. You stopped the audio.';
            break;
        case e.target.error.MEDIA_ERR_NETWORK:
            message = 'A network error caused the audio download to fail. Check your internet connection.';
            break;
        case e.target.error.MEDIA_ERR_DECODE:
            message = 'The audio playback was aborted due to a decoding error. The file might be corrupted or in an unsupported format.';
            break;
        case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            message = 'The audio format is not supported or the stream URL is invalid. Try a different stream or refresh.';
            break;
        default:
            message = 'An unexpected audio error occurred. Please try reloading the page.';
    }
    playerStatus.textContent = 'Error!';
    playerStatus.classList.remove('hidden'); // Show status text on error
    showMessage(errorMessage, `Error: ${message}`, 'error');
    updatePlayPauseButton();
    progressFill.style.width = '0%';
});

audioPlayer.addEventListener('canplay', () => {
    playerStatus.textContent = 'Ready to play';
    playerStatus.classList.remove('hidden'); // Show status text when ready
    hideMessage(errorMessage);
});

audioPlayer.addEventListener('loadstart', () => {
    playerStatus.textContent = 'Loading...';
    playerStatus.classList.remove('hidden'); // Show status text when loading
    hideMessage(errorMessage);
    progressFill.style.width = '0%';
});

// Hamburger Menu and Background Settings Logic
function toggleMenu() {
    sideMenu.classList.toggle('open');
    hamburgerIcon.classList.toggle('active');
    overlay.classList.toggle('active');
}

function applyBackground(source, type) {
    if (source) {
        body.style.backgroundImage = `url('${source}')`;
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center';
        body.style.backgroundRepeat = 'no-repeat';
        body.style.backgroundAttachment = 'fixed';
        body.classList.add('has-bg-image'); // Add class to body
        localStorage.setItem('savedBackground', source);
        localStorage.setItem('backgroundType', type);
    }
}

function clearBackground() {
    body.style.backgroundImage = 'none';
    body.style.background = 'linear-gradient(135deg, var(--gray-light), var(--gray-dark))';
    body.classList.remove('has-bg-image'); // Remove class from body
    localStorage.removeItem('savedBackground');
    localStorage.removeItem('backgroundType');
}

function loadSavedBackground() {
    const savedBackground = localStorage.getItem('savedBackground');
    const backgroundType = localStorage.getItem('backgroundType');
    if (savedBackground && (backgroundType === 'url' || backgroundType === 'data')) {
        body.style.backgroundImage = `url('${savedBackground}')`;
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center';
        body.style.backgroundRepeat = 'no-repeat';
        body.style.backgroundAttachment = 'fixed';
        body.classList.add('has-bg-image'); // Ensure class is added on load
    }
}

// Event listeners for menu
hamburgerButton.addEventListener('click', toggleMenu);
closeMenuButton.addEventListener('click', toggleMenu);
overlay.addEventListener('click', toggleMenu);

// Event listener for file input change
imageFileInput.addEventListener('change', () => {
    if (imageFileInput.files.length > 0) {
        const file = imageFileInput.files[0];
        if (file.size > MAX_FILE_SIZE) {
            showMessage(fileErrorMessage, `File is too large! Please select an image smaller than ${MAX_FILE_SIZE / (1024 * 1024)}MB.`, 'error');
            imageFileInput.value = ''; // Clear the selected file
        } else {
            hideMessage(fileErrorMessage);
        }
        imageUrlInput.value = ''; // Clear URL input if a file is selected
    } else {
        hideMessage(fileErrorMessage);
    }
    updateApplyButtonState();
});

// Event listener for URL input change (to clear file input if URL is entered)
imageUrlInput.addEventListener('input', () => {
    if (imageUrlInput.value.trim() !== '') {
        imageFileInput.value = ''; // Clear file input if URL is being typed
        hideMessage(fileErrorMessage); // Hide any file size error
    }
    updateApplyButtonState();
});

// NEW: Event listener for Enter key on imageUrlInput
imageUrlInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission if any
        if (!applyBgButton.disabled) { // Only click if the button is enabled
            applyBgButton.click();
        }
    }
});


// Event listeners for background settings
applyBgButton.addEventListener('click', () => {
    const imageUrl = imageUrlInput.value.trim();
    if (imageUrl) {
        applyBackground(imageUrl, 'url');
        imageUrlInput.value = ''; // Clear input after applying
    } else if (imageFileInput.files.length > 0) {
        const file = imageFileInput.files[0];
        if (file.size > MAX_FILE_SIZE) {
            showMessage(fileErrorMessage, `File is too large! Please select an image smaller than ${MAX_FILE_SIZE / (1024 * 1024)}MB.`, 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            applyBackground(e.target.result, 'data');
            imageFileInput.value = ''; // Clear file input
            hideMessage(fileErrorMessage);
        };
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            showMessage(fileErrorMessage, `Error reading file: ${error.message}.`, 'error');
        };
        reader.readAsDataURL(file);
    }
    updateApplyButtonState(); // Update state after applying
});

clearBgButton.addEventListener('click', clearBackground);

// Initialize button state and load saved background on page load
document.addEventListener('DOMContentLoaded', () => {
    updatePlayPauseButton();
    // Initial player status: "Ready to load" and visible
    playerStatus.textContent = 'Ready to load';
    playerStatus.classList.remove('hidden');

    // Set initial volume from local storage or default (50%)
    const savedVolume = localStorage.getItem('playerVolume');
    if (savedVolume !== null) {
        audioPlayer.volume = parseFloat(savedVolume);
        volumeSlider.value = parseFloat(savedVolume);
        previousVolume = parseFloat(savedVolume); // Set previous volume for mute/unmute
    } else {
        audioPlayer.volume = 0.5; // Default volume set to 50%
        volumeSlider.value = 0.5; // Default volume slider set to 50%
        previousVolume = 0.5;
    }

    // Check for initial mute state
    const savedMuteState = localStorage.getItem('playerMuted');
    if (savedMuteState === 'true') {
        audioPlayer.muted = true;
    } else {
        audioPlayer.muted = false;
    }
    updateMuteButton(); // Update mute button/slider based on initial state

    loadSavedBackground();
    hideMessage(fileErrorMessage); // Ensure file error message is hidden on load
    hideMessage(errorMessage); // Ensure main error message is hidden on load
    updateApplyButtonState(); // Set initial disabled state for apply button
});
