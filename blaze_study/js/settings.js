/**
 * Settings management functionality for the Blaze application
 */

import { defaultControls } from './controls.js';

// Settings storage key
const SETTINGS_KEY = 'blazeAppSettings';

/**
 * Save current settings to localStorage
 * @param {Object} settings - Current control settings
 * @returns {boolean} Success status
 */
export function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        console.log('Settings saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
}

/**
 * Load settings from localStorage
 * @returns {Object} Saved settings or default settings if none exist
 */
export function loadSettings() {
    try {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        
        if (savedSettings) {
            console.log('Settings loaded successfully');
            return JSON.parse(savedSettings);
        } else {
            console.log('No saved settings found, using defaults');
            return { ...defaultControls };
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        return { ...defaultControls };
    }
}

/**
 * Reset settings to defaults
 * @returns {Object} Default settings
 */
export function resetSettings() {
    try {
        localStorage.removeItem(SETTINGS_KEY);
        console.log('Settings reset to defaults');
        return { ...defaultControls };
    } catch (error) {
        console.error('Error resetting settings:', error);
        return { ...defaultControls };
    }
}

/**
 * Save specific setting
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 * @returns {boolean} Success status
 */
export function saveSetting(key, value) {
    try {
        const currentSettings = loadSettings();
        currentSettings[key] = value;
        return saveSettings(currentSettings);
    } catch (error) {
        console.error(`Error saving setting "${key}":`, error);
        return false;
    }
}

/**
 * Get specific setting value
 * @param {string} key - Setting key
 * @param {any} defaultValue - Default value if setting not found
 * @returns {any} Setting value or default value
 */
export function getSetting(key, defaultValue) {
    try {
        const currentSettings = loadSettings();
        return key in currentSettings ? currentSettings[key] : defaultValue;
    } catch (error) {
        console.error(`Error getting setting "${key}":`, error);
        return defaultValue;
    }
}

/**
 * Check if user has any saved settings
 * @returns {boolean} Whether user has saved settings
 */
export function hasSettings() {
    return localStorage.getItem(SETTINGS_KEY) !== null;
}

/**
 * Export settings to a JSON file
 * @returns {boolean} Success status
 */
export function exportSettings() {
    try {
        const settings = loadSettings();
        
        // Create a blob with the JSON data
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        
        // Create download link
        const link = document.createElement('a');
        link.download = `blaze-settings-${new Date().toISOString().slice(0, 10)}.json`;
        link.href = URL.createObjectURL(blob);
        link.click();
        
        // Clean up
        URL.revokeObjectURL(link.href);
        
        console.log('Settings exported successfully');
        return true;
    } catch (error) {
        console.error('Error exporting settings:', error);
        return false;
    }
}

/**
 * Import settings from a JSON file
 * @param {File} file - JSON file to import
 * @returns {Promise<Object>} Promise resolving to imported settings
 */
export function importSettings(file) {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const importedSettings = JSON.parse(event.target.result);
                    
                    // Save the imported settings
                    saveSettings(importedSettings);
                    
                    console.log('Settings imported successfully');
                    resolve(importedSettings);
                } catch (parseError) {
                    console.error('Error parsing imported settings:', parseError);
                    resolve({ ...defaultControls });
                }
            };
            
            reader.onerror = () => {
                console.error('Error reading file');
                resolve({ ...defaultControls });
            };
            
            reader.readAsText(file);
        } catch (error) {
            console.error('Error importing settings:', error);
            resolve({ ...defaultControls });
        }
    });
}

/**
 * Auto-save settings
 * Set up an interval to automatically save the current settings
 * @param {Object} controls - Reference to the controls object
 * @param {number} interval - Save interval in milliseconds
 * @returns {number} Interval ID
 */
export function setupAutoSave(controls, interval = 30000) {
    return setInterval(() => {
        saveSettings({ ...controls });
    }, interval);
}

/**
 * Clear auto-save interval
 * @param {number} intervalId - Interval ID returned by setupAutoSave
 */
export function clearAutoSave(intervalId) {
    clearInterval(intervalId);
} 