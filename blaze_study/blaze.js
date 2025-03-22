document.addEventListener('DOMContentLoaded', function() {
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
    
    // Get all value displays
    const ringCountValue = document.getElementById('ringCountValue');
    const segmentCountValue = document.getElementById('segmentCountValue');
    const stripeCountValue = document.getElementById('stripeCountValue');
    const angleOffsetValue = document.getElementById('angleOffsetValue');
    const rotationSpeedValue = document.getElementById('rotationSpeedValue');
    const stripAngleValue = document.getElementById('stripAngleValue');
    
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
            alternateStripAngles: alternateStripAnglesControl.checked
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
            rotationSpeedControl.value = settings.rotationSpeed || 0.005;
            alternateRotationControl.checked = settings.alternateRotation !== false;
            colorSchemeControl.value = settings.colorScheme || 'bw';
            primaryColorControl.value = settings.primaryColor || '#000000';
            secondaryColorControl.value = settings.secondaryColor || '#FFFFFF';
            stripAngleControl.value = settings.stripAngle || 0;
            alternateStripAnglesControl.checked = settings.alternateStripAngles !== false;
            
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
        
        // Save settings whenever they change
        saveSettings();
    }
    
    // Draw the Blaze pattern
    function drawBlaze(timestamp) {
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
        
        // Initialize rotations if needed
        if (ringRotations.length === 0) {
            initRotations(ringCount);
        }
        
        // Space between rings - ensure minimum thickness
        const minRingWidth = 0.5;
        const ringWidth = Math.max(minRingWidth, maxRadius / ringCount);
        
        // Angular width of each segment in radians
        const segmentAngle = (Math.PI * 2) / segments;
        
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
            const outerRadius = maxRadius - (r * ringWidth);
            const innerRadius = outerRadius - ringWidth;
            const ringRotation = ringRotations[r]; // Current rotation for this ring
            
            // Draw segments within each ring
            for (let i = 0; i < segments; i++) {
                // Apply rotation to the starting angle
                const startAngle = (i * segmentAngle) + ringRotation;
                const endAngle = startAngle + segmentAngle;
                
                // Draw segment with perpendicular stripes
                drawStripedRingSegment(
                    centerX, 
                    centerY, 
                    outerRadius, 
                    innerRadius, 
                    startAngle, 
                    endAngle, 
                    i % 2 === r % 2, // Determines starting color
                    primaryColor,
                    secondaryColor,
                    stripeCount,
                    angleOffset,
                    alternateStripAngles ? (r % 2 === 0 ? stripAngle : -stripAngle) : stripAngle
                );
            }
        }
        
        // Continue animation
        if (!isPaused) {
            animationId = requestAnimationFrame(drawBlaze);
        }
    }
    
    // Draw a segment of a ring with perpendicular stripes
    function drawStripedRingSegment(cx, cy, outerRadius, innerRadius, startAngle, endAngle, isPrimaryColor, primaryColor, secondaryColor, stripeCount, angleOffset, stripAngle) {
        // Safety check: ensure both radii are positive and outer > inner
        if (outerRadius <= 0 || innerRadius <= 0 || outerRadius <= innerRadius) {
            return; // Skip drawing this segment
        }
        
        // Create angled edges by offsetting the angles
        const outerStartAngle = startAngle + angleOffset;
        const outerEndAngle = endAngle - angleOffset;
        const innerStartAngle = startAngle - angleOffset;
        const innerEndAngle = endAngle + angleOffset;
        
        // Calculate angular width of each stripe
        const mainAngleWidth = endAngle - startAngle;
        const stripeAngleWidth = mainAngleWidth / stripeCount;
        
        // Convert stripAngle from degrees to radians
        const stripAngleRad = (stripAngle * Math.PI) / 180;
        
        // Draw each stripe within the segment
        for (let s = 0; s < stripeCount; s++) {
            // Base angles for the stripe
            const stripeStartAngle = startAngle + (s * stripeAngleWidth);
            const stripeEndAngle = stripeStartAngle + stripeAngleWidth;
            
            // Apply angle offset based on stripAngle
            const adjustedOuterStart = stripeStartAngle;
            const adjustedOuterEnd = stripeEndAngle;
            
            // Calculate inner angles with strip angle adjustment
            // This creates the angled effect by shifting the inner arc
            const midRadius = (outerRadius + innerRadius) / 2;
            const radiusDiff = outerRadius - innerRadius;
            const angleShift = Math.atan2(radiusDiff * Math.sin(stripAngleRad), 
                                           midRadius * stripeAngleWidth);
            
            const adjustedInnerStart = stripeStartAngle - angleShift;
            const adjustedInnerEnd = stripeEndAngle - angleShift;
            
            // Alternate colors for stripes
            const usesPrimaryColor = (s % 2 === 0) ? isPrimaryColor : !isPrimaryColor;
            
            ctx.beginPath();
            
            // Outer arc of the stripe
            ctx.arc(cx, cy, outerRadius, adjustedOuterStart, adjustedOuterEnd);
            
            // Line to inner arc end
            ctx.lineTo(
                cx + innerRadius * Math.cos(adjustedInnerEnd),
                cy + innerRadius * Math.sin(adjustedInnerEnd)
            );
            
            // Inner arc (in counter-clockwise direction)
            ctx.arc(cx, cy, innerRadius, adjustedInnerEnd, adjustedInnerStart, true);
            
            // Line back to outer arc start
            ctx.lineTo(
                cx + outerRadius * Math.cos(adjustedOuterStart),
                cy + outerRadius * Math.sin(adjustedOuterStart)
            );
            
            // Fill and stroke
            ctx.fillStyle = usesPrimaryColor ? primaryColor : secondaryColor;
            ctx.fill();
            ctx.strokeStyle = usesPrimaryColor ? primaryColor : secondaryColor;
            ctx.stroke();
        }
    }
    
    // Start the animation
    function startAnimation() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        isPaused = false;
        pausePlayButton.textContent = 'Pause';
        animationId = requestAnimationFrame(drawBlaze);
    }
    
    // Pause the animation
    function pauseAnimation() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        isPaused = true;
        pausePlayButton.textContent = 'Play';
    }
    
    // Reset the animation
    function resetAnimation() {
        // Reset all ring rotations to 0
        const ringCount = parseInt(ringCountControl.value);
        initRotations(ringCount);
        
        // Redraw with reset values
        if (isPaused) {
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
    
    // Initialize
    loadSettings();
    startAnimation();
    
    // Auto-collapse controls on mobile
    if (window.innerWidth < 768) {
        controlsContainer.classList.add('collapsed');
    }
}); 