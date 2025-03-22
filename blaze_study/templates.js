// Template management functions

// Create the template controls UI
function createTemplateControls() {
    console.log("createTemplateControls function called");
    
    // Check if container exists, if not, create one
    let container = document.getElementById('templateControls');
    
    if (!container) {
        console.log("Creating template controls container");
        
        // Find the controls-panel div to add our new section
        const controlsPanel = document.querySelector('.controls-panel');
        const controlSections = document.querySelector('.control-sections');
        
        if (controlSections) {
            // Create a new control section for templates
            const templateSection = document.createElement('div');
            templateSection.className = 'control-section';
            templateSection.id = 'templateSection'; // Add an ID for easy reference
            
            // Add a title
            const sectionTitle = document.createElement('h2');
            sectionTitle.className = 'section-title';
            sectionTitle.textContent = 'Natural Phenomena Templates';
            templateSection.appendChild(sectionTitle);
            
            // Create the container that will hold our template controls
            container = document.createElement('div');
            container.id = 'templateControls';
            templateSection.appendChild(container);
            
            // Add description
            const description = document.createElement('div');
            description.className = 'info-box';
            description.innerHTML = '<p>These templates represent natural oscillation periods found in nature, from rapid hummingbird wings (0.1s) to slow tidal rhythms (3m).</p>';
            templateSection.appendChild(description);
            
            // Add the template section to the control sections as the first child (for more visibility)
            controlSections.insertBefore(templateSection, controlSections.firstChild);
            
            console.log("Template section added to control-sections");
        } else {
            console.error("Could not find .control-sections element");
            return;
        }
    }
    
    if (!container) {
        console.error("Could not create or find template controls container");
        return;
    }
    
    // Clear existing controls
    container.innerHTML = '';
    
    // Create template name input
    const nameGroup = document.createElement('div');
    nameGroup.className = 'control-group';
    
    const nameLabel = document.createElement('label');
    nameLabel.htmlFor = 'templateName';
    nameLabel.textContent = 'Template Name';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'templateName';
    nameInput.className = 'template-name-input';
    nameInput.placeholder = 'Enter a name for this template';
    
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    container.appendChild(nameGroup);
    
    // Create save button
    const saveButton = document.createElement('button');
    saveButton.id = 'saveTemplate';
    saveButton.className = 'template-button';
    saveButton.textContent = 'Save Template';
    saveButton.addEventListener('click', saveTemplate);
    container.appendChild(saveButton);
    
    // Create reload templates button
    const reloadButton = document.createElement('button');
    reloadButton.id = 'reloadTemplates';
    reloadButton.className = 'template-button';
    reloadButton.textContent = 'Reload Nature Templates';
    reloadButton.addEventListener('click', function() {
        window.forcePresetTemplates = true;
        initializePresetTemplates();
        window.forcePresetTemplates = false;
    });
    container.appendChild(reloadButton);
    
    // Create template selection dropdown
    const loadGroup = document.createElement('div');
    loadGroup.className = 'control-group template-load-group';
    
    const loadLabel = document.createElement('label');
    loadLabel.htmlFor = 'templateSelect';
    loadLabel.textContent = 'Load Template';
    
    const templateSelect = document.createElement('select');
    templateSelect.id = 'templateSelect';
    
    // Add empty option
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- Select Template --';
    templateSelect.appendChild(emptyOption);
    
    // Load templates from localStorage
    const templates = loadTemplateList();
    templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.name;
        option.textContent = template.name;
        templateSelect.appendChild(option);
    });
    
    loadGroup.appendChild(loadLabel);
    loadGroup.appendChild(templateSelect);
    container.appendChild(loadGroup);
    
    // Create load and delete buttons
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'template-button-group';
    
    const loadButton = document.createElement('button');
    loadButton.id = 'loadTemplate';
    loadButton.className = 'template-button';
    loadButton.textContent = 'Load';
    loadButton.addEventListener('click', loadSelectedTemplate);
    
    const deleteButton = document.createElement('button');
    deleteButton.id = 'deleteTemplate';
    deleteButton.className = 'template-button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', deleteSelectedTemplate);
    
    buttonGroup.appendChild(loadButton);
    buttonGroup.appendChild(deleteButton);
    container.appendChild(buttonGroup);
}

// Save current settings as a template
function saveTemplate() {
    const templateName = document.getElementById('templateName').value;
    if (!templateName) {
        alert('Please enter a template name');
        return;
    }
    
    // Get current settings
    const settings = getCurrentSettings();
    
    // Load existing templates
    const templates = loadTemplateList();
    
    // Check if template name already exists
    const existingIndex = templates.findIndex(t => t.name === templateName);
    if (existingIndex >= 0) {
        if (!confirm(`Template "${templateName}" already exists. Overwrite?`)) {
            return;
        }
        templates[existingIndex] = { name: templateName, settings };
    } else {
        templates.push({ name: templateName, settings });
    }
    
    // Save templates
    localStorage.setItem('blazeTemplates', JSON.stringify(templates));
    
    // Update template dropdown
    updateTemplateDropdown();
    
    // Clear template name input
    document.getElementById('templateName').value = '';
    
    alert(`Template "${templateName}" saved successfully`);
}

// Load a selected template
function loadSelectedTemplate() {
    const templateSelect = document.getElementById('templateSelect');
    const templateName = templateSelect.value;
    
    if (!templateName) {
        alert('Please select a template to load');
        return;
    }
    
    // Load templates
    const templates = loadTemplateList();
    
    // Find selected template
    const template = templates.find(t => t.name === templateName);
    if (!template) {
        alert(`Template "${templateName}" not found`);
        return;
    }
    
    // Apply template settings
    applySettings(template.settings);
    
    alert(`Template "${templateName}" loaded successfully`);
}

// Delete a selected template
function deleteSelectedTemplate() {
    const templateSelect = document.getElementById('templateSelect');
    const templateName = templateSelect.value;
    
    if (!templateName) {
        alert('Please select a template to delete');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete template "${templateName}"?`)) {
        return;
    }
    
    // Load templates
    const templates = loadTemplateList();
    
    // Remove selected template
    const updatedTemplates = templates.filter(t => t.name !== templateName);
    
    // Save updated templates
    localStorage.setItem('blazeTemplates', JSON.stringify(updatedTemplates));
    
    // Update template dropdown
    updateTemplateDropdown();
    
    alert(`Template "${templateName}" deleted successfully`);
}

// Load template list from localStorage
function loadTemplateList() {
    const templatesJson = localStorage.getItem('blazeTemplates');
    return templatesJson ? JSON.parse(templatesJson) : [];
}

// Update the template dropdown with current templates
function updateTemplateDropdown() {
    const templateSelect = document.getElementById('templateSelect');
    if (!templateSelect) return;
    
    // Save currently selected template
    const currentValue = templateSelect.value;
    
    // Clear existing options
    templateSelect.innerHTML = '';
    
    // Add empty option
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- Select Template --';
    templateSelect.appendChild(emptyOption);
    
    // Load templates from localStorage
    const templates = loadTemplateList();
    templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.name;
        option.textContent = template.name;
        templateSelect.appendChild(option);
    });
    
    // Restore selected template if it still exists
    if (currentValue && templates.some(t => t.name === currentValue)) {
        templateSelect.value = currentValue;
    }
}

// Initialize preset natural phenomena templates
function initializePresetTemplates() {
    console.log("Initializing preset natural phenomena templates...");
    
    // Use the global naturalTemplatesData variable that's already loaded from the script tag
    if (window.naturalTemplatesData && window.naturalTemplatesData.length > 0) {
        const naturalTemplates = window.naturalTemplatesData;
        console.log(`Using ${naturalTemplates.length} templates from global naturalTemplatesData`);
        
        // Get existing templates
        const existingTemplates = loadTemplateList();
        const existingNames = existingTemplates.map(t => t.name);
        
        // Filter out templates that already exist (by name)
        const newTemplates = naturalTemplates.filter(t => !existingNames.includes(t.name));
        
        if (newTemplates.length > 0 || window.forcePresetTemplates) {
            // If forcing, replace templates with matching names
            let combinedTemplates;
            
            if (window.forcePresetTemplates) {
                // Remove any templates that match names in naturalTemplates
                const naturalNames = naturalTemplates.map(t => t.name);
                const filteredExisting = existingTemplates.filter(t => !naturalNames.includes(t.name));
                combinedTemplates = [...filteredExisting, ...naturalTemplates];
                console.log(`Replaced/added ${naturalTemplates.length} preset templates (force mode)`);
            } else {
                // Just add new templates
                combinedTemplates = [...existingTemplates, ...newTemplates];
                console.log(`Added ${newTemplates.length} new preset templates`);
            }
            
            // Save to localStorage
            localStorage.setItem('blazeTemplates', JSON.stringify(combinedTemplates));
            
            // Update the template dropdown
            updateTemplateDropdown();
        } else {
            console.log("All natural templates already exist, nothing to add");
        }
    } else {
        console.error("No natural templates data found in global variable");
        
        // Fallback to a basic template if needed
        const existingTemplates = loadTemplateList();
        if (existingTemplates.length === 0 || window.forcePresetTemplates) {
            const fallbackTemplate = {
                name: "Basic Fallback Template",
                settings: {
                    ringCount: 8,
                    ringWidth: 100,
                    segmentCount: 8,
                    stripeCount: 5,
                    angleOffset: 0.02,
                    rotationSpeed: 0.5,
                    alternateRotation: true,
                    colorScheme: "rb",
                    gradientEnabled: true,
                    gradientIntensity: 100,
                    edgeBrightness: 30,
                    centerDarkness: 25,
                    gradientWidth: 2.0,
                    gradientCurve: "sine",
                    ringData: []
                }
            };
            
            // Add the fallback to localStorage
            const combinedTemplates = [...existingTemplates, fallbackTemplate];
            localStorage.setItem('blazeTemplates', JSON.stringify(combinedTemplates));
            
            console.log("Added fallback template due to missing naturalTemplatesData");
            
            // Update the template dropdown
            updateTemplateDropdown();
        }
    }
} 