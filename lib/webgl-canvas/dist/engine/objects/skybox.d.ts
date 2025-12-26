import { Engine } from "./engine";
import { Mesh } from "./mesh";
import { Shader } from "../core/shader";
import { Scene } from "./scene";
import { mat4, vec3 } from "gl-matrix";
/**
 * Skybox class - renders a sky with Preetham atmospheric scattering
 */
export declare class Skybox {
    engine: Engine;
    scene: Scene;
    mesh: Mesh;
    shader: Shader;
    modelMatrix: mat4;
    size: number;
    sunElevation: number;
    sunAzimuth: number;
    turbidity: number;
    sunIntensity: number;
    private sunDirection;
    private cycleTime;
    constructor(engine: Engine, scene: Scene, mesh: Mesh, shader: Shader);
    private updateSunDirection;
    setSunElevation(elevation: number): void;
    setSunAzimuth(azimuth: number): void;
    setTurbidity(turbidity: number): void;
    /**
     * Get the direction of the active celestial body (sun or moon) for lighting
     * Returns direction pointing FROM surface TOWARD the light source
     */
    getLightDirection(): vec3 | null;
    /**
     * Get the color of the active celestial body for lighting
     */
    getLightColor(): vec3 | null;
    /**
     * Set the time parameter for day-night cycle (0.0 to 1.0)
     * 0.0 = night, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset, 1.0 = night
     */
    setCycleTime(time: number): void;
    render(): void;
}
//# sourceMappingURL=skybox.d.ts.map