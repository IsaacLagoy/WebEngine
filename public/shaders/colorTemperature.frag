precision mediump float;

varying vec2 vTexCoord;
uniform sampler2D uTexture;
uniform float uIntensity; // Effect intensity (0.0 = off, 1.0 = full)

void main() {
    vec3 color = texture2D(uTexture, vTexCoord).rgb;
    
    // Calculate brightness (luminance)
    float brightness = dot(color, vec3(0.299, 0.587, 0.114));
    
    // Map brightness to warm/cool tint (exaggerated)
    // Brighter areas (facing light) = warm, darker areas (away from light) = cool
    // Use a power curve to exaggerate the effect
    float warmAmount = pow(brightness, 0.5); // Power curve makes transition more dramatic
    
    // EXTREME warm colors (very orange/red) for bright areas
    vec3 warmColor = vec3(1.0, 0.4, 0.1); // Very warm orange/red tint
    // EXTREME cool colors (very blue/cyan) for dark areas
    vec3 coolColor = vec3(0.2, 0.4, 1.0); // Very cool blue tint
    
    // Blend between warm and cool based on brightness
    vec3 temperatureTint = mix(coolColor, warmColor, warmAmount);
    
    // Apply color temperature tint with strong intensity
    // Multiply instead of blend for more extreme effect
    vec3 finalColor = color * mix(vec3(1.0), temperatureTint, uIntensity);
    
    gl_FragColor = vec4(finalColor, 1.0);
}



