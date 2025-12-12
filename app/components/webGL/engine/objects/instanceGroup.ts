import { mat4, vec3, quat } from "gl-matrix";
import { Mesh } from "./mesh";
import { Material } from "./material";
import { Node } from "./node";
import { Engine } from "./engine";

/**
 * InstanceGroup - Groups nodes that share the same mesh and material
 * This allows rendering multiple instances in a single draw call using instancing
 */
export class InstanceGroup {
    engine: Engine;
    mesh: Mesh;
    material: Material | null;
    nodes: Node[] = [];
    
    // Instance data buffer for model matrices (4x4 matrices = 16 floats each)
    instanceMatrixBuffer: WebGLBuffer | null = null;
    instanceCount: number = 0;
    
    // Cache for attribute locations
    private attribCache = new Map<WebGLProgram, {
        instanceMatrix0: number;
        instanceMatrix1: number;
        instanceMatrix2: number;
        instanceMatrix3: number;
    }>();

    constructor(engine: Engine, mesh: Mesh, material: Material | null) {
        this.engine = engine;
        this.mesh = mesh;
        this.material = material;
        
        const gl = this.gl();
        this.instanceMatrixBuffer = gl.createBuffer();
    }

    gl(): WebGL2RenderingContext {
        return this.engine.gl;
    }

    /**
     * Add a node to this instance group
     */
    addNode(node: Node) {
        if (node.mesh !== this.mesh || node.material !== this.material) {
            throw new Error("Node mesh/material must match instance group");
        }
        this.nodes.push(node);
        this.instanceCount = this.nodes.length;
    }

    /**
     * Remove a node from this instance group
     */
    removeNode(node: Node) {
        const index = this.nodes.indexOf(node);
        if (index !== -1) {
            this.nodes.splice(index, 1);
            this.instanceCount = this.nodes.length;
        }
    }

    /**
     * Update instance data buffers with current node matrices
     * Call this before rendering if nodes have moved/rotated
     */
    updateInstanceData() {
        if (this.nodes.length === 0) return;
        
        const gl = this.gl();
        
        // Collect all model matrices from nodes
        const matrices = new Float32Array(this.nodes.length * 16); // 16 floats per 4x4 matrix
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            node.updateMatrix();
            // Copy matrix into array (mat4 is column-major, which is what WebGL expects)
            matrices.set(node.modelMatrix, i * 16);
        }
        
        // Upload to GPU
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceMatrixBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, matrices, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    /**
     * Configure instanced vertex attributes for model matrices
     * A 4x4 matrix requires 4 vec4 attributes (one per column)
     */
    setupInstanceAttributes(program: WebGLProgram) {
        const gl = this.gl();
        
        // Get cached attribute locations
        let attribs = this.attribCache.get(program);
        if (!attribs) {
            attribs = {
                instanceMatrix0: gl.getAttribLocation(program, "aInstanceMatrix0"),
                instanceMatrix1: gl.getAttribLocation(program, "aInstanceMatrix1"),
                instanceMatrix2: gl.getAttribLocation(program, "aInstanceMatrix2"),
                instanceMatrix3: gl.getAttribLocation(program, "aInstanceMatrix3"),
            };
            this.attribCache.set(program, attribs);
        }

        // If attributes don't exist in shader, skip (fallback to non-instanced rendering)
        if (attribs.instanceMatrix0 === -1) {
            return false;
        }

        // Bind instance data buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceMatrixBuffer);
        
        // Configure 4 vec4 attributes for the 4x4 matrix
        // Each column of the matrix is a vec4
        const stride = 16 * 4; // 16 floats * 4 bytes per float = 64 bytes
        const offset0 = 0;
        const offset1 = 4 * 4;  // 4 floats * 4 bytes
        const offset2 = 8 * 4;  // 8 floats * 4 bytes
        const offset3 = 12 * 4; // 12 floats * 4 bytes

        // Column 0
        gl.enableVertexAttribArray(attribs.instanceMatrix0);
        gl.vertexAttribPointer(attribs.instanceMatrix0, 4, gl.FLOAT, false, stride, offset0);
        gl.vertexAttribDivisor(attribs.instanceMatrix0, 1); // Advance once per instance

        // Column 1
        gl.enableVertexAttribArray(attribs.instanceMatrix1);
        gl.vertexAttribPointer(attribs.instanceMatrix1, 4, gl.FLOAT, false, stride, offset1);
        gl.vertexAttribDivisor(attribs.instanceMatrix1, 1);

        // Column 2
        gl.enableVertexAttribArray(attribs.instanceMatrix2);
        gl.vertexAttribPointer(attribs.instanceMatrix2, 4, gl.FLOAT, false, stride, offset2);
        gl.vertexAttribDivisor(attribs.instanceMatrix2, 1);

        // Column 3
        gl.enableVertexAttribArray(attribs.instanceMatrix3);
        gl.vertexAttribPointer(attribs.instanceMatrix3, 4, gl.FLOAT, false, stride, offset3);
        gl.vertexAttribDivisor(attribs.instanceMatrix3, 1);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        return true;
    }

    /**
     * Disable instanced attributes (cleanup)
     */
    disableInstanceAttributes(program: WebGLProgram) {
        const gl = this.gl();
        const attribs = this.attribCache.get(program);
        if (!attribs) return;

        if (attribs.instanceMatrix0 !== -1) {
            gl.disableVertexAttribArray(attribs.instanceMatrix0);
            gl.vertexAttribDivisor(attribs.instanceMatrix0, 0);
        }
        if (attribs.instanceMatrix1 !== -1) {
            gl.disableVertexAttribArray(attribs.instanceMatrix1);
            gl.vertexAttribDivisor(attribs.instanceMatrix1, 0);
        }
        if (attribs.instanceMatrix2 !== -1) {
            gl.disableVertexAttribArray(attribs.instanceMatrix2);
            gl.vertexAttribDivisor(attribs.instanceMatrix2, 0);
        }
        if (attribs.instanceMatrix3 !== -1) {
            gl.disableVertexAttribArray(attribs.instanceMatrix3);
            gl.vertexAttribDivisor(attribs.instanceMatrix3, 0);
        }
    }

    /**
     * Render all instances in this group
     */
    drawInstanced(
        gl: WebGL2RenderingContext,
        program: WebGLProgram,
        viewProjMatrix: mat4,
        cameraPos: [number, number, number]
    ) {
        if (this.nodes.length === 0) return;

        // Update instance data
        this.updateInstanceData();

        // Bind material (shared across all instances)
        if (this.material) {
            this.material.bindUniforms(program);
        } else {
            // Default white material
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, Material.defaultWhiteTexture(gl));
            const diffuseLoc = this.engine.getUniformLocation(program, "uDiffuseMap");
            if (diffuseLoc !== null) gl.uniform1i(diffuseLoc, 0);
            
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, Material.defaultWhiteTexture(gl));
            const normalLoc = this.engine.getUniformLocation(program, "uNormalMap");
            if (normalLoc !== null) gl.uniform1i(normalLoc, 1);
            
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, Material.defaultWhiteTexture(gl));
            const specLoc = this.engine.getUniformLocation(program, "uRoughnessMap");
            if (specLoc !== null) gl.uniform1i(specLoc, 2);
            
            const colorLoc = this.engine.getUniformLocation(program, "uMaterialColor");
            if (colorLoc !== null) gl.uniform3f(colorLoc, 1.0, 1.0, 1.0);
            
            const emissionLoc = this.engine.getUniformLocation(program, "uEmission");
            if (emissionLoc !== null) gl.uniform3f(emissionLoc, 0.0, 0.0, 0.0);
            
            const roughnessLoc = this.engine.getUniformLocation(program, "uRoughness");
            if (roughnessLoc !== null) gl.uniform1f(roughnessLoc, 0.5);
            const roughnessMultiplierLoc = this.engine.getUniformLocation(program, "uRoughnessMultiplier");
            if (roughnessMultiplierLoc !== null) gl.uniform1f(roughnessMultiplierLoc, 1.0);
            const metallicLoc = this.engine.getUniformLocation(program, "uMetallic");
            if (metallicLoc !== null) gl.uniform1f(metallicLoc, 0.0);
            const metallicMultiplierLoc = this.engine.getUniformLocation(program, "uMetallicMultiplier");
            if (metallicMultiplierLoc !== null) gl.uniform1f(metallicMultiplierLoc, 1.0);
        }

        // Set camera position (shared across all instances)
        const viewPosLoc = this.engine.getUniformLocation(program, "uViewPos");
        if (viewPosLoc !== null) {
            gl.uniform3fv(viewPosLoc, cameraPos);
        }
        const camLoc = this.engine.getUniformLocation(program, "uCameraPos");
        if (camLoc !== null) {
            gl.uniform3fv(camLoc, cameraPos);
        }

        // Set view-projection matrix (shared across all instances)
        // Individual model matrices come from instance attributes
        const vpLoc = this.engine.getUniformLocation(program, "uViewProj");
        if (vpLoc !== null) {
            gl.uniformMatrix4fv(vpLoc, false, viewProjMatrix);
        }

        // Bind mesh attributes (sets up regular vertex attributes in VAO)
        this.mesh.bindAttributes(program);
        
        // Check if shader supports instancing
        const instanceMatrix0Loc = gl.getAttribLocation(program, "aInstanceMatrix0");
        const hasInstancing = instanceMatrix0Loc !== -1;

        // Set instancing flag
        const useInstancingLoc = this.engine.getUniformLocation(program, "uUseInstancing");
        if (useInstancingLoc !== null) {
            gl.uniform1i(useInstancingLoc, hasInstancing ? 1 : 0);
        }
        
        if (hasInstancing) {
            // Bind VAO again (bindAttributes unbinds it)
            gl.bindVertexArray(this.mesh.vao);
            
            // Setup instance attributes (must be done while VAO is bound)
            this.setupInstanceAttributes(program);
            
            // Use instanced rendering
            gl.drawElementsInstanced(
                gl.TRIANGLES,
                this.mesh.numIndices,
                gl.UNSIGNED_SHORT,
                0,
                this.nodes.length
            );
            
            // Cleanup instance attributes
            this.disableInstanceAttributes(program);
            gl.bindVertexArray(null);
        } else {
            // Fallback: render each instance individually (non-instanced)
            // Make sure instancing flag is false
            const useInstancingLoc = this.engine.getUniformLocation(program, "uUseInstancing");
            if (useInstancingLoc !== null) {
                gl.uniform1i(useInstancingLoc, 0);
            }
            
            for (const node of this.nodes) {
                node.updateMatrix();
                
                const modelLoc = this.engine.getUniformLocation(program, "uModel");
                gl.uniformMatrix4fv(modelLoc, false, node.modelMatrix);
                
                const mvp = mat4.create();
                mat4.multiply(mvp, viewProjMatrix, node.modelMatrix);
                const mvpLoc = this.engine.getUniformLocation(program, "uMVP");
                gl.uniformMatrix4fv(mvpLoc, false, mvp);
                
                this.mesh.drawElements();
            }
        }
    }
}
