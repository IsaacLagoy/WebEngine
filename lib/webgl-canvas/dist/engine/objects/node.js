"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = void 0;
const gl_matrix_1 = require("gl-matrix");
class Node {
    constructor(scene, position, scale, rotation, mesh, material) {
        this.modelMatrix = gl_matrix_1.mat4.create();
        // Flag to skip updates for static objects (like leaves)
        this.skipUpdate = false;
        this.scene = scene;
        this.position = position;
        this.scale = scale;
        this.rotation = rotation;
        this.mesh = mesh;
        this.material = material || null;
        this.velocity = gl_matrix_1.vec3.create();
        this.angularVelocity = gl_matrix_1.vec3.create();
    }
    update(dt) {
        // integrate velocity
        const velocityScaled = gl_matrix_1.vec3.create();
        gl_matrix_1.vec3.scale(velocityScaled, this.velocity, dt);
        gl_matrix_1.vec3.add(this.position, velocityScaled, this.position);
        // integrate angular velocity using proper quaternion integration
        // Formula: dq/dt = 0.5 * q * ω, where ω is angular velocity as a pure quaternion
        // The correct integration is: q_new = q_old * exp(0.5 * dt * ω)
        // For small dt, we approximate using axis-angle representation
        const angularSpeed = gl_matrix_1.vec3.length(this.angularVelocity);
        if (angularSpeed > 0.0001) {
            // Calculate the total rotation angle: θ = |ω| * dt
            const rotationAngle = angularSpeed * dt;
            const axis = gl_matrix_1.vec3.create();
            gl_matrix_1.vec3.normalize(axis, this.angularVelocity);
            // Create quaternion from axis-angle: q = [sin(θ/2)*axis, cos(θ/2)]
            // setAxisAngle expects the full angle, not half angle
            const qDelta = gl_matrix_1.quat.create();
            gl_matrix_1.quat.setAxisAngle(qDelta, axis, rotationAngle);
            // Multiply rotations: q_new = q_old * q_delta
            // This correctly accumulates rotation over time
            gl_matrix_1.quat.multiply(this.rotation, this.rotation, qDelta);
            gl_matrix_1.quat.normalize(this.rotation, this.rotation);
        }
    }
    updateMatrix() {
        gl_matrix_1.mat4.fromRotationTranslationScale(this.modelMatrix, this.rotation, this.position, this.scale);
    }
}
exports.Node = Node;
//# sourceMappingURL=node.js.map