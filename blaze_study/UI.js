
// Get all controls
const ringCountControl = document.getElementById('ringCount');
const segmentCountControl = document.getElementById('segmentCount');
const stripeCountControl = document.getElementById('stripeCount');
const angleOffsetControl = document.getElementById('angleOffset');
const rotationSpeedControl = document.getElementById('rotationSpeed');
const alternateRotationControl = document.getElementById('alternateRotation');
const colorSchemeControl = document.getElementById('colorScheme');
const primaryColorControl = document.getElementById('primaryColor');
const secondaryColorControl = document.getElementById('secondaryColor');
const customColorGroup = document.getElementById('customColorGroup');
const stripAngleControl = document.getElementById('stripAngle');
const alternateStripAnglesControl = document.getElementById('alternateStripAngles');
const gradientEnabledControl = document.getElementById('gradientEnabled');
const gradientIntensityControl = document.getElementById('gradientIntensity');
const edgeBrightnessControl = document.getElementById('edgeBrightness');
const centerDarknessControl = document.getElementById('centerDarkness');
const gradientWidthControl = document.getElementById('gradientWidth');
const gradientControlsDiv = document.getElementById('gradientControls');
const ringWidthControl = document.getElementById('ringWidth');
const gradientCurveControl = document.getElementById('gradientCurve');
const glowEnabledControl = document.getElementById('glowEnabled');
const glowIntensityControl = document.getElementById('glowIntensity');
const glowSizeControl = document.getElementById('glowSize');
const glowColorControl = document.getElementById('glowColor');
const glowControlsDiv = document.getElementById('glowControls');

// Get all value displays
const ringCountValue = document.getElementById('ringCountValue');
const segmentCountValue = document.getElementById('segmentCountValue');
const stripeCountValue = document.getElementById('stripeCountValue');
const angleOffsetValue = document.getElementById('angleOffsetValue');
const rotationSpeedValue = document.getElementById('rotationSpeedValue');
const stripAngleValue = document.getElementById('stripAngleValue');
const gradientIntensityValue = document.getElementById('gradientIntensityValue');
const edgeBrightnessValue = document.getElementById('edgeBrightnessValue');
const centerDarknessValue = document.getElementById('centerDarknessValue');
const gradientWidthValue = document.getElementById('gradientWidthValue');
const ringWidthValue = document.getElementById('ringWidthValue');
const glowIntensityValue = document.getElementById('glowIntensityValue');
const glowSizeValue = document.getElementById('glowSizeValue');

// Get buttons
const pausePlayButton = document.getElementById('pausePlay');
const resetAnimationButton = document.getElementById('resetAnimation');
const toggleControlsBtn = document.querySelector('.toggle-controls');
const controlsContainer = document.querySelector('.controls-container');





// Control panel toggle
toggleControlsBtn.addEventListener('click', () => {
    controlsContainer.classList.toggle('collapsed');
});

// Play/Pause button
pausePlayButton.addEventListener('click', () => {
    if (isPaused) {
        startAnimation();
    } else {
        pauseAnimation();
    }
});

// Reset button
resetAnimationButton.addEventListener('click', resetAnimation);

// Parameter controls
ringCountControl.addEventListener('input', () => {
    updateValueDisplays();
    const newRingCount = parseInt(ringCountControl.value);
    initRotations(newRingCount);
    createRingWidthControls();  // Regenerate controls when ring count changes
});

stripeCountControl.addEventListener('input', updateValueDisplays);
angleOffsetControl.addEventListener('input', updateValueDisplays);
rotationSpeedControl.addEventListener('input', updateValueDisplays);

alternateRotationControl.addEventListener('change', saveSettings);

colorSchemeControl.addEventListener('change', () => {
    if (colorSchemeControl.value === 'custom') {
        customColorGroup.style.display = 'block';
    } else {
        customColorGroup.style.display = 'none';
    }
    saveSettings();
});

primaryColorControl.addEventListener('change', saveSettings);
secondaryColorControl.addEventListener('change', saveSettings);

stripAngleControl.addEventListener('input', updateValueDisplays);
alternateStripAnglesControl.addEventListener('change', saveSettings);

gradientEnabledControl.addEventListener('change', () => {
    gradientControlsDiv.style.display = gradientEnabledControl.checked ? 'block' : 'none';
    saveSettings();
});

gradientIntensityControl.addEventListener('input', updateValueDisplays);
edgeBrightnessControl.addEventListener('input', updateValueDisplays);
centerDarknessControl.addEventListener('input', updateValueDisplays);
gradientWidthControl.addEventListener('input', updateValueDisplays);

ringWidthControl.addEventListener('input', updateValueDisplays);

gradientCurveControl.addEventListener('change', saveSettings);

glowEnabledControl.addEventListener('change', function() {
    glowControlsDiv.style.display = glowEnabledControl.checked ? 'block' : 'none';
    saveSettings();
    
    // Initialize WebGL only if all controls are ready
    if (glowEnabledControl.checked) {
        // Use setTimeout to ensure this happens after all controls are properly initialized
        setTimeout(setupWebGL, 0);
    } else {
        setupCanvas2D();
    }
});
// Function to update value displays
function updateValueDisplays() {
    ringCountValue.textContent = ringCountControl.value;
    segmentCountValue.textContent = segmentCountControl.value;
    stripeCountValue.textContent = stripeCountControl.value;
    angleOffsetValue.textContent = parseFloat(angleOffsetControl.value).toFixed(3);
    rotationSpeedValue.textContent = parseFloat(rotationSpeedControl.value).toFixed(3);
    stripAngleValue.textContent = `${stripAngleControl.value}°`;
    gradientIntensityValue.textContent = `${gradientIntensityControl.value}%`;
    edgeBrightnessValue.textContent = edgeBrightnessControl.value;
    centerDarknessValue.textContent = centerDarknessControl.value;
    gradientWidthValue.textContent = gradientWidthControl.value;
    ringWidthValue.textContent = `${ringWidthControl.value}%`;
    glowIntensityValue.textContent = `${glowIntensityControl.value}%`;
    glowSizeValue.textContent = glowSizeControl.value;
    
    // Save settings whenever they change
    saveSettings();
}
segmentCountControl.addEventListener('input', updateValueDisplays);
glowIntensityControl.addEventListener('input', updateValueDisplays);
glowSizeControl.addEventListener('input', updateValueDisplays);
glowColorControl.addEventListener('change', saveSettings);
