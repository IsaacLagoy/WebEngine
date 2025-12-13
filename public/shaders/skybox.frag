precision mediump float;

varying vec3 vWorldPos;
varying vec3 vDirection;
varying vec2 vTexCoord;

uniform float uTime;
uniform vec3 uSunDirection;
uniform float uTurbidity;
uniform float uSunIntensity;

// Night sky color
vec3 getNightSkyColor(vec3 dir, float intensity) {
    float elevation = max(dir.y, 0.0);
    
    // Dark blue at zenith, darker at horizon
    vec3 zenithColor = vec3(0.01, 0.02, 0.08);
    vec3 horizonColor = vec3(0.05, 0.05, 0.10);
    
    float t = pow(elevation, 0.3);
    vec3 nightSky = mix(horizonColor, zenithColor, t);
    
    // Add subtle stars (procedural noise)
    float starNoise = fract(sin(dot(dir.xz * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
    if (starNoise > 0.998) {
        nightSky += vec3(0.5, 0.5, 0.6) * (starNoise - 0.998) * 500.0;
    }
    
    return nightSky * (0.3 + intensity * 0.7);
}

// Atmospheric scattering coefficients
vec3 getRayleighCoeff(float turbidity) {
    return vec3(0.00058, 0.00135, 0.00331) * (1.0 + turbidity * 0.05);
}

vec3 getMieCoeff(float turbidity) {
    return vec3(0.00021) * turbidity;
}

// Phase functions
float rayleighPhase(float cosTheta) {
    return 0.75 * (1.0 + cosTheta * cosTheta);
}

float miePhase(float cosTheta, float g) {
    float g2 = g * g;
    float denom = 1.0 + g2 - 2.0 * g * cosTheta;
    return 0.318 * (1.0 - g2) / (pow(abs(denom), 1.5) + 0.001);
}

// Day sky color with atmospheric scattering
vec3 getDaySkyColor(vec3 dir, vec3 sunDir, float turbidity, float intensity) {
    dir = normalize(dir);
    
    float viewElevation = max(dir.y, 0.0);
    float sunElevation = max(sunDir.y, 0.0);
    
    float cosTheta = dot(dir, sunDir);
    
    vec3 betaR = getRayleighCoeff(turbidity);
    vec3 betaM = getMieCoeff(turbidity);
    
    float rayleighDepth = 8.0 * exp(-viewElevation * 4.0);
    float mieDepth = 1.1 * exp(-viewElevation * 3.0);
    
    float rayleighPhaseVal = rayleighPhase(cosTheta);
    float miePhaseVal = miePhase(cosTheta, 0.76);
    
    vec3 extinction = exp(-(betaR * rayleighDepth + betaM * mieDepth));
    
    vec3 inScatter = (betaR * rayleighPhaseVal + betaM * miePhaseVal * 0.1) * 
                     (1.0 - extinction) * intensity;
    
    float elevationGradient = pow(viewElevation, 0.4);
    vec3 zenithColor = vec3(0.3, 0.5, 0.9);
    vec3 horizonColor = vec3(0.8, 0.85, 0.95);
    vec3 baseSkyColor = mix(horizonColor, zenithColor, elevationGradient);
    
    vec3 skyColor = baseSkyColor * (0.3 + 0.7 * extinction);
    skyColor += inScatter * 10.0;
    
    // Sun disk
    float sunAngle = acos(clamp(cosTheta, -1.0, 1.0));
    float sunDisk = exp(-sunAngle * 100.0) * max(sunElevation, 0.0);
    skyColor += vec3(1.0, 0.95, 0.8) * sunDisk * intensity * 3.0;
    
    // Sun glow
    float sunGlow = exp(-sunAngle * 10.0) * max(sunElevation, 0.0);
    skyColor += vec3(1.0, 0.9, 0.7) * sunGlow * intensity * 0.5;
    
    // Sunrise/sunset colors when sun is near horizon
    if (sunElevation < 0.4 && sunDir.y > -0.1) {
        float horizonFactor = exp(-viewElevation * 3.0);
        float sunHorizonFactor = (0.4 - sunElevation) * 2.5;
        vec3 horizonTint = vec3(1.0, 0.5, 0.2) * horizonFactor * sunHorizonFactor * 0.4;
        skyColor += horizonTint;
    }
    
    return skyColor;
}

void main() {
    vec3 dir = normalize(vDirection);
    vec3 skyColor;
    
    // Determine if it's day or night based on sun position
    float sunHeight = uSunDirection.y;
    
    if (sunHeight > -0.2) {
        // Day or twilight - use atmospheric scattering
        skyColor = getDaySkyColor(dir, uSunDirection, uTurbidity, uSunIntensity);
    } else {
        // Night - use night sky
        skyColor = getNightSkyColor(dir, uSunIntensity);
        
        // Add moon (opposite to sun when sun is below horizon)
        vec3 moonDir = -uSunDirection;
        moonDir.y = abs(moonDir.y); // Moon is always above horizon
        moonDir = normalize(moonDir);
        
        float moonDot = dot(dir, moonDir);
        float moonAngle = acos(clamp(moonDot, -1.0, 1.0));
        float moonDisk = smoothstep(0.05, 0.02, moonAngle);
        skyColor += vec3(0.8, 0.8, 0.9) * moonDisk * 0.3;
    }
    
    // Smooth transition between day and night
    if (sunHeight > -0.3 && sunHeight < 0.1) {
        float transitionFactor = (sunHeight + 0.3) / 0.4; // 0.0 at night, 1.0 at day
        transitionFactor = smoothstep(0.0, 1.0, transitionFactor);
        
        vec3 nightSky = getNightSkyColor(dir, uSunIntensity);
        vec3 daySky = getDaySkyColor(dir, uSunDirection, uTurbidity, uSunIntensity);
        
        skyColor = mix(nightSky, daySky, transitionFactor);
    }
    
    // Tone mapping
    skyColor = skyColor / (skyColor * 0.3 + vec3(1.0));
    
    // Gamma correction
    skyColor = pow(skyColor, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(skyColor, 1.0);
}