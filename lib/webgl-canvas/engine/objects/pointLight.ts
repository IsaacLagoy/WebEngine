import { vec3 } from "gl-matrix";

/**
 * PointLight class - represents a point light source in the scene
 * 
 * Point lights emit light in all directions from a specific position.
 * Light intensity decreases with distance based on attenuation.
 */
export class PointLight {
    position: vec3;
    color: vec3;  // RGB color (0-1 range)
    intensity: number;  // Light intensity multiplier
    
    // Attenuation parameters for distance falloff
    // attenuation = 1.0 / (constant + linear*distance + quadratic*distance²)
    constant: number;   // Constant attenuation (usually 1.0)
    linear: number;     // Linear attenuation coefficient
    quadratic: number;  // Quadratic attenuation coefficient

    constructor(
        position: vec3 = vec3.fromValues(0, 0, 0),
        color: vec3 = vec3.fromValues(1, 1, 1),
        intensity: number = 1.0,
        constant: number = 1.0,
        linear: number = 0.09,
        quadratic: number = 0.032
    ) {
        this.position = position;
        this.color = color;
        this.intensity = intensity;
        this.constant = constant;
        this.linear = linear;
        this.quadratic = quadratic;
    }

    /**
     * Sets the position of the light
     */
    setPosition(position: vec3) {
        this.position = position;
    }

    /**
     * Sets the color of the light (RGB, 0-1 range)
     */
    setColor(color: vec3) {
        this.color = color;
    }

    /**
     * Sets the intensity of the light
     */
    setIntensity(intensity: number) {
        this.intensity = intensity;
    }

    /**
     * Sets attenuation parameters for distance falloff
     * @param constant - Constant attenuation (usually 1.0)
     * @param linear - Linear attenuation coefficient
     * @param quadratic - Quadratic attenuation coefficient
     */
    setAttenuation(constant: number, linear: number, quadratic: number) {
        this.constant = constant;
        this.linear = linear;
        this.quadratic = quadratic;
    }
}
