precision mediump float;

// Varyings from vertex shader
varying vec3 vPosition;
varying vec2 vTexCoord;
varying mat3 vTBN;

// Uniforms for lighting
uniform vec3 uLightDir;
uniform vec3 uViewPos;

// Material inputs
uniform vec3 uDiffuseColor;       // fallback diffuse color
uniform vec3 uAmbientColor;       // fallback ambient color
uniform float uRoughness;         // fallback roughness

uniform sampler2D uDiffuseMap;    // optional diffuse texture
uniform sampler2D uNormalMap;     // optional normal map
uniform sampler2D uRoughnessMap;  // optional roughness map

uniform bool uHasDiffuseMap;
uniform bool uHasNormalMap;
uniform bool uHasRoughnessMap;

void main() {
    // --- Diffuse ---
    vec3 albedo = uDiffuseColor;
    if (uHasDiffuseMap) {
        albedo = texture2D(uDiffuseMap, vTexCoord).rgb;
    }

    // --- Normal ---
    vec3 N = normalize(vTBN[2]); // fallback normal = interpolated vertex normal in world space
    if (uHasNormalMap) {
        vec3 normalTex = texture2D(uNormalMap, vTexCoord).rgb;
        normalTex = normalize(normalTex * 2.0 - 1.0); // [0,1] -> [-1,1]
        N = normalize(vTBN * normalTex);              // transform to world space
    }

    // --- Roughness ---
    float rough = uRoughness;
    if (uHasRoughnessMap) {
        rough = texture2D(uRoughnessMap, vTexCoord).r; // assuming roughness stored in red channel
    }

    // --- Lighting ---
    vec3 L = normalize(uLightDir);
    vec3 V = normalize(uViewPos - vPosition);
    vec3 R = reflect(-L, N);

    // Diffuse term
    float diff = max(dot(N, L), 0.0);

    // Specular term (Blinn-Phong approximation)
    float specPower = mix(2.0, 256.0, 1.0 - rough); // rough -> shininess
    float spec = pow(max(dot(R, V), 0.0), specPower);

    vec3 diffuse = albedo * diff;
    vec3 specular = vec3(0.3) * spec;

    // Ambient fallback
    vec3 ambient = uAmbientColor;

    gl_FragColor = vec4(diffuse + specular + ambient, 1.0);
}
