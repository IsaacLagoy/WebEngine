import { Node } from "./node";
import { vec3 } from "gl-matrix";
/**
 * Helper functions for creating leaf quads using the instancing system
 */
/**
 * Creates a leaf node with a random rotation for natural variation
 * Some leaves will be flatter (more horizontal), others more angled
 *
 * @param scene - The scene to add the node to
 * @param position - World position for the leaf
 * @param scale - Scale of the leaf (e.g., [2, 2, 1] for a 2x2 quad)
 * @param mesh - The quad mesh to use
 * @param material - Material for the leaf (with texture, roughness, etc.)
 * @returns The created node
 */
export declare function createLeafNode(scene: any, position: vec3, scale: vec3, mesh: any, material: any): Node;
//# sourceMappingURL=leafHelper.d.ts.map