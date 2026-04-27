import { mat4, vec3, quat } from "gl-matrix";
import { Mesh } from "./mesh";
import { Material } from "./material";
import { Scene } from "./scene";


export class Node {
    scene: Scene;

    mesh: Mesh;
    material: Material | null;

    position: vec3;
    scale: vec3;
    rotation: quat;
    modelMatrix: mat4 = mat4.create();

    // kinematics
    velocity: vec3;
    angularVelocity: vec3;
    
    // Flag to skip updates for static objects (like leaves)
    skipUpdate: boolean = false;

    constructor(scene: Scene, position: vec3, scale: vec3, rotation: quat, mesh: Mesh, material?: Material) {
        this.scene = scene;
        this.position = position;
        this.scale = scale;
        this.rotation = rotation;

        this.mesh = mesh;
        this.material = material || null;

        this.velocity = vec3.create();
        this.angularVelocity = vec3.create();
    }

    update(dt: number) {
        // integrate velocity
        const velocityScaled = vec3.create();
        vec3.scale(velocityScaled, this.velocity, dt);
        vec3.add(this.position, velocityScaled, this.position);

        // integrate angular velocity using proper quaternion integration
        // Formula: dq/dt = 0.5 * q * ω, where ω is angular velocity as a pure quaternion
        // The correct integration is: q_new = q_old * exp(0.5 * dt * ω)
        // For small dt, we approximate using axis-angle representation
        const angularSpeed = vec3.length(this.angularVelocity);
        if (angularSpeed > 0.0001) {
            // Calculate the total rotation angle: θ = |ω| * dt
            const rotationAngle = angularSpeed * dt;
            const axis = vec3.create();
            vec3.normalize(axis, this.angularVelocity);
            
            // Create quaternion from axis-angle: q = [sin(θ/2)*axis, cos(θ/2)]
            // setAxisAngle expects the full angle, not half angle
            const qDelta = quat.create();
            quat.setAxisAngle(qDelta, axis, rotationAngle);
            
            // Multiply rotations: q_new = q_old * q_delta
            // This correctly accumulates rotation over time
            quat.multiply(this.rotation, this.rotation, qDelta);
            quat.normalize(this.rotation, this.rotation);
        }
    }

    updateMatrix() {
        mat4.fromRotationTranslationScale(this.modelMatrix, this.rotation, this.position, this.scale);
    }
}