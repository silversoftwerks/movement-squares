// Dynamically injected CSS styles for the Blaze application

function injectDynamicStyles() {
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
}

// Call this function to inject the styles
injectDynamicStyles(); 