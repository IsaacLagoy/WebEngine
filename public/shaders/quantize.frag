precision mediump float;
uniform sampler2D uTexture;
uniform float uQuantizationLevel;
varying vec2 vTexCoord;

// Function to get palette color by index
// Sunset color palette - mapped from dark to light greyscale buckets
vec3 getPaletteColor(int index) {
    if (index == 0) return vec3(0.0, 0.0, 0.0);        // Black
    if (index == 1) return vec3(0.15, 0.0, 0.25);      // Deep purple
    if (index == 2) return vec3(0.25, 0.05, 0.35);     // Darker deep purple
    if (index == 3) return vec3(0.45, 0.2, 0.55);      // Bluish medium pink
    if (index == 4) return vec3(0.6, 0.3, 0.65);       // Lighter bluish medium pink
    if (index == 5) return vec3(0.9, 0.5, 0.7);        // Pink
    if (index == 6) return vec3(1.0, 0.55, 0.5);       // Pink-orange transition
    return vec3(1.0, 0.6, 0.3);                        // Orange (index 7)
}

void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    
    // Always render pure black pixels as black
    // Check if all RGB channels are essentially black (using a small threshold for floating point precision)
    float blackThreshold = 0.01;
    if (color.r < blackThreshold && color.g < blackThreshold && color.b < blackThreshold) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, color.a);
        return;
    }
    
    // Convert color to greyscale using luminance formula
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    // Clearcoat effect: detect bright highlights/specular reflections
    // Bright areas (clearcoat) should be black
    float clearcoatThreshold = 0.85; // Higher = more areas become black clearcoat
    if (gray > clearcoatThreshold) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, color.a);
        return;
    }
    
    // Remap greyscale range [0, clearcoatThreshold] to [0, 1]
    // This ensures darkest areas map to deep purple, not black
    gray = gray / clearcoatThreshold;
    
    // Apply a curve to remap greyscale values to better distribute colors
    // This stretches the mid-tones and compresses the extremes
    // Using a power curve to emphasize lighter values
    gray = pow(gray, 0.6); // Lower exponent = more emphasis on lighter colors (blue/orange)
    
    // Quantize greyscale into buckets
    // Higher quantization level = more buckets (more colors)
    // Lower quantization level = fewer buckets (fewer colors)
    float level = max(uQuantizationLevel, 1.0);
    
    // Clamp level to palette size (8 colors max)
    float numBuckets = min(level, 8.0);
    
    // Quantize greyscale: multiply by buckets, floor to nearest integer
    // This creates discrete greyscale bucket indices [0, numBuckets-1]
    int bucketIndex = int(floor(gray * numBuckets));
    
    // Clamp bucket index to valid range [0, numBuckets-1]
    int maxBucketIndex = int(numBuckets - 1.0);
    if (bucketIndex < 0) bucketIndex = 0;
    if (bucketIndex > maxBucketIndex) bucketIndex = maxBucketIndex;
    
    // Map bucket index to palette color
    // Darkest areas should map to deep purple (index 1), not black (index 0)
    // So we map buckets to indices 1-7, skipping index 0 (black is for clearcoat only)
    int paletteIndex;
    if (numBuckets <= 1.0) {
        paletteIndex = 1; // Deep purple for darkest
    } else {
        // Remap to better distribute colors - stretch the range to favor blue/orange
        float normalizedBucket = float(bucketIndex) / (numBuckets - 1.0);
        // Apply a stronger curve to access more of the palette (blue/orange colors)
        // Lower exponent = more access to higher indices (blue/pink/orange)
        normalizedBucket = pow(normalizedBucket, 0.5); // Strong curve to favor lighter colors
        // Map to palette indices 1-7 (skip 0, which is black for clearcoat)
        paletteIndex = 1 + int(normalizedBucket * 6.0);
    }
    
    // Clamp palette index to valid range [1, 7] (deep purple to orange)
    if (paletteIndex < 1) paletteIndex = 1;
    if (paletteIndex > 7) paletteIndex = 7;
    
    // Get color from palette based on greyscale bucket
    vec3 paletteColor = getPaletteColor(paletteIndex);
    
    gl_FragColor = vec4(paletteColor, color.a);
}
