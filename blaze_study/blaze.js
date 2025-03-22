// blaze.js - Main application entry point and initialization

// Initialize - the main entry point
function initialize() {
    // First ensure all controls are initialized
    if (typeof initializeControls === 'function') {
        initializeControls();
    }
    
    // Add new color schemes
    addNewColorSchemes();
    
    // First load all global settings
    loadSettings();
    
    // Then create the ring controls based on the loaded ring count
    createRingWidthControls();
    
    // Create template controls
    createTemplateControls();
    
    // Add preset natural phenomena templates
    initializePresetTemplates();
    
    // Initialize rotations based on the ring count
    initRotations(parseInt(ringCountControl.value));
    
    // Update the color scheme dropdown to include the new options
    updateColorSchemeOptions();
    
    // Set up the canvas
    setupCanvas();
    
    // Start animation
    startAnimation();
}

// Call initialize when document is ready
document.addEventListener('DOMContentLoaded', initialize); 