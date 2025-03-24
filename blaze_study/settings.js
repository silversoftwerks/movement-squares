    // Persist settings using localStorage
    const SETTINGS_KEY = 'bridgetRileyBlazeSettings';
    
    // Function to save settings
    function saveSettings() {
        // Create a comprehensive settings object
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
        
        // Save to localStorage with extra debugging
        try {
            const settingsJson = JSON.stringify(settings);
            localStorage.setItem(SETTINGS_KEY, settingsJson);
            console.log("Settings saved successfully:", settings);
        } catch (e) {
            console.error("Error saving settings:", e);
        }
    }
    
    // Completely revamped loadSettings function
    function loadSettings() {
        console.log("Loading settings...");
        const settingsJson = localStorage.getItem(SETTINGS_KEY);
        
        if (settingsJson) {
            try {
                const settings = JSON.parse(settingsJson);
                console.log("Loaded settings:", settings);
                
                // First load all the global controls
                // This ensures the ring count is set before we create ring controls
                if (settings.ringCount) ringCountControl.value = settings.ringCount;
                if (settings.segmentCount) segmentCountControl.value = settings.segmentCount;
                if (settings.stripeCount) stripeCountControl.value = settings.stripeCount;
                if (settings.angleOffset) angleOffsetControl.value = settings.angleOffset;
                if (settings.rotationSpeed) rotationSpeedControl.value = settings.rotationSpeed;
                if (settings.alternateRotation !== undefined) alternateRotationControl.checked = settings.alternateRotation;
                if (settings.colorScheme) colorSchemeControl.value = settings.colorScheme;
                if (settings.stripAngle) stripAngleControl.value = settings.stripAngle;
                if (settings.alternateStripAngles !== undefined) alternateStripAnglesControl.checked = settings.alternateStripAngles;
                if (settings.ringWidth) ringWidthControl.value = settings.ringWidth;
                if (settings.gradientEnabled !== undefined) gradientEnabledControl.checked = settings.gradientEnabled;
                if (settings.gradientIntensity) gradientIntensityControl.value = settings.gradientIntensity;
                if (settings.edgeBrightness) edgeBrightnessControl.value = settings.edgeBrightness;
                if (settings.centerDarkness) centerDarknessControl.value = settings.centerDarkness;
                if (settings.gradientWidth) gradientWidthControl.value = settings.gradientWidth;
                if (settings.gradientCurve) gradientCurveControl.value = settings.gradientCurve;
                if (settings.primaryColor) primaryColorControl.value = settings.primaryColor;
                if (settings.secondaryColor) secondaryColorControl.value = settings.secondaryColor;
                if (settings.glowEnabled !== undefined) glowEnabledControl.checked = settings.glowEnabled;
                if (settings.glowIntensity) glowIntensityControl.value = settings.glowIntensity;
                if (settings.glowSize) glowSizeControl.value = settings.glowSize;
                if (settings.glowColor) glowColorControl.value = settings.glowColor;
                
                // Update value displays
                updateValueDisplays();
                
                // Store the ring settings for later application after controls are created
                window.storedRingSettings = settings.ringSettings;
                
                return true;
            } catch (e) {
                console.error("Error parsing settings:", e);
                return false;
            }
        } else {
            console.log("No saved settings found");
            return false;
        }
    }
    
    // New function to apply ring settings after controls are created
    function applyRingSettings() {
        console.log("Applying ring settings...");
        if (!window.storedRingSettings) {
            console.log("No stored ring settings found");
            return;
        }
        
        const ringCount = parseInt(ringCountControl.value);
        console.log(`Ring count: ${ringCount}, Stored settings length: ${window.storedRingSettings.length}`);
        
        // Apply settings to each ring
        for (let i = 1; i <= ringCount; i++) {
            if (i-1 >= window.storedRingSettings.length) {
                console.log(`No settings for ring ${i}`);
                continue;
            }
            
            const ringData = window.storedRingSettings[i-1];
            console.log(`Applying settings for ring ${i}:`, ringData);
            
            // Apply width
            const widthControl = document.getElementById(`ring${i}Width`);
            const widthValue = document.getElementById(`ring${i}WidthValue`);
            if (widthControl && ringData.width) {
                widthControl.value = ringData.width;
                if (widthValue) widthValue.textContent = `${ringData.width}%`;
            }
            
            // Apply solid color settings
            const colorToggle = document.getElementById(`ring${i}SolidColor`);
            const colorChoice = document.getElementById(`ring${i}ColorChoice`);
            if (colorToggle && ringData.solidColor !== undefined) {
                colorToggle.checked = ringData.solidColor;
                if (colorChoice) {
                    colorChoice.value = ringData.colorChoice || 'primary';
                    colorChoice.disabled = !ringData.solidColor;
                }
            }
            
            // Apply oscillation settings
            const oscillationToggle = document.getElementById(`ring${i}Oscillate`);
            const periodInput = document.getElementById(`ring${i}Period`);
            const periodValue = document.getElementById(`ring${i}PeriodValue`);
            
            if (oscillationToggle && ringData.oscillate !== undefined) {
                oscillationToggle.checked = ringData.oscillate;
                if (periodInput) {
                    periodInput.value = ringData.period || 5;
                    periodInput.disabled = !ringData.oscillate;
                    if (periodValue) periodValue.textContent = `${periodInput.value}s`;
                }
            }
            
            // Apply custom stripe angle settings
            const stripeAngleToggle = document.getElementById(`ring${i}CustomStripeAngle`);
            const stripeAngleInput = document.getElementById(`ring${i}StripeAngle`);
            const stripeAngleValue = document.getElementById(`ring${i}StripeAngleValue`);
            
            if (stripeAngleToggle && ringData.customStripeAngle !== undefined) {
                stripeAngleToggle.checked = ringData.customStripeAngle;
                if (stripeAngleInput) {
                    stripeAngleInput.value = ringData.stripeAngle || 0;
                    stripeAngleInput.disabled = !ringData.customStripeAngle;
                    if (stripeAngleValue) stripeAngleValue.textContent = `${stripeAngleInput.value}°`;
                }
            }
            
            // Apply width oscillation settings
            const widthOscillationToggle = document.getElementById(`ring${i}WidthOscillate`);
            const widthPeriodInput = document.getElementById(`ring${i}WidthPeriod`);
            const widthPeriodValue = document.getElementById(`ring${i}WidthPeriodValue`);
            const widthAmplitudeInput = document.getElementById(`ring${i}WidthAmplitude`);
            const widthAmplitudeValue = document.getElementById(`ring${i}WidthAmplitudeValue`);
            
            if (widthOscillationToggle && ringData.widthOscillate !== undefined) {
                widthOscillationToggle.checked = ringData.widthOscillate;
                
                if (widthPeriodInput) {
                    widthPeriodInput.value = ringData.widthPeriod || 5;
                    widthPeriodInput.disabled = !ringData.widthOscillate;
                    if (widthPeriodValue) widthPeriodValue.textContent = `${widthPeriodInput.value}s`;
                }
                
                if (widthAmplitudeInput) {
                    widthAmplitudeInput.value = ringData.widthAmplitude || 50;
                    widthAmplitudeInput.disabled = !ringData.widthOscillate;
                    if (widthAmplitudeValue) widthAmplitudeValue.textContent = `${widthAmplitudeInput.value}%`;
                }
            }
        }
        
        console.log("Ring settings applied successfully");
    }
    // Persist settings using localStorage

// Function to save settings
function saveSettings() {
    // Create a comprehensive settings object
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
    
    // Save to localStorage with extra debugging
    try {
        const settingsJson = JSON.stringify(settings);
        localStorage.setItem(SETTINGS_KEY, settingsJson);
        console.log("Settings saved successfully:", settings);
    } catch (e) {
        console.error("Error saving settings:", e);
    }
}

// Completely revamped loadSettings function
function loadSettings() {
    console.log("Loading settings...");
    const settingsJson = localStorage.getItem(SETTINGS_KEY);
    
    if (settingsJson) {
        try {
            const settings = JSON.parse(settingsJson);
            console.log("Loaded settings:", settings);
            
            // First load all the global controls
            // This ensures the ring count is set before we create ring controls
            if (settings.ringCount) ringCountControl.value = settings.ringCount;
            if (settings.segmentCount) segmentCountControl.value = settings.segmentCount;
            if (settings.stripeCount) stripeCountControl.value = settings.stripeCount;
            if (settings.angleOffset) angleOffsetControl.value = settings.angleOffset;
            if (settings.rotationSpeed) rotationSpeedControl.value = settings.rotationSpeed;
            if (settings.alternateRotation !== undefined) alternateRotationControl.checked = settings.alternateRotation;
            if (settings.colorScheme) colorSchemeControl.value = settings.colorScheme;
            if (settings.stripAngle) stripAngleControl.value = settings.stripAngle;
            if (settings.alternateStripAngles !== undefined) alternateStripAnglesControl.checked = settings.alternateStripAngles;
            if (settings.ringWidth) ringWidthControl.value = settings.ringWidth;
            if (settings.gradientEnabled !== undefined) gradientEnabledControl.checked = settings.gradientEnabled;
            if (settings.gradientIntensity) gradientIntensityControl.value = settings.gradientIntensity;
            if (settings.edgeBrightness) edgeBrightnessControl.value = settings.edgeBrightness;
            if (settings.centerDarkness) centerDarknessControl.value = settings.centerDarkness;
            if (settings.gradientWidth) gradientWidthControl.value = settings.gradientWidth;
            if (settings.gradientCurve) gradientCurveControl.value = settings.gradientCurve;
            if (settings.primaryColor) primaryColorControl.value = settings.primaryColor;
            if (settings.secondaryColor) secondaryColorControl.value = settings.secondaryColor;
            if (settings.glowEnabled !== undefined) glowEnabledControl.checked = settings.glowEnabled;
            if (settings.glowIntensity) glowIntensityControl.value = settings.glowIntensity;
            if (settings.glowSize) glowSizeControl.value = settings.glowSize;
            if (settings.glowColor) glowColorControl.value = settings.glowColor;
            
            // Update value displays
            updateValueDisplays();
            
            // Store the ring settings for later application after controls are created
            window.storedRingSettings = settings.ringSettings;
            
            return true;
        } catch (e) {
            console.error("Error parsing settings:", e);
            return false;
        }
    } else {
        console.log("No saved settings found");
        return false;
    }
}

// New function to apply ring settings after controls are created
function applyRingSettings() {
    console.log("Applying ring settings...");
    if (!window.storedRingSettings) {
        console.log("No stored ring settings found");
        return;
    }
    
    const ringCount = parseInt(ringCountControl.value);
    console.log(`Ring count: ${ringCount}, Stored settings length: ${window.storedRingSettings.length}`);
    
    // Apply settings to each ring
    for (let i = 1; i <= ringCount; i++) {
        if (i-1 >= window.storedRingSettings.length) {
            console.log(`No settings for ring ${i}`);
            continue;
        }
        
        const ringData = window.storedRingSettings[i-1];
        console.log(`Applying settings for ring ${i}:`, ringData);
        
        // Apply width
        const widthControl = document.getElementById(`ring${i}Width`);
        const widthValue = document.getElementById(`ring${i}WidthValue`);
        if (widthControl && ringData.width) {
            widthControl.value = ringData.width;
            if (widthValue) widthValue.textContent = `${ringData.width}%`;
        }
        
        // Apply solid color settings
        const colorToggle = document.getElementById(`ring${i}SolidColor`);
        const colorChoice = document.getElementById(`ring${i}ColorChoice`);
        if (colorToggle && ringData.solidColor !== undefined) {
            colorToggle.checked = ringData.solidColor;
            if (colorChoice) {
                colorChoice.value = ringData.colorChoice || 'primary';
                colorChoice.disabled = !ringData.solidColor;
            }
        }
        
        // Apply oscillation settings
        const oscillationToggle = document.getElementById(`ring${i}Oscillate`);
        const periodInput = document.getElementById(`ring${i}Period`);
        const periodValue = document.getElementById(`ring${i}PeriodValue`);
        
        if (oscillationToggle && ringData.oscillate !== undefined) {
            oscillationToggle.checked = ringData.oscillate;
            if (periodInput) {
                periodInput.value = ringData.period || 5;
                periodInput.disabled = !ringData.oscillate;
                if (periodValue) periodValue.textContent = `${periodInput.value}s`;
            }
        }
        
        // Apply custom stripe angle settings
        const stripeAngleToggle = document.getElementById(`ring${i}CustomStripeAngle`);
        const stripeAngleInput = document.getElementById(`ring${i}StripeAngle`);
        const stripeAngleValue = document.getElementById(`ring${i}StripeAngleValue`);
        
        if (stripeAngleToggle && ringData.customStripeAngle !== undefined) {
            stripeAngleToggle.checked = ringData.customStripeAngle;
            if (stripeAngleInput) {
                stripeAngleInput.value = ringData.stripeAngle || 0;
                stripeAngleInput.disabled = !ringData.customStripeAngle;
                if (stripeAngleValue) stripeAngleValue.textContent = `${stripeAngleInput.value}°`;
            }
        }
        
        // Apply width oscillation settings
        const widthOscillationToggle = document.getElementById(`ring${i}WidthOscillate`);
        const widthPeriodInput = document.getElementById(`ring${i}WidthPeriod`);
        const widthPeriodValue = document.getElementById(`ring${i}WidthPeriodValue`);
        const widthAmplitudeInput = document.getElementById(`ring${i}WidthAmplitude`);
        const widthAmplitudeValue = document.getElementById(`ring${i}WidthAmplitudeValue`);
        
        if (widthOscillationToggle && ringData.widthOscillate !== undefined) {
            widthOscillationToggle.checked = ringData.widthOscillate;
            
            if (widthPeriodInput) {
                widthPeriodInput.value = ringData.widthPeriod || 5;
                widthPeriodInput.disabled = !ringData.widthOscillate;
                if (widthPeriodValue) widthPeriodValue.textContent = `${widthPeriodInput.value}s`;
            }
            
            if (widthAmplitudeInput) {
                widthAmplitudeInput.value = ringData.widthAmplitude || 50;
                widthAmplitudeInput.disabled = !ringData.widthOscillate;
                if (widthAmplitudeValue) widthAmplitudeValue.textContent = `${widthAmplitudeInput.value}%`;
            }
        }
    }
    
    console.log("Ring settings applied successfully");
}


