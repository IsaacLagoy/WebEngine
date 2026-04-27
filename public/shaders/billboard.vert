attribute vec2 aPosition;
attribute vec2 aTexCoord;

uniform mat4 uViewProj;
uniform vec3 uPosition;
uniform vec2 uSize;
uniform vec3 uCameraPos;  // Camera position in world space

varying vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    
    // Calculate direction from billboard position to camera (only in horizontal XZ plane)
    vec3 toCamera = uCameraPos - uPosition;
    vec3 toCameraHorizontal = vec3(toCamera.x, 0.0, toCamera.z);
    float dist = length(toCameraHorizontal);
    if (dist < 0.001) {
        // If camera is directly above/below, use default forward direction
        toCameraHorizontal = vec3(0.0, 0.0, 1.0);
    } else {
        toCameraHorizontal = normalize(toCameraHorizontal);
    }
    
    // Billboard always stays upright (world up = Y axis)
    vec3 worldUp = vec3(0.0, 1.0, 0.0);
    
    // Right vector is perpendicular to horizontal camera direction and world up
    vec3 right = cross(worldUp, toCameraHorizontal);
    right = normalize(right);
    
    // Up vector is always world up (billboard stays vertical)
    vec3 up = worldUp;
    
    // Calculate billboard quad vertices
    vec3 offset = right * (aPosition.x * uSize.x * 0.5) + up * (aPosition.y * uSize.y * 0.5);
    vec3 worldPos = uPosition + offset;
    gl_Position = uViewProj * vec4(worldPos, 1.0);
}
