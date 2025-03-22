/**
 * Template management functionality for the Blaze application
 */

/**
 * Save a template to local storage
 * @param {string} name - Template name
 * @param {Object} templateData - Template control values
 * @returns {boolean} Success status
 */
export function saveTemplate(name, templateData) {
    try {
        // Get existing templates
        const templates = JSON.parse(localStorage.getItem('blazeTemplates') || '{}');
        
        // Add or update template
        templates[name] = templateData;
        
        // Save back to localStorage
        localStorage.setItem('blazeTemplates', JSON.stringify(templates));
        
        console.log(`Template "${name}" saved successfully`);
        return true;
    } catch (error) {
        console.error('Error saving template:', error);
        return false;
    }
}

/**
 * Load a template from local storage
 * @param {string} name - Template name
 * @returns {Object|null} Template data or null if not found
 */
export function loadTemplate(name) {
    try {
        // Get templates from localStorage
        const templates = JSON.parse(localStorage.getItem('blazeTemplates') || '{}');
        
        // Check if template exists
        if (templates[name]) {
            console.log(`Template "${name}" loaded successfully`);
            return templates[name];
        } else {
            console.warn(`Template "${name}" not found`);
            return null;
        }
    } catch (error) {
        console.error('Error loading template:', error);
        return null;
    }
}

/**
 * Delete a template from local storage
 * @param {string} name - Template name
 * @returns {boolean} Success status
 */
export function deleteTemplate(name) {
    try {
        // Get templates from localStorage
        const templates = JSON.parse(localStorage.getItem('blazeTemplates') || '{}');
        
        // Check if template exists
        if (templates[name]) {
            // Delete template
            delete templates[name];
            
            // Save back to localStorage
            localStorage.setItem('blazeTemplates', JSON.stringify(templates));
            
            console.log(`Template "${name}" deleted successfully`);
            return true;
        } else {
            console.warn(`Template "${name}" not found`);
            return false;
        }
    } catch (error) {
        console.error('Error deleting template:', error);
        return false;
    }
}

/**
 * Get all saved templates
 * @returns {Object} Object containing all templates
 */
export function getAllTemplates() {
    try {
        return JSON.parse(localStorage.getItem('blazeTemplates') || '{}');
    } catch (error) {
        console.error('Error getting templates:', error);
        return {};
    }
}

/**
 * Export templates to a JSON file
 * @returns {boolean} Success status
 */
export function exportTemplates() {
    try {
        const templates = JSON.parse(localStorage.getItem('blazeTemplates') || '{}');
        
        // Create a blob with the JSON data
        const blob = new Blob([JSON.stringify(templates, null, 2)], { type: 'application/json' });
        
        // Create download link
        const link = document.createElement('a');
        link.download = `blaze-templates-${new Date().toISOString().slice(0, 10)}.json`;
        link.href = URL.createObjectURL(blob);
        link.click();
        
        // Clean up
        URL.revokeObjectURL(link.href);
        
        console.log('Templates exported successfully');
        return true;
    } catch (error) {
        console.error('Error exporting templates:', error);
        return false;
    }
}

/**
 * Import templates from a JSON file
 * @param {File} file - JSON file to import
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export function importTemplates(file) {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const importedTemplates = JSON.parse(event.target.result);
                    
                    // Get existing templates
                    const existingTemplates = JSON.parse(localStorage.getItem('blazeTemplates') || '{}');
                    
                    // Merge templates
                    const mergedTemplates = { ...existingTemplates, ...importedTemplates };
                    
                    // Save back to localStorage
                    localStorage.setItem('blazeTemplates', JSON.stringify(mergedTemplates));
                    
                    console.log('Templates imported successfully');
                    resolve(true);
                } catch (parseError) {
                    console.error('Error parsing imported templates:', parseError);
                    resolve(false);
                }
            };
            
            reader.onerror = () => {
                console.error('Error reading file');
                resolve(false);
            };
            
            reader.readAsText(file);
        } catch (error) {
            console.error('Error importing templates:', error);
            resolve(false);
        }
    });
}

/**
 * Create a share URL with encoded template data
 * @param {string} name - Template name
 * @param {Object} templateData - Template control values
 * @returns {string|null} Share URL or null if failed
 */
export function createShareURL(name, templateData) {
    try {
        // Create a compressed version of the template with only necessary data
        const compressedData = {
            n: name, // name
            pc: templateData.primaryColor,
            sc: templateData.secondaryColor,
            b: templateData.banding,
            ct: templateData.curveType,
            pt: templateData.patternType,
            rs: templateData.ringSpacing,
            rc: templateData.ringCount,
            ra: templateData.rotationAngle,
            os: templateData.oscillationSpeed,
            bv: templateData.brightnessVariation,
            cs: templateData.colorScheme,
            db: templateData.isDarkBackground ? 1 : 0,
            sz: templateData.canvasSize,
            gl: templateData.useWebGLRenderer ? 1 : 0,
            gc: templateData.glowColor,
            gi: templateData.glowIntensity,
            gs: templateData.glowSize
        };
        
        // Encode as JSON and then base64
        const jsonData = JSON.stringify(compressedData);
        const base64Data = btoa(encodeURIComponent(jsonData));
        
        // Create URL with template data
        const url = new URL(window.location.href);
        url.searchParams.set('template', base64Data);
        
        return url.toString();
    } catch (error) {
        console.error('Error creating share URL:', error);
        return null;
    }
}

/**
 * Load template data from URL parameters
 * @returns {Object|null} Template data or null if not found
 */
export function loadTemplateFromURL() {
    try {
        const url = new URL(window.location.href);
        const templateParam = url.searchParams.get('template');
        
        if (!templateParam) {
            return null;
        }
        
        // Decode from base64 and parse JSON
        const jsonData = decodeURIComponent(atob(templateParam));
        const compressedData = JSON.parse(jsonData);
        
        // Convert compressed data back to full template format
        const templateData = {
            primaryColor: compressedData.pc,
            secondaryColor: compressedData.sc,
            banding: compressedData.b,
            curveType: compressedData.ct,
            patternType: compressedData.pt,
            ringSpacing: compressedData.rs,
            ringCount: compressedData.rc,
            rotationAngle: compressedData.ra,
            oscillationSpeed: compressedData.os,
            brightnessVariation: compressedData.bv,
            colorScheme: compressedData.cs,
            isDarkBackground: compressedData.db === 1,
            canvasSize: compressedData.sz,
            useWebGLRenderer: compressedData.gl === 1,
            glowColor: compressedData.gc,
            glowIntensity: compressedData.gi,
            glowSize: compressedData.gs
        };
        
        console.log(`Template "${compressedData.n}" loaded from URL`);
        return templateData;
    } catch (error) {
        console.error('Error loading template from URL:', error);
        return null;
    }
} 