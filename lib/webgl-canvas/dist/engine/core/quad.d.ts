/**
 * Quad class - represents a fullscreen quad for post-processing
 * This is a simple 2D rectangle that covers the entire screen
 * Used to render textures (like framebuffers) to the screen
 *
 * Uses VAO (Vertex Array Object) - a WebGL 2.0 feature that stores
 * all vertex attribute bindings, making rendering much faster
 */
export declare class Quad {
    gl: WebGL2RenderingContext;
    vao: WebGLVertexArrayObject | null;
    vertexBuffer: WebGLBuffer | null;
    texCoordBuffer: WebGLBuffer | null;
    constructor(gl: WebGL2RenderingContext);
    /**
     * Draws the fullscreen quad
     * With VAO, we bind it and configure attributes once per program
     * @param program - The shader program to use for rendering
     */
    draw(program: WebGLProgram): void;
}
//# sourceMappingURL=quad.d.ts.map