

export class Quad {
    gl: WebGLRenderingContext;
    vertexBuffer: WebGLBuffer | null;
    texCoordBuffer: WebGLBuffer | null;

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;

        // Two triangles forming a quad covering the screen (NDC coordinates)
        const vertices = new Float32Array([
            -1, -1,  // bottom-left
             1, -1,  // bottom-right
            -1,  1,  // top-left
             1,  1   // top-right
        ]);

        // Texture coordinates (flipped vertically for proper orientation)
        const texCoords = new Float32Array([
            0, 0,  // bottom-left
            1, 0,  // bottom-right
            0, 1,  // top-left
            1, 1   // top-right
        ]);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    }

    draw(program: WebGLProgram) {
        const gl = this.gl;

        // Bind position attribute
        const posLoc = gl.getAttribLocation(program, "aPosition");
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        // Bind texcoord attribute
        const texLoc = gl.getAttribLocation(program, "aTexCoord");
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(texLoc);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

        // Draw as triangle strip (4 vertices = 2 triangles)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}