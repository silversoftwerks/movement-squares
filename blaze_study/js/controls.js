/**
 * UI control management for the Blaze application
 */

import { state, initRotations, getColorScheme } from './core.js';
import { drawBlaze, drawStaticBlaze } from './rendering.js';
import { setupWebGL, setupCanvas2D, drawBlazeWithGlow } from './webgl.js';
import { saveTemplate, loadTemplate, getAllTemplates, deleteTemplate, createShareURL } from './templates.js';
import { saveSettings, loadSettings, resetSettings } from './settings.js';
import { startAnimation, stopAnimation, togglePause } from './animation.js';

// Default control values
export const defaultControls = {
    // Colors
    primaryColor: '#FF0055',
    secondaryColor: '#55DDFF',
    colorScheme: 'custom',
    isDarkBackground: false,
    
    // Pattern
    banding: 5,
    curveType: 'trapezoid',
    patternType: 'spiral',
    brightnessVariation: 1.5,
    
    // Rings
    ringSpacing: 20,
    ringCount: 50,
    
    // Animation
    rotationAngle: 0.5, 
    oscillationSpeed: 2.0,
    
    // Display
    canvasSize: 800,
    
    // WebGL renderer
    useWebGLRenderer: false,
    glowColor: '#FFFFFF',
    glowIntensity: 25,
    glowSize: 3.0
};

// Active controls object
export const controls = { ...defaultControls };

/**
 * Initialize UI controls and event listeners
 */
export function initializeControls() {
    // Primary color picker
    const primaryColorPicker = document.getElementById('primaryColor');
    primaryColorPicker.value = controls.primaryColor;
    primaryColorPicker.addEventListener('input', () => {
        controls.primaryColor = primaryColorPicker.value;
        startAnimation();
    });

    // Secondary color picker
    const secondaryColorPicker = document.getElementById('secondaryColor');
    secondaryColorPicker.value = controls.secondaryColor;
    secondaryColorPicker.addEventListener('input', () => {
        controls.secondaryColor = secondaryColorPicker.value;
        startAnimation();
    });

    // Banding control
    const bandingSlider = document.getElementById('banding');
    const bandingValue = document.getElementById('bandingValue');
    bandingSlider.value = controls.banding;
    bandingValue.textContent = controls.banding;
    bandingSlider.addEventListener('input', () => {
        controls.banding = parseInt(bandingSlider.value);
        bandingValue.textContent = controls.banding;
        startAnimation();
    });

    // Curve type selector
    const curveTypeSelector = document.getElementById('curveType');
    curveTypeSelector.value = controls.curveType;
    curveTypeSelector.addEventListener('change', () => {
        controls.curveType = curveTypeSelector.value;
        startAnimation();
    });

    // Pattern type selector
    const patternTypeSelector = document.getElementById('patternType');
    patternTypeSelector.value = controls.patternType;
    patternTypeSelector.addEventListener('change', () => {
        controls.patternType = patternTypeSelector.value;
        startAnimation();
    });

    // Ring spacing control
    const ringSpacingSlider = document.getElementById('ringSpacing');
    const ringSpacingValue = document.getElementById('ringSpacingValue');
    ringSpacingSlider.value = controls.ringSpacing;
    ringSpacingValue.textContent = controls.ringSpacing;
    ringSpacingSlider.addEventListener('input', () => {
        controls.ringSpacing = parseInt(ringSpacingSlider.value);
        ringSpacingValue.textContent = controls.ringSpacing;
        startAnimation();
    });

    // Ring count control
    const ringCountSlider = document.getElementById('ringCount');
    const ringCountValue = document.getElementById('ringCountValue');
    ringCountSlider.value = controls.ringCount;
    ringCountValue.textContent = controls.ringCount;
    ringCountSlider.addEventListener('input', () => {
        controls.ringCount = parseInt(ringCountSlider.value);
        ringCountValue.textContent = controls.ringCount;
        
        // Reinitialize rotations when ring count changes
        state.ringRotations = initRotations(controls.ringCount);
        startAnimation();
    });

    // Rotation angle control
    const rotationAngleSlider = document.getElementById('rotationAngle');
    const rotationAngleValue = document.getElementById('rotationAngleValue');
    rotationAngleSlider.value = controls.rotationAngle;
    rotationAngleValue.textContent = controls.rotationAngle;
    rotationAngleSlider.addEventListener('input', () => {
        controls.rotationAngle = parseFloat(rotationAngleSlider.value);
        rotationAngleValue.textContent = controls.rotationAngle;
        startAnimation();
    });

    // Oscillation speed control
    const oscillationSpeedSlider = document.getElementById('oscillationSpeed');
    const oscillationSpeedValue = document.getElementById('oscillationSpeedValue');
    oscillationSpeedSlider.value = controls.oscillationSpeed;
    oscillationSpeedValue.textContent = controls.oscillationSpeed;
    oscillationSpeedSlider.addEventListener('input', () => {
        controls.oscillationSpeed = parseFloat(oscillationSpeedSlider.value);
        oscillationSpeedValue.textContent = controls.oscillationSpeed;
        startAnimation();
    });

    // Brightness variation control
    const brightnessSlider = document.getElementById('brightnessVariation');
    const brightnessValue = document.getElementById('brightnessValue');
    brightnessSlider.value = controls.brightnessVariation;
    brightnessValue.textContent = controls.brightnessVariation;
    brightnessSlider.addEventListener('input', () => {
        controls.brightnessVariation = parseFloat(brightnessSlider.value);
        brightnessValue.textContent = controls.brightnessVariation;
        startAnimation();
    });

    // Color scheme selector
    const colorSchemeSelector = document.getElementById('colorScheme');
    colorSchemeSelector.value = controls.colorScheme;
    colorSchemeSelector.addEventListener('change', () => {
        controls.colorScheme = colorSchemeSelector.value;
        startAnimation();
    });

    // Background toggle
    const backgroundToggle = document.getElementById('backgroundToggle');
    backgroundToggle.checked = controls.isDarkBackground;
    backgroundToggle.addEventListener('change', () => {
        controls.isDarkBackground = backgroundToggle.checked;
        document.body.classList.toggle('dark-background', controls.isDarkBackground);
        startAnimation();
    });

    // Canvas size selector
    const canvasSizeSelector = document.getElementById('canvasSize');
    canvasSizeSelector.value = controls.canvasSize;
    canvasSizeSelector.addEventListener('change', () => {
        controls.canvasSize = parseInt(canvasSizeSelector.value);
        resizeCanvas();
        startAnimation();
    });

    // WebGL renderer toggle
    const webglToggle = document.getElementById('webglToggle');
    webglToggle.checked = controls.useWebGLRenderer;
    webglToggle.addEventListener('change', () => {
        controls.useWebGLRenderer = webglToggle.checked;
        
        // Switch between WebGL and Canvas2D renderers
        if (controls.useWebGLRenderer) {
            if (setupWebGL()) {
                // Show WebGL controls
                document.getElementById('webglControls').style.display = 'block';
                // Update drawBlaze function reference to use WebGL
                controls.drawBlaze = drawBlaze;
                startAnimation();
            } else {
                // Fallback to Canvas2D if WebGL setup fails
                webglToggle.checked = false;
                controls.useWebGLRenderer = false;
                setupCanvas2D();
                document.getElementById('webglControls').style.display = 'none';
            }
        } else {
            setupCanvas2D();
            document.getElementById('webglControls').style.display = 'none';
            controls.drawBlaze = drawBlaze;
            startAnimation();
        }
    });

    // Glow color picker
    const glowColorPicker = document.getElementById('glowColor');
    glowColorPicker.value = controls.glowColor;
    glowColorPicker.addEventListener('input', () => {
        controls.glowColor = glowColorPicker.value;
        if (controls.useWebGLRenderer) startAnimation();
    });

    // Glow intensity control
    const glowIntensitySlider = document.getElementById('glowIntensity');
    const glowIntensityValue = document.getElementById('glowIntensityValue');
    glowIntensitySlider.value = controls.glowIntensity;
    glowIntensityValue.textContent = controls.glowIntensity;
    glowIntensitySlider.addEventListener('input', () => {
        controls.glowIntensity = parseInt(glowIntensitySlider.value);
        glowIntensityValue.textContent = controls.glowIntensity;
        if (controls.useWebGLRenderer) startAnimation();
    });

    // Glow size control
    const glowSizeSlider = document.getElementById('glowSize');
    const glowSizeValue = document.getElementById('glowSizeValue');
    glowSizeSlider.value = controls.glowSize;
    glowSizeValue.textContent = controls.glowSize;
    glowSizeSlider.addEventListener('input', () => {
        controls.glowSize = parseFloat(glowSizeSlider.value);
        glowSizeValue.textContent = controls.glowSize;
        if (controls.useWebGLRenderer) startAnimation();
    });

    // Save template button
    const saveTemplateButton = document.getElementById('saveTemplate');
    saveTemplateButton.addEventListener('click', () => {
        const templateName = prompt('Enter a name for this template:');
        if (templateName) {
            saveTemplate(templateName, { ...controls });
            updateTemplateList();
        }
    });

    // Load template button
    const loadTemplateButton = document.getElementById('loadTemplate');
    loadTemplateButton.addEventListener('click', () => {
        const templateSelector = document.getElementById('templateSelector');
        const selectedTemplate = templateSelector.value;
        if (selectedTemplate) {
            const templateData = loadTemplate(selectedTemplate);
            if (templateData) {
                applyControlValues(templateData);
                startAnimation();
            }
        }
    });

    // Delete template button
    const deleteTemplateButton = document.getElementById('deleteTemplate');
    deleteTemplateButton.addEventListener('click', () => {
        const templateSelector = document.getElementById('templateSelector');
        const selectedTemplate = templateSelector.value;
        if (selectedTemplate && confirm(`Delete template "${selectedTemplate}"?`)) {
            const templates = JSON.parse(localStorage.getItem('blazeTemplates') || '{}');
            delete templates[selectedTemplate];
            localStorage.setItem('blazeTemplates', JSON.stringify(templates));
            updateTemplateList();
        }
    });

    // Reset button
    const resetButton = document.getElementById('resetControls');
    resetButton.addEventListener('click', () => {
        if (confirm('Reset all controls to default values?')) {
            applyControlValues(defaultControls);
            startAnimation();
        }
    });

    // Play/Pause button
    const playPauseButton = document.getElementById('playPause');
    playPauseButton.addEventListener('click', () => {
        state.isPaused = !state.isPaused;
        playPauseButton.textContent = state.isPaused ? 'Play' : 'Pause';
        
        if (!state.isPaused) {
            startAnimation();
        } else if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
        }
    });

    // Screenshot button
    const screenshotButton = document.getElementById('screenshot');
    screenshotButton.addEventListener('click', takeScreenshot);

    // Initialize template list
    updateTemplateList();
    
    // Set initial drawBlaze function reference
    controls.drawBlaze = drawBlaze;
}

/**
 * Update the template selector with saved templates
 */
function updateTemplateList() {
    const templateSelector = document.getElementById('templateSelector');
    templateSelector.innerHTML = '';
    
    const templates = JSON.parse(localStorage.getItem('blazeTemplates') || '{}');
    
    for (const templateName in templates) {
        const option = document.createElement('option');
        option.value = templateName;
        option.textContent = templateName;
        templateSelector.appendChild(option);
    }
}

/**
 * Apply control values from a template or defaults
 * @param {Object} values - Control values to apply
 */
function applyControlValues(values) {
    // Update control values
    Object.assign(controls, values);
    
    // Update UI to reflect new values
    document.getElementById('primaryColor').value = controls.primaryColor;
    document.getElementById('secondaryColor').value = controls.secondaryColor;
    
    document.getElementById('banding').value = controls.banding;
    document.getElementById('bandingValue').textContent = controls.banding;
    
    document.getElementById('curveType').value = controls.curveType;
    document.getElementById('patternType').value = controls.patternType;
    
    document.getElementById('ringSpacing').value = controls.ringSpacing;
    document.getElementById('ringSpacingValue').textContent = controls.ringSpacing;
    
    document.getElementById('ringCount').value = controls.ringCount;
    document.getElementById('ringCountValue').textContent = controls.ringCount;
    
    document.getElementById('rotationAngle').value = controls.rotationAngle;
    document.getElementById('rotationAngleValue').textContent = controls.rotationAngle;
    
    document.getElementById('oscillationSpeed').value = controls.oscillationSpeed;
    document.getElementById('oscillationSpeedValue').textContent = controls.oscillationSpeed;
    
    document.getElementById('brightnessVariation').value = controls.brightnessVariation;
    document.getElementById('brightnessValue').textContent = controls.brightnessVariation;
    
    document.getElementById('colorScheme').value = controls.colorScheme;
    
    document.getElementById('backgroundToggle').checked = controls.isDarkBackground;
    document.body.classList.toggle('dark-background', controls.isDarkBackground);
    
    document.getElementById('canvasSize').value = controls.canvasSize;
    
    document.getElementById('webglToggle').checked = controls.useWebGLRenderer;
    document.getElementById('webglControls').style.display = controls.useWebGLRenderer ? 'block' : 'none';
    
    document.getElementById('glowColor').value = controls.glowColor;
    
    document.getElementById('glowIntensity').value = controls.glowIntensity;
    document.getElementById('glowIntensityValue').textContent = controls.glowIntensity;
    
    document.getElementById('glowSize').value = controls.glowSize;
    document.getElementById('glowSizeValue').textContent = controls.glowSize;
    
    // Reset canvas size if needed
    resizeCanvas();
    
    // Reset renderer if needed
    if (controls.useWebGLRenderer) {
        setupWebGL();
    } else {
        setupCanvas2D();
    }
    
    // Reinitialize rotations
    state.ringRotations = initRotations(controls.ringCount);
}

/**
 * Start the animation loop
 */
function startAnimation() {
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
 * Resize the canvas based on the selected size
 */
function resizeCanvas() {
    const canvas = document.getElementById('blazeCanvas');
    const size = controls.canvasSize;
    
    canvas.width = size;
    canvas.height = size;
    
    // Also resize WebGL canvas if it exists
    const glCanvas = document.getElementById('blazeGLCanvas');
    if (glCanvas) {
        glCanvas.width = size;
        glCanvas.height = size;
    }
}

/**
 * Take a screenshot of the current pattern
 */
function takeScreenshot() {
    let canvas;
    
    if (controls.useWebGLRenderer) {
        canvas = document.getElementById('blazeGLCanvas');
    } else {
        canvas = document.getElementById('blazeCanvas');
    }
    
    // Create download link
    const link = document.createElement('a');
    link.download = `blaze-pattern-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

/**
 * Initialize ring rotations
 * @param {number} ringCount - Number of rings
 * @returns {Array} Array of rotation and oscillation data
 */
function initRotations(ringCount) {
    const rotations = [];
    for (let i = 0; i < ringCount; i++) {
        rotations.push({
            rotation: Math.random() * Math.PI * 2,
            oscillationPhase: Math.random() * Math.PI * 2
        });
    }
    return rotations;
}

// Export reference to the default controls
export { defaultControls }; 