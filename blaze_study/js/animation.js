/**
 * Animation management functionality for the Blaze application
 */

import { state } from './core.js';
import { drawBlaze } from './rendering.js';
import { drawBlazeWithGlow } from './webgl.js';

/**
 * Start the animation loop
 * @param {Object} controls - Control values
 */
export function startAnimation(controls) {
    if (state.isPaused) return;
    
    if (state.animationId) {
        cancelAnimationFrame(state.animationId);
        state.animationId = null;
    }
    
    const canvas = document.getElementById('blazeCanvas');
    const ctx = canvas.getContext('2d');
    
    if (controls.useWebGLRenderer) {
        // Use WebGL renderer with glow effect
        state.animationId = requestAnimationFrame((timestamp) => 
            drawBlazeWithGlow(timestamp, controls)
        );
    } else {
        // Use Canvas2D renderer
        state.animationId = requestAnimationFrame((timestamp) => 
            drawBlaze(timestamp, ctx, canvas, controls)
        );
    }
}

/**
 * Stop the animation loop
 */
export function stopAnimation() {
    if (state.animationId) {
        cancelAnimationFrame(state.animationId);
        state.animationId = null;
    }
    state.isPaused = true;
}

/**
 * Pause or resume the animation
 * @param {Object} controls - Control values
 * @returns {boolean} New pause state
 */
export function togglePause(controls) {
    state.isPaused = !state.isPaused;
    
    if (!state.isPaused) {
        startAnimation(controls);
    } else if (state.animationId) {
        cancelAnimationFrame(state.animationId);
        state.animationId = null;
    }
    
    return state.isPaused;
}

/**
 * Update the rotation and oscillation of all rings
 * @param {number} timestamp - Animation timestamp
 * @param {number} oscillationSpeed - Speed of oscillation
 * @param {number} rotationAngle - Base angle of rotation
 */
export function updateRotations(timestamp, oscillationSpeed, rotationAngle) {
    if (!state.ringRotations) return;
    
    for (let i = 0; i < state.ringRotations.length; i++) {
        // Calculate rotation based on time and oscillation
        const oscillation = Math.sin(
            (timestamp / 1000) * oscillationSpeed + 
            state.ringRotations[i].oscillationPhase
        ) * 0.3;
        
        // Update rotation with oscillation
        state.ringRotations[i].currentRotation = 
            state.ringRotations[i].rotation + 
            oscillation * rotationAngle;
    }
}

/**
 * Calculate new position for animated elements
 * @param {number} timestamp - Animation timestamp
 * @param {Object} controls - Control values
 */
export function calculateAnimationState(timestamp, controls) {
    // Update rotations
    updateRotations(
        timestamp, 
        controls.oscillationSpeed, 
        controls.rotationAngle
    );
    
    // Additional animation state calculations can be added here
    // For example, calculating color transitions, size changes, etc.
}

/**
 * Create a time-lapse sequence of the animation
 * @param {Object} controls - Control values
 * @param {number} frames - Number of frames to capture
 * @param {number} duration - Duration in seconds
 * @returns {Promise<Array>} Promise resolving to array of image data URLs
 */
export function createTimeLapse(controls, frames = 24, duration = 2) {
    return new Promise((resolve, reject) => {
        const images = [];
        let frameCount = 0;
        const timeIncrement = (duration * 1000) / frames;
        const canvas = document.getElementById('blazeCanvas');
        const ctx = canvas.getContext('2d');
        
        // Store current animation state
        const wasAnimating = !state.isPaused;
        if (wasAnimating) {
            stopAnimation();
        }
        
        function captureFrame(timestamp) {
            // Calculate animation state for this timestamp
            calculateAnimationState(timestamp, controls);
            
            // Draw the frame
            drawBlaze(timestamp, ctx, canvas, controls);
            
            // Capture the image
            images.push(canvas.toDataURL('image/png'));
            frameCount++;
            
            if (frameCount < frames) {
                // Capture next frame with incremented timestamp
                setTimeout(() => {
                    captureFrame(timestamp + timeIncrement);
                }, 0);
            } else {
                // Restore animation state
                if (wasAnimating) {
                    state.isPaused = false;
                    startAnimation(controls);
                }
                
                resolve(images);
            }
        }
        
        // Start capturing frames
        captureFrame(Date.now());
    });
}

/**
 * Calculate the easing function value based on the curve type
 * @param {number} progress - Progress from 0 to 1
 * @param {string} curveType - Type of easing curve
 * @returns {number} Eased value from 0 to 1
 */
export function calculateEasing(progress, curveType) {
    switch (curveType) {
        case 'linear':
            return progress;
            
        case 'ease-in':
            return progress * progress;
            
        case 'ease-out':
            return 1 - Math.pow(1 - progress, 2);
            
        case 'ease-in-out':
            return progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                
        case 'sine':
            return 0.5 - 0.5 * Math.cos(progress * Math.PI);
            
        case 'step':
            return progress < 0.5 ? 0 : 1;
            
        case 'trapezoid':
            if (progress < 0.25) {
                return progress * 4;
            } else if (progress < 0.45) {
                return 1;
            } else if (progress < 0.55) {
                return 1;
            } else if (progress < 0.75) {
                return 1 - (progress - 0.55) * 5;
            } else {
                return 0;
            }
            
        case 'triangle':
            return progress < 0.5
                ? progress * 2
                : 2 - progress * 2;
                
        case 'double-peak':
            if (progress < 0.25) {
                return progress * 4;
            } else if (progress < 0.5) {
                return 2 - progress * 4;
            } else if (progress < 0.75) {
                return (progress - 0.5) * 4;
            } else {
                return 2 - (progress - 0.5) * 4;
            }
            
        case 'organic':
            return (1 - Math.cos(progress * Math.PI * 2)) / 2;
            
        default:
            return progress;
    }
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