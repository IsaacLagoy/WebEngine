import { mat4, vec3 } from "gl-matrix";

export class Camera {
    position: vec3 = vec3.fromValues(0, 0, 2);
    target: vec3 = vec3.fromValues(0, 0, 0);
    up: vec3 = vec3.fromValues(0, 1, 0);
    fov: number = 45;
    aspect: number = 800 / 600;
    near: number = 0.5;  // Raise near plane for better depth precision
    far: number = 200;  // Extend far plane to cover the scene range

    setAspect(aspect: number) {
        this.aspect = aspect;
        this.updateMatrices();
    }

    viewMatrix: mat4 = mat4.create();
    projectionMatrix: mat4 = mat4.create();

    constructor() {
        this.updateMatrices();
    }

    updateMatrices() {
        mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
        mat4.perspective(this.projectionMatrix, (this.fov * Math.PI) / 180, this.aspect, this.near, this.far);
    }

    getViewProjectionMatrix(): mat4 {
        return mat4.multiply(mat4.create(), this.projectionMatrix, this.viewMatrix);
    }

    setPosition(position: vec3) {
        this.position = position;
        this.updateMatrices();
    }
}