precision mediump float;

uniform sampler2D uTexture;      // Color texture
uniform sampler2D uDepthTexture; // Depth texture
uniform vec2 uResolution;         // Screen resolution (width, height)
uniform mat4 uInverseViewProj;   // Inverse view-projection matrix to reconstruct positions

varying vec2 vTexCoord;

// Calculate depth-based edge strength using gradient magnitude (best for parallel faces)
// Uses Sobel-like operator on depth values for robust edge detection
float calculateDepthEdge(vec2 uv) {
    vec2 texelSize = 1.0 / uResolution;
    
    // Sample depth from center
    float depthCenter = texture2D(uDepthTexture, uv).r;
    
    // Skip if at far plane
    if (depthCenter >= 0.999) {
        return 0.0;
    }
    
    // Sample depth from 3x3 neighborhood for Sobel operator
    // This gives better edge detection for parallel faces
    float depthTopLeft = texture2D(uDepthTexture, uv + vec2(-texelSize.x, -texelSize.y)).r;
    float depthTop = texture2D(uDepthTexture, uv + vec2(0.0, -texelSize.y)).r;
    float depthTopRight = texture2D(uDepthTexture, uv + vec2(texelSize.x, -texelSize.y)).r;
    
    float depthLeft = texture2D(uDepthTexture, uv + vec2(-texelSize.x, 0.0)).r;
    float depthRight = texture2D(uDepthTexture, uv + vec2(texelSize.x, 0.0)).r;
    
    float depthBottomLeft = texture2D(uDepthTexture, uv + vec2(-texelSize.x, texelSize.y)).r;
    float depthBottom = texture2D(uDepthTexture, uv + vec2(0.0, texelSize.y)).r;
    float depthBottomRight = texture2D(uDepthTexture, uv + vec2(texelSize.x, texelSize.y)).r;
    
    // Sobel operator for horizontal depth gradient
    float sobelX = -1.0 * depthTopLeft + 1.0 * depthTopRight
                   -2.0 * depthLeft + 2.0 * depthRight
                   -1.0 * depthBottomLeft + 1.0 * depthBottomRight;
    
    // Sobel operator for vertical depth gradient
    float sobelY = -1.0 * depthTopLeft - 2.0 * depthTop - 1.0 * depthTopRight
                   + 1.0 * depthBottomLeft + 2.0 * depthBottom + 1.0 * depthBottomRight;
    
    // Calculate depth gradient magnitude
    float depthGradient = sqrt(sobelX * sobelX + sobelY * sobelY);
    
    // Use relative depth difference for better handling of parallel faces
    // For parallel faces, absolute depth differences are small, but relative differences
    // can still be significant. We normalize by the depth value itself.
    // Also account for non-linear depth buffer precision
    float relativeGradient = depthGradient / (depthCenter + 0.001); // Add small epsilon to avoid division by zero
    
    // Normalize and return edge strength
    // The threshold is tuned for parallel faces - they need higher sensitivity
    return clamp(relativeGradient * 50.0, 0.0, 1.0);
}

// Calculate color-based edge strength using Sobel operator
float calculateColorEdge(vec2 uv) {
    vec2 texelSize = 1.0 / uResolution;
    
    // Sample color from 3x3 neighborhood for Sobel operator
    // Top row
    vec3 colorTopLeft = texture2D(uTexture, uv + vec2(-texelSize.x, -texelSize.y)).rgb;
    vec3 colorTop = texture2D(uTexture, uv + vec2(0.0, -texelSize.y)).rgb;
    vec3 colorTopRight = texture2D(uTexture, uv + vec2(texelSize.x, -texelSize.y)).rgb;
    
    // Middle row
    vec3 colorLeft = texture2D(uTexture, uv + vec2(-texelSize.x, 0.0)).rgb;
    vec3 colorCenter = texture2D(uTexture, uv).rgb;
    vec3 colorRight = texture2D(uTexture, uv + vec2(texelSize.x, 0.0)).rgb;
    
    // Bottom row
    vec3 colorBottomLeft = texture2D(uTexture, uv + vec2(-texelSize.x, texelSize.y)).rgb;
    vec3 colorBottom = texture2D(uTexture, uv + vec2(0.0, texelSize.y)).rgb;
    vec3 colorBottomRight = texture2D(uTexture, uv + vec2(texelSize.x, texelSize.y)).rgb;
    
    // Convert to luminance for edge detection
    vec3 luminanceWeights = vec3(0.299, 0.587, 0.114);
    float lumTopLeft = dot(colorTopLeft, luminanceWeights);
    float lumTop = dot(colorTop, luminanceWeights);
    float lumTopRight = dot(colorTopRight, luminanceWeights);
    float lumLeft = dot(colorLeft, luminanceWeights);
    float lumCenter = dot(colorCenter, luminanceWeights);
    float lumRight = dot(colorRight, luminanceWeights);
    float lumBottomLeft = dot(colorBottomLeft, luminanceWeights);
    float lumBottom = dot(colorBottom, luminanceWeights);
    float lumBottomRight = dot(colorBottomRight, luminanceWeights);
    
    // Sobel operator for horizontal gradient
    float sobelX = -1.0 * lumTopLeft + 1.0 * lumTopRight
                   -2.0 * lumLeft + 2.0 * lumRight
                   -1.0 * lumBottomLeft + 1.0 * lumBottomRight;
    
    // Sobel operator for vertical gradient
    float sobelY = -1.0 * lumTopLeft - 2.0 * lumTop - 1.0 * lumTopRight
                   + 1.0 * lumBottomLeft + 2.0 * lumBottom + 1.0 * lumBottomRight;
    
    // Calculate edge magnitude
    float edgeMagnitude = sqrt(sobelX * sobelX + sobelY * sobelY);
    
    // Normalize to [0, 1] range (Sobel can produce values up to ~4.0 for 8-bit colors)
    return clamp(edgeMagnitude / 4.0, 0.0, 1.0);
}

void main() {
    vec2 texelSize = 1.0 / uResolution;
    
    // Sample depth to check if we're in background
    float depthCenter = texture2D(uDepthTexture, vTexCoord).r;
    if (depthCenter >= 0.999) {
        // Background - output white (no edge)
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
    }
    
    // === PURE DEPTH-BASED EDGE DETECTION (Best for parallel faces and moving objects) ===
    // Uses depth gradient magnitude with Sobel operator
    // This is the most reliable method for parallel faces because:
    // 1. It doesn't rely on position reconstruction (which is unstable for parallel faces)
    // 2. Uses relative depth differences (works even when absolute differences are small)
    // 3. Gradient magnitude catches edges regardless of orientation
    float depthEdgeStrength = calculateDepthEdge(vTexCoord);
    
    // === COLOR-BASED EDGE DETECTION (Optional, for texture boundaries) ===
    // Only use color edges if depth edges are weak (to catch texture/material boundaries)
    // This prevents color edges from interfering with geometric edges
    float colorEdgeStrength = calculateColorEdge(vTexCoord);
    
    // === COMBINE DEPTH AND COLOR ===
    // Primary: depth edges (geometric boundaries, works for all face orientations)
    // Secondary: color edges (texture/material boundaries, only when depth edge is weak)
    // Use weighted combination - depth is primary, color is secondary
    float combinedEdgeStrength = max(depthEdgeStrength, colorEdgeStrength * 0.5);
    
    // Threshold and smooth the edge detection
    // Tuned for depth gradient magnitude
    float threshold = 0.15;
    float edge = smoothstep(threshold, threshold + 0.2, combinedEdgeStrength);
    
    // Output: black for edges, white for non-edges
    // Invert so edges are black
    float result = 1.0 - edge;
    
    gl_FragColor = vec4(vec3(result), 1.0);
}

