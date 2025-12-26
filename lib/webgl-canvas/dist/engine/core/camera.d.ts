import { mat4, vec3 } from "gl-matrix";
import { Engine } from "../objects/engine";
import { Shader } from "./shader";
export declare class Camera {
    engine: Engine;
    position: vec3;
    target: vec3;
    up: vec3;
    fov: number;
    near: number;
    far: number;
    viewMatrix: mat4;
    projectionMatrix: mat4;
    rotationSpeed: number;
    moveSpeed: number;
    constructor(engine: Engine);
    updateAspectRatio(): void;
    updateMatrices(): void;
    getViewProjectionMatrix(): mat4;
    setPosition(position: vec3): void;
    use(shader: Shader): void;
    /**
     * Update camera based on input state
     * @param dt - Delta time in seconds
     * @param inputState - Input state object with keys and mouse delta
     */
    update(dt: number, inputState?: {
        keys: Set<string>;
        mouseDeltaX: number;
        mouseDeltaY: number;
    }): void;
    printState(): void;
}
//# sourceMappingURL=camera.d.ts.map