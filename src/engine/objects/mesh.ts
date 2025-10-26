import * as OBJ from "webgl-obj-loader";
import { vec3, vec2 } from "gl-matrix";
import { Engine } from "./engine";


export class Mesh {
    engine: Engine;
    obj: OBJ.Mesh;
    vertexBuffer: WebGLBuffer | null;
    indexBuffer: WebGLBuffer | null;
    normalBuffer: WebGLBuffer | null;
    texcoordBuffer: WebGLBuffer | null;
    tangentBuffer: WebGLBuffer | null;
    numIndices: number;

    private attribCache = new Map<WebGLProgram, {
        position: number;
        normal: number;
        texCoord: number;
        tangent: number;
    }>();

    constructor(engine: Engine, obj: OBJ.Mesh) {
        this.engine = engine;
        this.obj = obj;

        // compute tangents from obj data
        const tangents = this.computeTangents(obj);
        this.tangentBuffer = this.createBuffer(this.gl().ARRAY_BUFFER, new Float32Array(tangents));

        // create standard buffers
        this.vertexBuffer   = this.createBuffer(this.gl().ARRAY_BUFFER, new Float32Array(obj.vertices));
        this.normalBuffer   = this.createBuffer(this.gl().ARRAY_BUFFER, new Float32Array(obj.vertexNormals));
        this.texcoordBuffer = this.createBuffer(this.gl().ARRAY_BUFFER, new Float32Array(obj.textures));
        this.indexBuffer    = this.createBuffer(this.gl().ELEMENT_ARRAY_BUFFER, new Uint16Array(obj.indices));
        this.numIndices = obj.indices.length;
    }

    static async fromObj(engine: Engine, url: string) {
        const response = await fetch(url);
        const text = await response.text();
        const obj = new OBJ.Mesh(text);
        return new Mesh(engine, obj);
    }

    private createBuffer(target: number, data: BufferSource) {
        const gl = this.gl();
        const buffer = gl.createBuffer();
        gl.bindBuffer(target, buffer);
        gl.bufferData(target, data, gl.STATIC_DRAW);
        return buffer;
    }

    gl(): WebGLRenderingContext {
        return this.engine.gl;
    }

    bindAttributes(program: WebGLProgram) {
        const gl = this.gl();
        
        // Get cached attribute locations
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

        // position
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(attribs.position);
        gl.vertexAttribPointer(attribs.position, 3, gl.FLOAT, false, 0, 0);

        // normal
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.enableVertexAttribArray(attribs.normal);
        gl.vertexAttribPointer(attribs.normal, 3, gl.FLOAT, false, 0, 0);

        // texCoords
        if (attribs.texCoord !== -1 && this.obj.textures) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
            gl.enableVertexAttribArray(attribs.texCoord);
            gl.vertexAttribPointer(attribs.texCoord, 2, gl.FLOAT, false, 0, 0);
        }

        // tangent
        if (attribs.tangent !== -1 && this.tangentBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
            gl.enableVertexAttribArray(attribs.tangent);
            gl.vertexAttribPointer(attribs.tangent, 3, gl.FLOAT, false, 0, 0);
        }

        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    }

    drawElements() {
        this.gl().drawElements(this.gl().TRIANGLES, this.obj.indices.length, this.gl().UNSIGNED_SHORT, 0);
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

