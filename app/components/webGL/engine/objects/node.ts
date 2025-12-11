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

    /**
     * Draws this node (3D object) to the screen
     * @param gl - WebGL 2.0 context
     * @param program - Shader program to use
     * @param viewProjMatrix - Combined view and projection matrix
     * @param cameraPos - Camera position (for lighting calculations)
     */
    draw(gl: WebGL2RenderingContext, program: WebGLProgram, viewProjMatrix: mat4, cameraPos: [number, number, number]) {
        this.updateMatrix();
        
        // mvp and model
        const modelLoc = this.scene.engine.getUniformLocation(program, "uModel");
        gl.uniformMatrix4fv(modelLoc, false, this.modelMatrix);

        const mvp = mat4.create();
        mat4.multiply(mvp, viewProjMatrix, this.modelMatrix);
        const mvpLoc = this.scene.engine.getUniformLocation(program, "uMVP");
        gl.uniformMatrix4fv(mvpLoc, false, mvp);

        // camera position for specular (shader uses uViewPos)
        const viewPosLoc = this.scene.engine.getUniformLocation(program, "uViewPos");
        if (viewPosLoc !== null) {
            gl.uniform3fv(viewPosLoc, cameraPos);
        }
        // Also set uCameraPos for backwards compatibility
        const camLoc = this.scene.engine.getUniformLocation(program, "uCameraPos");
        if (camLoc !== null) {
            gl.uniform3fv(camLoc, cameraPos);
        }

        // directional light
        const lightDirLoc = this.scene.engine.getUniformLocation(program, "uLightDir");
        gl.uniform3fv(lightDirLoc, [0, 1, 1]);

        // bind material (if present) or use default white material
        if (this.material) {
            this.material.bindUniforms(program);
        } else {
            // Default white material for nodes without materials
            const gl = this.scene.engine.gl;
            
            // Bind white textures (shader will detect white and use defaults)
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, Material.defaultWhiteTexture(gl));
            const diffuseLoc = this.scene.engine.getUniformLocation(program, "uDiffuseMap");
            if (diffuseLoc !== null) gl.uniform1i(diffuseLoc, 0);
            
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, Material.defaultWhiteTexture(gl));
            const normalLoc = this.scene.engine.getUniformLocation(program, "uNormalMap");
            if (normalLoc !== null) gl.uniform1i(normalLoc, 1);
            
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, Material.defaultWhiteTexture(gl));
            const specLoc = this.scene.engine.getUniformLocation(program, "uRoughnessMap");
            if (specLoc !== null) gl.uniform1i(specLoc, 2);
            
            // Default white material color (255, 255, 255 normalized)
            const colorLoc = this.scene.engine.getUniformLocation(program, "uMaterialColor");
            if (colorLoc !== null) gl.uniform3f(colorLoc, 1.0, 1.0, 1.0);
            
            // Default roughness, roughness multiplier and metallic
            const roughnessLoc = this.scene.engine.getUniformLocation(program, "uRoughness");
            if (roughnessLoc !== null) gl.uniform1f(roughnessLoc, 0.5);
            const roughnessMultiplierLoc = this.scene.engine.getUniformLocation(program, "uRoughnessMultiplier");
            if (roughnessMultiplierLoc !== null) gl.uniform1f(roughnessMultiplierLoc, 1.0);
            const metallicLoc = this.scene.engine.getUniformLocation(program, "uMetallic");
            if (metallicLoc !== null) gl.uniform1f(metallicLoc, 0.0);
        }
        
        this.mesh.bindAttributes(program);
        this.mesh.drawElements();
    }
}