precision mediump float;
uniform sampler2D uTexture;
varying vec2 vTexCoord;

void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    gl_FragColor = vec4(vec3(gray), color.a);
}
