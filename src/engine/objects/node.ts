import { mat4, vec3, quat } from "gl-matrix";
import { Mesh } from "./mesh";
import { Material } from "./material";
import { Scene } from "./scene";


export class Node {
    scene: Scene;

    mesh: Mesh;
    material: Material;

    position: vec3;
    scale: vec3;
    rotation: quat;
    modelMatrix: mat4 = mat4.create();

    // kinematics
    velocity: vec3;
    angularVelocity: vec3;

    constructor(scene: Scene, position: vec3, scale: vec3, rotation: quat, mesh: Mesh, material: Material) {
        this.scene = scene;
        this.position = position;
        this.scale = scale;
        this.rotation = rotation;

        this.mesh = mesh;
        this.material = material;

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

    draw(gl: WebGLRenderingContext, program: WebGLProgram, viewProjMatrix: mat4, cameraPos: [number, number, number]) {
        this.updateMatrix();
        
        // mvp and model
        const modelLoc = this.scene. engine.getUniformLocation(program, "uModel");
        gl.uniformMatrix4fv(modelLoc, false, this.modelMatrix);

        const mvp = mat4.create();
        mat4.multiply(mvp, viewProjMatrix, this.modelMatrix);
        const mvpLoc = this.scene. engine.getUniformLocation(program, "uMVP");
        gl.uniformMatrix4fv(mvpLoc, false, mvp);

        // camera position for specular
        const camLoc = this.scene. engine.getUniformLocation(program, "uCameraPos");
        gl.uniform3fv(camLoc, cameraPos);

        // light direction
        const lightDirLoc = this.scene. engine.getUniformLocation(program, "uLightDir");
        gl.uniform3fv(lightDirLoc, [0, 1, 1]);

        // bind material and mesh
        this.material.bindUniforms(program);
        this.mesh.bindAttributes(program);

        this.mesh.drawElements();
    }
}