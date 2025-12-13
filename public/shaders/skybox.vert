attribute vec3 aPosition;
attribute vec2 aTexCoord;

uniform mat4 uViewProj;
uniform mat4 uModel;

varying vec3 vWorldPos;
varying vec3 vDirection;
varying vec2 vTexCoord;

void main() {
    vec4 worldPos = uModel * vec4(aPosition, 1.0);
    vWorldPos = worldPos.xyz;
    vTexCoord = aTexCoord;
    
    // Normalized direction vector (for atmospheric scattering)
    vDirection = normalize(vWorldPos);
    
    // Transform to clip space
    gl_Position = uViewProj * worldPos;
    // Ensure skybox is always behind everything (far plane)
    gl_Position.z = gl_Position.w;
}
