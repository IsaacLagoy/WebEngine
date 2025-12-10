attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;
attribute vec3 aTangent;

uniform mat4 uMVP;
uniform mat4 uModel;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vTexCoord;
varying mat3 vTBN;

void main() {
    vec4 worldPos = uModel * vec4(aPosition, 1.0);
    vPosition = worldPos.xyz;

    // transform normal and tangent to world space
    vec3 N = normalize(mat3(uModel) * aNormal);
    vec3 T = normalize(mat3(uModel) * aTangent);
    vec3 B = cross(N, T);  // bitangent

    vTBN = mat3(T, B, N);

    // pass texture coordinates to fragment shader
    vTexCoord = aTexCoord;

    vNormal = mat3(uModel) * aNormal; // transform normal to world space
    gl_Position = uMVP * vec4(aPosition, 1.0);
}
