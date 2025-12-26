import { mat4, vec3, quat } from "gl-matrix";
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
    
    // Camera control settings
    rotationSpeed: number = 1.5; // radians per second
    moveSpeed: number = 5.0; // units per second

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

    /**
     * Update camera based on input state
     * @param dt - Delta time in seconds
     * @param inputState - Input state object with keys and mouse delta
     */
    update(dt: number, inputState?: { keys: Set<string>, mouseDeltaX: number, mouseDeltaY: number }) {
        if (!inputState || (inputState.keys.size === 0 && inputState.mouseDeltaX === 0 && inputState.mouseDeltaY === 0)) {
            return;
        }

        const rotationDelta = this.rotationSpeed * dt;
        const moveDelta = this.moveSpeed * dt;

        // Calculate forward direction (from position to target)
        const forward = vec3.create();
        vec3.subtract(forward, this.target, this.position);
        const distance = vec3.length(forward);
        vec3.normalize(forward, forward);

        // Calculate right direction (cross product of forward and up)
        const right = vec3.create();
        vec3.cross(right, forward, this.up);
        vec3.normalize(right, right);

        // Calculate actual up direction (cross product of right and forward)
        const up = vec3.create();
        vec3.cross(up, right, forward);
        vec3.normalize(up, up);

        let horizontalRotation = 0.0; // Yaw (around Y axis)
        let verticalRotation = 0.0; // Pitch (around right axis)
        let moveDirection = vec3.create(); // Movement direction

        // Mouse look (takes priority over arrow keys)
        if (inputState.mouseDeltaX !== 0 || inputState.mouseDeltaY !== 0) {
            horizontalRotation = -inputState.mouseDeltaX * rotationDelta;
            verticalRotation = -inputState.mouseDeltaY * rotationDelta;
        } else {
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
            vec3.add(moveDirection, moveDirection, forward);
        }
        if (inputState.keys.has("s")) {
            vec3.subtract(moveDirection, moveDirection, forward);
        }
        if (inputState.keys.has("a")) {
            vec3.subtract(moveDirection, moveDirection, right);
        }
        if (inputState.keys.has("d")) {
            vec3.add(moveDirection, moveDirection, right);
        }

        // Apply horizontal rotation (yaw) - rotate around Y axis
        if (horizontalRotation !== 0.0) {
            const yawAxis = vec3.fromValues(0, 1, 0);
            const rotationQuat = quat.create();
            quat.setAxisAngle(rotationQuat, yawAxis, horizontalRotation);
            vec3.transformQuat(forward, forward, rotationQuat);
        }

        // Apply vertical rotation (pitch) - rotate around right axis
        if (verticalRotation !== 0.0) {
            const pitchAxis = right;
            const rotationQuat = quat.create();
            quat.setAxisAngle(rotationQuat, pitchAxis, verticalRotation);
            vec3.transformQuat(forward, forward, rotationQuat);

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
        if (vec3.length(moveDirection) > 0.0) {
            vec3.normalize(moveDirection, moveDirection);
            vec3.scale(moveDirection, moveDirection, moveDelta);
            vec3.add(this.position, this.position, moveDirection);
            vec3.add(this.target, this.target, moveDirection);
            this.updateMatrices();
        }

        // Update camera target based on new forward direction
        if (horizontalRotation !== 0.0 || verticalRotation !== 0.0) {
            vec3.scale(forward, forward, distance);
            vec3.add(this.target, this.position, forward);
            this.updateMatrices();
        }
    }

    printState() {
        // Calculate rotation from forward direction
        const forward = vec3.create();
        vec3.subtract(forward, this.target, this.position);
        vec3.normalize(forward, forward);
        
        const yaw = Math.atan2(forward[0], forward[2]) * (180 / Math.PI);
        const pitch = Math.asin(forward[1]) * (180 / Math.PI);
        
        console.log(`Camera Position: [${this.position[0].toFixed(2)}, ${this.position[1].toFixed(2)}, ${this.position[2].toFixed(2)}]`);
        console.log(`Camera Rotation: Yaw=${yaw.toFixed(2)}°, Pitch=${pitch.toFixed(2)}°`);
        console.log(`Camera Target: [${this.target[0].toFixed(2)}, ${this.target[1].toFixed(2)}, ${this.target[2].toFixed(2)}]`);
    }
}