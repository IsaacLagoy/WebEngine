"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Camera = void 0;
const gl_matrix_1 = require("gl-matrix");
class Camera {
    constructor(engine) {
        this.position = gl_matrix_1.vec3.fromValues(0, 0, 2);
        this.target = gl_matrix_1.vec3.fromValues(0, 0, 0);
        this.up = gl_matrix_1.vec3.fromValues(0, 1, 0);
        this.fov = 45;
        this.near = 0.5; // Raise near plane for better depth precision
        this.far = 200; // Extend far plane to cover the scene range
        this.viewMatrix = gl_matrix_1.mat4.create();
        this.projectionMatrix = gl_matrix_1.mat4.create();
        // Camera control settings
        this.rotationSpeed = 1.5; // radians per second
        this.moveSpeed = 5.0; // units per second
        this.engine = engine;
        this.updateMatrices();
    }
    updateAspectRatio() {
        this.updateMatrices();
    }
    updateMatrices() {
        gl_matrix_1.mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
        gl_matrix_1.mat4.perspective(this.projectionMatrix, (this.fov * Math.PI) / 180, this.engine.aspectRatio, this.near, this.far);
    }
    getViewProjectionMatrix() {
        return gl_matrix_1.mat4.multiply(gl_matrix_1.mat4.create(), this.projectionMatrix, this.viewMatrix);
    }
    setPosition(position) {
        this.position = position;
        this.updateMatrices();
    }
    use(shader) {
        // Match C++: uses "uView" and "uProjection" (not uViewMatrix/uProjectionMatrix)
        shader.setUniformMatrix("uView", Array.from(this.viewMatrix));
        shader.setUniformMatrix("uProjection", Array.from(this.projectionMatrix));
        // Also set uViewMatrix/uProjectionMatrix for backwards compatibility
        shader.setUniformMatrix("uViewMatrix", Array.from(this.viewMatrix));
        shader.setUniformMatrix("uProjectionMatrix", Array.from(this.projectionMatrix));
    }
    /**
     * Update camera based on input state
     * @param dt - Delta time in seconds
     * @param inputState - Input state object with keys and mouse delta
     */
    update(dt, inputState) {
        if (!inputState || (inputState.keys.size === 0 && inputState.mouseDeltaX === 0 && inputState.mouseDeltaY === 0)) {
            return;
        }
        const rotationDelta = this.rotationSpeed * dt;
        const moveDelta = this.moveSpeed * dt;
        // Calculate forward direction (from position to target)
        const forward = gl_matrix_1.vec3.create();
        gl_matrix_1.vec3.subtract(forward, this.target, this.position);
        const distance = gl_matrix_1.vec3.length(forward);
        gl_matrix_1.vec3.normalize(forward, forward);
        // Calculate right direction (cross product of forward and up)
        const right = gl_matrix_1.vec3.create();
        gl_matrix_1.vec3.cross(right, forward, this.up);
        gl_matrix_1.vec3.normalize(right, right);
        // Calculate actual up direction (cross product of right and forward)
        const up = gl_matrix_1.vec3.create();
        gl_matrix_1.vec3.cross(up, right, forward);
        gl_matrix_1.vec3.normalize(up, up);
        let horizontalRotation = 0.0; // Yaw (around Y axis)
        let verticalRotation = 0.0; // Pitch (around right axis)
        let moveDirection = gl_matrix_1.vec3.create(); // Movement direction
        // Mouse look (takes priority over arrow keys)
        if (inputState.mouseDeltaX !== 0 || inputState.mouseDeltaY !== 0) {
            horizontalRotation = -inputState.mouseDeltaX * rotationDelta;
            verticalRotation = -inputState.mouseDeltaY * rotationDelta;
        }
        else {
            // Arrow key rotation (fallback if no mouse input)
            if (inputState.keys.has("arrowleft")) {
                horizontalRotation = rotationDelta;
            }
            if (inputState.keys.has("arrowright")) {
                horizontalRotation = -rotationDelta;
            }
            if (inputState.keys.has("arrowup")) {
                verticalRotation = rotationDelta;
            }
            if (inputState.keys.has("arrowdown")) {
                verticalRotation = -rotationDelta;
            }
        }
        // WASD movement
        if (inputState.keys.has("w")) {
            gl_matrix_1.vec3.add(moveDirection, moveDirection, forward);
        }
        if (inputState.keys.has("s")) {
            gl_matrix_1.vec3.subtract(moveDirection, moveDirection, forward);
        }
        if (inputState.keys.has("a")) {
            gl_matrix_1.vec3.subtract(moveDirection, moveDirection, right);
        }
        if (inputState.keys.has("d")) {
            gl_matrix_1.vec3.add(moveDirection, moveDirection, right);
        }
        // Apply horizontal rotation (yaw) - rotate around Y axis
        if (horizontalRotation !== 0.0) {
            const yawAxis = gl_matrix_1.vec3.fromValues(0, 1, 0);
            const rotationQuat = gl_matrix_1.quat.create();
            gl_matrix_1.quat.setAxisAngle(rotationQuat, yawAxis, horizontalRotation);
            gl_matrix_1.vec3.transformQuat(forward, forward, rotationQuat);
        }
        // Apply vertical rotation (pitch) - rotate around right axis
        if (verticalRotation !== 0.0) {
            const pitchAxis = right;
            const rotationQuat = gl_matrix_1.quat.create();
            gl_matrix_1.quat.setAxisAngle(rotationQuat, pitchAxis, verticalRotation);
            gl_matrix_1.vec3.transformQuat(forward, forward, rotationQuat);
            // Clamp pitch to prevent flipping
            const pitchAngle = Math.asin(forward[1]);
            const maxPitch = Math.PI / 2.0 - 0.1; // Almost 90 degrees
            if (Math.abs(pitchAngle) > maxPitch) {
                forward[1] = Math.sign(forward[1]) * Math.sin(maxPitch);
                const horizontalLength = Math.sqrt(forward[0] * forward[0] + forward[2] * forward[2]);
                const scale = Math.cos(maxPitch) / horizontalLength;
                forward[0] *= scale;
                forward[2] *= scale;
            }
        }
        // Apply movement
        if (gl_matrix_1.vec3.length(moveDirection) > 0.0) {
            gl_matrix_1.vec3.normalize(moveDirection, moveDirection);
            gl_matrix_1.vec3.scale(moveDirection, moveDirection, moveDelta);
            gl_matrix_1.vec3.add(this.position, this.position, moveDirection);
            gl_matrix_1.vec3.add(this.target, this.target, moveDirection);
            this.updateMatrices();
        }
        // Update camera target based on new forward direction
        if (horizontalRotation !== 0.0 || verticalRotation !== 0.0) {
            gl_matrix_1.vec3.scale(forward, forward, distance);
            gl_matrix_1.vec3.add(this.target, this.position, forward);
            this.updateMatrices();
        }
    }
    printState() {
        // Calculate rotation from forward direction
        const forward = gl_matrix_1.vec3.create();
        gl_matrix_1.vec3.subtract(forward, this.target, this.position);
        gl_matrix_1.vec3.normalize(forward, forward);
        const yaw = Math.atan2(forward[0], forward[2]) * (180 / Math.PI);
        const pitch = Math.asin(forward[1]) * (180 / Math.PI);
        console.log(`Camera Position: [${this.position[0].toFixed(2)}, ${this.position[1].toFixed(2)}, ${this.position[2].toFixed(2)}]`);
        console.log(`Camera Rotation: Yaw=${yaw.toFixed(2)}°, Pitch=${pitch.toFixed(2)}°`);
        console.log(`Camera Target: [${this.target[0].toFixed(2)}, ${this.target[1].toFixed(2)}, ${this.target[2].toFixed(2)}]`);
    }
}
exports.Camera = Camera;
//# sourceMappingURL=camera.js.map