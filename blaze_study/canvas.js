
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
        
        // Normalize the direction vector (with safety check for zero length)
        const normalizedDirX = stripLength > 0.0001 ? stripDirX / stripLength : 1;
        const normalizedDirY = stripLength > 0.0001 ? stripDirY / stripLength : 0;
        
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
        
        // Validate coordinates to prevent non-finite values
        if (!isFinite(gradientX1) || !isFinite(gradientY1) || !isFinite(gradientX2) || !isFinite(gradientY2)) {
            // Fallback to solid color if gradient coordinates are invalid
            console.warn("Invalid gradient coordinates detected, falling back to solid color");
            ctx.fillStyle = stripeColor;
            ctx.fill();
            continue; // Skip to next stripe
        }
        
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
