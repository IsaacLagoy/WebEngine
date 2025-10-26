precision mediump float;
uniform sampler2D uTexture;
varying vec2 vTexCoord;

void main() {
    vec2 pos = vTexCoord - 0.5;
    float vignette = smoothstep(0.8, 0.2, length(pos));
    vec4 color = texture2D(uTexture, vTexCoord);
    gl_FragColor = vec4(color.rgb * vignette, color.a);
}
