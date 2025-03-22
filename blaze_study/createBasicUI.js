// Create basic UI controls if they don't exist
function createBasicControls() {
    console.log("Checking for basic controls...");
    
    // Make sure there's a control section container
    let controlSections = document.querySelector('.control-sections');
    if (!controlSections) {
        console.log("Creating control sections container");
        const controlsPanel = document.querySelector('.controls-panel');
        if (controlsPanel) {
            controlSections = document.createElement('div');
            controlSections.className = 'control-sections';
            controlsPanel.appendChild(controlSections);
        } else {
            console.error("Cannot find controls panel to add sections");
            return;
        }
    }
    
    // Check for basic controls section
    let basicSection = document.getElementById('basicControlsSection');
    if (!basicSection) {
        console.log("Creating basic controls section");
        basicSection = document.createElement('div');
        basicSection.className = 'control-section';
        basicSection.id = 'basicControlsSection';
        
        // Add a title
        const sectionTitle = document.createElement('h2');
        sectionTitle.className = 'section-title';
        sectionTitle.textContent = 'Basic Controls';
        basicSection.appendChild(sectionTitle);
        
        // Add to control sections
        controlSections.appendChild(basicSection);
    }
    
    // Add ring count control if it doesn't exist
    if (!document.getElementById('ringCount')) {
        console.log("Creating ring count control");
        
        const controlGroup = document.createElement('div');
        controlGroup.className = 'control-group';
        
        const label = document.createElement('label');
        label.htmlFor = 'ringCount';
        label.textContent = 'Ring Count ';
        
        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'value-display';
        valueDisplay.id = 'ringCountValue';
        valueDisplay.textContent = '8';
        
        label.appendChild(valueDisplay);
        
        const input = document.createElement('input');
        input.type = 'range';
        input.id = 'ringCount';
        input.min = '1';
        input.max = '20';
        input.value = '8';
        
        input.addEventListener('input', () => {
            valueDisplay.textContent = input.value;
            if (typeof saveSettings === 'function') {
                saveSettings();
            }
            if (typeof createRingWidthControls === 'function') {
                createRingWidthControls();
            }
            if (typeof initRotations === 'function') {
                initRotations(parseInt(input.value));
            }
        });
        
        controlGroup.appendChild(label);
        controlGroup.appendChild(input);
        basicSection.appendChild(controlGroup);
    }
    
    // Add segment count control if it doesn't exist
    if (!document.getElementById('segmentCount')) {
        console.log("Creating segment count control");
        
        const controlGroup = document.createElement('div');
        controlGroup.className = 'control-group';
        
        const label = document.createElement('label');
        label.htmlFor = 'segmentCount';
        label.textContent = 'Segment Count ';
        
        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'value-display';
        valueDisplay.id = 'segmentCountValue';
        valueDisplay.textContent = '8';
        
        label.appendChild(valueDisplay);
        
        const input = document.createElement('input');
        input.type = 'range';
        input.id = 'segmentCount';
        input.min = '3';
        input.max = '36';
        input.value = '8';
        
        input.addEventListener('input', () => {
            valueDisplay.textContent = input.value;
            if (typeof saveSettings === 'function') {
                saveSettings();
            }
        });
        
        controlGroup.appendChild(label);
        controlGroup.appendChild(input);
        basicSection.appendChild(controlGroup);
    }
    
    // Add individual ring widths container if it doesn't exist
    if (!document.getElementById('individualRingWidths')) {
        console.log("Creating individual ring widths container");
        
        const ringSection = document.createElement('div');
        ringSection.className = 'control-section';
        ringSection.id = 'ringSection';
        
        const sectionTitle = document.createElement('h2');
        sectionTitle.className = 'section-title';
        sectionTitle.textContent = 'Individual Ring Controls';
        ringSection.appendChild(sectionTitle);
        
        const container = document.createElement('div');
        container.id = 'individualRingWidths';
        ringSection.appendChild(container);
        
        controlSections.appendChild(ringSection);
    }
    
    // Re-initialize controls after creating UI elements
    if (typeof initializeControls === 'function') {
        initializeControls();
    }
}

// Run when document is ready
document.addEventListener('DOMContentLoaded', createBasicControls); 