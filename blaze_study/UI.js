// UI.js - Handles user interface interactions

// Controls toggle
const controlsToggle = document.getElementById('controlsToggle');
const controlsContainer = document.getElementById('controlsContainer');

// Toggle controls panel when button is clicked
if (controlsToggle) {
    controlsToggle.addEventListener('click', () => {
        controlsContainer.classList.toggle('collapsed');
    });
}

// Function to update all value displays for range inputs
function updateValueDisplays() {
    // Basic controls
    updateValueDisplay('ringCount', 'ringCountValue');
    updateValueDisplay('segmentCount', 'segmentCountValue');
    updateValueDisplay('stripeCount', 'stripeCountValue');
    updateValueDisplay('angleOffset', 'angleOffsetValue', (val) => val);
    updateValueDisplay('rotationSpeed', 'rotationSpeedValue', (val) => val);
    updateValueDisplay('stripAngle', 'stripAngleValue', (val) => `${val}°`);
    updateValueDisplay('ringWidth', 'ringWidthValue', (val) => `${val}%`);
    
    // Gradient controls
    updateValueDisplay('gradientIntensity', 'gradientIntensityValue', (val) => `${val}%`);
    updateValueDisplay('edgeBrightness', 'edgeBrightnessValue');
    updateValueDisplay('centerDarkness', 'centerDarknessValue');
    updateValueDisplay('gradientWidth', 'gradientWidthValue', (val) => parseFloat(val).toFixed(1));
    
    // Glow controls
    updateValueDisplay('glowIntensity', 'glowIntensityValue', (val) => `${val}%`);
    updateValueDisplay('glowSize', 'glowSizeValue', (val) => parseFloat(val).toFixed(1));
    
    // Individual ring controls
    const ringCount = parseInt(document.getElementById('ringCount')?.value || 0);
    for (let i = 1; i <= ringCount; i++) {
        updateValueDisplay(`ring${i}Width`, `ring${i}WidthValue`, (val) => `${val}%`);
        updateValueDisplay(`ring${i}StripeAngle`, `ring${i}StripeAngleValue`, (val) => `${val}°`);
        updateValueDisplay(`ring${i}Period`, `ring${i}PeriodValue`, (val) => `${val}s`);
        updateValueDisplay(`ring${i}WidthPeriod`, `ring${i}WidthPeriodValue`, (val) => `${val}s`);
        updateValueDisplay(`ring${i}WidthAmplitude`, `ring${i}WidthAmplitudeValue`, (val) => `${val}%`);
    }
}

// Helper function to update a single value display
function updateValueDisplay(inputId, displayId, formatter = val => val) {
    const input = document.getElementById(inputId);
    const display = document.getElementById(displayId);
    if (input && display) {
        display.textContent = formatter(input.value);
    }
}

// Toggle visibility of related controls based on checkboxes
function setupToggleVisibility() {
    // Custom color toggle
    const colorSchemeControl = document.getElementById('colorScheme');
    const customColorGroup = document.getElementById('customColorGroup');
    
    if (colorSchemeControl && customColorGroup) {
        const updateCustomColorVisibility = () => {
            customColorGroup.style.display = 
                colorSchemeControl.value === 'custom' ? 'block' : 'none';
        };
        
        colorSchemeControl.addEventListener('change', updateCustomColorVisibility);
        updateCustomColorVisibility(); // Initial state
    }
    
    // Gradient controls toggle
    const gradientEnabledControl = document.getElementById('gradientEnabled');
    const gradientControls = document.getElementById('gradientControls');
    
    if (gradientEnabledControl && gradientControls) {
        gradientEnabledControl.addEventListener('change', () => {
            gradientControls.style.display = 
                gradientEnabledControl.checked ? 'block' : 'none';
        });
        
        // Initial state
        gradientControls.style.display = 
            gradientEnabledControl.checked ? 'block' : 'none';
    }
    
    // Glow controls toggle
    const glowEnabledControl = document.getElementById('glowEnabled');
    const glowControls = document.getElementById('glowControls');
    
    if (glowEnabledControl && glowControls) {
        glowEnabledControl.addEventListener('change', () => {
            glowControls.style.display = 
                glowEnabledControl.checked ? 'block' : 'none';
            
            // Setup WebGL if needed
            if (glowEnabledControl.checked) {
                setupWebGL();
            } else {
                setupCanvas2D();
            }
        });
        
        // Initial state
        glowControls.style.display = 
            glowEnabledControl.checked ? 'block' : 'none';
    }
}

// Create a pause/play button
function setupAnimationControls() {
    const pausePlayButton = document.getElementById('pausePlay');
    const resetButton = document.getElementById('resetAnimation');
    
    if (pausePlayButton) {
        pausePlayButton.addEventListener('click', () => {
            if (isPaused) {
                startAnimation();
                pausePlayButton.textContent = 'Pause';
            } else {
                stopAnimation();
                pausePlayButton.textContent = 'Play';
            }
            isPaused = !isPaused;
        });
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            // Reset all rotations to 0
            for (let i = 0; i < ringRotations.length; i++) {
                ringRotations[i] = 0;
                ringOscillationPhases[i] = 0;
            }
            
            // If paused, draw once to show reset
            if (isPaused) {
                drawBlaze();
            }
        });
    }
}

// Setup event listeners for all controls
function setupEventListeners() {
    // Add event listeners to inputs that need to update value displays
    const inputsWithValueDisplay = [
        'ringCount', 'segmentCount', 'stripeCount', 'angleOffset',
        'rotationSpeed', 'stripAngle', 'ringWidth', 'gradientIntensity',
        'edgeBrightness', 'centerDarkness', 'gradientWidth',
        'glowIntensity', 'glowSize'
    ];
    
    inputsWithValueDisplay.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => {
                updateValueDisplays();
                saveSettings();
            });
        }
    });
    
    // Add event listeners for checkboxes and selects
    const otherInputs = [
        'alternateRotation', 'alternateStripAngles', 'colorScheme',
        'gradientCurve', 'gradientEnabled', 'glowEnabled',
        'primaryColor', 'secondaryColor', 'glowColor'
    ];
    
    otherInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', saveSettings);
        }
    });
    
    // Ring Count needs special handling to recreate ring controls
    const ringCountControl = document.getElementById('ringCount');
    if (ringCountControl) {
        ringCountControl.addEventListener('change', () => {
            createRingWidthControls();
            initRotations(parseInt(ringCountControl.value));
        });
    }
}

// Initialize UI
function initializeUI() {
    // Inject dynamic styles
    if (typeof injectDynamicStyles === 'function') {
        injectDynamicStyles();
    }
    
    // Setup all UI toggles and visibility
    setupToggleVisibility();
    
    // Setup animation controls
    setupAnimationControls();
    
    // Setup all event listeners
    setupEventListeners();
    
    // Initial update of all value displays
    updateValueDisplays();
    
    // Auto-collapse controls on mobile
    if (window.innerWidth < 768) {
        controlsContainer.classList.add('collapsed');
    }
}

// Call initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeUI);
