/**
 * WebGL-specific rendering functions for the Blaze application
 */

import { state, hexToRgb } from './core.js';

/**
 * Set up WebGL rendering
 */
export function setupWebGL() {
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
        return false;
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
        state.webglContext = {
            gl,
            canvas: glCanvas,
            shaderProgram,
            glowProgram,
            buffers,
            framebuffer,
            texture
        };
        
        return true;
    } catch (error) {
        console.error('WebGL initialization error:', error);
        return false;
    }
}

/**
 * Set up Canvas2D fallback
 */
export function setupCanvas2D() {
    const canvas2D = document.getElementById('blazeCanvas');
    canvas2D.style.display = 'block';
    
    // Hide WebGL canvas if it exists
    const glCanvas = document.getElementById('blazeGLCanvas');
    if (glCanvas) {
        glCanvas.style.display = 'none';
    }
    
    return true;
}

/**
 * Draw the Blaze pattern with a glow effect using WebGL
 * @param {number} timestamp - Animation timestamp
 * @param {Object} controls - Control values
 */
export function drawBlazeWithGlow(timestamp, controls) {
    try {
        // Get a reference to the main canvas
        const mainCanvas = document.getElementById('blazeCanvas');
        
        // Create a temp canvas with the same dimensions
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = mainCanvas.width;
        tempCanvas.height = mainCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw the pattern to temp canvas using the Canvas2D renderer
        const drawBlazeFunction = controls.drawBlaze;
        drawBlazeFunction(timestamp, tempCtx, tempCanvas, controls);
        
        // Get the WebGL context and objects
        const { gl, canvas: glCanvas, glowProgram, buffers, texture } = state.webglContext;
        
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
        const glowIntensity = parseFloat(controls.glowIntensity) / 100;
        const glowSize = parseFloat(controls.glowSize);
        const glowColor = hexToRgb(controls.glowColor);
        
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
        if (!state.isPaused) {
            state.animationId = requestAnimationFrame((time) => 
                drawBlazeWithGlow(time, controls)
            );
        }
        
        return true;
    } catch (error) {
        console.error("Error in drawBlazeWithGlow:", error);
        // Fall back to regular canvas rendering
        setupCanvas2D();
        return false;
    }
}

/**
 * Initialize shader program
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {string} vsSource - Vertex shader source
 * @param {string} fsSource - Fragment shader source
 * @returns {WebGLProgram} Shader program
 */
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    
    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    
    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    
    return shaderProgram;
}

/**
 * Load a shader
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {number} type - Shader type
 * @param {string} source - Shader source code
 * @returns {WebGLShader} Compiled shader
 */
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    
    // Send the source to the shader object
    gl.shaderSource(shader, source);
    
    // Compile the shader program
    gl.compileShader(shader);
    
    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    
    return shader;
}

/**
 * Create buffers for a plane
 * @param {WebGLRenderingContext} gl - WebGL context
 * @returns {Object} Buffers for position, texture coordinates, and indices
 */
function createPlaneBuffers(gl) {
    // Create a buffer for the square's positions
    const positionBuffer = gl.createBuffer();
    
    // Select the positionBuffer as the one to apply buffer operations to
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    // Create an array of positions for the square
    const positions = [
        -1.0,  1.0, 0.0,
         1.0,  1.0, 0.0,
         1.0, -1.0, 0.0,
        -1.0, -1.0, 0.0,
    ];
    
    // Pass the positions array to WebGL
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    // Create a buffer for texture coordinates
    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    
    // Create texture coordinates for the square
    const textureCoordinates = [
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];
    
    // Pass texture coordinates to WebGL
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
    
    // Create a buffer for indices
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    
    // Define indices for the square
    const indices = [
        0, 1, 2,
        0, 2, 3,
    ];
    
    // Pass indices to WebGL
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    
    return {
        position: positionBuffer,
        textureCoord: textureCoordBuffer,
        indices: indexBuffer,
        count: indices.length
    };
}

/**
 * Create a framebuffer and texture for off-screen rendering
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {number} width - Width of the framebuffer
 * @param {number} height - Height of the framebuffer
 * @returns {Object} Framebuffer and texture
 */
function createFramebufferTexture(gl, width, height) {
    // Create a texture to render to
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    // Create a framebuffer and attach the texture
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    
    // Check if framebuffer is complete
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        console.error('Unable to create framebuffer');
    }
    
    // Clean up
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    return { framebuffer, texture };
}

// Vertex shader source code
const vertexShaderSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;
    
    varying highp vec2 vTextureCoord;
    
    void main(void) {
        gl_Position = aVertexPosition;
        vTextureCoord = aTextureCoord;
    }
`;

// Fragment shader source code
const fragmentShaderSource = `
    precision mediump float;
    
    varying highp vec2 vTextureCoord;
    
    uniform sampler2D uTexture;
    
    void main(void) {
        gl_FragColor = texture2D(uTexture, vTextureCoord);
    }
`;

// Glow fragment shader source code
const glowFragmentShaderSource = `
    precision mediump float;
    
    varying highp vec2 vTextureCoord;
    
    uniform sampler2D uTexture;
    uniform float uGlowIntensity;
    uniform float uGlowSize;
    uniform vec3 uGlowColor;
    
    void main(void) {
        vec4 color = texture2D(uTexture, vTextureCoord);
        
        // Sample surrounding pixels for glow effect
        float totalAlpha = 0.0;
        float pixelSize = 1.0 / 512.0; // Adjust based on texture size
        float size = uGlowSize * pixelSize;
        
        // Sample in a simple blur pattern
        for (float x = -4.0; x <= 4.0; x += 1.0) {
            for (float y = -4.0; y <= 4.0; y += 1.0) {
                vec2 offset = vec2(x, y) * size;
                totalAlpha += texture2D(uTexture, vTextureCoord + offset).a;
            }
        }
        
        // Normalize and apply glow
        totalAlpha = totalAlpha / 81.0; // 9x9 samples
        
        // Create glow color with intensity
        vec4 glowColor = vec4(uGlowColor, totalAlpha * uGlowIntensity);
        
        // Blend original color with glow
        gl_FragColor = mix(glowColor, color, color.a);
    }
`; 