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
        // Hide the canvas2D element and show the WebGL canvas
        const canvas2D = document.getElementById('blazeCanvas');
        canvas2D.style.display = 'none';
        
        // Create or show WebGL canvas
        let glCanvas = document.getElementById('blazeGLCanvas');
        if (!glCanvas) {
            glCanvas = document.createElement('canvas');
            glCanvas.id = 'blazeGLCanvas';
            glCanvas.width = canvas2D.width;
            glCanvas.height = canvas2D.height;
            // Apply the same positioning and sizing as the main canvas
            glCanvas.style.position = 'fixed';
            glCanvas.style.top = '-50vw';
            glCanvas.style.left = '-50vw';
            glCanvas.style.width = '200vw';
            glCanvas.style.height = '200vh';
            canvas2D.parentNode.insertBefore(glCanvas, canvas2D);
        } else {
            glCanvas.style.display = 'block';
        }
        
        // Initialize WebGL context
        const gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
        if (!gl) {
            console.error('Unable to initialize WebGL. Your browser may not support it.');
            glowEnabledControl.checked = false;
            setupCanvas2D();
            return;
        }
        
        try {
            // Initialize shaders
            const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
            if (!shaderProgram) throw new Error("Failed to initialize shader program");
            
            const glowProgram = initShaderProgram(gl, vertexShaderSource, glowFragmentShaderSource);
            if (!glowProgram) throw new Error("Failed to initialize glow shader program");
            
            // Create buffers for rendering
            const buffers = createPlaneBuffers(gl);
            
            // Create framebuffer and texture for off-screen rendering
            const { framebuffer, texture } = createFramebufferTexture(gl, glCanvas.width, glCanvas.height);
            
            // Store WebGL objects for later use
            window.webglContext = {
                gl,
                canvas: glCanvas,
                shaderProgram,
                glowProgram,
                buffers,
                framebuffer,
                texture
            };
            
            // Start rendering with WebGL
            drawBlazeWithGlow();
        } catch (error) {
            console.error('WebGL initialization error:', error);
            // Fall back to Canvas2D rendering
            glowEnabledControl.checked = false;
            setupCanvas2D();
        }
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
            
            // Now apply the WebGL glow effect
            const { gl, canvas: glCanvas, glowProgram, buffers, texture } = window.webglContext;
            
            // Clear the canvas
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            // Use the glow shader program
            gl.useProgram(glowProgram);
            
            // Set up attribute locations
            const vertexPosition = gl.getAttribLocation(glowProgram, 'aVertexPosition');
            const textureCoord = gl.getAttribLocation(glowProgram, 'aTextureCoord');
            
            // Position attribute
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
            gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vertexPosition);
            
            // Texture coordinate attribute
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
            gl.vertexAttribPointer(textureCoord, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(textureCoord);
            
            // Indices
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
            
            // Create a texture from the temporary canvas
            const patternTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, patternTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tempCanvas);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            
            // Set the texture unit
            gl.uniform1i(gl.getUniformLocation(glowProgram, 'uTexture'), 0);
            
            // Get glow parameters from controls
            const glowIntensity = parseFloat(glowIntensityControl.value) / 100;
            const glowSize = parseFloat(glowSizeControl.value);
            const glowColor = hexToRgb(glowColorControl.value);
            
            // Set glow uniforms
            gl.uniform1f(gl.getUniformLocation(glowProgram, 'uGlowIntensity'), glowIntensity);
            gl.uniform1f(gl.getUniformLocation(glowProgram, 'uGlowSize'), glowSize);
            gl.uniform3fv(gl.getUniformLocation(glowProgram, 'uGlowColor'), [
                glowColor.r / 255, glowColor.g / 255, glowColor.b / 255
            ]);
            
            // Draw the quad
            gl.drawElements(gl.TRIANGLES, buffers.count, gl.UNSIGNED_SHORT, 0);
            
            // Clean up
            gl.deleteTexture(patternTexture);
            
            // Continue animation
            if (!isPaused) {
                animationId = requestAnimationFrame(drawBlazeWithGlow);
            }
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

    // Modify the drawBlaze function to make rings larger and overflow the screen
    function drawBlaze(timestamp, customCtx, customCanvas) {
        const ctx = customCtx || document.getElementById('blazeCanvas').getContext('2d');
        const canvas = customCanvas || document.getElementById('blazeCanvas');
        
        // Make the canvas dimensions larger than the viewport
        if (!customCanvas) {
            canvas.width = window.innerWidth * 1.5;
            canvas.height = window.innerHeight * 1.5;
        }
        
        // Set the center point to the middle of the viewport (not the canvas)
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Set maxRadius to extend beyond the screen (much larger than before)
        const maxRadius = Math.max(window.innerWidth, window.innerHeight) * 1.2;
        window.maxRadius = maxRadius;
        
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
        
        // Get individual ring width values for all rings
        const individualRingWidths = [];
        for (let i = 1; i <= ringCount; i++) {
            const control = document.getElementById(`ring${i}Width`);
            if (control) {
                individualRingWidths.push(parseInt(control.value) / 100);
            } else {
                individualRingWidths.push(ringWidthPercent / 100);
            }
        }
        
        // Use a fixed base unit for ring width that doesn't depend on ring count
        // This way adding rings doesn't shrink existing ones
        const baseRingUnit = maxRadius / 12; // Use 12 as a reference point (default ring count)
        const baseRingWidth = baseRingUnit * (ringWidthPercent / 100);
        
        // Angular width of each segment in radians
        const segmentAngle = (Math.PI * 2) / segments;
        
        // Initialize rotations if needed
        if (ringRotations.length === 0) {
            initRotations(ringCount);
        }
        
        // Initialize width oscillation values array if needed
        if (!window.ringWidthOscillations) {
            window.ringWidthOscillations = new Array(ringCount).fill(1);
        }
        
        // Ensure the array has correct length
        if (window.ringWidthOscillations.length !== ringCount) {
            window.ringWidthOscillations = new Array(ringCount).fill(1);
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
            case 'psychedelic':
                primaryColor = '#FF0055';  // Hot pink/magenta
                secondaryColor = '#00CC99'; // Greener turquoise
                break;
            case 'deep-ocean':
                primaryColor = '#003366';  // Deep blue
                secondaryColor = '#66CCFF'; // Light blue
                break;
            case 'firefly':
                primaryColor = '#111111';  // Almost black
                secondaryColor = '#AAFF22'; // Yellow-green
                break;
            case 'wolf-night':
                primaryColor = '#1A1A2E';  // Dark blue-black
                secondaryColor = '#E0E0E8'; // Silvery white with blue tint
                break;
            case 'custom':
                primaryColor = primaryColorControl.value;
                secondaryColor = secondaryColorControl.value;
                break;
            default: // 'bw'
                primaryColor = '#000000';  // Black
                secondaryColor = '#ffffff'; // White
                break;
        }
        
        // Update rotations
        if (!isPaused) {
            for (let r = 0; r < ringCount; r++) {
                // Check if this ring has oscillation enabled
                const oscillationToggle = document.getElementById(`ring${r+1}Oscillate`);
                const periodInput = document.getElementById(`ring${r+1}Period`);
                
                const useOscillation = oscillationToggle && oscillationToggle.checked;
                const period = periodInput ? parseFloat(periodInput.value) : 5;
                
                if (useOscillation) {
                    // Calculate rotation based on sine wave with correct period timing
                    const frequency = 1 / period; // frequency = 1/period
                    const amplitude = Math.PI / 4; // 45 degrees of rotation
                    
                    // Calculate phase purely based on time - this gives accurate period timing
                    // No need to update oscillation phases manually
                    const timeSeconds = timestamp / 1000; // Convert timestamp to seconds
                    
                    // Apply sine wave oscillation - one complete cycle every 'period' seconds
                    ringRotations[r] = amplitude * Math.sin(2 * Math.PI * frequency * timeSeconds);
                } else {
                    // Standard rotation
                    const direction = alternateRotation && r % 2 === 1 ? -1 : 1;
                    ringRotations[r] += rotationSpeed * direction;
                }
                
                // Calculate width oscillation if enabled
                const widthOscillationToggle = document.getElementById(`ring${r+1}WidthOscillate`);
                const widthPeriodInput = document.getElementById(`ring${r+1}WidthPeriod`);
                const widthAmplitudeInput = document.getElementById(`ring${r+1}WidthAmplitude`);
                
                const useWidthOscillation = widthOscillationToggle && widthOscillationToggle.checked;
                if (useWidthOscillation && widthPeriodInput && widthAmplitudeInput) {
                    const widthPeriod = parseFloat(widthPeriodInput.value);
                    const widthFrequency = 1 / widthPeriod;
                    const widthAmplitude = parseInt(widthAmplitudeInput.value) / 100; // Convert percentage to decimal
                    
                    // Calculate time-based phase
                    const timeSeconds = timestamp / 1000;
                    
                    // Calculate oscillation factor: oscillates between 1-(amplitude/2) and 1+(amplitude/2)
                    // This means at amplitude 0.5 (50%), width will oscillate between 0.75x and 1.25x its base value
                    const oscillationFactor = 1 + (widthAmplitude/2) * Math.sin(2 * Math.PI * widthFrequency * timeSeconds);
                    
                    // Store the width oscillation factor
                    window.ringWidthOscillations[r] = oscillationFactor;
                } else {
                    // Reset to default if oscillation disabled
                    window.ringWidthOscillations[r] = 1;
                }
            }
        }
        
        // Start from center and build outward
        let currentRadius = 0;
        
        // Draw rings from inside to outside
        for (let r = 0; r < ringCount; r++) {
            // Calculate this ring's width using the individual setting and apply width oscillation factor
            const widthOscillationFactor = window.ringWidthOscillations ? window.ringWidthOscillations[r] : 1;
            const thisRingWidth = baseRingUnit * individualRingWidths[r] * widthOscillationFactor;
            
            // Inner radius is where the previous ring ended
            const innerRadius = currentRadius;
            // Outer radius adds this ring's width
            const outerRadius = innerRadius + thisRingWidth;
            
            // Update the current radius for the next ring
            currentRadius = outerRadius;
            
            // Get the current rotation for this ring
            const ringRotation = ringRotations[r];
            
            // Always use primary color for innermost (r=0) and outermost rings
            const isInnermostRing = r === 0;
            const isOutermostRing = r === ringCount - 1;
            const forceRingPrimaryColor = isInnermostRing || isOutermostRing;
            
            // Calculate a ring phase to ensure consistent color alternation
            const ringPhase = r % 2;
            
            // Check if this ring should use a solid color
            const solidColorToggle = document.getElementById(`ring${r+1}SolidColor`);
            const colorChoice = document.getElementById(`ring${r+1}ColorChoice`);
            
            const useSolidColor = solidColorToggle && solidColorToggle.checked;
            const solidColorChoice = colorChoice ? colorChoice.value : 'primary';
            
            // Check if this ring uses a custom stripe angle
            const customStripeAngleToggle = document.getElementById(`ring${r+1}CustomStripeAngle`);
            const stripeAngleInput = document.getElementById(`ring${r+1}StripeAngle`);
            
            const useCustomStripeAngle = customStripeAngleToggle && customStripeAngleToggle.checked;
            const ringStripeAngle = useCustomStripeAngle && stripeAngleInput ? 
                parseFloat(stripeAngleInput.value) : 
                alternateStripAngles ? (r % 2 === 0 ? stripAngle : -stripAngle) : stripAngle;
            
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
                
                // If using solid color, skip the striping and just fill the segment
                if (useSolidColor) {
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
                    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
                    ctx.closePath();
                    
                    // Use selected color
                    ctx.fillStyle = solidColorChoice === 'primary' ? primaryColor : secondaryColor;
                    ctx.fill();
                } else {
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
                        ringStripeAngle,
                        gradientEnabled,
                        gradientIntensity,
                        edgeBrightness,
                        centerDarkness,
                        gradientWidth,
                        gradientCurve
                    );
                }
            }
        }
        
        // Continue animation if not paused
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
    const ringOscillationPhases = [];
    
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
    
    // Initialize the ring rotations
    function initRotations(ringCount) {
        ringRotations.length = 0;
        ringOscillationPhases.length = 0;
        for (let i = 0; i < ringCount; i++) {
            ringRotations.push(0); // Start at 0 rotation
            ringOscillationPhases.push(0);
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
        
        // Calculate the radial distance (ring thickness)
        const ringThickness = outerRadius - innerRadius;
        
        // Calculate the middle radius for offset calculations
        const middleRadius = (outerRadius + innerRadius) / 2;
        
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
            
            // FIXED: Calculate angle shifts differently for inner and outer edges
            // to preserve ring width while applying stripe angle
            const angleOffsetInner = 0; // Keep inner edge at original angle
            // Scale the angle offset based on radius but preserve ring thickness
            const angleOffsetOuter = stripAngleRad * (ringThickness / middleRadius);
            
            // Apply the angle shift only to outer edges to maintain consistent ring width
            const adjustedOuterStart = stripeStartAngle + angleOffsetOuter;
            const adjustedOuterEnd = stripeEndAngle + angleOffsetOuter;
            const adjustedInnerStart = stripeStartAngle; // No offset for inner edges
            const adjustedInnerEnd = stripeEndAngle;
            
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
            // midOuterX = (midOuterX + midInnerX) / 2;
            // midOuterY = (midOuterY + midInnerY) / 2;
            // midInnerX = (midOuterX + midInnerX) / 2;
            // midInnerY = (midOuterY + midInnerY) / 2;
            
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
            const gradientOffset = stripWidth
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
                        gradient.addColorStop(0.5, lighterColor);
                        gradient.addColorStop(0.6, deeperColor);  // Linear transition to deep
                        gradient.addColorStop(0.7, deeperColor);   // Flat section
                        gradient.addColorStop(0.8, deeperColor);   // Flat section
                        gradient.addColorStop(0.9, lighterColor); // Linear transition back
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
                        gradient.addColorStop(0, deeperColor);     // Changed from lighterColor
                        gradient.addColorStop(0.49, deeperColor);  // Changed from lighterColor
                        gradient.addColorStop(0.5, lighterColor);  // Changed from deeperColor
                        gradient.addColorStop(0.51, deeperColor);  // Changed from lighterColor
                        gradient.addColorStop(1, deeperColor);     // Changed from lighterColor
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
        const canvas = document.getElementById('blazeCanvas');
        // Set canvas size to be larger than the viewport
        canvas.width = window.innerWidth * 1.5;
        canvas.height = window.innerHeight * 1.5;
        
        // Update WebGL canvas if it exists
        const glCanvas = document.getElementById('blazeGLCanvas');
        if (glCanvas) {
            glCanvas.width = canvas.width;
            glCanvas.height = canvas.height;
        }
        
        // Force redraw with the new dimensions
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
        createRingWidthControls();  // Regenerate controls when ring count changes
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
    
    // Modify the createRingWidthControls function
    function createRingWidthControls() {
        console.log("Creating ring width controls");
        const ringCount = parseInt(ringCountControl.value);
        const container = document.getElementById('individualRingWidths');
        
        // Clear existing controls
        container.innerHTML = '';
        
        // Create a scrollable container for the controls
        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'ring-width-scrollable';
        container.appendChild(scrollContainer);
        
        // Create controls for each ring
        for (let i = 1; i <= ringCount; i++) {
            // Create control group div
            const controlGroup = document.createElement('div');
            controlGroup.className = 'control-group ring-width-control';
            controlGroup.id = `ring${i}WidthControl`;
            
            // Create label row with width settings
            const widthRow = document.createElement('div');
            widthRow.className = 'ring-control-row';
            
            // Create label
            const label = document.createElement('label');
            label.htmlFor = `ring${i}Width`;
            label.textContent = `Ring ${i} Width `;
            
            // Create value display span
            const valueDisplay = document.createElement('span');
            valueDisplay.className = 'value-display';
            valueDisplay.id = `ring${i}WidthValue`;
            valueDisplay.textContent = '100%';
            
            // Append value display to label
            label.appendChild(valueDisplay);
            
            // Create slider input
            const input = document.createElement('input');
            input.type = 'range';
            input.id = `ring${i}Width`;
            input.min = '1';
            input.max = '500';
            input.value = '100';
            
            // Add event listener to the input
            input.addEventListener('input', () => {
                valueDisplay.textContent = `${input.value}%`;
                saveSettings();
            });
            
            // Assemble width row
            widthRow.appendChild(label);
            widthRow.appendChild(input);
            controlGroup.appendChild(widthRow);
            
            // Add stripe angle controls row
            const stripeAngleRow = document.createElement('div');
            stripeAngleRow.className = 'ring-control-row';
            
            // Create stripe angle toggle
            const stripeAngleToggleLabel = document.createElement('label');
            stripeAngleToggleLabel.className = 'stripe-angle-toggle-label';
            stripeAngleToggleLabel.htmlFor = `ring${i}CustomStripeAngle`;
            stripeAngleToggleLabel.textContent = 'Custom Stripe Angle';
            
            const stripeAngleToggle = document.createElement('input');
            stripeAngleToggle.type = 'checkbox';
            stripeAngleToggle.id = `ring${i}CustomStripeAngle`;
            stripeAngleToggle.className = 'ring-stripe-angle-toggle';
            
            stripeAngleToggleLabel.prepend(stripeAngleToggle);
            
            // Create stripe angle slider
            const stripeAngleLabel = document.createElement('label');
            stripeAngleLabel.htmlFor = `ring${i}StripeAngle`;
            stripeAngleLabel.textContent = 'Angle';
            stripeAngleLabel.className = 'stripe-angle-label';
            
            const stripeAngleInput = document.createElement('input');
            stripeAngleInput.type = 'range';
            stripeAngleInput.id = `ring${i}StripeAngle`;
            stripeAngleInput.className = 'stripe-angle-input';
            stripeAngleInput.min = '-45';
            stripeAngleInput.max = '45';
            stripeAngleInput.step = '1';
            stripeAngleInput.value = '0';
            stripeAngleInput.disabled = !stripeAngleToggle.checked;
            
            const stripeAngleValue = document.createElement('span');
            stripeAngleValue.className = 'value-display';
            stripeAngleValue.id = `ring${i}StripeAngleValue`;
            stripeAngleValue.textContent = '0°';
            
            // Add event listeners
            stripeAngleToggle.addEventListener('change', () => {
                stripeAngleInput.disabled = !stripeAngleToggle.checked;
                saveSettings();
            });
            
            stripeAngleInput.addEventListener('input', () => {
                stripeAngleValue.textContent = `${stripeAngleInput.value}°`;
                saveSettings();
            });
            
            // Assemble stripe angle row
            stripeAngleRow.appendChild(stripeAngleToggleLabel);
            stripeAngleRow.appendChild(stripeAngleLabel);
            stripeAngleRow.appendChild(stripeAngleInput);
            stripeAngleRow.appendChild(stripeAngleValue);
            
            controlGroup.appendChild(stripeAngleRow);
            
            // Create solid color row
            const colorRow = document.createElement('div');
            colorRow.className = 'ring-control-row';
            
            // Create solid color toggle
            const colorToggleLabel = document.createElement('label');
            colorToggleLabel.className = 'color-toggle-label';
            colorToggleLabel.htmlFor = `ring${i}SolidColor`;
            colorToggleLabel.textContent = 'Solid Color';
            
            const colorToggle = document.createElement('input');
            colorToggle.type = 'checkbox';
            colorToggle.id = `ring${i}SolidColor`;
            colorToggle.className = 'ring-solid-toggle';
            
            colorToggleLabel.prepend(colorToggle);
            
            // Create color selection dropdown
            const colorSelect = document.createElement('select');
            colorSelect.id = `ring${i}ColorChoice`;
            colorSelect.className = 'ring-color-select';
            colorSelect.disabled = !colorToggle.checked;
            
            const primaryOption = document.createElement('option');
            primaryOption.value = 'primary';
            primaryOption.textContent = 'Primary';
            colorSelect.appendChild(primaryOption);
            
            const secondaryOption = document.createElement('option');
            secondaryOption.value = 'secondary';
            secondaryOption.textContent = 'Secondary';
            colorSelect.appendChild(secondaryOption);
            
            // Add event listeners
            colorToggle.addEventListener('change', () => {
                colorSelect.disabled = !colorToggle.checked;
                saveSettings();
            });
            
            colorSelect.addEventListener('change', saveSettings);
            
            // Assemble color row
            colorRow.appendChild(colorToggleLabel);
            colorRow.appendChild(colorSelect);
            controlGroup.appendChild(colorRow);
            
            // Add oscillation controls row
            const oscillationRow = document.createElement('div');
            oscillationRow.className = 'ring-control-row';
            
            // Create oscillation toggle
            const oscillationToggleLabel = document.createElement('label');
            oscillationToggleLabel.className = 'oscillation-toggle-label';
            oscillationToggleLabel.htmlFor = `ring${i}Oscillate`;
            oscillationToggleLabel.textContent = 'Oscillate';
            
            const oscillationToggle = document.createElement('input');
            oscillationToggle.type = 'checkbox';
            oscillationToggle.id = `ring${i}Oscillate`;
            oscillationToggle.className = 'ring-oscillate-toggle';
            
            oscillationToggleLabel.prepend(oscillationToggle);
            
            // Create period input
            const periodLabel = document.createElement('label');
            periodLabel.htmlFor = `ring${i}Period`;
            periodLabel.textContent = 'Period';
            periodLabel.className = 'period-label';
            
            const periodInput = document.createElement('input');
            periodInput.type = 'range';
            periodInput.id = `ring${i}Period`;
            periodInput.className = 'period-input';
            periodInput.min = '1';
            periodInput.max = '20';
            periodInput.value = '5';
            periodInput.disabled = !oscillationToggle.checked;
            
            const periodValue = document.createElement('span');
            periodValue.className = 'value-display';
            periodValue.id = `ring${i}PeriodValue`;
            periodValue.textContent = '5s';
            
            // Add event listeners
            oscillationToggle.addEventListener('change', () => {
                periodInput.disabled = !oscillationToggle.checked;
                saveSettings();
            });
            
            periodInput.addEventListener('input', () => {
                periodValue.textContent = `${periodInput.value}s`;
                saveSettings();
            });
            
            // Assemble oscillation row
            oscillationRow.appendChild(oscillationToggleLabel);
            oscillationRow.appendChild(periodLabel);
            oscillationRow.appendChild(periodInput);
            oscillationRow.appendChild(periodValue);
            
            controlGroup.appendChild(oscillationRow);
            
            // Add width oscillation controls row
            const widthOscillationRow = document.createElement('div');
            widthOscillationRow.className = 'ring-control-row';
            
            // Create width oscillation toggle
            const widthOscillationToggleLabel = document.createElement('label');
            widthOscillationToggleLabel.className = 'oscillation-toggle-label';
            widthOscillationToggleLabel.htmlFor = `ring${i}WidthOscillate`;
            widthOscillationToggleLabel.textContent = 'Width Oscillate';
            
            const widthOscillationToggle = document.createElement('input');
            widthOscillationToggle.type = 'checkbox';
            widthOscillationToggle.id = `ring${i}WidthOscillate`;
            widthOscillationToggle.className = 'ring-oscillate-toggle';
            
            widthOscillationToggleLabel.prepend(widthOscillationToggle);
            
            // Create width period input
            const widthPeriodLabel = document.createElement('label');
            widthPeriodLabel.htmlFor = `ring${i}WidthPeriod`;
            widthPeriodLabel.textContent = 'Period';
            widthPeriodLabel.className = 'period-label';
            
            const widthPeriodInput = document.createElement('input');
            widthPeriodInput.type = 'range';
            widthPeriodInput.id = `ring${i}WidthPeriod`;
            widthPeriodInput.className = 'period-input';
            widthPeriodInput.min = '1';
            widthPeriodInput.max = '20';
            widthPeriodInput.value = '5';
            widthPeriodInput.disabled = !widthOscillationToggle.checked;
            
            const widthPeriodValue = document.createElement('span');
            widthPeriodValue.className = 'value-display';
            widthPeriodValue.id = `ring${i}WidthPeriodValue`;
            widthPeriodValue.textContent = '5s';
            
            // Add event listeners
            widthOscillationToggle.addEventListener('change', () => {
                widthPeriodInput.disabled = !widthOscillationToggle.checked;
                saveSettings();
            });
            
            widthPeriodInput.addEventListener('input', () => {
                widthPeriodValue.textContent = `${widthPeriodInput.value}s`;
                saveSettings();
            });
            
            // Create amplitude control for width oscillation
            const widthAmplitudeLabel = document.createElement('label');
            widthAmplitudeLabel.htmlFor = `ring${i}WidthAmplitude`;
            widthAmplitudeLabel.textContent = 'Amp';
            widthAmplitudeLabel.className = 'amplitude-label';
            
            const widthAmplitudeInput = document.createElement('input');
            widthAmplitudeInput.type = 'range';
            widthAmplitudeInput.id = `ring${i}WidthAmplitude`;
            widthAmplitudeInput.className = 'amplitude-input';
            widthAmplitudeInput.min = '10';
            widthAmplitudeInput.max = '100';
            widthAmplitudeInput.value = '50';
            widthAmplitudeInput.disabled = !widthOscillationToggle.checked;
            
            const widthAmplitudeValue = document.createElement('span');
            widthAmplitudeValue.className = 'value-display';
            widthAmplitudeValue.id = `ring${i}WidthAmplitudeValue`;
            widthAmplitudeValue.textContent = '50%';
            
            widthAmplitudeInput.addEventListener('input', () => {
                widthAmplitudeValue.textContent = `${widthAmplitudeInput.value}%`;
                saveSettings();
            });
            
            // Assemble width oscillation row
            widthOscillationRow.appendChild(widthOscillationToggleLabel);
            widthOscillationRow.appendChild(widthPeriodLabel);
            widthOscillationRow.appendChild(widthPeriodInput);
            widthOscillationRow.appendChild(widthPeriodValue);
            
            // Create second row for amplitude control
            const widthAmplitudeRow = document.createElement('div');
            widthAmplitudeRow.className = 'ring-control-row width-amplitude-row';
            widthAmplitudeRow.appendChild(document.createElement('div')); // Spacer
            widthAmplitudeRow.appendChild(widthAmplitudeLabel);
            widthAmplitudeRow.appendChild(widthAmplitudeInput);
            widthAmplitudeRow.appendChild(widthAmplitudeValue);
            
            controlGroup.appendChild(widthOscillationRow);
            controlGroup.appendChild(widthAmplitudeRow);
            
            // Add to scrollable container
            scrollContainer.appendChild(controlGroup);
        }
        
        // Instead of setTimeout, directly call our new apply function
        // which will use the stored settings
        applyRingSettings();
    }
    
    // Initialize - improve the sequence
    function initialize() {
        // First load all global settings
        loadSettings();
        
        // Then create the ring controls based on the loaded ring count
        createRingWidthControls();
        
        // Create template controls
        createTemplateControls();
        
        // Initialize rotations
        initRotations(parseInt(ringCountControl.value));
        
        // Start animation
        startAnimation();
    }

    // Call initialize
    initialize();

    // Auto-collapse controls on mobile
    if (window.innerWidth < 768) {
        controlsContainer.classList.add('collapsed');
    }

    // Add CSS for the new ring color controls
    const style = document.createElement('style');
    style.textContent = `
        .ring-control-row {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .ring-control-row label {
            flex: 1;
            margin-bottom: 0;
        }
        
        .color-toggle-label {
            display: flex;
            align-items: center;
        }
        
        .ring-solid-toggle {
            margin-right: 8px;
        }
        
        .ring-color-select {
            width: 100px;
            height: 28px;
        }
        
        .oscillation-toggle-label {
            display: flex;
            align-items: center;
            width: 80px;
        }
        
        .ring-oscillate-toggle {
            margin-right: 8px;
        }
        
        .period-label {
            margin: 0 8px;
            width: 50px;
        }
        
        .period-input {
            width: 100px;
        }
        
        .stripe-angle-toggle-label {
            display: flex;
            align-items: center;
            width: 150px;
        }
        
        .ring-stripe-angle-toggle {
            margin-right: 8px;
        }
        
        .stripe-angle-label {
            margin: 0 8px;
            width: 40px;
        }
        
        .stripe-angle-input {
            width: 100px;
        }
        
        .amplitude-label {
            margin: 0 8px;
            width: 40px;
        }
        
        .amplitude-input {
            width: 100px;
        }
        
        .width-amplitude-row {
            padding-left: 80px;
        }
        
        /* Template controls styling */
        .template-name-input {
            width: 100%;
            height: 32px;
            padding: 0 8px;
            border: 2px solid #ddd;
            margin-bottom: 10px;
        }
        
        .template-button {
            margin-top: 5px;
            margin-right: 10px;
        }
        
        .template-button-group {
            display: flex;
            margin-top: 10px;
        }
        
        .template-load-group {
            margin-top: 20px;
        }
    `;
    document.head.appendChild(style);

    // Add this function after createRingWidthControls to create the template management UI
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
                // controlSections.appendChild(templateSection);
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

    // Add these functions to handle template operations
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

    function loadTemplateList() {
        const templatesJson = localStorage.getItem('blazeTemplates');
        return templatesJson ? JSON.parse(templatesJson) : [];
    }

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

    // Apply settings to all controls
    function applySettings(settings) {
        // Apply global settings
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
        
        // Handle WebGL if needed
        if (settings.glowEnabled) {
            setupWebGL();
        } else {
            setupCanvas2D();
        }
        
        // Store ring settings for later application after controls are created
        window.storedRingSettings = settings.ringSettings;
        
        // Recreate ring controls with new ring count
        createRingWidthControls();
        
        // Initialize rotations with new ring count
        initRotations(parseInt(ringCountControl.value));
        
        // Force redraw
        drawBlaze();
    }

    // Add function to initialize preset natural phenomena templates
    function initializePresetTemplates() {
        console.log("Initializing preset natural phenomena templates...");
        
        // Check if we've already added presets
        const existingTemplates = loadTemplateList();
        
        // Only add presets if no templates exist or if forced
        if (existingTemplates.length === 0 || window.forcePresetTemplates) {
            const presetTemplates = [
                {
                    name: "Ocean Swells",
                    settings: createTemplateSettings({
                        colorScheme: 'egypt1',
                        ringCount: 7,
                        segmentCount: 8,
                        stripeCount: 6,
                        rotationSpeed: 0.002,
                        stripAngle: 15,
                        alternateStripAngles: true,
                        gradientEnabled: true,
                        gradientCurve: 'sine',
                        ringSettings: [
                            { widthOscillate: true, widthPeriod: 8, widthAmplitude: 40 },
                            { widthOscillate: true, widthPeriod: 9, widthAmplitude: 45 },
                            { widthOscillate: true, widthPeriod: 10, widthAmplitude: 50 },
                            { widthOscillate: true, widthPeriod: 11, widthAmplitude: 55 },
                            { widthOscillate: true, widthPeriod: 12, widthAmplitude: 60 },
                            { widthOscillate: true, widthPeriod: 10, widthAmplitude: 50 },
                            { widthOscillate: true, widthPeriod: 8, widthAmplitude: 40 }
                        ]
                    })
                },
                {
                    name: "Heartbeat Rhythm",
                    settings: createTemplateSettings({
                        colorScheme: 'ra',
                        ringCount: 4,
                        segmentCount: 2,
                        stripeCount: 5,
                        rotationSpeed: 0.004,
                        alternateRotation: true,
                        gradientEnabled: true,
                        gradientIntensity: 80,
                        gradientCurve: 'ease-in-out',
                        ringSettings: [
                            { widthOscillate: true, widthPeriod: 0.8, widthAmplitude: 85 },
                            { widthOscillate: true, widthPeriod: 0.8, widthAmplitude: 85 },
                            { widthOscillate: true, widthPeriod: 0.8, widthAmplitude: 85 },
                            { widthOscillate: true, widthPeriod: 0.8, widthAmplitude: 85 }
                        ]
                    })
                },
                {
                    name: "Breathing Meditation",
                    settings: createTemplateSettings({
                        colorScheme: 'chant',
                        ringCount: 3,
                        segmentCount: 8,
                        stripeCount: 4,
                        rotationSpeed: 0.001,
                        gradientEnabled: true,
                        gradientIntensity: 30,
                        gradientCurve: 'ease-in-out',
                        ringSettings: [
                            { widthOscillate: true, widthPeriod: 5, widthAmplitude: 40 },
                            { widthOscillate: true, widthPeriod: 5, widthAmplitude: 40 },
                            { widthOscillate: true, widthPeriod: 5, widthAmplitude: 40 }
                        ]
                    })
                },
                {
                    name: "Hummingbird Wings",
                    settings: createTemplateSettings({
                        colorScheme: 'psychedelic',
                        ringCount: 12,
                        segmentCount: 10,
                        stripeCount: 12,
                        rotationSpeed: 0.025,
                        alternateRotation: true,
                        alternateStripAngles: true,
                        stripAngle: 20,
                        ringWidth: 50, // Thinner rings
                        ringSettings: Array(12).fill({}).map(() => ({
                            widthOscillate: true,
                            widthPeriod: 0.1,
                            widthAmplitude: 20
                        }))
                    })
                },
                {
                    name: "Forest Breeze",
                    settings: createTemplateSettings({
                        colorScheme: 'yg',
                        ringCount: 6,
                        segmentCount: 8,
                        stripeCount: 5,
                        rotationSpeed: 0.003,
                        gradientEnabled: true,
                        gradientCurve: 'organic',
                        ringSettings: [
                            { widthOscillate: true, widthPeriod: 2, widthAmplitude: 25, customStripeAngle: true, stripeAngle: -5 },
                            { widthOscillate: true, widthPeriod: 3, widthAmplitude: 30, customStripeAngle: true, stripeAngle: 0 },
                            { widthOscillate: true, widthPeriod: 4, widthAmplitude: 35, customStripeAngle: true, stripeAngle: 5 },
                            { widthOscillate: true, widthPeriod: 5, widthAmplitude: 30, customStripeAngle: true, stripeAngle: 10 },
                            { widthOscillate: true, widthPeriod: 4, widthAmplitude: 25, customStripeAngle: true, stripeAngle: 15 },
                            { widthOscillate: true, widthPeriod: 3, widthAmplitude: 30, customStripeAngle: true, stripeAngle: 5 }
                        ]
                    })
                },
                {
                    name: "Whale Song",
                    settings: createTemplateSettings({
                        colorScheme: 'deep-ocean', // New color scheme
                        ringCount: 5,
                        segmentCount: 12,
                        stripeCount: 3,
                        rotationSpeed: 0.001,
                        gradientEnabled: true,
                        edgeBrightness: 70,
                        ringSettings: [
                            { widthOscillate: true, widthPeriod: 30, widthAmplitude: 70 },
                            { widthOscillate: true, widthPeriod: 45, widthAmplitude: 70 },
                            { widthOscillate: true, widthPeriod: 60, widthAmplitude: 70 },
                            { widthOscillate: true, widthPeriod: 75, widthAmplitude: 70 },
                            { widthOscillate: true, widthPeriod: 90, widthAmplitude: 70 }
                        ]
                    })
                },
                {
                    name: "Firefly Synchronization",
                    settings: createTemplateSettings({
                        colorScheme: 'firefly', // New color scheme
                        ringCount: 8,
                        segmentCount: 8,
                        stripeCount: 1,
                        rotationSpeed: 0.005,
                        alternateRotation: true,
                        glowEnabled: true,
                        glowIntensity: 80,
                        glowSize: 8,
                        glowColor: '#88ff22',
                        ringSettings: [
                            { widthOscillate: true, widthPeriod: 1.0, widthAmplitude: 70 },
                            { widthOscillate: true, widthPeriod: 1.1, widthAmplitude: 75 },
                            { widthOscillate: true, widthPeriod: 1.2, widthAmplitude: 80 },
                            { widthOscillate: true, widthPeriod: 1.3, widthAmplitude: 70 },
                            { widthOscillate: true, widthPeriod: 1.4, widthAmplitude: 60 },
                            { widthOscillate: true, widthPeriod: 1.5, widthAmplitude: 65 },
                            { widthOscillate: true, widthPeriod: 1.6, widthAmplitude: 70 },
                            { widthOscillate: true, widthPeriod: 1.7, widthAmplitude: 80 }
                        ]
                    })
                },
                {
                    name: "Alpha Mind",
                    settings: createTemplateSettings({
                        colorScheme: 'late70s',
                        ringCount: 8,
                        segmentCount: 16,
                        stripeCount: 8,
                        rotationSpeed: 0.008,
                        ringWidth: 60, // Thinner rings
                        gradientEnabled: true,
                        gradientIntensity: 30,
                        gradientCurve: 'ease-in-out',
                        ringSettings: Array(8).fill({}).map(() => ({
                            widthOscillate: true,
                            widthPeriod: 0.1,
                            widthAmplitude: 30
                        }))
                    })
                },
                {
                    name: "Tidal Rhythms",
                    settings: createTemplateSettings({
                        colorScheme: 'egypt2',
                        ringCount: 3,
                        segmentCount: 4,
                        stripeCount: 6,
                        rotationSpeed: 0.0005,
                        gradientEnabled: true,
                        gradientIntensity: 80,
                        gradientCurve: 'trapezoid',
                        ringSettings: [
                            { widthOscillate: true, widthPeriod: 60, widthAmplitude: 60 },
                            { widthOscillate: true, widthPeriod: 120, widthAmplitude: 60 },
                            { widthOscillate: true, widthPeriod: 180, widthAmplitude: 60 }
                        ]
                    })
                },
                {
                    name: "Wolf Chorus",
                    settings: createTemplateSettings({
                        colorScheme: 'wolf-night', // New color scheme
                        ringCount: 7,
                        segmentCount: 10,
                        stripeCount: 5,
                        rotationSpeed: 0.003,
                        gradientEnabled: true,
                        gradientIntensity: 50,
                        gradientCurve: 'step',
                        ringSettings: [
                            { widthOscillate: true, widthPeriod: 30, widthAmplitude: 40, customStripeAngle: true, stripeAngle: -30 },
                            { widthOscillate: true, widthPeriod: 45, widthAmplitude: 50, customStripeAngle: true, stripeAngle: -20 },
                            { widthOscillate: true, widthPeriod: 60, widthAmplitude: 60, customStripeAngle: true, stripeAngle: -10 },
                            { widthOscillate: true, widthPeriod: 75, widthAmplitude: 70, customStripeAngle: true, stripeAngle: 0 },
                            { widthOscillate: true, widthPeriod: 60, widthAmplitude: 80, customStripeAngle: true, stripeAngle: 10 },
                            { widthOscillate: true, widthPeriod: 45, widthAmplitude: 90, customStripeAngle: true, stripeAngle: 20 },
                            { widthOscillate: true, widthPeriod: 30, widthAmplitude: 70, customStripeAngle: true, stripeAngle: 30 }
                        ]
                    })
                }
            ];
            
            // Add the presets to localStorage
            const existingTemplates = loadTemplateList();
            const combinedTemplates = [...existingTemplates, ...presetTemplates];
            localStorage.setItem('blazeTemplates', JSON.stringify(combinedTemplates));
            
            console.log(`Added ${presetTemplates.length} preset templates`);
        } else {
            console.log("Preset templates already exist, skipping initialization");
        }
    }

    // Helper function to create template settings with defaults
    function createTemplateSettings(options) {
        // Default settings
        const defaults = {
            ringCount: 8,
            segmentCount: 8,
            stripeCount: 4,
            angleOffset: 0,
            rotationSpeed: 0.005,
            alternateRotation: false,
            colorScheme: 'bw',
            stripAngle: 0,
            alternateStripAngles: false,
            ringWidth: 100,
            gradientEnabled: false,
            gradientIntensity: 50,
            edgeBrightness: 50,
            centerDarkness: 50,
            gradientWidth: 1,
            gradientCurve: 'linear',
            primaryColor: '#000000',
            secondaryColor: '#ffffff',
            glowEnabled: false,
            glowIntensity: 50,
            glowSize: 5,
            glowColor: '#ffffff',
            ringSettings: []
        };
        
        // Merge provided options with defaults
        const settings = {...defaults, ...options};
        
        // Ensure each ring has complete settings
        if (settings.ringSettings && settings.ringSettings.length > 0) {
            const defaultRingSettings = {
                width: 100,
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
            
            // Create full settings for each ring by merging with defaults
            settings.ringSettings = settings.ringSettings.map(ring => ({...defaultRingSettings, ...ring}));
            
            // If we have fewer ring settings than ringCount, duplicate the last one
            while (settings.ringSettings.length < settings.ringCount) {
                settings.ringSettings.push({...settings.ringSettings[settings.ringSettings.length - 1]});
            }
        }
        
        return settings;
    }

    // Add new color schemes
    function addNewColorSchemes() {
        // First, let's check if we have a switch case for color schemes in drawBlaze function
        // and add new schemes to it if they don't exist
        
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

    // Update initialize function to include our new color schemes and preset templates
    function initialize() {
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
        
        // Initialize rotations
        initRotations(parseInt(ringCountControl.value));
        
        // Start animation
        startAnimation();
        
        // Update the color scheme dropdown to include the new options
        updateColorSchemeOptions();
    }

    // Add this function to update the color scheme dropdown
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

    // ... existing code ...
});

// Add this helper function for color mixing

// Add a function to update visible ring controls based on ring count
function updateRingWidthControls() {
    const ringCount = parseInt(ringCountControl.value);
    const container = document.getElementById('individualRingWidths');
    
    // First hide all controls
    const allControls = container.querySelectorAll('.ring-width-control');
    allControls.forEach(control => {
        control.style.display = 'none';
    });
    
    // Show only the needed controls for current ring count
    for (let i = 1; i <= ringCount; i++) {
        const control = document.getElementById(`ring${i}WidthControl`);
        if (control) {
            control.style.display = 'block';
        }
    }
}

// Fix the stripe drawing code to correctly handle angled stripes across all rings
function drawSegmentStripes(ctx, centerX, centerY, innerRadius, outerRadius, startAngle, endAngle, 
                          stripeColor, stripeCount, currentStripAngle, gradientEnabled, 
                          gradientParams) {
    
    // Calculate the arc length at the middle radius for more consistent stripe spacing
    const middleRadius = (innerRadius + outerRadius) / 2;
    const arcLength = middleRadius * (endAngle - startAngle);
    
    // Width of each stripe based on the arc length
    const stripeWidth = arcLength / (stripeCount * 2); // Double for space between stripes
    
    // Convert stripe angle from degrees to radians
    const stripAngleRad = currentStripAngle * (Math.PI / 180);
    
    // Calculate the radial distance (ring thickness)
    const ringThickness = outerRadius - innerRadius;
    
    // Important: Adjust for curvature but maintain consistent ring thickness
    const curvatureCompensation = outerRadius / innerRadius;
    
    for (let s = 0; s < stripeCount; s++) {
        // Position each stripe evenly across the segment
        const stripePosition = s / stripeCount;
        const stripeAngle = startAngle + (endAngle - startAngle) * stripePosition;
        
        // Calculate width for this stripe, accounting for curvature
        const adjustedWidth = stripeWidth * (1 + (curvatureCompensation - 1) * stripePosition);
        
        // Calculate the four corners of the stripe
        const innerAngleStart = stripeAngle - (adjustedWidth / innerRadius / 2);
        const innerAngleEnd = stripeAngle + (adjustedWidth / innerRadius / 2);
        
        // IMPORTANT FIX: Scale the angle offset based on radius but preserve ring thickness
        // This ensures stripe angle doesn't affect perceived ring width
        const angleOffsetInner = 0;
        // Instead of dividing by radiusRatio, we need to carefully adjust the offset
        const angleOffsetOuter = stripAngleRad * (ringThickness / middleRadius);
        
        const outerAngleStart = stripeAngle - (adjustedWidth / outerRadius / 2) + angleOffsetOuter;
        const outerAngleEnd = stripeAngle + (adjustedWidth / outerRadius / 2) + angleOffsetOuter;
        
        // Calculate the actual points
        const x1 = centerX + innerRadius * Math.cos(innerAngleStart);
        const y1 = centerY + innerRadius * Math.sin(innerAngleStart);
        const x2 = centerX + innerRadius * Math.cos(innerAngleEnd);
        const y2 = centerY + innerRadius * Math.sin(innerAngleEnd);
        const x3 = centerX + outerRadius * Math.cos(outerAngleEnd);
        const y3 = centerY + outerRadius * Math.sin(outerAngleEnd);
        const x4 = centerX + outerRadius * Math.cos(outerAngleStart);
        const y4 = centerY + outerRadius * Math.sin(outerAngleStart);
        
        // Draw the stripe
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.closePath();
        
        // Apply fill color or gradient
        if (gradientEnabled && gradientParams) {
            // Create and apply gradient
            const gradient = ctx.createLinearGradient(
                centerX + innerRadius * Math.cos(stripeAngle),
                centerY + innerRadius * Math.sin(stripeAngle),
                centerX + outerRadius * Math.cos(stripeAngle),
                centerY + outerRadius * Math.sin(stripeAngle)
            );
            
            // Apply gradient stops based on the curve type
            applyGradientStops(gradient, gradientParams, stripeColor);
            
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = stripeColor;
        }
        
        ctx.fill();
    }
}



