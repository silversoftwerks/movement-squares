// Color scheme management functions

// Add new color schemes
function addNewColorSchemes() {
    // New color schemes to add
    const newColorSchemes = [
        {
            id: 'deep-ocean',
            primary: '#003366',    // Deep blue
            secondary: '#66CCFF'   // Light blue
        },
        {
            id: 'firefly',
            primary: '#111111',    // Almost black
            secondary: '#AAFF22'   // Yellow-green
        },
        {
            id: 'wolf-night',
            primary: '#1A1A2E',    // Dark blue-black
            secondary: '#E0E0E8'   // Silvery white with blue tint
        }
    ];
    
    // Store these schemes in global space for the color scheme selection
    window.customColorSchemes = newColorSchemes;
    
    console.log("Added new color schemes for natural phenomena templates");
}

// Get color scheme based on ID
function getColorScheme(schemeId) {
    // Default colors in case nothing matches
    let colors = {
        primary: '#FF0000',    // Red
        secondary: '#0000FF'   // Blue
    };
    
    // Built-in color schemes
    switch(schemeId) {
        case 'rb': // Red-Blue
            colors = { primary: '#FF0000', secondary: '#0000FF' };
            break;
        case 'bw': // Black-White
            colors = { primary: '#000000', secondary: '#FFFFFF' };
            break;
        case 'rg': // Red-Green
            colors = { primary: '#FF0000', secondary: '#00FF00' };
            break;
        case 'bg': // Blue-Green
            colors = { primary: '#0000FF', secondary: '#00FF00' };
            break;
        case 'yb': // Yellow-Blue
            colors = { primary: '#FFFF00', secondary: '#0000FF' };
            break;
        case 'rp': // Red-Purple
            colors = { primary: '#FF0000', secondary: '#800080' };
            break;
    }
    
    // Check for custom color schemes
    if (window.customColorSchemes) {
        const customScheme = window.customColorSchemes.find(scheme => scheme.id === schemeId);
        if (customScheme) {
            colors = { 
                primary: customScheme.primary, 
                secondary: customScheme.secondary 
            };
        }
    }
    
    return colors;
}

// Update the color scheme dropdown with new options
function updateColorSchemeOptions() {
    const colorSchemeControl = document.getElementById('colorScheme');
    if (!colorSchemeControl || !window.customColorSchemes) return;
    
    // Check if we already added the custom schemes
    const existingDeepOcean = Array.from(colorSchemeControl.options).find(option => option.value === 'deep-ocean');
    if (existingDeepOcean) return; // Already added
    
    // Add the new color schemes to the dropdown
    window.customColorSchemes.forEach(scheme => {
        const option = document.createElement('option');
        option.value = scheme.id;
        
        // Set display name based on the scheme ID
        switch(scheme.id) {
            case 'deep-ocean':
                option.textContent = 'Deep Ocean (Whale Song)';
                break;
            case 'firefly':
                option.textContent = 'Firefly Night';
                break;
            case 'wolf-night':
                option.textContent = 'Wolf Chorus';
                break;
            default:
                option.textContent = scheme.id;
        }
        
        colorSchemeControl.appendChild(option);
    });
} 