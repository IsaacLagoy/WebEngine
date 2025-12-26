import { mat4 } from "gl-matrix";
import { Mesh } from "./mesh";
import { Material } from "./material";
import { Node } from "./node";
import { Engine } from "./engine";
/**
 * InstanceGroup - Groups nodes that share the same mesh and material
 * This allows rendering multiple instances in a single draw call using instancing
 */
export declare class InstanceGroup {
    engine: Engine;
    mesh: Mesh;
    material: Material | null;
    nodes: Node[];
    instanceMatrixBuffer: WebGLBuffer | null;
    instanceCount: number;
    private attribCache;
    constructor(engine: Engine, mesh: Mesh, material: Material | null);
    gl(): WebGL2RenderingContext;
    /**
     * Add a node to this instance group
     */
    addNode(node: Node): void;
    /**
     * Remove a node from this instance group
     */
    removeNode(node: Node): void;
    /**
     * Update instance data buffers with current node matrices
     * Call this before rendering if nodes have moved/rotated
     */
    updateInstanceData(): void;
    /**
     * Configure instanced vertex attributes for model matrices
     * A 4x4 matrix requires 4 vec4 attributes (one per column)
     * Instancing is required - attributes must exist in shader
     */
    setupInstanceAttributes(program: WebGLProgram): void;
    /**
     * Disable instanced attributes (cleanup)
     */
    disableInstanceAttributes(program: WebGLProgram): void;
    /**
     * Render all instances in this group
     */
    drawInstanced(gl: WebGL2RenderingContext, program: WebGLProgram, viewProjMatrix: mat4, cameraPos: [number, number, number]): void;
}
//# sourceMappingURL=instanceGroup.d.ts.map