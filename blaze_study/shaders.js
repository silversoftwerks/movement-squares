// Create a new file for shader definitions
const vertexShaderSource = `
attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying highp vec2 vTextureCoord;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  vTextureCoord = aTextureCoord;
}
`;

const fragmentShaderSource = `
precision mediump float;

uniform sampler2D uSampler;
uniform float uGlowStrength;
uniform vec3 uGlowColor;
uniform float uGlowRadius;

varying highp vec2 vTextureCoord;

void main() {
  // Sample the texture at the current coordinate
  vec4 texColor = texture2D(uSampler, vTextureCoord);
  
  // Check if this is a dark area (potential glow source)
  float darkness = 1.0 - (texColor.r + texColor.g + texColor.b) / 3.0;
  
  // Initialize glow
  vec4 glowColor = vec4(0.0);
  
  // Only add glow around darker areas
  if (darkness > 0.5) {
    // Sample neighboring pixels to create glow
    float totalWeight = 0.0;
    vec4 blurColor = vec4(0.0);
    
    // Use a fixed iteration count with constant indices
    // and calculate the dx/dy dynamically inside the loop
    for (int x = -8; x <= 8; x++) {
      for (int y = -8; y <= 8; y++) {
        float dx = float(x);
        float dy = float(y);
        
        // Calculate distance from center
        float dist = sqrt(dx*dx + dy*dy);
        
        // Skip if outside glow radius
        if (dist > uGlowRadius) continue;
        
        // Calculate weight based on distance (gaussian-like)
        float weight = exp(-dist * dist / (uGlowRadius * uGlowRadius));
        
        // Sample color at offset
        vec2 offset = vec2(dx, dy) / vec2(512.0, 512.0); // Normalize by texture size
        vec4 offsetColor = texture2D(uSampler, vTextureCoord + offset);
        
        // Add weighted color
        blurColor += offsetColor * weight;
        totalWeight += weight;
      }
    }
    
    // Normalize by total weight
    if (totalWeight > 0.0) {
      blurColor /= totalWeight;
    }
    
    // Create glow from blur and original color
    float glowAmount = darkness * uGlowStrength;
    glowColor = vec4(uGlowColor * glowAmount, glowAmount);
  }
  
  // Combine texture color with glow
  gl_FragColor = texColor + glowColor;
}
`;

// Post-processing shader for the glow effect
const glowFragmentShaderSource = `
precision mediump float;

uniform sampler2D uTexture;
uniform float uGlowIntensity;
uniform vec3 uGlowColor;
uniform float uGlowSize;

varying highp vec2 vTextureCoord;

void main() {
  // Get the base color from the texture
  vec4 texColor = texture2D(uTexture, vTextureCoord);
  
  // Calculate darkness as indicator for glow source
  float darkness = 1.0 - (texColor.r + texColor.g + texColor.b) / 3.0;
  
  // Apply glow based on darkness
  vec4 finalColor = texColor;
  
  if (darkness > 0.5) {
    // Sample neighboring pixels with blur to create glow
    vec4 glow = vec4(0.0);
    float totalWeight = 0.0;
    
    // Use constant loop indices
    for (int x = -4; x <= 4; x++) {
      for (int y = -4; y <= 4; y++) {
        float dist = sqrt(float(x*x + y*y));
        if (dist <= uGlowSize) {
          float weight = 1.0 - dist/uGlowSize;
          vec2 offset = vec2(float(x), float(y)) / vec2(512.0, 512.0);
          vec4 sampleColor = texture2D(uTexture, vTextureCoord + offset);
          
          // Only add glow from dark areas
          float sampleDarkness = 1.0 - (sampleColor.r + sampleColor.g + sampleColor.b) / 3.0;
          if (sampleDarkness > 0.5) {
            glow += vec4(uGlowColor, 1.0) * weight * sampleDarkness;
            totalWeight += weight;
          }
        }
      }
    }
    
    if (totalWeight > 0.0) {
      glow /= totalWeight;
      finalColor += glow * uGlowIntensity;
    }
  }
  
  gl_FragColor = finalColor;
}
`; 