import { Node } from "./node";
import { vec3, quat } from "gl-matrix";

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
export function createLeafNode(
    scene: any,
    position: vec3,
    scale: vec3,
    mesh: any,
    material: any
): Node {
    // Random rotation for natural variation
    // Some leaves flatter (smaller pitch), others more angled
    const rotation = quat.create();
    const randomYaw = Math.random() * Math.PI * 2; // Random rotation around Y axis (0-360°)
    const randomPitch = (Math.random() - 0.5) * Math.PI * 0.4; // Tilt variation (-36° to +36°)
    const randomRoll = (Math.random() - 0.5) * Math.PI * 0.3; // Roll variation (-27° to +27°)
    
    // Convert to degrees for fromEuler (which expects degrees)
    quat.fromEuler(
        rotation,
        randomPitch * 180 / Math.PI,
        randomYaw * 180 / Math.PI,
        randomRoll * 180 / Math.PI
    );
    
    const node = new Node(scene, position, scale, rotation, mesh, material);
    
    // Explicitly set velocity and angularVelocity to zero to prevent any movement/swaying
    vec3.set(node.velocity, 0, 0, 0);
    vec3.set(node.angularVelocity, 0, 0, 0);
    
    // Mark leaf as static so it skips update calls entirely
    node.skipUpdate = true;
    
    scene.add(node);
    
    return node;
}
