/**
 * Core utilities and state management for the Blaze application
 */

// Global state object
export const state = {
    // Animation state
    isPaused: false,
    wasPaused: false,
    animationId: null,
    
    // Ring rotations
    ringRotations: [],
    
    // WebGL context and related objects
    webglContext: null
};

/**
 * Mix two colors based on a ratio
 * @param {string} color1 - First color in hex format
 * @param {string} color2 - Second color in hex format
 * @param {number} ratio - Mixing ratio from 0 to 1
 * @returns {string} Mixed color in hex format
 */
export function mixColors(color1, color2, ratio) {
    // Convert hex to RGB
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    // Mix the colors
    const mixed = {
        r: Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio),
        g: Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio),
        b: Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio)
    };
    
    // Convert back to hex
    return rgbToHex(mixed);
}

/**
 * Convert hex color to RGB object
 * @param {string} hex - Color in hex format
 * @returns {Object} RGB color object
 */
export function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    // Parse hex values
    const bigint = parseInt(hex, 16);
    
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

/**
 * Convert RGB object to hex string
 * @param {Object} rgb - RGB color object
 * @returns {string} Color in hex format
 */
export function rgbToHex(rgb) {
    return '#' + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
}

/**
 * Get a color scheme based on a primary color
 * @param {string} scheme - Color scheme type
 * @param {string} primaryColorValue - Primary color in hex format
 * @param {string} secondaryColorValue - Secondary color in hex (for custom scheme)
 * @returns {Object} Color scheme object with primary and secondary colors
 */
export function getColorScheme(scheme, primaryColorValue, secondaryColorValue) {
    const primaryColor = primaryColorValue;
    let secondaryColor = secondaryColorValue;
    
    // Generate color schemes algorithmically
    if (scheme !== 'custom') {
        const rgb = hexToRgb(primaryColor);
        
        switch (scheme) {
            case 'complementary':
                // Complementary color (opposite on color wheel)
                secondaryColor = rgbToHex({
                    r: 255 - rgb.r,
                    g: 255 - rgb.g,
                    b: 255 - rgb.b
                });
                break;
                
            case 'analogous':
                // Analogous color (adjacent on color wheel)
                // Simplified algorithm - rotate hue by converting to HSL
                const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                hsl.h = (hsl.h + 30) % 360; // Rotate hue by 30 degrees
                const analogous = hslToRgb(hsl.h, hsl.s, hsl.l);
                secondaryColor = rgbToHex(analogous);
                break;
                
            case 'triadic':
                // Triadic color (three equally spaced colors on wheel)
                // Simplified algorithm - rotate hue by 120 degrees
                const hslTri = rgbToHsl(rgb.r, rgb.g, rgb.b);
                hslTri.h = (hslTri.h + 120) % 360;
                const triadic = hslToRgb(hslTri.h, hslTri.s, hslTri.l);
                secondaryColor = rgbToHex(triadic);
                break;
                
            default:
                // Default to complementary
                secondaryColor = rgbToHex({
                    r: 255 - rgb.r,
                    g: 255 - rgb.g,
                    b: 255 - rgb.b
                });
        }
    }
    
    return { primaryColor, secondaryColor };
}

/**
 * Initialize ring rotations
 * @param {number} ringCount - Number of rings
 * @returns {Array} Array of rotation and oscillation data
 */
export function initRotations(ringCount) {
    const rotations = [];
    for (let i = 0; i < ringCount; i++) {
        rotations.push({
            rotation: Math.random() * Math.PI * 2,
            oscillationPhase: Math.random() * Math.PI * 2,
            currentRotation: 0
        });
    }
    return rotations;
}

/**
 * Convert RGB to HSL
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {Object} HSL color object
 */
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        
        h = Math.round(h * 60);
    }
    
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    return { h, s, l };
}

/**
 * Convert HSL to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {Object} RGB color object
 */
function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
} 