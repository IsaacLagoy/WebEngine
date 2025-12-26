"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointLight = void 0;
const gl_matrix_1 = require("gl-matrix");
/**
 * PointLight class - represents a point light source in the scene
 *
 * Point lights emit light in all directions from a specific position.
 * Light intensity decreases with distance based on attenuation.
 */
class PointLight {
    constructor(position = gl_matrix_1.vec3.fromValues(0, 0, 0), color = gl_matrix_1.vec3.fromValues(1, 1, 1), intensity = 1.0, constant = 1.0, linear = 0.09, quadratic = 0.032) {
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
    setPosition(position) {
        this.position = position;
    }
    /**
     * Sets the color of the light (RGB, 0-1 range)
     */
    setColor(color) {
        this.color = color;
    }
    /**
     * Sets the intensity of the light
     */
    setIntensity(intensity) {
        this.intensity = intensity;
    }
    /**
     * Sets attenuation parameters for distance falloff
     * @param constant - Constant attenuation (usually 1.0)
     * @param linear - Linear attenuation coefficient
     * @param quadratic - Quadratic attenuation coefficient
     */
    setAttenuation(constant, linear, quadratic) {
        this.constant = constant;
        this.linear = linear;
        this.quadratic = quadratic;
    }
}
exports.PointLight = PointLight;
//# sourceMappingURL=pointLight.js.map