precision mediump float;

uniform vec3 uColor;
uniform sampler2D uTexture;
uniform bool uUseTexture;  // If true, use texture; if false, use solid color

varying vec2 vTexCoord;

void main() {
    if (uUseTexture) {
        // Use texture (for fire animation)
        // Flip texture coordinates vertically (Y axis) to fix upside-down issue
        vec2 flippedCoord = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
        vec4 texColor = texture2D(uTexture, flippedCoord);
        // Discard fully transparent pixels
        if (texColor.a < 0.01) {
            discard;
        }
        gl_FragColor = texColor;
    } else {
        // Use solid color (for simple billboards)
        gl_FragColor = vec4(uColor, 1.0);
    }
}
