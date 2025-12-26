import * as OBJ from "webgl-obj-loader";
/**
 * Computes tangent vectors for each vertex in a mesh
 * Tangents are needed for normal mapping (bump mapping effects)
 *
 * @param obj - The OBJ mesh to compute tangents for
 * @returns Array of tangent values (flattened: [x, y, z, x, y, z, ...])
 */
export declare function computeTangents(obj: OBJ.Mesh): number[];
//# sourceMappingURL=tangents.d.ts.map