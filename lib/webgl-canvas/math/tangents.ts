import * as OBJ from "webgl-obj-loader";
import { vec3, vec2 } from "gl-matrix";

/**
 * Computes tangent vectors for each vertex in a mesh
 * Tangents are needed for normal mapping (bump mapping effects)
 * 
 * @param obj - The OBJ mesh to compute tangents for
 * @returns Array of tangent values (flattened: [x, y, z, x, y, z, ...])
 */
export function computeTangents(obj: OBJ.Mesh): number[] {
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
