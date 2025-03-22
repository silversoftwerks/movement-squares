/**
 * Gradient-related functions for the Blaze application
 */

import { hexToRgb, rgbToHex } from './core.js';

/**
 * Apply gradient stops based on curve type
 * @param {CanvasGradient} gradient - Canvas gradient object
 * @param {string} curveType - Type of gradient curve
 * @param {string} lighterColor - Lighter color for the gradient
 * @param {string} deeperColor - Deeper color for the gradient
 */
export function applyGradientStops(gradient, curveType, lighterColor, deeperColor) {
    switch (curveType) {
        case 'linear':
            // Simple linear gradient
            gradient.addColorStop(0, lighterColor);
            gradient.addColorStop(1, lighterColor);
            gradient.addColorStop(0.5, deeperColor);
            break;
            
        case 'ease-in':
            // Start slow, end fast
            gradient.addColorStop(0, lighterColor);
            gradient.addColorStop(0.2, lighterColor);
            gradient.addColorStop(0.5, deeperColor);
            gradient.addColorStop(1, lighterColor);
            break;
            
        case 'ease-out':
            // Start fast, end slow
            gradient.addColorStop(0, lighterColor);
            gradient.addColorStop(0.5, deeperColor);
            gradient.addColorStop(0.8, lighterColor);
            gradient.addColorStop(1, lighterColor);
            break;
            
        case 'ease-in-out':
            // Slow at both ends, fast in middle
            gradient.addColorStop(0, lighterColor);
            gradient.addColorStop(0.25, deeperColor);
            gradient.addColorStop(0.75, deeperColor);
            gradient.addColorStop(1, lighterColor);
            break;
            
        case 'step':
            // Sharp transition in the middle
            gradient.addColorStop(0, lighterColor);
            gradient.addColorStop(0.49, lighterColor);
            gradient.addColorStop(0.5, deeperColor);
            gradient.addColorStop(0.51, deeperColor);
            gradient.addColorStop(1, lighterColor);
            break;
            
        case 'sine':
            // Smooth sine wave-like curve
            gradient.addColorStop(0, lighterColor);
            gradient.addColorStop(0.2, deeperColor);
            gradient.addColorStop(0.5, lighterColor);
            gradient.addColorStop(0.8, deeperColor);
            gradient.addColorStop(1, lighterColor);
            break;
            
        case 'trapezoid':
            // Flat section in the middle with transitions on sides
            gradient.addColorStop(0, lighterColor);
            gradient.addColorStop(0.25, deeperColor);
            gradient.addColorStop(0.45, deeperColor);
            gradient.addColorStop(0.55, deeperColor);
            gradient.addColorStop(0.75, deeperColor);
            gradient.addColorStop(1, lighterColor);
            break;
            
        case 'double-peak':
            // Two peaks of intensity
            gradient.addColorStop(0, lighterColor);
            gradient.addColorStop(0.2, deeperColor);
            gradient.addColorStop(0.35, lighterColor);
            gradient.addColorStop(0.5, deeperColor);
            gradient.addColorStop(0.65, lighterColor);
            gradient.addColorStop(0.8, deeperColor);
            gradient.addColorStop(1, lighterColor);
            break;
            
        case 'triangle':
            // Simple triangle pattern
            gradient.addColorStop(0, lighterColor);
            gradient.addColorStop(0.5, deeperColor);
            gradient.addColorStop(1, lighterColor);
            break;
            
        case 'organic':
            // More natural, organic feel
            gradient.addColorStop(0, lighterColor);
            gradient.addColorStop(0.3, deeperColor);
            gradient.addColorStop(0.65, deeperColor);
            gradient.addColorStop(1, lighterColor);
            break;
            
        default:
            // Default to triangle
            gradient.addColorStop(0, lighterColor);
            gradient.addColorStop(0.5, deeperColor);
            gradient.addColorStop(1, lighterColor);
    }
}

/**
 * Create lighter and deeper color variations
 * @param {string} baseColor - Base color in hex format
 * @param {number} brightnessUp - Amount to brighten (0-255)
 * @param {number} brightnessDown - Amount to darken (0-255)
 * @returns {Object} Object with lighterColor and deeperColor
 */
export function createColorVariations(baseColor, brightnessUp, brightnessDown) {
    // Convert base color to RGB
    const rgb = hexToRgb(baseColor);
    
    // Create lighter color by adding brightness
    const lighterRgb = {
        r: Math.min(255, rgb.r + brightnessUp),
        g: Math.min(255, rgb.g + brightnessUp),
        b: Math.min(255, rgb.b + brightnessUp)
    };
    
    // Create deeper color by subtracting brightness
    const deeperRgb = {
        r: Math.max(0, rgb.r - brightnessDown),
        g: Math.max(0, rgb.g - brightnessDown),
        b: Math.max(0, rgb.b - brightnessDown)
    };
    
    // Convert back to hex
    const lighterColor = rgbToHex(lighterRgb);
    const deeperColor = rgbToHex(deeperRgb);
    
    return { lighterColor, deeperColor };
}

/**
 * Create a gradient with specified colors and pattern
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {number} x1 - Start X coordinate
 * @param {number} y1 - Start Y coordinate
 * @param {number} x2 - End X coordinate
 * @param {number} y2 - End Y coordinate
 * @param {string} startColor - Start color in hex format
 * @param {string} endColor - End color in hex format
 * @param {string} pattern - Gradient pattern type
 * @returns {CanvasGradient} The created gradient
 */
export function createLinearGradient(ctx, x1, y1, x2, y2, startColor, endColor, pattern = 'linear') {
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    
    // Apply color stops based on pattern
    switch (pattern) {
        case 'simple':
            gradient.addColorStop(0, startColor);
            gradient.addColorStop(1, endColor);
            break;
            
        case 'three-tone':
            // Create a middle color by mixing start and end
            const midColor = mixColors(startColor, endColor, 0.5);
            gradient.addColorStop(0, startColor);
            gradient.addColorStop(0.5, midColor);
            gradient.addColorStop(1, endColor);
            break;
            
        case 'rainbow':
            // Create a rainbow effect
            gradient.addColorStop(0, '#FF0000');   // Red
            gradient.addColorStop(0.17, '#FF7F00'); // Orange
            gradient.addColorStop(0.33, '#FFFF00'); // Yellow
            gradient.addColorStop(0.5, '#00FF00');  // Green
            gradient.addColorStop(0.67, '#0000FF'); // Blue
            gradient.addColorStop(0.83, '#4B0082'); // Indigo
            gradient.addColorStop(1, '#9400D3');   // Violet
            break;
            
        case 'fade-center':
            // Fade to transparent in the center
            gradient.addColorStop(0, startColor);
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
            gradient.addColorStop(1, endColor);
            break;
            
        default:
            // Default to simple
            gradient.addColorStop(0, startColor);
            gradient.addColorStop(1, endColor);
    }
    
    return gradient;
}

/**
 * Mix two colors based on a ratio
 * @param {string} color1 - First color in hex format
 * @param {string} color2 - Second color in hex format
 * @param {number} ratio - Mixing ratio from 0 to 1
 * @returns {string} Mixed color in hex format
 */
function mixColors(color1, color2, ratio) {
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