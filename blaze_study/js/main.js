/**
 * Main entry point for the Blaze application
 */

import { state, initRotations } from './core.js';
import { controls, initializeControls } from './controls.js';
import { startAnimation } from './animation.js';
import { loadSettings, saveSettings, setupAutoSave } from './settings.js';
import { loadTemplateFromURL } from './templates.js';

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('Initializing Blaze Application');
    
    // Set up canvas
    const canvas = document.getElementById('blazeCanvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    
    // Create canvas if it doesn't exist
    if (!canvas) {
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'blazeCanvas';
        newCanvas.width = 800;
        newCanvas.height = 800;
        newCanvas.style.position = 'fixed';
        newCanvas.style.top = '-50vw';
        newCanvas.style.left = '-50vw';
        newCanvas.style.width = '200vw';
        newCanvas.style.height = '200vh';
        document.body.appendChild(newCanvas);
    }
    
    // Load settings
    const savedSettings = loadSettings();
    Object.assign(controls, savedSettings);
    
    // Check for URL template parameters
    const urlTemplate = loadTemplateFromURL();
    if (urlTemplate) {
        Object.assign(controls, urlTemplate);
    }
    
    // Initialize ring rotations
    state.ringRotations = initRotations(controls.ringCount);
    
    // Set up UI controls
    initializeControls();
    
    // Set up dark background if needed
    document.body.classList.toggle('dark-background', controls.isDarkBackground);
    
    // Set up auto-save
    const autoSaveInterval = setupAutoSave(controls);
    
    // Start animation
    startAnimation(controls);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        // Adjust canvas positioning if needed
        // This maintains the centered, fullscreen effect
    });
    
    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Pause animation when tab is not visible
            if (!state.isPaused) {
                state.wasPaused = false;
                if (state.animationId) {
                    cancelAnimationFrame(state.animationId);
                    state.animationId = null;
                }
            } else {
                state.wasPaused = true;
            }
        } else {
            // Resume animation when tab becomes visible again
            if (!state.wasPaused && !state.isPaused) {
                startAnimation(controls);
            }
        }
    });
    
    // Save settings when page is unloaded
    window.addEventListener('beforeunload', () => {
        saveSettings({ ...controls });
    });
    
    console.log('Blaze Application initialized');
}

// Start the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Export functions for global access
window.Blaze = {
    startAnimation: () => startAnimation(controls),
    togglePause: () => {
        state.isPaused = !state.isPaused;
        const playPauseButton = document.getElementById('playPause');
        if (playPauseButton) {
            playPauseButton.textContent = state.isPaused ? 'Play' : 'Pause';
        }
        
        if (!state.isPaused) {
            startAnimation(controls);
        } else if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
        }
        
        return state.isPaused;
    },
    takeScreenshot: () => {
        let canvas;
        
        if (controls.useWebGLRenderer) {
            canvas = document.getElementById('blazeGLCanvas');
        } else {
            canvas = document.getElementById('blazeCanvas');
        }
        
        const link = document.createElement('a');
        link.download = `blaze-pattern-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
}; 