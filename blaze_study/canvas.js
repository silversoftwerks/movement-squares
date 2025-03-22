// canvas.js - Handles canvas setup and WebGL operations

// Canvas setup
let canvas = document.getElementById('blazeCanvas');
let ctx = canvas.getContext('2d');

// WebGL variables
let gl = null;
let glCanvas = null;
let shaderProgram = null;
let vertexBuffer = null;
let textureBuffer = null;
let framebuffer = null;
let texture = null;

// Make the canvas a perfect square
function setupCanvas() {
    let size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
    canvas.width = size;
    canvas.height = size;
    
    // Set up variables for the pattern
    centerX = size / 2;
    centerY = size / 2;
    maxRadius = size * 0.45; // Slightly smaller than canvas
    
    // Update canvas if window is resized
    window.addEventListener('resize', () => {
        setupCanvas();
        if (gl) {
            setupWebGL(); // Reinitialize WebGL if it's being used
        }
        drawBlaze();
    });
}

// Animation control functions
function startAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    isPaused = false;
    animateBlaze();
}

function stopAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    isPaused = true;
}

// Animation function
function animateBlaze() {
    // Update rotation angles
    const alternateRotation = document.getElementById('alternateRotation')?.checked || false;
    const rotationSpeed = parseFloat(document.getElementById('rotationSpeed')?.value || 0.0005);
    
    for (let i = 0; i < ringRotations.length; i++) {
        // Alternate direction if specified
        const direction = alternateRotation && i % 2 === 1 ? -1 : 1;
        
        // Handle oscillation if enabled for this ring
        let oscillateElement = document.getElementById(`ring${i+1}Oscillate`);
        if (oscillateElement && oscillateElement.checked) {
            const period = parseFloat(document.getElementById(`ring${i+1}Period`)?.value || 5);
            const frequency = 1 / (period * 60); // Convert to frames
            
            // Add time to phase
            ringOscillationPhases[i] += 0.016; // Approximately 1/60, assuming 60fps
            
            // Apply sinusoidal rotation
            const oscillationAmount = Math.sin(ringOscillationPhases[i] * 2 * Math.PI * frequency);
            ringRotations[i] = oscillationAmount * Math.PI / 4; // 45 degrees in radians
        } else {
            // Normal continuous rotation
            ringRotations[i] += direction * rotationSpeed;
        }
    }
    
    // Draw the pattern
    drawBlaze();
    
    // Request next frame
    animationId = requestAnimationFrame(animateBlaze);
}

// Set up WebGL for glow effects
function setupWebGL() {
    // Create a new canvas for WebGL if it doesn't exist
    if (!glCanvas) {
        glCanvas = document.createElement('canvas');
        glCanvas.width = canvas.width;
        glCanvas.height = canvas.height;
        
        // Try to get WebGL context
        try {
            gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
        } catch (e) {
            console.error('WebGL not supported:', e);
            setupCanvas2D(); // Fall back to Canvas2D
            return;
        }
        
        if (!gl) {
            console.error('WebGL not supported');
            setupCanvas2D(); // Fall back to Canvas2D
            return;
        }
        
        // Create shader program
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, getVertexShaderSource());
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, getFragmentShaderSource());
        
        if (!vertexShader || !fragmentShader) {
            console.error('Shader creation failed');
            setupCanvas2D(); // Fall back to Canvas2D
            return;
        }
        
        shaderProgram = createProgram(gl, vertexShader, fragmentShader);
        if (!shaderProgram) {
            console.error('Shader program creation failed');
            setupCanvas2D(); // Fall back to Canvas2D
            return;
        }
        
        // Set up attribute locations
        const positionLocation = gl.getAttribLocation(shaderProgram, 'a_position');
        const texCoordLocation = gl.getAttribLocation(shaderProgram, 'a_texCoord');
        
        // Create buffers
        vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1
        ]), gl.STATIC_DRAW);
        
        textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1
        ]), gl.STATIC_DRAW);
        
        // Create texture
        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        // Set up framebuffer
        framebuffer = gl.createFramebuffer();
    } else {
        glCanvas.width = canvas.width;
        glCanvas.height = canvas.height;
    }
    
    console.log('WebGL initialized successfully');
}

// Helper function to create WebGL shader
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
}

// Helper function to create WebGL program
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
}

// Get vertex shader source code
function getVertexShaderSource() {
    return `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        
        void main() {
            gl_Position = vec4(a_position, 0, 1);
            v_texCoord = a_texCoord;
        }
    `;
}

// Get fragment shader source code
function getFragmentShaderSource() {
    return `
        precision mediump float;
        
        uniform sampler2D u_image;
        uniform vec2 u_resolution;
        uniform float u_glowSize;
        uniform float u_glowIntensity;
        uniform vec3 u_glowColor;
        
        varying vec2 v_texCoord;
        
        void main() {
            vec4 color = texture2D(u_image, v_texCoord);
            float alpha = color.a;
            
            // Apply glow effect
            if (alpha < 0.9) {
                float glow = 0.0;
                float totalWeight = 0.0;
                float glowRadius = u_glowSize / min(u_resolution.x, u_resolution.y);
                
                // Sample nearby pixels
                for (int x = -4; x <= 4; x++) {
                    for (int y = -4; y <= 4; y++) {
                        vec2 offset = vec2(float(x), float(y)) * glowRadius;
                        float weight = 1.0 / (1.0 + float(x*x + y*y));
                        
                        vec4 sampleColor = texture2D(u_image, v_texCoord + offset);
                        glow += sampleColor.a * weight;
                        totalWeight += weight;
                    }
                }
                
                // Normalize glow by total weight
                glow /= totalWeight;
                glow *= u_glowIntensity;
                
                // Apply glow color
                color = vec4(mix(color.rgb, u_glowColor, glow * (1.0 - alpha)), max(color.a, glow));
            }
            
            gl_FragColor = color;
        }
    `;
}

// Fall back to Canvas2D rendering
function setupCanvas2D() {
    gl = null;
    ctx = canvas.getContext('2d');
}

// Apply glow effect using WebGL
function applyGlowEffect(sourceCanvas) {
    if (!gl || !shaderProgram) {
        console.warn('WebGL not available for glow effect');
        return sourceCanvas;
    }
    
    // Resize if needed
    if (glCanvas.width !== sourceCanvas.width || glCanvas.height !== sourceCanvas.height) {
        glCanvas.width = sourceCanvas.width;
        glCanvas.height = sourceCanvas.height;
    }
    
    // Set viewport
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    
    // Clear canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Use shader program
    gl.useProgram(shaderProgram);
    
    // Set uniforms
    const glowSize = parseFloat(document.getElementById('glowSize')?.value || 3.0);
    const glowIntensity = parseFloat(document.getElementById('glowIntensity')?.value || 50) / 100;
    const glowColorHex = document.getElementById('glowColor')?.value || '#00AAFF';
    
    // Convert hex color to RGB
    const r = parseInt(glowColorHex.substr(1, 2), 16) / 255;
    const g = parseInt(glowColorHex.substr(3, 2), 16) / 255;
    const b = parseInt(glowColorHex.substr(5, 2), 16) / 255;
    
    // Get uniform locations
    const resolutionLocation = gl.getUniformLocation(shaderProgram, 'u_resolution');
    const glowSizeLocation = gl.getUniformLocation(shaderProgram, 'u_glowSize');
    const glowIntensityLocation = gl.getUniformLocation(shaderProgram, 'u_glowIntensity');
    const glowColorLocation = gl.getUniformLocation(shaderProgram, 'u_glowColor');
    const imageLocation = gl.getUniformLocation(shaderProgram, 'u_image');
    
    // Set uniform values
    gl.uniform2f(resolutionLocation, glCanvas.width, glCanvas.height);
    gl.uniform1f(glowSizeLocation, glowSize);
    gl.uniform1f(glowIntensityLocation, glowIntensity);
    gl.uniform3f(glowColorLocation, r, g, b);
    
    // Update texture with source canvas content
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
    
    // Set attributes
    const positionLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    const texCoordLocation = gl.getAttribLocation(shaderProgram, 'a_texCoord');
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    return glCanvas;
}

// Initialize the canvas
setupCanvas();
