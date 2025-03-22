// common.js - Shared variables and utility functions

// Global variables for canvas dimensions and positioning
let centerX = 0;
let centerY = 0;
let maxRadius = 0;

// Animation variables
let animationId = null;
let isPaused = false;
const ringRotations = []; // Track rotation angle for each ring
const ringOscillationPhases = [];

// Control elements - initialized in initializeControls() for use across files
let ringCountControl;
let segmentCountControl;
let stripeCountControl;
let angleOffsetControl;
let rotationSpeedControl;
let alternateRotationControl;
let colorSchemeControl;
let primaryColorControl;
let secondaryColorControl;
let stripAngleControl;
let alternateStripAnglesControl;
let ringWidthControl;
let gradientEnabledControl;
let gradientIntensityControl;
let edgeBrightnessControl;
let centerDarknessControl;
let gradientWidthControl;
let gradientCurveControl;
let glowEnabledControl;
let glowIntensityControl;
let glowSizeControl;
let glowColorControl;

// Initialize rotation tracking arrays
function initRotations(ringCount) {
    ringRotations.length = 0;
    ringOscillationPhases.length = 0;
    for (let i = 0; i < ringCount; i++) {
        ringRotations.push(0); // Start at 0 rotation
        ringOscillationPhases.push(0);
    }
}

// Initialize control references
function initializeControls() {
    console.log("Initializing controls...");
    
    // Get all main controls
    ringCountControl = document.getElementById('ringCount');
    segmentCountControl = document.getElementById('segmentCount');
    stripeCountControl = document.getElementById('stripeCount');
    angleOffsetControl = document.getElementById('angleOffset');
    rotationSpeedControl = document.getElementById('rotationSpeed');
    alternateRotationControl = document.getElementById('alternateRotation');
    colorSchemeControl = document.getElementById('colorScheme');
    primaryColorControl = document.getElementById('primaryColor');
    secondaryColorControl = document.getElementById('secondaryColor');
    stripAngleControl = document.getElementById('stripAngle');
    alternateStripAnglesControl = document.getElementById('alternateStripAngles');
    ringWidthControl = document.getElementById('ringWidth');
    gradientEnabledControl = document.getElementById('gradientEnabled');
    gradientIntensityControl = document.getElementById('gradientIntensity');
    edgeBrightnessControl = document.getElementById('edgeBrightness');
    centerDarknessControl = document.getElementById('centerDarkness');
    gradientWidthControl = document.getElementById('gradientWidth');
    gradientCurveControl = document.getElementById('gradientCurve');
    glowEnabledControl = document.getElementById('glowEnabled');
    glowIntensityControl = document.getElementById('glowIntensity');
    glowSizeControl = document.getElementById('glowSize');
    glowColorControl = document.getElementById('glowColor');
    
    // If the essential controls don't exist, create basic ones for initialization purposes
    if (!ringCountControl) {
        console.log("Creating basic ring count control");
        ringCountControl = { value: '8' }; // Default to 8 rings
    }
    
    if (!segmentCountControl) {
        segmentCountControl = { value: '8' }; // Default to 8 segments
    }
    
    // Other essential controls with defaults
    if (!stripeCountControl) stripeCountControl = { value: '5' };
    if (!angleOffsetControl) angleOffsetControl = { value: '0.02' };
    if (!rotationSpeedControl) rotationSpeedControl = { value: '0.5' };
    if (!alternateRotationControl) alternateRotationControl = { checked: true };
    if (!colorSchemeControl) colorSchemeControl = { value: 'rb' };
    if (!primaryColorControl) primaryColorControl = { value: '#FF0000' };
    if (!secondaryColorControl) secondaryColorControl = { value: '#0000FF' };
    if (!stripAngleControl) stripAngleControl = { value: '0' };
    if (!alternateStripAnglesControl) alternateStripAnglesControl = { checked: false };
    if (!ringWidthControl) ringWidthControl = { value: '100' };
    if (!gradientEnabledControl) gradientEnabledControl = { checked: true };
    if (!gradientIntensityControl) gradientIntensityControl = { value: '100' };
    if (!edgeBrightnessControl) edgeBrightnessControl = { value: '30' };
    if (!centerDarknessControl) centerDarknessControl = { value: '25' };
    if (!gradientWidthControl) gradientWidthControl = { value: '2.0' };
    if (!gradientCurveControl) gradientCurveControl = { value: 'sine' };
    if (!glowEnabledControl) glowEnabledControl = { checked: true };
    if (!glowIntensityControl) glowIntensityControl = { value: '50' };
    if (!glowSizeControl) glowSizeControl = { value: '3' };
    if (!glowColorControl) glowColorControl = { value: '#00AAFF' };
}

// Color mixing utility function
function mixColors(color1, color2, ratio) {
    // Parse the color strings
    const parseColor = (color) => {
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/);
        if (match) {
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3]),
                a: match[4] ? parseFloat(match[4]) : 1
            };
        }
        return null;
    };
    
    const c1 = parseColor(color1);
    const c2 = parseColor(color2);
    
    if (!c1 || !c2) return color1; // Fallback if parsing fails
    
    // Mix the colors
    const r = Math.round(c1.r * (1 - ratio) + c2.r * ratio);
    const g = Math.round(c1.g * (1 - ratio) + c2.g * ratio);
    const b = Math.round(c1.b * (1 - ratio) + c2.b * ratio);
    const a = c1.a * (1 - ratio) + c2.a * ratio;
    
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Convert hex color to RGB
function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    // Parse r, g, b values
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    
    return { r, g, b };
}

// Convert RGB to hex
function rgbToHex(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Initialize controls when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeControls); 