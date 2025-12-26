import { mat4, vec3, quat } from "gl-matrix";
import { Mesh } from "./mesh";
import { Material } from "./material";
import { Scene } from "./scene";
export declare class Node {
    scene: Scene;
    mesh: Mesh;
    material: Material | null;
    position: vec3;
    scale: vec3;
    rotation: quat;
    modelMatrix: mat4;
    velocity: vec3;
    angularVelocity: vec3;
    skipUpdate: boolean;
    constructor(scene: Scene, position: vec3, scale: vec3, rotation: quat, mesh: Mesh, material?: Material);
    update(dt: number): void;
    updateMatrix(): void;
}
//# sourceMappingURL=node.d.ts.map