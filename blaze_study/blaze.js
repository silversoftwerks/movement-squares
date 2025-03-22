
document.addEventListener('DOMContentLoaded', function() {
    // Fix the Canvas2D fallback function
    function setupCanvas2D() {
        const canvas2D = document.getElementById('blazeCanvas');
        canvas2D.style.display = 'block';
        
        // Hide WebGL canvas if it exists
        const glCanvas = document.getElementById('blazeGLCanvas');
        if (glCanvas) {
            glCanvas.style.display = 'none';
        }
        
        // Resume animation with regular canvas
        startAnimation();
    } 
    function mixColors(color1, color2, ratio) {
        // Extract RGB components from rgba strings
        const c1 = color1.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        const c2 = color2.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        
        if (!c1 || !c2) return color1;
        
        // Mix the colors according to the ratio
        const r = Math.round(parseInt(c1[1]) * (1 - ratio) + parseInt(c2[1]) * ratio);
        const g = Math.round(parseInt(c1[2]) * (1 - ratio) + parseInt(c2[2]) * ratio);
        const b = Math.round(parseInt(c1[3]) * (1 - ratio) + parseInt(c2[3]) * ratio);
        
        return `rgba(${r}, ${g}, ${b}, 1)`;
    }
    
    // Add WebGL setup function
    function setupWebGL() {
        // Capture all needed control values as local variables first
        const ringCountValue = ringCountControl.value;
        const segmentCountValue = segmentCountControl.value;
        const stripeCountValue = stripeCountControl.value;
        // Capture all other needed control values here
        
        // Create a proxy function for drawBlaze that uses the captured values
        const drawBlazeForWebGL = (timestamp, customCtx, customCanvas) => {
            // Use captured values here instead of directly accessing controls
            const ringCount = parseInt(ringCountValue);
            const segments = parseInt(segmentCountValue);
            const stripeCount = parseInt(stripeCountValue);
            // Set other parameters from captured values
            
            // Call the original drawBlaze with these values
            // (we'll need to modify drawBlaze to accept these parameters directly)
            // For now, we can just ensure the controls are in scope
            drawBlaze(timestamp, customCtx, customCanvas);
        };
        
        // Now continue with WebGL setup knowing we have all the values we need
        // Hide the canvas2D element and show the WebGL canvas
        const canvas2D = document.getElementById('blazeCanvas');
        canvas2D.style.display = 'none';
        
        // Rest of WebGL setup...
    }

    // Function to draw the blaze pattern with glow
    function drawBlazeWithGlow(timestamp) {
        try {
            // Get a reference to the main canvas
            const mainCanvas = document.getElementById('blazeCanvas');
            
            // Create a temp canvas with the same dimensions
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = mainCanvas.width;
            tempCanvas.height = mainCanvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Draw the pattern to temp canvas
            drawBlaze(timestamp, tempCtx, tempCanvas);
            
            // Rest of glow effect code...
        } catch (error) {
            console.error("Error in drawBlazeWithGlow:", error);
            // Fall back to regular canvas rendering
            setupCanvas2D();
        }
    }

    // Helper function to convert hex color to RGB
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : {r: 0, g: 0, b: 0};
    }

    // Modify the drawBlaze function to accept custom context
    function drawBlaze(timestamp, customCtx, customCanvas) {
        const ctx = customCtx || document.getElementById('blazeCanvas').getContext('2d');
        const canvas = customCanvas || document.getElementById('blazeCanvas');
        
        // Store maxRadius globally for access in other functions
        const size = canvas.width;
        window.maxRadius = size * 0.45;
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Get parameter values from controls
        const ringCount = parseInt(ringCountControl.value);
        const segments = parseInt(segmentCountControl.value);
        const stripeCount = parseInt(stripeCountControl.value);
        const angleOffset = parseFloat(angleOffsetControl.value);
        const rotationSpeed = parseFloat(rotationSpeedControl.value);
        const alternateRotation = alternateRotationControl.checked;
        const colorScheme = colorSchemeControl.value;
        const stripAngle = parseFloat(stripAngleControl.value);
        const alternateStripAngles = alternateStripAnglesControl.checked;
        const gradientEnabled = gradientEnabledControl.checked;
        const gradientIntensity = parseInt(gradientIntensityControl.value) / 100;
        const edgeBrightness = parseInt(edgeBrightnessControl.value);
        const centerDarkness = parseInt(centerDarknessControl.value);
        const gradientWidth = parseFloat(gradientWidthControl.value);
        const ringWidthPercent = parseInt(ringWidthControl.value);
        const gradientCurve = gradientCurveControl.value;
        
        // Calculate actual ring width
        const ringWidth = (maxRadius / ringCount) * (ringWidthPercent / 100);
        
        // Angular width of each segment in radians
        const segmentAngle = (Math.PI * 2) / segments;
        
        // Initialize rotations if needed
        if (ringRotations.length === 0) {
            initRotations(ringCount);
        }
        
        // Get colors based on the color scheme
        let primaryColor, secondaryColor;
        switch (colorScheme) {
            case 'rb':
                primaryColor = '#cc0000';  // Red
                secondaryColor = '#0000cc'; // Blue
                break;
            case 'yg':
                primaryColor = '#cccc00';  // Yellow
                secondaryColor = '#00cc00'; // Green
                break;
            case 'egypt1':
                primaryColor = '#1A8BB3';  // Turquoise blue
                secondaryColor = '#E3B92F'; // Ochre/gold
                break;
            case 'egypt2':
                primaryColor = '#D74E3D';  // Egyptian red
                secondaryColor = '#2B5282'; // Lapis blue
                break;
            case 'ra':
                primaryColor = '#CC3333';  // Red
                secondaryColor = '#FCF6EA'; // Off-white/cream
                break;
            case 'chant':
                primaryColor = '#275D96';  // Blue
                secondaryColor = '#CD9F3B'; // Gold
                break;
            case 'late70s':
                primaryColor = '#7F4098';  // Purple
                secondaryColor = '#009A4E'; // Green
                break;
            case 'rajasthan':
                primaryColor = '#FF671E';  // Orange/vermilion
                secondaryColor = '#3F49FF'; // Bright blue
                break;
            case 'custom':
                primaryColor = primaryColorControl.value;
                secondaryColor = secondaryColorControl.value;
                break;
            case 'psychedelic':
                primaryColor = '#FF0055';  // Correct hot pink/magenta (was '#FF003')
                secondaryColor = '#00CC99'; // Greener turquoise
                break;
            default: // 'bw'
                primaryColor = '#000000';  // Black
                secondaryColor = '#ffffff'; // White
                break;
        }
        
        // Update rotations for each ring (in alternating directions if selected)
        if (!isPaused) {
            for (let r = 0; r < ringCount; r++) {
                if (alternateRotation) {
                    // Alternate direction based on ring index (even/odd)
                    ringRotations[r] += (r % 2 === 0) ? rotationSpeed : -rotationSpeed;
                } else {
                    // All rings rotate in the same direction
                    ringRotations[r] += rotationSpeed;
                }
            }
        }
        
        // Draw concentric rings from outside to inside
        for (let r = 0; r < ringCount; r++) {
            // Change the ring position calculation to ensure rings align perfectly
            // First calculate the total width of all rings
            const totalRingWidth = maxRadius * (ringWidthPercent / 100);
            
            // Calculate positions with even spacing
            const ringStep = maxRadius / ringCount;
            const outerRadius = maxRadius - (r * ringStep);
            const innerRadius = outerRadius - ringStep;
            
            // Skip if inner radius would be negative
            if (innerRadius < 0) continue;
            
            const ringRotation = ringRotations[r]; // Current rotation for this ring
            
            // Always use primary color for outermost (r=0) and innermost rings
            const isOutermostRing = r === 0;
            const isInnermostRing = r === ringCount - 1;
            const forceRingPrimaryColor = isOutermostRing || isInnermostRing;
            
            // Calculate a ring phase to ensure consistent color alternation
            const ringPhase = r % 2;
            
            // Adjust the segments based on the ring count to create visual interest
            for (let i = 0; i < segments; i++) {
                const startAngle = (i / segments) * Math.PI * 2 + ringRotation;
                const endAngle = ((i + 1) / segments) * Math.PI * 2 + ringRotation;
                
                // Slightly offset the angle to create the "curved" effect
                const offsetFactor = (r % 2 === 0) ? 1 : -1;
                const angleOffsetValue = angleOffset * offsetFactor;
                
                // Use consistent color alternation logic
                // This ensures colors don't double at boundaries
                const segmentPhase = i % 2;
                const isPrimarySegment = forceRingPrimaryColor || (segmentPhase === ringPhase);
                
                drawStripedRingSegment(
                    centerX, 
                    centerY, 
                    outerRadius, 
                    innerRadius, 
                    startAngle, 
                    endAngle, 
                    isPrimarySegment,
                    primaryColor,
                    secondaryColor,
                    stripeCount,
                    angleOffsetValue,
                    alternateStripAngles ? (r % 2 === 0 ? stripAngle : -stripAngle) : stripAngle,
                    gradientEnabled,
                    gradientIntensity,
                    edgeBrightness,
                    centerDarkness,
                    gradientWidth,
                    gradientCurve
                );
            }
        }
        
        // Return to animation loop if not paused and not using custom context
        if (!customCtx && !isPaused) {
            animationId = requestAnimationFrame(drawBlaze);
        }
    }
    // Canvas setup
    const canvas = document.getElementById('blazeCanvas');
    const ctx = canvas.getContext('2d');
    
    // Make the canvas a perfect square
    let size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
    canvas.width = size;
    canvas.height = size;
    
    // Set up variables for the pattern
    let centerX = size / 2;
    let centerY = size / 2;
    let maxRadius = size * 0.45; // Slightly smaller than canvas
    
    // Animation variables
    let animationId;
    let isPaused = false;
    const ringRotations = []; // Track rotation angle for each ring
    
    // Get all controls
    const ringCountControl = document.getElementById('ringCount');
    const segmentCountControl = document.getElementById('segmentCount');
    const stripeCountControl = document.getElementById('stripeCount');
    const angleOffsetControl = document.getElementById('angleOffset');
    const rotationSpeedControl = document.getElementById('rotationSpeed');
    const alternateRotationControl = document.getElementById('alternateRotation');
    const colorSchemeControl = document.getElementById('colorScheme');
    const primaryColorControl = document.getElementById('primaryColor');
    const secondaryColorControl = document.getElementById('secondaryColor');
    const customColorGroup = document.getElementById('customColorGroup');
    const stripAngleControl = document.getElementById('stripAngle');
    const alternateStripAnglesControl = document.getElementById('alternateStripAngles');
    const gradientEnabledControl = document.getElementById('gradientEnabled');
    const gradientIntensityControl = document.getElementById('gradientIntensity');
    const edgeBrightnessControl = document.getElementById('edgeBrightness');
    const centerDarknessControl = document.getElementById('centerDarkness');
    const gradientWidthControl = document.getElementById('gradientWidth');
    const gradientControlsDiv = document.getElementById('gradientControls');
    const ringWidthControl = document.getElementById('ringWidth');
    const gradientCurveControl = document.getElementById('gradientCurve');
    const glowEnabledControl = document.getElementById('glowEnabled');
    const glowIntensityControl = document.getElementById('glowIntensity');
    const glowSizeControl = document.getElementById('glowSize');
    const glowColorControl = document.getElementById('glowColor');
    const glowControlsDiv = document.getElementById('glowControls');
    
    // Get all value displays
    const ringCountValue = document.getElementById('ringCountValue');
    const segmentCountValue = document.getElementById('segmentCountValue');
    const stripeCountValue = document.getElementById('stripeCountValue');
    const angleOffsetValue = document.getElementById('angleOffsetValue');
    const rotationSpeedValue = document.getElementById('rotationSpeedValue');
    const stripAngleValue = document.getElementById('stripAngleValue');
    const gradientIntensityValue = document.getElementById('gradientIntensityValue');
    const edgeBrightnessValue = document.getElementById('edgeBrightnessValue');
    const centerDarknessValue = document.getElementById('centerDarknessValue');
    const gradientWidthValue = document.getElementById('gradientWidthValue');
    const ringWidthValue = document.getElementById('ringWidthValue');
    const glowIntensityValue = document.getElementById('glowIntensityValue');
    const glowSizeValue = document.getElementById('glowSizeValue');
    
    // Get buttons
    const pausePlayButton = document.getElementById('pausePlay');
    const resetAnimationButton = document.getElementById('resetAnimation');
    const toggleControlsBtn = document.querySelector('.toggle-controls');
    const controlsContainer = document.querySelector('.controls-container');
    
    // Persist settings using localStorage
    const SETTINGS_KEY = 'bridgetRileyBlazeSettings';
    
    // Function to save settings
    function saveSettings() {
        const settings = {
            ringCount: ringCountControl.value,
            segmentCount: segmentCountControl.value,
            stripeCount: stripeCountControl.value,
            angleOffset: angleOffsetControl.value,
            rotationSpeed: rotationSpeedControl.value,
            alternateRotation: alternateRotationControl.checked,
            colorScheme: colorSchemeControl.value,
            primaryColor: primaryColorControl.value,
            secondaryColor: secondaryColorControl.value,
            stripAngle: stripAngleControl.value,
            alternateStripAngles: alternateStripAnglesControl.checked,
            gradientEnabled: gradientEnabledControl.checked,
            gradientIntensity: gradientIntensityControl.value,
            edgeBrightness: edgeBrightnessControl.value,
            centerDarkness: centerDarknessControl.value,
            gradientWidth: gradientWidthControl.value,
            ringWidth: ringWidthControl.value,
            gradientCurve: gradientCurveControl.value,
            glowEnabled: glowEnabledControl.checked,
            glowIntensity: glowIntensityControl.value,
            glowSize: glowSizeControl.value,
            glowColor: glowColorControl.value
        };
        
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
    
    // Function to load settings
    function loadSettings() {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            ringCountControl.value = settings.ringCount || 12;
            segmentCountControl.value = settings.segmentCount || 36;
            stripeCountControl.value = settings.stripeCount || 7;
            angleOffsetControl.value = settings.angleOffset || 0.02;
            rotationSpeedControl.value = settings.rotationSpeed || 0.0005;
            alternateRotationControl.checked = settings.alternateRotation !== false;
            colorSchemeControl.value = settings.colorScheme || 'bw';
            primaryColorControl.value = settings.primaryColor || '#000000';
            secondaryColorControl.value = settings.secondaryColor || '#FFFFFF';
            stripAngleControl.value = settings.stripAngle || 0;
            alternateStripAnglesControl.checked = settings.alternateStripAngles !== false;
            gradientEnabledControl.checked = settings.gradientEnabled !== false;
            gradientIntensityControl.value = settings.gradientIntensity || 100;
            edgeBrightnessControl.value = settings.edgeBrightness || 30;
            centerDarknessControl.value = settings.centerDarkness || 25;
            gradientWidthControl.value = settings.gradientWidth || 2.0;
            ringWidthControl.value = settings.ringWidth || 100;
            gradientCurveControl.value = settings.gradientCurve || 'linear';
            glowEnabledControl.checked = settings.glowEnabled !== false;
            glowIntensityControl.value = settings.glowIntensity || 50;
            glowSizeControl.value = settings.glowSize || 3.0;
            glowColorControl.value = settings.glowColor || '#00AAFF';
            
            // Update custom color display
            if (colorSchemeControl.value === 'custom') {
                customColorGroup.style.display = 'block';
            }
            
            // Update displays
            updateValueDisplays();
        }
    }
    
    // Initialize the ring rotations
    function initRotations(ringCount) {
        ringRotations.length = 0;
        for (let i = 0; i < ringCount; i++) {
            ringRotations.push(0); // Start at 0 rotation
        }
    }
    
    // Function to update value displays
    function updateValueDisplays() {
        ringCountValue.textContent = ringCountControl.value;
        segmentCountValue.textContent = segmentCountControl.value;
        stripeCountValue.textContent = stripeCountControl.value;
        angleOffsetValue.textContent = parseFloat(angleOffsetControl.value).toFixed(3);
        rotationSpeedValue.textContent = parseFloat(rotationSpeedControl.value).toFixed(3);
        stripAngleValue.textContent = `${stripAngleControl.value}°`;
        gradientIntensityValue.textContent = `${gradientIntensityControl.value}%`;
        edgeBrightnessValue.textContent = edgeBrightnessControl.value;
        centerDarknessValue.textContent = centerDarknessControl.value;
        gradientWidthValue.textContent = gradientWidthControl.value;
        ringWidthValue.textContent = `${ringWidthControl.value}%`;
        glowIntensityValue.textContent = `${glowIntensityControl.value}%`;
        glowSizeValue.textContent = glowSizeControl.value;
        
        // Save settings whenever they change
        saveSettings();
    }
    
    // Draw the Blaze pattern
    function drawBlaze(timestamp, customCtx, customCanvas) {
        const ctx = customCtx || document.getElementById('blazeCanvas').getContext('2d');
        const canvas = customCanvas || document.getElementById('blazeCanvas');
        
        // Store maxRadius globally for access in other functions
        const size = canvas.width;
        window.maxRadius = size * 0.45;
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Get parameter values from controls
        const ringCount = parseInt(ringCountControl.value);
        const segments = parseInt(segmentCountControl.value);
        const stripeCount = parseInt(stripeCountControl.value);
        const angleOffset = parseFloat(angleOffsetControl.value);
        const rotationSpeed = parseFloat(rotationSpeedControl.value);
        const alternateRotation = alternateRotationControl.checked;
        const colorScheme = colorSchemeControl.value;
        const stripAngle = parseFloat(stripAngleControl.value);
        const alternateStripAngles = alternateStripAnglesControl.checked;
        const gradientEnabled = gradientEnabledControl.checked;
        const gradientIntensity = parseInt(gradientIntensityControl.value) / 100;
        const edgeBrightness = parseInt(edgeBrightnessControl.value);
        const centerDarkness = parseInt(centerDarknessControl.value);
        const gradientWidth = parseFloat(gradientWidthControl.value);
        const ringWidthPercent = parseInt(ringWidthControl.value);
        const gradientCurve = gradientCurveControl.value;
        
        // Calculate actual ring width
        const ringWidth = (maxRadius / ringCount) * (ringWidthPercent / 100);
        
        // Angular width of each segment in radians
        const segmentAngle = (Math.PI * 2) / segments;
        
        // Initialize rotations if needed
        if (ringRotations.length === 0) {
            initRotations(ringCount);
        }
        
        // Get colors based on the color scheme
        let primaryColor, secondaryColor;
        switch (colorScheme) {
            case 'rb':
                primaryColor = '#cc0000';  // Red
                secondaryColor = '#0000cc'; // Blue
                break;
            case 'yg':
                primaryColor = '#cccc00';  // Yellow
                secondaryColor = '#00cc00'; // Green
                break;
            case 'egypt1':
                primaryColor = '#1A8BB3';  // Turquoise blue
                secondaryColor = '#E3B92F'; // Ochre/gold
                break;
            case 'egypt2':
                primaryColor = '#D74E3D';  // Egyptian red
                secondaryColor = '#2B5282'; // Lapis blue
                break;
            case 'ra':
                primaryColor = '#CC3333';  // Red
                secondaryColor = '#FCF6EA'; // Off-white/cream
                break;
            case 'chant':
                primaryColor = '#275D96';  // Blue
                secondaryColor = '#CD9F3B'; // Gold
                break;
            case 'late70s':
                primaryColor = '#7F4098';  // Purple
                secondaryColor = '#009A4E'; // Green
                break;
            case 'rajasthan':
                primaryColor = '#FF671E';  // Orange/vermilion
                secondaryColor = '#3F49FF'; // Bright blue
                break;
            case 'custom':
                primaryColor = primaryColorControl.value;
                secondaryColor = secondaryColorControl.value;
                break;
            case 'psychedelic':
                primaryColor = '#FF0055';  // Correct hot pink/magenta (was '#FF003')
                secondaryColor = '#00CC99'; // Greener turquoise
                break;
            default: // 'bw'
                primaryColor = '#000000';  // Black
                secondaryColor = '#ffffff'; // White
                break;
        }
        
        // Update rotations for each ring (in alternating directions if selected)
        if (!isPaused) {
            for (let r = 0; r < ringCount; r++) {
                if (alternateRotation) {
                    // Alternate direction based on ring index (even/odd)
                    ringRotations[r] += (r % 2 === 0) ? rotationSpeed : -rotationSpeed;
                } else {
                    // All rings rotate in the same direction
                    ringRotations[r] += rotationSpeed;
                }
            }
        }
        
        // Draw concentric rings from outside to inside
        for (let r = 0; r < ringCount; r++) {
            // Change the ring position calculation to ensure rings align perfectly
            // First calculate the total width of all rings
            const totalRingWidth = maxRadius * (ringWidthPercent / 100);
            
            // Calculate positions with even spacing
            const ringStep = maxRadius / ringCount;
            const outerRadius = maxRadius - (r * ringStep);
            const innerRadius = outerRadius - ringStep;
            
            // Skip if inner radius would be negative
            if (innerRadius < 0) continue;
            
            const ringRotation = ringRotations[r]; // Current rotation for this ring
            
            // Always use primary color for outermost (r=0) and innermost rings
            const isOutermostRing = r === 0;
            const isInnermostRing = r === ringCount - 1;
            const forceRingPrimaryColor = isOutermostRing || isInnermostRing;
            
            // Calculate a ring phase to ensure consistent color alternation
            const ringPhase = r % 2;
            
            // Adjust the segments based on the ring count to create visual interest
            for (let i = 0; i < segments; i++) {
                const startAngle = (i / segments) * Math.PI * 2 + ringRotation;
                const endAngle = ((i + 1) / segments) * Math.PI * 2 + ringRotation;
                
                // Slightly offset the angle to create the "curved" effect
                const offsetFactor = (r % 2 === 0) ? 1 : -1;
                const angleOffsetValue = angleOffset * offsetFactor;
                
                // Use consistent color alternation logic
                // This ensures colors don't double at boundaries
                const segmentPhase = i % 2;
                const isPrimarySegment = forceRingPrimaryColor || (segmentPhase === ringPhase);
                
                drawStripedRingSegment(
                    centerX, 
                    centerY, 
                    outerRadius, 
                    innerRadius, 
                    startAngle, 
                    endAngle, 
                    isPrimarySegment,
                    primaryColor,
                    secondaryColor,
                    stripeCount,
                    angleOffsetValue,
                    alternateStripAngles ? (r % 2 === 0 ? stripAngle : -stripAngle) : stripAngle,
                    gradientEnabled,
                    gradientIntensity,
                    edgeBrightness,
                    centerDarkness,
                    gradientWidth,
                    gradientCurve
                );
            }
        }
        
        // Continue animation
        if (!customCtx && !isPaused) {
            animationId = requestAnimationFrame(drawBlaze);
        }
    }
    
    // Draw a segment of a ring with perpendicular stripes
    function drawStripedRingSegment(cx, cy, outerRadius, innerRadius, startAngle, endAngle, isPrimaryColor, primaryColor, secondaryColor, stripeCount, angleOffset, stripAngle, gradientEnabled, gradientIntensity, edgeBrightness, centerDarkness, gradientWidth, gradientCurve) {
        // Get maxRadius from parent scope
        const maxRadius = Math.max(outerRadius, window.maxRadius || Math.max(cx, cy));
        
        // Calculate the angular width of the segment
        const segmentAngularWidth = endAngle - startAngle;
        
        // Convert stripAngle from degrees to radians
        const stripAngleRad = stripAngle * (Math.PI / 180);
        
        // Limit the angle compensation to prevent doubling
        // Use a more conservative formula that doesn't over-compensate at large angles
        const angleCompensation = Math.abs(stripAngleRad) > 0.001 ? 
            Math.min(1.2, 1 / Math.cos(Math.min(Math.PI/4, Math.abs(stripAngleRad)))) : 1;
        
        // Adjust the angular width of each stripe (compensate for angle)
        const stripeAngleWidth = (segmentAngularWidth / stripeCount);
        
        // Create angled edges by offsetting the angles
        // But limit the maximum offset to prevent extreme distortions
        const constrainedAngleOffset = Math.min(0.05, angleOffset);
        const outerStartAngle = startAngle - constrainedAngleOffset;
        const outerEndAngle = endAngle + constrainedAngleOffset;
        const innerStartAngle = startAngle - constrainedAngleOffset;
        const innerEndAngle = endAngle + constrainedAngleOffset;
        
        // Draw each stripe with properly constrained angles
        for (let s = 0; s < stripeCount; s++) {
            // Calculate stripe angles with careful boundaries to prevent overlap
            const stripeStartAngle = startAngle + (s * stripeAngleWidth);
            const stripeEndAngle = Math.min(stripeStartAngle + stripeAngleWidth, endAngle);
            
            // Ensure we don't exceed the segment boundaries
            if (stripeStartAngle >= endAngle) continue;
            
            // Ensure consistent color alternation with clean phase
            const stripePhase = s % 2;
            const usesPrimaryColor = (stripePhase === 0) ? isPrimaryColor : !isPrimaryColor;
            const stripeColor = usesPrimaryColor ? primaryColor : secondaryColor;
            
            // Calculate the angle shift based on the strip angle and position
            // Adjust the angle shift with the compensation factor for smoother transitions
            const radiusRatio = (outerRadius + innerRadius) / (2 * maxRadius);
            const angleShift = stripAngle * (Math.PI / 180) * radiusRatio;
            
            // Apply the adjusted angle shift to stripe edges
            const adjustedOuterStart = stripeStartAngle + angleShift;
            const adjustedOuterEnd = stripeEndAngle + angleShift;
            const adjustedInnerStart = stripeStartAngle - angleShift;
            const adjustedInnerEnd = stripeEndAngle - angleShift;
            
            // Create stripe path
            ctx.beginPath();
            ctx.arc(cx, cy, outerRadius, adjustedOuterStart, adjustedOuterEnd);
            ctx.lineTo(cx + innerRadius * Math.cos(adjustedInnerEnd), cy + innerRadius * Math.sin(adjustedInnerEnd));
            ctx.arc(cx, cy, innerRadius, adjustedInnerEnd, adjustedInnerStart, true);
            ctx.lineTo(cx + outerRadius * Math.cos(adjustedOuterStart), cy + outerRadius * Math.sin(adjustedOuterStart));
            ctx.closePath();
            
            // Fill with solid color if gradients disabled
            if (!gradientEnabled) {
                ctx.fillStyle = stripeColor;
                ctx.fill();
                
                // Optional: add a subtle stroke for definition
                ctx.strokeStyle = stripeColor;
                ctx.lineWidth = 0.5;
                ctx.stroke();
                continue; // Skip to next stripe
            }
            
            // If we got here, gradients are enabled
            
            // Calculate gradient coordinates
            let midInnerX = cx + Math.cos(adjustedInnerEnd) * innerRadius;
            let midInnerY = cy + Math.sin(adjustedInnerEnd) * innerRadius;
            let midOuterX = cx + Math.cos(adjustedOuterEnd) * outerRadius;
            let midOuterY = cy + Math.sin(adjustedOuterEnd) * outerRadius;
            
            // Calculate the midpoint of the strip in terms of position (not just angle)
            midOuterX = (midOuterX + midInnerX) / 2;
            midOuterY = (midOuterY + midInnerY) / 2;
            midInnerX = (midOuterX + midInnerX) / 2;
            midInnerY = (midOuterY + midInnerY) / 2;
            
            // Calculate strip direction vector (from inner to outer midpoint)
            const stripDirX = midOuterX - midInnerX;
            const stripDirY = midOuterY - midInnerY;
            const stripLength = Math.sqrt(stripDirX * stripDirX + stripDirY * stripDirY);
            
            // Normalize the direction vector
            const normalizedDirX = stripDirX / stripLength;
            const normalizedDirY = stripDirY / stripLength;
            
            // Calculate the perpendicular direction for the gradient
            // This rotation is 90 degrees counter-clockwise
            const perpDirX = -normalizedDirY;
            const perpDirY = normalizedDirX;
            
            // Calculate the strip width (perpendicular to direction)
            // We'll use the angle width and mean radius for an approximation
            const meanRadius = (outerRadius + innerRadius) / 2;
            const stripWidth = stripeAngleWidth * meanRadius;
            
            // Calculate gradient endpoints (offset from center in perpendicular directions)
            const gradientOffset = stripWidth * gradientWidth;
            const gradientX1 = midOuterX + perpDirX * gradientOffset;
            const gradientY1 = midOuterY + perpDirY * gradientOffset;
            const gradientX2 = midOuterX - perpDirX * gradientOffset;
            const gradientY2 = midOuterY - perpDirY * gradientOffset;
            
            // Create gradient along the strip
            const gradient = ctx.createLinearGradient(
                gradientX1, gradientY1,
                gradientX2, gradientY2
            );
            
            // Extract RGB components to create lighter and deeper versions
            const colorMatch = stripeColor.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
            if (colorMatch) {
                const r = parseInt(colorMatch[1], 16);
                const g = parseInt(colorMatch[2], 16);
                const b = parseInt(colorMatch[3], 16);
                
                // Calculate color adjustment based on stripe width and user settings
                const radiusRatio = meanRadius / maxRadius; 
                const sizeAdjustment = Math.max(0.4, Math.min(1.0, radiusRatio * 1.2));
                
                // Use the user-specified parameters
                const intensityFactor = gradientIntensity;
                const brightnessUp = Math.round(edgeBrightness * sizeAdjustment * intensityFactor);
                const brightnessDown = Math.round(centerDarkness * sizeAdjustment * intensityFactor);
                
                // Create lighter and deeper versions
                const lighterColor = `rgba(${Math.min(r + brightnessUp, 255)}, ${Math.min(g + brightnessUp, 255)}, ${Math.min(b + brightnessUp, 255)}, 1)`;
                const deeperColor = `rgba(${Math.max(r - brightnessDown, 0)}, ${Math.max(g - brightnessDown, 0)}, ${Math.max(b - brightnessDown, 0)}, 1)`;
                
                // Define gradient stops based on the selected curve type
                switch(gradientCurve) {
                    case 'ease-in':
                        // Slow start, fast end
                        gradient.addColorStop(0, lighterColor);
                        gradient.addColorStop(0.2, lighterColor);
                        gradient.addColorStop(0.4, mixColors(lighterColor, deeperColor, 0.3));
                        gradient.addColorStop(0.5, deeperColor);
                        gradient.addColorStop(0.6, mixColors(deeperColor, lighterColor, 0.3));
                        gradient.addColorStop(0.8, lighterColor);
                        gradient.addColorStop(1, lighterColor);
                        break;
                        
                    case 'ease-out':
                        // Fast start, slow end
                        gradient.addColorStop(0, lighterColor);
                        gradient.addColorStop(0.1, mixColors(lighterColor, deeperColor, 0.3));
                        gradient.addColorStop(0.4, deeperColor);
                        gradient.addColorStop(0.5, deeperColor);
                        gradient.addColorStop(0.6, deeperColor);
                        gradient.addColorStop(0.9, mixColors(deeperColor, lighterColor, 0.3));
                        gradient.addColorStop(1, lighterColor);
                        break;
                        
                    case 'ease-in-out':
                        // Slow start, fast middle, slow end
                        gradient.addColorStop(0, lighterColor);
                        gradient.addColorStop(0.15, mixColors(lighterColor, deeperColor, 0.2));
                        gradient.addColorStop(0.3, mixColors(lighterColor, deeperColor, 0.6));
                        gradient.addColorStop(0.5, deeperColor);
                        gradient.addColorStop(0.7, mixColors(deeperColor, lighterColor, 0.6));
                        gradient.addColorStop(0.85, mixColors(deeperColor, lighterColor, 0.2));
                        gradient.addColorStop(1, lighterColor);
                        break;
                        
                    case 'step':
                        // Sharp transition
                        gradient.addColorStop(0, lighterColor);
                        gradient.addColorStop(0.3, lighterColor);
                        gradient.addColorStop(0.3001, deeperColor);
                        gradient.addColorStop(0.7, deeperColor);
                        gradient.addColorStop(0.7001, lighterColor);
                        gradient.addColorStop(1, lighterColor);
                        break;
                        
                    case 'sine':
                        // Sine wave pattern
                        gradient.addColorStop(0, lighterColor);
                        gradient.addColorStop(0.25, deeperColor);
                        gradient.addColorStop(0.5, lighterColor);
                        gradient.addColorStop(0.75, deeperColor);
                        gradient.addColorStop(1, lighterColor);
                        break;
                        
                    case 'trapezoid':
                        // Angled transitions with flat center (what you requested)
                        gradient.addColorStop(0, lighterColor);
                        gradient.addColorStop(0.25, deeperColor);  // Linear transition to deep
                        gradient.addColorStop(0.4, deeperColor);   // Flat section
                        gradient.addColorStop(0.6, deeperColor);   // Flat section
                        gradient.addColorStop(0.75, lighterColor); // Linear transition back
                        gradient.addColorStop(1, lighterColor);
                        break;
                        
                    case 'double-peak':
                        // Two darker regions creating a wave-like pattern
                        gradient.addColorStop(0, lighterColor);
                        gradient.addColorStop(0.2, deeperColor);
                        gradient.addColorStop(0.35, lighterColor);
                        gradient.addColorStop(0.65, lighterColor);
                        gradient.addColorStop(0.8, deeperColor);
                        gradient.addColorStop(1, lighterColor);
                        break;
                        
                    case 'triangle':
                        // Sharp triangular pattern with abrupt transitions
                        gradient.addColorStop(0, lighterColor);
                        gradient.addColorStop(0.49, lighterColor);
                        gradient.addColorStop(0.5, deeperColor);
                        gradient.addColorStop(0.51, lighterColor);
                        gradient.addColorStop(1, lighterColor);
                        break;
                        
                    case 'organic':
                        // Irregular, natural-looking gradient
                        const midDeep = mixColors(lighterColor, deeperColor, 0.7);
                        const midLight = mixColors(lighterColor, deeperColor, 0.3);
                        
                        gradient.addColorStop(0, lighterColor);
                        gradient.addColorStop(0.2, midLight);
                        gradient.addColorStop(0.4, deeperColor);
                        gradient.addColorStop(0.6, midDeep);
                        gradient.addColorStop(0.7, midLight);
                        gradient.addColorStop(0.9, lighterColor);
                        gradient.addColorStop(1, lighterColor);
                        break;
                        
                    default: // 'linear'
                        // Linear (original implementation)
                        gradient.addColorStop(0, lighterColor);
                        gradient.addColorStop(0.5, deeperColor);
                        gradient.addColorStop(1, lighterColor);
                        break;
                }
            } else {
                // Fallback if color parsing fails
                gradient.addColorStop(0, stripeColor);
                gradient.addColorStop(0.5, stripeColor);
                gradient.addColorStop(1, stripeColor);
            }
            
            // Apply the gradient fill
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }
    
    // Start the animation
    function startAnimation() {
        isPaused = false;
        pausePlayButton.textContent = 'Pause';
        
        // Use WebGL or Canvas2D based on glow setting
        if (glowEnabledControl.checked && window.webglContext) {
            animationId = requestAnimationFrame(drawBlazeWithGlow);
        } else {
            animationId = requestAnimationFrame(drawBlaze);
        }
    }
    
    // Pause the animation
    function pauseAnimation() {
        isPaused = true;
        pausePlayButton.textContent = 'Play';
        cancelAnimationFrame(animationId);
    }
    
    // Reset the animation
    function resetAnimation() {
        // Reset all ring rotations to 0
        for (let i = 0; i < ringRotations.length; i++) {
            ringRotations[i] = 0;
        }
        
        // Redraw with reset rotations
        if (glowEnabledControl.checked && window.webglContext) {
            drawBlazeWithGlow();
        } else {
            drawBlaze();
        }
    }
    
    // Handle window resize
    function handleResize() {
        size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
        canvas.width = size;
        canvas.height = size;
        centerX = size / 2;
        centerY = size / 2;
        maxRadius = size * 0.45;
        
        drawBlaze();
    }
    
    // Add event listeners
    window.addEventListener('resize', handleResize);
    
    // Control panel toggle
    toggleControlsBtn.addEventListener('click', () => {
        controlsContainer.classList.toggle('collapsed');
    });
    
    // Play/Pause button
    pausePlayButton.addEventListener('click', () => {
        if (isPaused) {
            startAnimation();
        } else {
            pauseAnimation();
        }
    });
    
    // Reset button
    resetAnimationButton.addEventListener('click', resetAnimation);
    
    // Parameter controls
    ringCountControl.addEventListener('input', () => {
        updateValueDisplays();
        const newRingCount = parseInt(ringCountControl.value);
        initRotations(newRingCount);
    });
    
    segmentCountControl.addEventListener('input', updateValueDisplays);
    stripeCountControl.addEventListener('input', updateValueDisplays);
    angleOffsetControl.addEventListener('input', updateValueDisplays);
    rotationSpeedControl.addEventListener('input', updateValueDisplays);
    
    alternateRotationControl.addEventListener('change', saveSettings);
    
    colorSchemeControl.addEventListener('change', () => {
        if (colorSchemeControl.value === 'custom') {
            customColorGroup.style.display = 'block';
        } else {
            customColorGroup.style.display = 'none';
        }
        saveSettings();
    });
    
    primaryColorControl.addEventListener('change', saveSettings);
    secondaryColorControl.addEventListener('change', saveSettings);
    
    stripAngleControl.addEventListener('input', updateValueDisplays);
    alternateStripAnglesControl.addEventListener('change', saveSettings);
    
    gradientEnabledControl.addEventListener('change', () => {
        gradientControlsDiv.style.display = gradientEnabledControl.checked ? 'block' : 'none';
        saveSettings();
    });
    
    gradientIntensityControl.addEventListener('input', updateValueDisplays);
    edgeBrightnessControl.addEventListener('input', updateValueDisplays);
    centerDarknessControl.addEventListener('input', updateValueDisplays);
    gradientWidthControl.addEventListener('input', updateValueDisplays);
    
    ringWidthControl.addEventListener('input', updateValueDisplays);
    
    gradientCurveControl.addEventListener('change', saveSettings);
    
    glowEnabledControl.addEventListener('change', function() {
        glowControlsDiv.style.display = glowEnabledControl.checked ? 'block' : 'none';
        saveSettings();
        
        // Initialize WebGL only if all controls are ready
        if (glowEnabledControl.checked) {
            // Use setTimeout to ensure this happens after all controls are properly initialized
            setTimeout(setupWebGL, 0);
        } else {
            setupCanvas2D();
        }
    });
    
    glowIntensityControl.addEventListener('input', updateValueDisplays);
    glowSizeControl.addEventListener('input', updateValueDisplays);
    glowColorControl.addEventListener('change', saveSettings);
    
    // Initialize
    loadSettings();
    startAnimation();
    
    // Auto-collapse controls on mobile
    if (window.innerWidth < 768) {
        controlsContainer.classList.add('collapsed');
    }
});

// Add this helper function for color mixing



