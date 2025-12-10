precision mediump float;
uniform sampler2D uTexture;
uniform float uQuantizationLevel;
varying vec2 vTexCoord;

void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    
    // Quantize each color channel by reducing the number of discrete levels
    // Higher quantization level = more colors (less quantization)
    // Lower quantization level = fewer colors (more quantization/posterization)
    float level = max(uQuantizationLevel, 1.0);
    
    // Quantize: multiply by level, floor to nearest integer, divide back
    // This creates discrete color steps
    color.rgb = floor(color.rgb * level) / level;
    
    gl_FragColor = color;
}
