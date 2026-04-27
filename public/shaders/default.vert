attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;
attribute vec3 aTangent;

// Instanced attributes - required for all rendering
// A 4x4 matrix is passed as 4 vec4 attributes (one per column)
attribute vec4 aInstanceMatrix0;
attribute vec4 aInstanceMatrix1;
attribute vec4 aInstanceMatrix2;
attribute vec4 aInstanceMatrix3;

// Uniforms
uniform mat4 uViewProj;  // View-projection matrix

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vTexCoord;
varying mat3 vTBN;

// Reconstruct 4x4 matrix from 4 vec4 columns
mat4 getInstanceMatrix() {
    return mat4(
        aInstanceMatrix0,
        aInstanceMatrix1,
        aInstanceMatrix2,
        aInstanceMatrix3
    );
}

void main() {
    // Always use instanced matrix
    mat4 modelMatrix = getInstanceMatrix();
    mat4 mvp = uViewProj * modelMatrix;
    
    vec4 worldPos = modelMatrix * vec4(aPosition, 1.0);
    vPosition = worldPos.xyz;

    // transform normal and tangent to world space
    vec3 N = normalize(mat3(modelMatrix) * aNormal);
    vec3 T = normalize(mat3(modelMatrix) * aTangent);
    vec3 B = cross(N, T);  // bitangent

    vTBN = mat3(T, B, N);

    // pass texture coordinates to fragment shader
    vTexCoord = aTexCoord;

    vNormal = mat3(modelMatrix) * aNormal; // transform normal to world space
    gl_Position = mvp * vec4(aPosition, 1.0);
}
