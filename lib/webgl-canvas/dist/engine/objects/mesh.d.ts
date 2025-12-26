import * as OBJ from "webgl-obj-loader";
import { Engine } from "./engine";
/**
 * Mesh class - represents a 3D model loaded from an OBJ file
 *
 * Uses modern WebGL 2.0 features:
 * - VAO (Vertex Array Object): Stores all vertex attribute bindings
 * - VBOs (Vertex Buffer Objects): Store vertex data (positions, normals, UVs, tangents)
 * - EBO (Element Buffer Object): Stores indices for indexed drawing
 *
 * This architecture is much more efficient than rebinding everything each frame
 */
export declare class Mesh {
    engine: Engine;
    obj: OBJ.Mesh;
    vao: WebGLVertexArrayObject | null;
    vertexBuffer: WebGLBuffer | null;
    normalBuffer: WebGLBuffer | null;
    texcoordBuffer: WebGLBuffer | null;
    tangentBuffer: WebGLBuffer | null;
    indexBuffer: WebGLBuffer | null;
    numIndices: number;
    indexType: number;
    private attribCache;
    constructor(engine: Engine, obj: OBJ.Mesh);
    /**
     * Yields control to the browser to prevent blocking the main thread
     * Uses requestIdleCallback if available, otherwise setTimeout
     */
    private static yieldToBrowser;
    static fromObj(engine: Engine, url: string): Promise<Mesh>;
    /**
     * Creates a mesh from arbitrary geometry data
     * @param engine - The WebGL engine
     * @param vertices - Array of vertex positions (x, y, z, x, y, z, ...)
     * @param vertexNormals - Array of vertex normals (nx, ny, nz, nx, ny, nz, ...)
     * @param textures - Array of texture coordinates (u, v, u, v, ...)
     * @param indices - Array of vertex indices for triangles
     * @returns A new Mesh instance
     */
    static createFromGeometry(engine: Engine, vertices: number[], vertexNormals: number[], textures: number[], indices: number[]): Mesh;
    /**
     * Creates a buffer (VBO or EBO) and uploads data to GPU
     * @param target - ARRAY_BUFFER for vertex data, ELEMENT_ARRAY_BUFFER for indices
     * @param data - The actual data to upload
     */
    private createBuffer;
    gl(): WebGL2RenderingContext;
    /**
     * Configures vertex attributes for a shader program
     * With VAO, this only needs to be called once per program, not every frame!
     * The VAO stores all these bindings so we can restore them instantly
     *
     * @param program - The shader program to configure attributes for
     */
    bindAttributes(program: WebGLProgram): void;
    /**
     * Draws the mesh using indexed rendering
     * This is efficient because it reuses vertices (e.g., a cube has 8 vertices but 12 triangles)
     */
    drawElements(): void;
    /**
     * Gets all vertex positions from the mesh
     * @returns Array of vertex positions as [x, y, z] tuples
     */
    getVertices(): [number, number, number][];
    /**
     * Gets the raw vertex array (flat array: [x1, y1, z1, x2, y2, z2, ...])
     * @returns The raw vertex array
     */
    getVerticesFlat(): number[];
    /**
     * Gets the number of vertices in the mesh
     * @returns Number of vertices
     */
    getVertexCount(): number;
}
//# sourceMappingURL=mesh.d.ts.map