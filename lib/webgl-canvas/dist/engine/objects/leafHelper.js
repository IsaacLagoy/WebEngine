"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLeafNode = createLeafNode;
const node_1 = require("./node");
const gl_matrix_1 = require("gl-matrix");
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
function createLeafNode(scene, position, scale, mesh, material) {
    // Random rotation for natural variation
    // Some leaves flatter (smaller pitch), others more angled
    const rotation = gl_matrix_1.quat.create();
    const randomYaw = Math.random() * Math.PI * 2; // Random rotation around Y axis (0-360°)
    const randomPitch = (Math.random() - 0.5) * Math.PI * 0.4; // Tilt variation (-36° to +36°)
    const randomRoll = (Math.random() - 0.5) * Math.PI * 0.3; // Roll variation (-27° to +27°)
    // Convert to degrees for fromEuler (which expects degrees)
    gl_matrix_1.quat.fromEuler(rotation, randomPitch * 180 / Math.PI, randomYaw * 180 / Math.PI, randomRoll * 180 / Math.PI);
    const node = new node_1.Node(scene, position, scale, rotation, mesh, material);
    // Explicitly set velocity and angularVelocity to zero to prevent any movement/swaying
    gl_matrix_1.vec3.set(node.velocity, 0, 0, 0);
    gl_matrix_1.vec3.set(node.angularVelocity, 0, 0, 0);
    // Mark leaf as static so it skips update calls entirely
    node.skipUpdate = true;
    scene.add(node);
    return node;
}
//# sourceMappingURL=leafHelper.js.map