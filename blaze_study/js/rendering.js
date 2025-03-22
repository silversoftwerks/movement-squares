/**
 * Rendering functions for the Blaze application
 */

import { state, mixColors } from './core.js';
import { calculateEasing, updateRotations } from './animation.js';
import { applyGradientStops, createColorVariations } from './gradients.js';

/**
 * Draw a striped ring segment with gradient
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {number} cx - Center X coordinate
 * @param {number} cy - Center Y coordinate
 * @param {number} innerRadius - Inner radius of the ring
 * @param {number} outerRadius - Outer radius of the ring
 * @param {number} startAngle - Start angle in radians
 * @param {number} endAngle - End angle in radians
 * @param {string} stripeColor - Stripe base color
 * @param {number} stripeCount - Number of stripes
 * @param {string} curveType - Type of gradient curve
 * @param {number} brightnessVariation - Brightness adjustment for gradient
 */
function drawStripedRingSegment(
    ctx, cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    stripeColor, stripeCount, curveType, brightnessVariation
) {
    // Calculate the angle covered by each stripe
    const stripeAngle = (endAngle - startAngle) / stripeCount;
    
    // Create color variations for the gradient
    const { lighterColor, deeperColor } = createColorVariations(
        stripeColor, 
        brightnessVariation,
        brightnessVariation * 1.5
    );
    
    // Draw each stripe
    for (let i = 0; i < stripeCount; i++) {
        // Calculate start and end angles for this stripe
        const stripeStartAngle = startAngle + i * stripeAngle;
        const stripeEndAngle = stripeStartAngle + stripeAngle;
        
        // Create a gradient
        const gradient = ctx.createRadialGradient(
            cx, cy, innerRadius,
            cx, cy, outerRadius
        );
        
        // Apply gradient stops based on curve type
        applyGradientStops(gradient, curveType, lighterColor, deeperColor);
        
        // Set the fill style to the gradient
        ctx.fillStyle = gradient;
        
        // Begin a path for the stripe
        ctx.beginPath();
        
        // Draw the stripe (an arc segment)
        ctx.arc(cx, cy, innerRadius, stripeStartAngle, stripeEndAngle);
        ctx.arc(cx, cy, outerRadius, stripeEndAngle, stripeStartAngle, true);
        ctx.closePath();
        
        // Fill the stripe
        ctx.fill();
    }
}

/**
 * Draw the complete Blaze pattern
 * @param {number} timestamp - Animation timestamp
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} controls - Control values
 */
export function drawBlaze(timestamp, ctx, canvas, controls) {
    // Update ring rotations based on time and oscillation
    updateRotations(
        timestamp, 
        controls.oscillationSpeed, 
        controls.rotationAngle
    );
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Make the canvas dimensions larger than the viewport if not custom canvas
    if (!canvas || canvas.id === 'blazeCanvas') {
        canvas.width = window.innerWidth * 1.5;
        canvas.height = window.innerHeight * 1.5;
    }
    
    // Set white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Center point to the middle of the viewport
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    
    // Set maxRadius to extend beyond the screen
    const maxRadius = Math.max(window.innerWidth, window.innerHeight) * 1.2;
    
    // Set up drawing parameters
    const ringSpacing = controls.ringSpacing;
    const ringCount = controls.ringCount;
    const banding = controls.banding;
    const curveType = controls.curveType;
    const patternType = controls.patternType;
    const brightnessVariation = controls.brightnessVariation;
    
    // Get color scheme
    let primaryColorValue = controls.primaryColor;
    let secondaryColorValue = controls.secondaryColor;
    
    // Draw each ring
    for (let ringIndex = 0; ringIndex < ringCount; ringIndex++) {
        // Calculate ring dimensions - outermost ring first, moving inward
        const ringPosition = ringIndex / ringCount;
        const outerRadius = maxRadius * (1 - ringPosition);
        const innerRadius = outerRadius - ringSpacing;
        
        if (innerRadius <= 0) continue; // Skip if inner radius is too small
        
        // Calculate rotation for this ring
        let rotation = 0;
        
        if (state.ringRotations && state.ringRotations[ringIndex]) {
            rotation = state.ringRotations[ringIndex].currentRotation;
        }
        
        // Determine stripe color based on pattern type
        let stripeColor;
        
        switch (patternType) {
            case 'alternating':
                stripeColor = ringIndex % 2 === 0 ? primaryColorValue : secondaryColorValue;
                break;
                
            case 'gradient':
                const ratio = ringPosition;
                stripeColor = mixColors(primaryColorValue, secondaryColorValue, ratio);
                break;
                
            case 'spiral':
            default:
                // Make color subtly change based on rotation
                const colorRatio = (Math.sin(rotation * 2) + 1) / 2;
                stripeColor = mixColors(primaryColorValue, secondaryColorValue, colorRatio);
                break;
        }
        
        // Draw a complete ring with stripes
        drawStripedRingSegment(
            ctx, cx, cy, innerRadius, outerRadius,
            0 + rotation, Math.PI * 2 + rotation,
            stripeColor, banding, curveType, brightnessVariation
        );
    }
    
    // Continue animation
    if (!state.isPaused) {
        state.animationId = requestAnimationFrame((time) => 
            drawBlaze(time, ctx, canvas, controls)
        );
    }
}

/**
 * Draw a single frame of the Blaze pattern (without animation)
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} controls - Control values
 */
export function drawStaticBlaze(ctx, canvas, controls) {
    // Calculate dimensions
    const canvasSize = controls.canvasSize;
    const cx = canvasSize / 2; // Center X
    const cy = canvasSize / 2; // Center Y
    const maxRadius = Math.min(cx, cy) * 0.9; // Maximum radius
    
    // Set up drawing parameters
    const ringSpacing = controls.ringSpacing;
    const ringCount = controls.ringCount;
    const banding = controls.banding;
    const curveType = controls.curveType;
    const patternType = controls.patternType;
    const brightnessVariation = controls.brightnessVariation;
    
    // Get color scheme
    let primaryColorValue = controls.primaryColor;
    let secondaryColorValue = controls.secondaryColor;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw each ring
    for (let ringIndex = 0; ringIndex < ringCount; ringIndex++) {
        // Calculate ring dimensions
        const ringPosition = ringIndex / ringCount;
        const outerRadius = maxRadius * (1 - ringPosition);
        const innerRadius = outerRadius - ringSpacing;
        
        if (innerRadius <= 0) continue; // Skip if inner radius is too small
        
        // Determine stripe color based on pattern type
        let stripeColor;
        
        switch (patternType) {
            case 'alternating':
                stripeColor = ringIndex % 2 === 0 ? primaryColorValue : secondaryColorValue;
                break;
                
            case 'gradient':
                const ratio = ringPosition;
                stripeColor = mixColors(primaryColorValue, secondaryColorValue, ratio);
                break;
                
            case 'spiral':
            default:
                // Use a fixed position for static rendering
                const colorRatio = (ringIndex % 10) / 10;
                stripeColor = mixColors(primaryColorValue, secondaryColorValue, colorRatio);
                break;
        }
        
        // Draw a complete ring with stripes
        drawStripedRingSegment(
            ctx, cx, cy, innerRadius, outerRadius,
            0, Math.PI * 2,
            stripeColor, banding, curveType, brightnessVariation
        );
    }
}

/**
 * Create a thumbnail of the Blaze pattern
 * @param {Object} controls - Control values
 * @param {number} size - Size of the thumbnail
 * @returns {string} Data URL of the thumbnail
 */
export function createThumbnail(controls, size = 200) {
    // Create a temporary canvas
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Create a copy of the controls with reduced complexity
    const thumbnailControls = { 
        ...controls,
        ringCount: Math.min(20, controls.ringCount),
        canvasSize: size
    };
    
    // Draw the pattern
    drawStaticBlaze(ctx, canvas, thumbnailControls);
    
    // Return the data URL
    return canvas.toDataURL('image/png');
} 