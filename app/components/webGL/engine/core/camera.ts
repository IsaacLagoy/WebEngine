import { mat4, vec3 } from "gl-matrix";
import { Engine } from "../objects/engine";
import { Shader } from "./shader";

export class Camera {
    engine: Engine;
    position: vec3 = vec3.fromValues(0, 0, 2);
    target: vec3 = vec3.fromValues(0, 0, 0);
    up: vec3 = vec3.fromValues(0, 1, 0);
    fov: number = 45;
    near: number = 0.5;  // Raise near plane for better depth precision
    far: number = 200;  // Extend far plane to cover the scene range
    viewMatrix: mat4 = mat4.create();
    projectionMatrix: mat4 = mat4.create();

    constructor(engine: Engine) {
        this.engine = engine;
        this.updateMatrices();
    }

    updateAspectRatio() {
        this.updateMatrices();
    }

    updateMatrices() {
        mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
        mat4.perspective(this.projectionMatrix, (this.fov * Math.PI) / 180, this.engine.aspectRatio, this.near, this.far);
    }

    getViewProjectionMatrix(): mat4 {
        return mat4.multiply(mat4.create(), this.projectionMatrix, this.viewMatrix);
    }

    setPosition(position: vec3) {
        this.position = position;
        this.updateMatrices();
    }

    use(shader: Shader) {
        // Match C++: uses "uView" and "uProjection" (not uViewMatrix/uProjectionMatrix)
        shader.setUniformMatrix("uView", Array.from(this.viewMatrix) as Float32List);
        shader.setUniformMatrix("uProjection", Array.from(this.projectionMatrix) as Float32List);
        // Also set uViewMatrix/uProjectionMatrix for backwards compatibility
        shader.setUniformMatrix("uViewMatrix", Array.from(this.viewMatrix) as Float32List);
        shader.setUniformMatrix("uProjectionMatrix", Array.from(this.projectionMatrix) as Float32List);
    }
}