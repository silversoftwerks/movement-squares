// Ring Controls management

// Create ring width controls
function createRingWidthControls() {
    console.log("Creating ring width controls");
    
    // Check if ringCountControl exists, if not we need to initialize controls
    if (!ringCountControl && typeof initializeControls === 'function') {
        initializeControls();
    }
    
    // Still need to check if the control is available
    if (!ringCountControl) {
        console.error("Ring count control not available. Ring controls cannot be created.");
        return;
    }
    
    const ringCount = parseInt(ringCountControl.value);
    const container = document.getElementById('individualRingWidths');
    
    // Check if the container exists
    if (!container) {
        console.error("Individual ring widths container not found. Creating it...");
        
        // Try to find where to add it
        const controlSections = document.querySelector('.control-sections');
        if (!controlSections) {
            console.error("Control sections container not found. Cannot create ring controls.");
            return;
        }
        
        // Create a new section for individual ring controls
        const ringSection = document.createElement('div');
        ringSection.className = 'control-section';
        ringSection.id = 'ringSection';
        
        // Add a title
        const sectionTitle = document.createElement('h2');
        sectionTitle.className = 'section-title';
        sectionTitle.textContent = 'Individual Ring Controls';
        ringSection.appendChild(sectionTitle);
        
        // Create the container
        const newContainer = document.createElement('div');
        newContainer.id = 'individualRingWidths';
        ringSection.appendChild(newContainer);
        
        // Add to control sections
        controlSections.appendChild(ringSection);
        
        // Now get the newly created container
        return setTimeout(createRingWidthControls, 0); // Try again after this tick
    }
    
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
    if (typeof applyRingSettings === 'function') {
        applyRingSettings();
    }
} 