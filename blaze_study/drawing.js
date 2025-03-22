// drawing.js - Functions for drawing the Blaze pattern

// Function to draw the blaze pattern
function drawBlaze(timestamp, customCtx, customCanvas) {
    const ctx = customCtx || document.getElementById('blazeCanvas').getContext('2d');
    const canvas = customCanvas || document.getElementById('blazeCanvas');
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Get parameter values from controls
    const ringCount = parseInt(ringCountControl.value);
    const segments = parseInt(segmentCountControl.value);
    const stripeCount = parseInt(stripeCountControl.value);
    const angleOffset = parseFloat(angleOffsetControl.value);
    const stripAngle = parseFloat(stripAngleControl.value);
    const alternateStripAngles = alternateStripAnglesControl.checked;
    const gradientEnabled = gradientEnabledControl.checked;
    const gradientIntensity = parseInt(gradientIntensityControl.value) / 100;
    const edgeBrightness = parseInt(edgeBrightnessControl.value);
    const centerDarkness = parseInt(centerDarknessControl.value);
    const gradientWidth = parseFloat(gradientWidthControl.value);
    const ringWidthPercent = parseInt(ringWidthControl.value);
    const gradientCurve = gradientCurveControl.value;
    
    // Get color scheme
    const colorScheme = colorSchemeControl.value;
    let primaryColor, secondaryColor;
    
    // Get the colors from color scheme selector
    if (colorScheme === 'custom') {
        primaryColor = primaryColorControl.value;
        secondaryColor = secondaryColorControl.value;
    } else {
        const colors = getColorScheme(colorScheme);
        primaryColor = colors.primary;
        secondaryColor = colors.secondary;
    }
    
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
    
    // Calculate width oscillation for each ring
    if (timestamp) {
        const timeSeconds = timestamp / 1000;
        
        for (let r = 0; r < ringCount; r++) {
            // Check if this ring has width oscillation enabled
            const widthOscillationToggle = document.getElementById(`ring${r+1}WidthOscillate`);
            const widthPeriodInput = document.getElementById(`ring${r+1}WidthPeriod`);
            const widthAmplitudeInput = document.getElementById(`ring${r+1}WidthAmplitude`);
            
            const useWidthOscillation = widthOscillationToggle && widthOscillationToggle.checked;
            if (useWidthOscillation && widthPeriodInput && widthAmplitudeInput) {
                const widthPeriod = parseFloat(widthPeriodInput.value);
                const widthFrequency = 1 / widthPeriod;
                const widthAmplitude = parseInt(widthAmplitudeInput.value) / 100; // Convert percentage to decimal
                
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
                    ctx,
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
    
    // Apply glow effect if enabled
    if (glowEnabledControl.checked && !customCtx) {
        return applyGlowToBlaze(canvas);
    }
    
    return canvas;
}

// Draw a segment of a ring with perpendicular stripes
function drawStripedRingSegment(ctx, cx, cy, outerRadius, innerRadius, startAngle, endAngle, 
    isPrimaryColor, primaryColor, secondaryColor, stripeCount, angleOffset, stripAngle, 
    gradientEnabled, gradientIntensity, edgeBrightness, centerDarkness, gradientWidth, gradientCurve) {
    
    // Get maxRadius
    const maxR = maxRadius || Math.max(outerRadius, Math.max(cx, cy));
    
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
        
        // Calculate angle shifts differently for inner and outer edges
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
            const radiusRatio = meanRadius / maxR; 
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
                    // Angled transitions with flat center
                    gradient.addColorStop(0, lighterColor);
                    gradient.addColorStop(0.3, lighterColor);
                    gradient.addColorStop(0.4, deeperColor);
                    gradient.addColorStop(0.6, deeperColor);
                    gradient.addColorStop(0.7, lighterColor);
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
                    gradient.addColorStop(0, deeperColor);
                    gradient.addColorStop(0.49, deeperColor);
                    gradient.addColorStop(0.5, lighterColor);
                    gradient.addColorStop(0.51, deeperColor);
                    gradient.addColorStop(1, deeperColor);
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

// Apply WebGL glow effect to the drawn blaze
function applyGlowToBlaze(sourceCanvas) {
    // Create a temp canvas for the glow effect
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sourceCanvas.width;
    tempCanvas.height = sourceCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Copy the original canvas to the temp canvas
    tempCtx.drawImage(sourceCanvas, 0, 0);
    
    // Apply the WebGL glow effect to the temp canvas
    const glowedCanvas = applyGlowEffect(tempCanvas);
    
    // Draw the glowed canvas back to the original context
    const ctx = sourceCanvas.getContext('2d');
    ctx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
    ctx.drawImage(glowedCanvas, 0, 0);
    
    return sourceCanvas;
} 