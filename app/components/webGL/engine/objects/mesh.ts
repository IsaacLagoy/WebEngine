import * as OBJ from "webgl-obj-loader";
import { vec3, vec2 } from "gl-matrix";
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
export class Mesh {
    engine: Engine;
    obj: OBJ.Mesh;
    
    // VAO stores all vertex attribute state (WebGL 2.0 feature)
    vao: WebGLVertexArrayObject | null;
    
    // VBOs (Vertex Buffer Objects) - store different types of vertex data
    vertexBuffer: WebGLBuffer | null;    // 3D positions (x, y, z)
    normalBuffer: WebGLBuffer | null;    // Surface normals for lighting
    texcoordBuffer: WebGLBuffer | null;  // Texture coordinates (UVs)
    tangentBuffer: WebGLBuffer | null;  // Tangents for normal mapping
    
    // EBO (Element Buffer Object) - stores indices for indexed drawing
    indexBuffer: WebGLBuffer | null;
    numIndices: number;

    // Cache attribute locations per shader program (avoids repeated lookups)
    private attribCache = new Map<WebGLProgram, {
        position: number;
        normal: number;
        texCoord: number;
        tangent: number;
    }>();

    constructor(engine: Engine, obj: OBJ.Mesh) {
        this.engine = engine;
        this.obj = obj;

        // Compute tangents for normal mapping (needed for bump mapping effects)
        const tangents = this.computeTangents(obj);
        
        // Create VAO - this will store all our vertex attribute configurations
        const gl = this.gl();
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // Create and upload all vertex data buffers (VBOs)
        // ARRAY_BUFFER is for vertex attributes (positions, normals, etc.)
        this.tangentBuffer = this.createBuffer(gl.ARRAY_BUFFER, new Float32Array(tangents));
        this.vertexBuffer = this.createBuffer(gl.ARRAY_BUFFER, new Float32Array(obj.vertices));
        this.normalBuffer = this.createBuffer(gl.ARRAY_BUFFER, new Float32Array(obj.vertexNormals));
        this.texcoordBuffer = this.createBuffer(gl.ARRAY_BUFFER, new Float32Array(obj.textures));
        
        // ELEMENT_ARRAY_BUFFER is for indices (defines which vertices form triangles)
        this.indexBuffer = this.createBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(obj.indices));
        this.numIndices = obj.indices.length;

        // Unbind VAO - configuration is saved, can unbind now
        gl.bindVertexArray(null);
    }

    static async fromObj(engine: Engine, url: string) {
        const response = await fetch(url);
        const text = await response.text();
        const obj = new OBJ.Mesh(text);
        return new Mesh(engine, obj);
    }

    /**
     * Creates a buffer (VBO or EBO) and uploads data to GPU
     * @param target - ARRAY_BUFFER for vertex data, ELEMENT_ARRAY_BUFFER for indices
     * @param data - The actual data to upload
     */
    private createBuffer(target: number, data: BufferSource) {
        const gl = this.gl();
        const buffer = gl.createBuffer();
        gl.bindBuffer(target, buffer);
        // STATIC_DRAW means data won't change - GPU can optimize storage location
        gl.bufferData(target, data, gl.STATIC_DRAW);
        return buffer;
    }

    gl(): WebGL2RenderingContext {
        return this.engine.gl;
    }

    /**
     * Configures vertex attributes for a shader program
     * With VAO, this only needs to be called once per program, not every frame!
     * The VAO stores all these bindings so we can restore them instantly
     * 
     * @param program - The shader program to configure attributes for
     */
    bindAttributes(program: WebGLProgram) {
        const gl = this.gl();
        
        // Get cached attribute locations (avoid repeated lookups)
        // Attribute locations tell us where in the shader each input is
        let attribs = this.attribCache.get(program);
        if (!attribs) {
            attribs = {
                position: gl.getAttribLocation(program, "aPosition"),
                normal: gl.getAttribLocation(program, "aNormal"),
                texCoord: gl.getAttribLocation(program, "aTexCoord"),
                tangent: gl.getAttribLocation(program, "aTangent")
            };
            this.attribCache.set(program, attribs);
        }

        // Bind VAO - this restores all vertex attribute configurations
        gl.bindVertexArray(this.vao);

        // Configure position attribute (3 floats: x, y, z)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(attribs.position);
        // 3 = components per vertex, FLOAT = data type, false = don't normalize, 0 = stride, 0 = offset
        gl.vertexAttribPointer(attribs.position, 3, gl.FLOAT, false, 0, 0);

        // Configure normal attribute (3 floats: nx, ny, nz) - used for lighting
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.enableVertexAttribArray(attribs.normal);
        gl.vertexAttribPointer(attribs.normal, 3, gl.FLOAT, false, 0, 0);

        // Configure texture coordinate attribute (2 floats: u, v) - if shader uses it
        if (attribs.texCoord !== -1 && this.obj.textures) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
            gl.enableVertexAttribArray(attribs.texCoord);
            gl.vertexAttribPointer(attribs.texCoord, 2, gl.FLOAT, false, 0, 0);
        }

        // Configure tangent attribute (3 floats) - used for normal mapping
        if (attribs.tangent !== -1 && this.tangentBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
            gl.enableVertexAttribArray(attribs.tangent);
            gl.vertexAttribPointer(attribs.tangent, 3, gl.FLOAT, false, 0, 0);
        }

        // Bind index buffer (EBO) - defines which vertices form triangles
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        
        // VAO now stores all this configuration - we can unbind
        gl.bindVertexArray(null);
    }

    /**
     * Draws the mesh using indexed rendering
     * This is efficient because it reuses vertices (e.g., a cube has 8 vertices but 12 triangles)
     */
    drawElements() {
        const gl = this.gl();
        // Bind VAO - restores all vertex attributes instantly!
        gl.bindVertexArray(this.vao);
        // Draw using indices - more efficient than drawing vertices directly
        gl.drawElements(gl.TRIANGLES, this.obj.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    private computeTangents(obj: OBJ.Mesh): number[] {
        const numVerts = obj.vertices.length / 3;
        const tangents: vec3[] = Array(numVerts).fill(0).map(() => vec3.create());

        const indices = obj.indices;
        const positions = obj.vertices;
        const uvs = obj.textures;

        for (let i = 0; i < indices.length; i += 3) {
            const i0 = indices[i];
            const i1 = indices[i + 1];
            const i2 = indices[i + 2];

            const p0 = vec3.fromValues(
                positions[i0 * 3 + 0],
                positions[i0 * 3 + 1],
                positions[i0 * 3 + 2]
            );
            const p1 = vec3.fromValues(
                positions[i1 * 3 + 0],
                positions[i1 * 3 + 1],
                positions[i1 * 3 + 2]
            );
            const p2 = vec3.fromValues(
                positions[i2 * 3 + 0],
                positions[i2 * 3 + 1],
                positions[i2 * 3 + 2]
            );

            const uv0 = vec2.fromValues(uvs[i0 * 2 + 0], uvs[i0 * 2 + 1]);
            const uv1 = vec2.fromValues(uvs[i1 * 2 + 0], uvs[i1 * 2 + 1]);
            const uv2 = vec2.fromValues(uvs[i2 * 2 + 0], uvs[i2 * 2 + 1]);

            const edge1 = vec3.sub(vec3.create(), p1, p0);
            const edge2 = vec3.sub(vec3.create(), p2, p0);
            const deltaUV1 = vec2.sub(vec2.create(), uv1, uv0);
            const deltaUV2 = vec2.sub(vec2.create(), uv2, uv0);

            const f = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV2[0] * deltaUV1[1]);

            const tangent = vec3.create();
            tangent[0] = f * (deltaUV2[1] * edge1[0] - deltaUV1[1] * edge2[0]);
            tangent[1] = f * (deltaUV2[1] * edge1[1] - deltaUV1[1] * edge2[1]);
            tangent[2] = f * (deltaUV2[1] * edge1[2] - deltaUV1[1] * edge2[2]);

            vec3.add(tangents[i0], tangents[i0], tangent);
            vec3.add(tangents[i1], tangents[i1], tangent);
            vec3.add(tangents[i2], tangents[i2], tangent);
        }

        // normalize
        const out: number[] = [];
        for (let i = 0; i < tangents.length; i++) {
            vec3.normalize(tangents[i], tangents[i]);
            out.push(tangents[i][0], tangents[i][1], tangents[i][2]);
        }

        return out;
    }
}

