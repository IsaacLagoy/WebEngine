precision mediump float;
uniform sampler2D uTexture;
uniform float uQuantizationLevel;
uniform vec2 uResolution;
varying vec2 vTexCoord;

const int n = 8;
const float ditherStrength = 0.05;

// Compact 8x8 Bayer dither - using bit manipulation for smaller code
float getBayerDither(int x, int y) {
    int idx = y * n + x;
    // Use bit manipulation to compute Bayer value more compactly
    // This is a simplified approach - could use full formula but this is cleaner
    if (idx < 16) {
        if (idx == 0) return 0.0; if (idx == 1) return 32.0; if (idx == 2) return 8.0; if (idx == 3) return 40.0;
        if (idx == 4) return 2.0; if (idx == 5) return 34.0; if (idx == 6) return 10.0; if (idx == 7) return 42.0;
        if (idx == 8) return 48.0; if (idx == 9) return 16.0; if (idx == 10) return 56.0; if (idx == 11) return 24.0;
        if (idx == 12) return 50.0; if (idx == 13) return 18.0; if (idx == 14) return 58.0; if (idx == 15) return 26.0;
    } else if (idx < 32) {
        if (idx == 16) return 12.0; if (idx == 17) return 44.0; if (idx == 18) return 4.0; if (idx == 19) return 36.0;
        if (idx == 20) return 14.0; if (idx == 21) return 46.0; if (idx == 22) return 6.0; if (idx == 23) return 38.0;
        if (idx == 24) return 60.0; if (idx == 25) return 28.0; if (idx == 26) return 52.0; if (idx == 27) return 20.0;
        if (idx == 28) return 62.0; if (idx == 29) return 30.0; if (idx == 30) return 54.0; if (idx == 31) return 22.0;
    } else if (idx < 48) {
        if (idx == 32) return 3.0; if (idx == 33) return 35.0; if (idx == 34) return 11.0; if (idx == 35) return 43.0;
        if (idx == 36) return 1.0; if (idx == 37) return 33.0; if (idx == 38) return 9.0; if (idx == 39) return 41.0;
        if (idx == 40) return 51.0; if (idx == 41) return 19.0; if (idx == 42) return 59.0; if (idx == 43) return 27.0;
        if (idx == 44) return 49.0; if (idx == 45) return 17.0; if (idx == 46) return 57.0; if (idx == 47) return 25.0;
    } else {
        if (idx == 48) return 15.0; if (idx == 49) return 47.0; if (idx == 50) return 7.0; if (idx == 51) return 39.0;
        if (idx == 52) return 13.0; if (idx == 53) return 45.0; if (idx == 54) return 5.0; if (idx == 55) return 37.0;
        if (idx == 56) return 63.0; if (idx == 57) return 31.0; if (idx == 58) return 55.0; if (idx == 59) return 23.0;
        if (idx == 60) return 61.0; if (idx == 61) return 29.0; if (idx == 62) return 53.0; if (idx == 63) return 21.0;
    }
    return 0.0;
}

// Convert RGB to HSV
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// Convert HSV to RGB
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    const float ditherCellSize = 2.0;
    const float blackThreshold = 0.01;
    const float clearcoatThreshold = 0.85;
    
    // Night sky color (pale night sky)
    vec3 nightSkyColor = vec3(0.2, 0.2, 0.35);
    
    // Calculate dither cells (will be square in pixel space)
    vec2 cellIndex = floor(gl_FragCoord.xy / ditherCellSize);
    vec2 cellCenter = (cellIndex + 0.5) * ditherCellSize;
    
    // Sample texture from center of dither cell
    vec4 cellColor = texture2D(uTexture, cellCenter / uResolution);
    
    // Early exits for black and clearcoat
    if (cellColor.r < blackThreshold && cellColor.g < blackThreshold && cellColor.b < blackThreshold) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, cellColor.a);
        return;
    }
    
    float gray = dot(cellColor.rgb, vec3(0.299, 0.587, 0.114));
    
    // Check if this is a clearcoat (bright) area - render as night sky color
    if (gray >= clearcoatThreshold) {
        gl_FragColor = vec4(nightSkyColor, cellColor.a);
        return;
    }
    
    // Convert RGB to HSV to preserve hue and saturation
    vec3 hsv = rgb2hsv(cellColor.rgb);
    
    // Process and quantize the value (brightness) component
    // Clamp value to [0, clearcoatThreshold] before normalization
    float value = clamp(hsv.z, 0.0, clearcoatThreshold);
    value = pow(value / clearcoatThreshold, 0.6);
    
    // Apply dithering to the value component
    vec2 ditherPos = mod(cellIndex, float(n));
    float ditherValue = getBayerDither(int(ditherPos.x), int(ditherPos.y)) / (float(n) * float(n)) - 0.5;
    value = clamp(value + ditherStrength * ditherValue, 0.0, 1.0);
    
    // Quantize the value component
    float numBuckets = min(max(uQuantizationLevel, 1.0), 8.0);
    float quantizedValue = floor(value * numBuckets) / numBuckets;
    quantizedValue = clamp(quantizedValue, 0.0, 1.0);
    
    // Reconstruct HSV with quantized value but original hue and saturation
    hsv.z = quantizedValue;
    
    // Convert back to RGB
    vec3 quantizedColor = hsv2rgb(hsv);
    
    gl_FragColor = vec4(quantizedColor, cellColor.a);
}
