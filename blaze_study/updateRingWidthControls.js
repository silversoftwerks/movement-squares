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
