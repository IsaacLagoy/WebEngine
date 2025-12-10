precision mediump float;

uniform sampler2D uTexture;
varying vec2 vTexCoord;

void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    // Hash-based noise (stable per-pixel)
    float n = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453);

    // Moderate dithering: quantize to 5 bits per channel (32 levels)
    float levels = 32.0;
    vec3 quantized = floor(color.rgb * (levels - 1.0) + n * (levels - 1.0)) / (levels - 1.0);

    gl_FragColor = vec4(quantized, color.a);
}

