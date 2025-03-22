// WebGL helper functions
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
// Initialize a shader program
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // Check if it linked successfully
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

// Create a shader of the given type, upload source and compile
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  // Check if compilation was successful
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

// Create and bind a framebuffer texture
function createFramebufferTexture(gl, width, height) {
  // Create and bind the framebuffer
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  
  // Create a texture to render to
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, 
    width, height, 0,
    gl.RGBA, gl.UNSIGNED_BYTE, null
  );
  
  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
  // Attach the texture as the first color attachment
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0
  );
  
  // Check for completeness
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    console.error("Framebuffer is not complete:", status);
  }
  
  // Unbind
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  
  return { framebuffer, texture };
}

// Create a plane geometry for rendering textures
function createPlaneBuffers(gl) {
  // Vertex positions for a quad
  const positions = [
    -1.0, -1.0,  0.0,
     1.0, -1.0,  0.0,
     1.0,  1.0,  0.0,
    -1.0,  1.0,  0.0,
  ];
  
  // Texture coordinates
  const textureCoordinates = [
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
  ];
  
  // Indices for drawing as triangles
  const indices = [
    0, 1, 2,
    0, 2, 3,
  ];
  
  // Create and bind position buffer
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
  // Create and bind texture coordinate buffer
  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
  
  // Create and bind indices buffer
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  
  return {
    position: positionBuffer,
    textureCoord: textureCoordBuffer,
    indices: indexBuffer,
    count: indices.length,
  };
} 