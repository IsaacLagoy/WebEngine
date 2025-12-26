import { vec3 } from "gl-matrix";
/**
 * PointLight class - represents a point light source in the scene
 *
 * Point lights emit light in all directions from a specific position.
 * Light intensity decreases with distance based on attenuation.
 */
export declare class PointLight {
    position: vec3;
    color: vec3;
    intensity: number;
    constant: number;
    linear: number;
    quadratic: number;
    constructor(position?: vec3, color?: vec3, intensity?: number, constant?: number, linear?: number, quadratic?: number);
    /**
     * Sets the position of the light
     */
    setPosition(position: vec3): void;
    /**
     * Sets the color of the light (RGB, 0-1 range)
     */
    setColor(color: vec3): void;
    /**
     * Sets the intensity of the light
     */
    setIntensity(intensity: number): void;
    /**
     * Sets attenuation parameters for distance falloff
     * @param constant - Constant attenuation (usually 1.0)
     * @param linear - Linear attenuation coefficient
     * @param quadratic - Quadratic attenuation coefficient
     */
    setAttenuation(constant: number, linear: number, quadratic: number): void;
}
//# sourceMappingURL=pointLight.d.ts.map