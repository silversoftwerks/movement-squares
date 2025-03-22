// Utility functions for getting and manipulating settings

// Get current settings from all controls
function getCurrentSettings() {
    // Call the existing saveSettings function to get all current settings
    // but don't save to localStorage, just return the settings object
    const settings = {
        ringCount: parseInt(ringCountControl.value),
        segmentCount: parseInt(segmentCountControl.value),
        stripeCount: parseInt(stripeCountControl.value),
        angleOffset: parseFloat(angleOffsetControl.value),
        rotationSpeed: parseFloat(rotationSpeedControl.value),
        alternateRotation: alternateRotationControl.checked,
        colorScheme: colorSchemeControl.value,
        stripAngle: parseFloat(stripAngleControl.value),
        alternateStripAngles: alternateStripAnglesControl.checked,
        ringWidth: parseInt(ringWidthControl.value),
        gradientEnabled: gradientEnabledControl.checked,
        gradientIntensity: parseInt(gradientIntensityControl.value),
        edgeBrightness: parseInt(edgeBrightnessControl.value),
        centerDarkness: parseInt(centerDarknessControl.value),
        gradientWidth: parseFloat(gradientWidthControl.value),
        gradientCurve: gradientCurveControl.value,
        primaryColor: primaryColorControl.value,
        secondaryColor: secondaryColorControl.value,
        glowEnabled: glowEnabledControl.checked,
        glowIntensity: glowIntensityControl.value,
        glowSize: glowSizeControl.value,
        glowColor: glowColorControl.value,
        
        // Individual ring settings
        ringSettings: []
    };
    
    // Collect all settings for each ring in one coherent structure
    const ringCount = parseInt(ringCountControl.value);
    for (let i = 1; i <= ringCount; i++) {
        const ringData = {
            width: 100, // Default values
            solidColor: false,
            colorChoice: 'primary',
            oscillate: false,
            period: 5,
            customStripeAngle: false,
            stripeAngle: 0,
            widthOscillate: false,
            widthPeriod: 5,
            widthAmplitude: 50
        };
        
        // Get width
        const widthControl = document.getElementById(`ring${i}Width`);
        if (widthControl) {
            ringData.width = parseInt(widthControl.value);
        }
        
        // Get solid color settings
        const colorToggle = document.getElementById(`ring${i}SolidColor`);
        if (colorToggle) {
            ringData.solidColor = colorToggle.checked;
        }
        
        const colorChoice = document.getElementById(`ring${i}ColorChoice`);
        if (colorChoice) {
            ringData.colorChoice = colorChoice.value;
        }
        
        // Get oscillation settings
        const oscillationToggle = document.getElementById(`ring${i}Oscillate`);
        if (oscillationToggle) {
            ringData.oscillate = oscillationToggle.checked;
        }
        
        const periodInput = document.getElementById(`ring${i}Period`);
        if (periodInput) {
            ringData.period = parseFloat(periodInput.value);
        }
        
        // Get stripe angle settings
        const stripeAngleToggle = document.getElementById(`ring${i}CustomStripeAngle`);
        if (stripeAngleToggle) {
            ringData.customStripeAngle = stripeAngleToggle.checked;
        }
        
        const stripeAngleInput = document.getElementById(`ring${i}StripeAngle`);
        if (stripeAngleInput) {
            ringData.stripeAngle = parseFloat(stripeAngleInput.value);
        }
        
        // Get width oscillation settings
        const widthOscillationToggle = document.getElementById(`ring${i}WidthOscillate`);
        if (widthOscillationToggle) {
            ringData.widthOscillate = widthOscillationToggle.checked;
        }
        
        const widthPeriodInput = document.getElementById(`ring${i}WidthPeriod`);
        if (widthPeriodInput) {
            ringData.widthPeriod = parseFloat(widthPeriodInput.value);
        }
        
        const widthAmplitudeInput = document.getElementById(`ring${i}WidthAmplitude`);
        if (widthAmplitudeInput) {
            ringData.widthAmplitude = parseInt(widthAmplitudeInput.value);
        }
        
        // Add this ring's settings to the array
        settings.ringSettings.push(ringData);
    }
    
    return settings;
} 