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

        // integrate angular velocity
        const dq = quat.create();
        const qOmega = quat.fromValues(this.angularVelocity[0], this.angularVelocity[1], this.angularVelocity[2], 0);
        quat.multiply(dq, this.rotation, qOmega);
        quat.scale(dq, dq, 0.5 * dt);
        quat.add(this.rotation, this.rotation, dq);
        quat.normalize(this.rotation, this.rotation);
    }

    updateMatrix() {
        mat4.fromRotationTranslationScale(this.modelMatrix, this.rotation, this.position, this.scale);
    }
}