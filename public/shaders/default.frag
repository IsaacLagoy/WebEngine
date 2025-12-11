precision mediump float;

// Varyings from vertex shader
varying vec3 vPosition;
varying vec2 vTexCoord;
varying mat3 vTBN;

// Uniforms for lighting
uniform vec3 uLightDir;
uniform vec3 uViewPos;

// Material inputs
uniform vec3 uMaterialColor;      // material color (0-1, tints albedo)
uniform vec3 uAmbientColor;       // fallback ambient color
uniform vec3 uEmission;           // emission color (0-1, makes surface glow)
uniform float uRoughness;         // roughness (used if no roughness map)
uniform float uRoughnessMultiplier; // multiplier for roughness (1.0 = normal, >1.0 = rougher, <1.0 = shinier)
uniform float uMetallic;          // metallic value (0.0 = dielectric, 1.0 = metal, uniform across surface)
uniform float uMetallicMultiplier; // multiplier for metallic (1.0 = normal, >1.0 = more metallic, <1.0 = less metallic)

uniform sampler2D uDiffuseMap;    // albedo texture (white if not provided)
uniform sampler2D uNormalMap;     // normal map (white if not provided, means flat)
uniform sampler2D uRoughnessMap;  // roughness map (white if not provided)

// Cook-Torrance BRDF functions

// Normal Distribution Function (GGX/Trowbridge-Reitz)
float DistributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;
    
    float num = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = 3.14159265359 * denom * denom;
    
    return num / max(denom, 0.0000001); // Prevent division by zero
}

// Geometry function (Schlick-GGX)
float GeometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;
    
    float num = NdotV;
    float denom = NdotV * (1.0 - k) + k;
    
    return num / max(denom, 0.0000001);
}

// Smith's method for geometry attenuation
float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);
    
    return ggx1 * ggx2;
}

// Fresnel-Schlick approximation
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

void main() {
    // --- Albedo (PBR standard: texture * materialColor) ---
    vec3 albedoTex = texture2D(uDiffuseMap, vTexCoord).rgb;
    // If texture is white (default), use material color directly
    // Otherwise, tint the texture with material color (PBR standard)
    vec3 albedo = albedoTex * uMaterialColor;

    // --- Normal ---
    // Sample normal map - if it's white (default), use vertex normal (flat)
    // Otherwise, use the normal map
    vec3 normalTex = texture2D(uNormalMap, vTexCoord).rgb;
    vec3 N = normalize(vTBN[2]); // default: vertex normal (flat)
    
    // Check if normal map is not white (has actual normal data)
    // White normal map = (1, 1, 1) in RGB means no normal map provided
    // We detect this by checking if all channels are close to 1.0
    if (normalTex.r < 0.99 || normalTex.g < 0.99 || normalTex.b < 0.99) {
        // Not white, has normal data - transform and use it
        normalTex = normalize(normalTex * 2.0 - 1.0); // [0,1] -> [-1,1]
        N = normalize(vTBN * normalTex);              // transform to world space
    }
    // If white, N remains as vertex normal (flat)

    // --- Roughness & Metallic ---
    // Sample roughness map - if it's white (default), use uniform value
    vec3 roughnessTex = texture2D(uRoughnessMap, vTexCoord).rgb;
    float rough = uRoughness; // default: uniform value
    
    // Check if roughness map is not white (has actual roughness data)
    // White = (1, 1, 1) means use uniform, otherwise use red channel
    if (roughnessTex.r < 0.99 || roughnessTex.g < 0.99 || roughnessTex.b < 0.99) {
        // Not white, has roughness data - use red channel
        rough = roughnessTex.r; // assuming roughness stored in red channel
    }
    // If white, rough remains as uniform value
    
    // Apply roughness multiplier (allows making materials shinier or rougher)
    rough = rough * uRoughnessMultiplier;
    
    // Metallic is uniform (no texture) - apply multiplier
    float metallic = uMetallic * uMetallicMultiplier;
    
    // Clamp roughness and metallic to valid ranges
    rough = clamp(rough, 0.04, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);

    // --- Lighting vectors ---
    vec3 L = normalize(uLightDir);
    vec3 V = normalize(uViewPos - vPosition);
    vec3 H = normalize(V + L);
    
    float NdotL = max(dot(N, L), 0.0);
    float NdotV = max(dot(N, V), 0.0);

    // --- Cook-Torrance BRDF ---
    
    // Calculate reflectance at normal incidence (F0)
    // For dielectrics, F0 is around 0.04
    // For metals, F0 is the albedo color
    vec3 F0 = mix(vec3(0.04), albedo, metallic);
    
    // Cook-Torrance components
    float D = DistributionGGX(N, H, rough);
    vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);
    float G = GeometrySmith(N, V, L, rough);
    
    // Specular contribution
    vec3 numerator = D * F * G;
    float denominator = 4.0 * NdotV * NdotL;
    vec3 specular = numerator / max(denominator, 0.001);
    
    // Energy conservation: kS is the specular contribution, kD is the diffuse
    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    
    // For metals, there's no diffuse reflection (all light is reflected)
    kD *= (1.0 - metallic);
    
    // Diffuse contribution (Lambertian)
    vec3 diffuse = kD * albedo / 3.14159265359;
    
    // Final lighting
    vec3 Lo = (diffuse + specular) * NdotL;
    
    // Ambient (simple approximation - could use IBL here)
    vec3 ambient = uAmbientColor * albedo * 0.03; // Very low ambient for PBR
    
    // Emission (adds glow - not affected by lighting)
    vec3 emission = uEmission;
    
    vec3 color = ambient + Lo + emission;
    
    // Tone mapping (simple Reinhard)
    color = color / (color + vec3(1.0));
    
    // Gamma correction
    color = pow(color, vec3(1.0 / 2.2));

    gl_FragColor = vec4(color, 1.0);
}
