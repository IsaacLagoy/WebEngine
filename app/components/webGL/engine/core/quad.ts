
/**
 * Quad class - represents a fullscreen quad for post-processing
 * This is a simple 2D rectangle that covers the entire screen
 * Used to render textures (like framebuffers) to the screen
 * 
 * Uses VAO (Vertex Array Object) - a WebGL 2.0 feature that stores
 * all vertex attribute bindings, making rendering much faster
 */
export class Quad {
    gl: WebGL2RenderingContext;
    vao: WebGLVertexArrayObject | null;  // VAO stores all vertex state
    vertexBuffer: WebGLBuffer | null;     // VBO: stores vertex positions
    texCoordBuffer: WebGLBuffer | null;   // VBO: stores texture coordinates

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;

        // Create VAO - this will store all our vertex attribute configurations
        // VAOs are a WebGL 2.0 feature that dramatically simplify rendering
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // Define vertices in NDC (Normalized Device Coordinates)
        // NDC ranges from -1 to 1, covering the entire screen
        // Two triangles forming a quad: bottom-left, bottom-right, top-left, top-right
        const vertices = new Float32Array([
            -1, -1,  // bottom-left
             1, -1,  // bottom-right
            -1,  1,  // top-left
             1,  1   // top-right
        ]);

        // Texture coordinates map the quad to a texture (0,0 = bottom-left, 1,1 = top-right)
        const texCoords = new Float32Array([
            0, 0,  // bottom-left
            1, 0,  // bottom-right
            0, 1,  // top-left
            1, 1   // top-right
        ]);

        // Create and upload vertex position buffer (VBO)
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        // STATIC_DRAW means data won't change, GPU can optimize storage

        // Create and upload texture coordinate buffer (VBO)
        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

        // Note: We can't configure vertex attributes here because we need the shader program
        // to know the attribute locations. Attributes will be configured when bindAttributes()
        // is called, or we'll configure them in draw() with the program.
        // The VAO will still store the buffer bindings though.

        // Unbind VAO - we've stored the buffer bindings
        gl.bindVertexArray(null);
    }

    /**
     * Draws the fullscreen quad
     * With VAO, we bind it and configure attributes once per program
     * @param program - The shader program to use for rendering
     */
    draw(program: WebGLProgram) {
        const gl = this.gl;

        // Bind the VAO - this restores buffer bindings
        gl.bindVertexArray(this.vao);

        // Get attribute locations (where in the shader these inputs are)
        const posLoc = gl.getAttribLocation(program, "aPosition");
        const texLoc = gl.getAttribLocation(program, "aTexCoord");

        // Configure position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(posLoc);
        // 2 = x,y components, FLOAT = 32-bit float, false = don't normalize, 0 = stride, 0 = offset
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        // Configure texture coordinate attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(texLoc);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

        // Draw as triangle strip: 4 vertices = 2 triangles covering the screen
        // TRIANGLE_STRIP is efficient: vertices 0,1,2 form first triangle, 1,2,3 form second
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Unbind VAO (optional, but good practice)
        gl.bindVertexArray(null);
    }
}