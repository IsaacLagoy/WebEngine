"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mesh = void 0;
const tangents_1 = require("../../math/tangents");
const obj_parser_1 = require("./obj-parser");
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
class Mesh {
    constructor(engine, obj) {
        // Cache attribute locations per shader program (avoids repeated lookups)
        this.attribCache = new Map();
        this.engine = engine;
        this.obj = obj;
        // Compute tangents for normal mapping (needed for bump mapping effects)
        // This can be slow for large meshes, but must be synchronous here
        // Consider moving to async if this becomes a bottleneck
        let tangents;
        try {
            tangents = (0, tangents_1.computeTangents)(obj);
        }
        catch (error) {
            console.warn("Failed to compute tangents, using zero tangents:", error);
            // Fallback: create zero tangents
            const numVerts = obj.vertices.length / 3;
            tangents = new Array(numVerts * 3).fill(0);
        }
        // Create VAO - this will store all our vertex attribute configurations
        const gl = this.gl();
        this.vao = gl.createVertexArray();
        if (!this.vao) {
            throw new Error("Failed to create VAO - WebGL 2.0 may not be fully supported");
        }
        gl.bindVertexArray(this.vao);
        // Create and upload all vertex data buffers (VBOs)
        // ARRAY_BUFFER is for vertex attributes (positions, normals, etc.)
        this.tangentBuffer = this.createBuffer(gl.ARRAY_BUFFER, new Float32Array(tangents));
        this.vertexBuffer = this.createBuffer(gl.ARRAY_BUFFER, new Float32Array(obj.vertices));
        // Validate normals exist
        if (!obj.vertexNormals || obj.vertexNormals.length === 0) {
            console.warn("OBJ file has no vertex normals, using zero normals");
            const numVerts = obj.vertices.length / 3;
            obj.vertexNormals = new Array(numVerts * 3).fill(0);
        }
        this.normalBuffer = this.createBuffer(gl.ARRAY_BUFFER, new Float32Array(obj.vertexNormals));
        // Texture coordinates are optional
        if (obj.textures && obj.textures.length > 0) {
            this.texcoordBuffer = this.createBuffer(gl.ARRAY_BUFFER, new Float32Array(obj.textures));
        }
        else {
            console.warn("OBJ file has no texture coordinates");
            this.texcoordBuffer = null;
        }
        // ELEMENT_ARRAY_BUFFER is for indices (defines which vertices form triangles)
        // Use Uint32Array if we have more than 65535 vertices (Uint16 limit)
        const numVertices = obj.vertices.length / 3;
        // Find max index efficiently without spreading large arrays
        let maxIndex = 0;
        for (let i = 0; i < obj.indices.length; i++) {
            if (obj.indices[i] > maxIndex) {
                maxIndex = obj.indices[i];
            }
        }
        if (maxIndex > 65535 || numVertices > 65535) {
            // Need 32-bit indices
            this.indexBuffer = this.createBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(obj.indices));
            this.indexType = gl.UNSIGNED_INT;
        }
        else {
            // Can use 16-bit indices (more efficient)
            this.indexBuffer = this.createBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(obj.indices));
            this.indexType = gl.UNSIGNED_SHORT;
        }
        this.numIndices = obj.indices.length;
        // Unbind VAO - configuration is saved, can unbind now
        gl.bindVertexArray(null);
    }
    /**
     * Yields control to the browser to prevent blocking the main thread
     * Uses requestIdleCallback if available, otherwise setTimeout
     */
    static async yieldToBrowser() {
        return new Promise((resolve) => {
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(() => resolve(), { timeout: 0 });
            }
            else {
                // Fallback for browsers without requestIdleCallback
                setTimeout(() => resolve(), 0);
            }
        });
    }
    static async fromObj(engine, url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch OBJ file: ${response.status} ${response.statusText}`);
            }
            const text = await response.text();
            // Log file size for debugging
            const fileSizeKB = (text.length / 1024).toFixed(2);
            console.log(`Loading OBJ file: ${url} (${fileSizeKB} KB)`);
            // Parse OBJ file asynchronously (yields control to prevent blocking)
            // Note: The actual parsing is still synchronous, but we yield before/after
            // to allow the browser to handle other tasks
            let parsedData;
            try {
                parsedData = await (0, obj_parser_1.parseObjAsync)(text);
            }
            catch (parseError) {
                console.error(`Failed to parse OBJ file ${url}:`, parseError);
                throw new Error(`OBJ parsing failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
            }
            // Validate parsed data
            if (!parsedData.vertices || parsedData.vertices.length === 0) {
                throw new Error(`OBJ file ${url} has no vertices`);
            }
            if (!parsedData.indices || parsedData.indices.length === 0) {
                throw new Error(`OBJ file ${url} has no indices`);
            }
            const vertexCount = parsedData.vertices.length / 3;
            const faceCount = parsedData.indices.length / 3;
            console.log(`Parsed OBJ: ${vertexCount} vertices, ${faceCount} faces`);
            // Create OBJ.Mesh-like object from parsed data
            const obj = {
                vertices: parsedData.vertices,
                vertexNormals: parsedData.vertexNormals || [],
                textures: parsedData.textures || [],
                indices: parsedData.indices
            };
            // Yield before creating the mesh (which does tangent computation)
            await Mesh.yieldToBrowser();
            return new Mesh(engine, obj);
        }
        catch (error) {
            console.error(`Error loading mesh from ${url}:`, error);
            throw error;
        }
    }
    /**
     * Creates a mesh from arbitrary geometry data
     * @param engine - The WebGL engine
     * @param vertices - Array of vertex positions (x, y, z, x, y, z, ...)
     * @param vertexNormals - Array of vertex normals (nx, ny, nz, nx, ny, nz, ...)
     * @param textures - Array of texture coordinates (u, v, u, v, ...)
     * @param indices - Array of vertex indices for triangles
     * @returns A new Mesh instance
     */
    static createFromGeometry(engine, vertices, vertexNormals, textures, indices) {
        // Create a fake OBJ.Mesh-like object
        const fakeObj = {
            vertices: vertices,
            vertexNormals: vertexNormals,
            textures: textures,
            indices: indices
        };
        return new Mesh(engine, fakeObj);
    }
    /**
     * Creates a buffer (VBO or EBO) and uploads data to GPU
     * @param target - ARRAY_BUFFER for vertex data, ELEMENT_ARRAY_BUFFER for indices
     * @param data - The actual data to upload
     */
    createBuffer(target, data) {
        const gl = this.gl();
        const buffer = gl.createBuffer();
        gl.bindBuffer(target, buffer);
        // STATIC_DRAW means data won't change - GPU can optimize storage location
        gl.bufferData(target, data, gl.STATIC_DRAW);
        return buffer;
    }
    gl() {
        return this.engine.gl;
    }
    /**
     * Configures vertex attributes for a shader program
     * With VAO, this only needs to be called once per program, not every frame!
     * The VAO stores all these bindings so we can restore them instantly
     *
     * @param program - The shader program to configure attributes for
     */
    bindAttributes(program) {
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
        // Use the appropriate index type (16-bit or 32-bit)
        gl.drawElements(gl.TRIANGLES, this.obj.indices.length, this.indexType, 0);
        gl.bindVertexArray(null);
    }
    /**
     * Gets all vertex positions from the mesh
     * @returns Array of vertex positions as [x, y, z] tuples
     */
    getVertices() {
        const vertices = [];
        const verts = this.obj.vertices;
        for (let i = 0; i < verts.length; i += 3) {
            vertices.push([verts[i], verts[i + 1], verts[i + 2]]);
        }
        return vertices;
    }
    /**
     * Gets the raw vertex array (flat array: [x1, y1, z1, x2, y2, z2, ...])
     * @returns The raw vertex array
     */
    getVerticesFlat() {
        return [...this.obj.vertices];
    }
    /**
     * Gets the number of vertices in the mesh
     * @returns Number of vertices
     */
    getVertexCount() {
        return this.obj.vertices.length / 3;
    }
}
exports.Mesh = Mesh;
//# sourceMappingURL=mesh.js.map