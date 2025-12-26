"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tree = void 0;
const gl_matrix_1 = require("gl-matrix");
const mesh_1 = require("./mesh");
const material_1 = require("./material");
const node_1 = require("./node");
const terrain_1 = require("./terrain");
const leafHelper_1 = require("./leafHelper");
/**
 * Tree class - handles tree spawning and leaf placement
 */
class Tree {
    /**
     * Seeded random number generator for deterministic tree placement
     */
    static seededRandom(seedState) {
        seedState.value = (seedState.value * 9301 + 49297) % 233280;
        return seedState.value / 233280;
    }
    /**
     * Check if a point is within the camera's view frustum
     */
    static isInFrustum(worldPos, camPos, forward, right, up, camNear, camFar, frustumWidthNear, frustumHeightNear, frustumWidthFar, frustumHeightFar) {
        // Vector from camera to point
        const toPoint = gl_matrix_1.vec3.create();
        gl_matrix_1.vec3.subtract(toPoint, worldPos, camPos);
        // Project onto forward vector to get distance along view direction
        const distance = gl_matrix_1.vec3.dot(toPoint, forward);
        // Check if within near/far planes
        if (distance < camNear || distance > camFar) {
            return false;
        }
        // Project onto right and up vectors to get position in frustum plane
        const rightDist = gl_matrix_1.vec3.dot(toPoint, right);
        const upDist = gl_matrix_1.vec3.dot(toPoint, up);
        // Calculate frustum dimensions at this distance
        const t = (distance - camNear) / (camFar - camNear); // Interpolation factor
        const frustumWidth = frustumWidthNear + t * (frustumWidthFar - frustumWidthNear);
        const frustumHeight = frustumHeightNear + t * (frustumHeightFar - frustumHeightNear);
        // Check if within frustum bounds (widened by 2x)
        const spawnWidthMultiplier = 2.0; // Widen spawn space by 2x
        const margin = 0.1; // 10% margin
        return (Math.abs(rightDist) <= frustumWidth * (0.5 + margin) * spawnWidthMultiplier &&
            Math.abs(upDist) <= frustumHeight * (0.5 + margin) * spawnWidthMultiplier);
    }
    /**
     * Spawn trees in the scene based on camera view frustum
     */
    static async spawnTrees(engine, scene, treeMesh, barkMaterial, config) {
        // Collect all vertices from the tree mesh
        const treeVertices = treeMesh.getVertices();
        console.log(`Tree mesh has ${treeMesh.getVertexCount()} vertices`);
        console.log(`First 10 vertices:`, treeVertices.slice(0, 10));
        // Seeded random number generator for tree placement
        const seedState = { value: config.treeSeed };
        const seededRandom = () => Tree.seededRandom(seedState);
        // Seeded random number generator for tree sizes
        const sizeSeedState = { value: config.sizeSeed };
        const sizeSeededRandom = () => Tree.seededRandom(sizeSeedState);
        // Camera-based tree spawning: bias towards camera and limit to view frustum
        const camPos = scene.camera.position;
        const camTarget = scene.camera.target;
        const camFov = scene.camera.fov * (Math.PI / 180); // Convert to radians
        const camNear = scene.camera.near;
        const camFar = Math.min(scene.camera.far, 100); // Limit far distance for tree spawning
        const aspectRatio = engine.aspectRatio;
        // Calculate camera forward, right, and up vectors
        const forward = gl_matrix_1.vec3.create();
        gl_matrix_1.vec3.subtract(forward, camTarget, camPos);
        gl_matrix_1.vec3.normalize(forward, forward);
        const right = gl_matrix_1.vec3.create();
        gl_matrix_1.vec3.cross(right, forward, scene.camera.up);
        gl_matrix_1.vec3.normalize(right, right);
        const up = gl_matrix_1.vec3.create();
        gl_matrix_1.vec3.cross(up, right, forward);
        gl_matrix_1.vec3.normalize(up, up);
        // Calculate frustum dimensions at various distances
        const frustumHeightNear = 2 * camNear * Math.tan(camFov / 2);
        const frustumWidthNear = frustumHeightNear * aspectRatio;
        const frustumHeightFar = 2 * camFar * Math.tan(camFov / 2);
        const frustumWidthFar = frustumHeightFar * aspectRatio;
        let treesPlaced = 0;
        let attempts = 0;
        const maxAttempts = config.numTrees * 20; // Increased attempts for frustum filtering
        const treeNodes = [];
        // Spawn trees with uniform distribution
        while (treesPlaced < config.numTrees && attempts < maxAttempts) {
            attempts++;
            // Generate candidate position
            let logX = 0;
            let logZ = 0;
            let candidatePos = null;
            // Try multiple times to find a position within frustum
            let foundValidPos = false;
            for (let tryCount = 0; tryCount < 50; tryCount++) {
                // Generate position with uniform distribution (even spawn rate near and far)
                const randomDist = seededRandom() * (camFar - camNear) + camNear;
                // Generate position in camera's local space (forward-right-up)
                const localOffset = gl_matrix_1.vec3.create();
                const forwardOffset = gl_matrix_1.vec3.create();
                gl_matrix_1.vec3.scale(forwardOffset, forward, randomDist);
                // Random offset perpendicular to forward (in frustum plane)
                // Widen spawn space by 2x
                const frustumWidthAtDist = (frustumWidthNear +
                    ((randomDist - camNear) / (camFar - camNear)) *
                        (frustumWidthFar - frustumWidthNear)) *
                    2.0;
                const frustumHeightAtDist = (frustumHeightNear +
                    ((randomDist - camNear) / (camFar - camNear)) *
                        (frustumHeightFar - frustumHeightNear)) *
                    2.0;
                const rightOffset = gl_matrix_1.vec3.create();
                gl_matrix_1.vec3.scale(rightOffset, right, (seededRandom() - 0.5) * frustumWidthAtDist * 0.9);
                const upOffset = gl_matrix_1.vec3.create();
                gl_matrix_1.vec3.scale(upOffset, up, (seededRandom() - 0.5) * frustumHeightAtDist * 0.9);
                gl_matrix_1.vec3.add(localOffset, forwardOffset, rightOffset);
                gl_matrix_1.vec3.add(localOffset, localOffset, upOffset);
                // Convert to world position
                const testPos = gl_matrix_1.vec3.create();
                gl_matrix_1.vec3.add(testPos, camPos, localOffset);
                // Check if within frustum
                if (Tree.isInFrustum(testPos, camPos, forward, right, up, camNear, camFar, frustumWidthNear, frustumHeightNear, frustumWidthFar, frustumHeightFar)) {
                    candidatePos = testPos;
                    logX = testPos[0];
                    logZ = testPos[2];
                    foundValidPos = true;
                    break;
                }
            }
            if (!foundValidPos || candidatePos === null) {
                continue; // Skip if couldn't find valid position
            }
            // Check distance from fire - skip if too close
            const distanceFromFire = Math.sqrt((logX - config.fireCenter[0]) ** 2 + (logZ - config.fireCenter[2]) ** 2);
            if (distanceFromFire < config.fireExclusionRadius) {
                continue; // Skip this position, try again
            }
            // Check distance from camera - skip if too close
            const distanceFromCamera = Math.sqrt((logX - camPos[0]) ** 2 + (logZ - camPos[2]) ** 2);
            if (distanceFromCamera < config.cameraExclusionRadius) {
                continue; // Skip this position, try again
            }
            // Convert world coordinates to terrain local coordinates
            const terrainLocalX = logX;
            const terrainLocalZ = logZ - config.terrainOffsetZ;
            // Query actual terrain height at this position
            const terrainY = terrain_1.Terrain.getHeightAt(terrainLocalX, terrainLocalZ, config.terrainParams);
            // Scale: taller logs standing vertically (using seeded RNG)
            // Generate a random size multiplier based on size seed (0.7 to 1.3 range)
            const sizeMultiplier = 0.25 + sizeSeededRandom() * 0.6;
            const logHeight = (config.logBaseScale + seededRandom() * config.logHeightVariation) * sizeMultiplier;
            const logWidth = config.logBaseScale * 2.0 * sizeMultiplier;
            const scaleVec = gl_matrix_1.vec3.fromValues(logWidth, logHeight, logWidth);
            // Position: bottom of log on terrain (account for terrain Y offset = -1)
            const position = gl_matrix_1.vec3.fromValues(logX, terrainY - 1.0 + logWidth, logZ);
            // Random rotation around Y axis (vertical, using seeded RNG)
            const rotation = gl_matrix_1.quat.create();
            gl_matrix_1.quat.fromEuler(rotation, 0, // No pitch (vertical)
            seededRandom() * 360, // Random yaw rotation
            0 // No roll
            );
            const treeLogNode = new node_1.Node(scene, position, scaleVec, rotation, treeMesh, barkMaterial);
            scene.add(treeLogNode);
            treeNodes.push(treeLogNode);
            treesPlaced++;
        }
        console.log(`Added ${treesPlaced} vertical logs (trees) across terrain (${attempts} attempts)`);
        // Place leaves on trees
        const leaves = await Tree.addLeavesToTrees(engine, scene, treeNodes, treeVertices, config);
        return { treeNodes, leaves };
    }
    /**
     * Add leaves to all trees
     */
    static async addLeavesToTrees(engine, scene, treeNodes, treeVertices, config) {
        // Load leaf resources
        const quadMesh = await mesh_1.Mesh.fromObj(engine, "/models/quad.obj");
        const leafMaterial = new material_1.Material(engine);
        leafMaterial.setDiffuse("/images/scene/leaf/leaf.png", {
            wrapMode: "clamp",
            generateMipmaps: false, // Disable mipmaps to prevent white edge artifacts
        });
        leafMaterial.setNormal("/images/scene/leaf/leaf_normal.png", {
            wrapMode: "clamp",
            generateMipmaps: false,
        });
        leafMaterial.color = [255, 255, 255]; // White color to use texture as-is
        leafMaterial.roughness = 0.9; // Leaves are rough/matte
        leafMaterial.metallic = 0.0; // Not metallic
        const leaves = [];
        let totalLeaves = 0;
        // Get camera position for distance-based leaf spawning
        const camPos = scene.camera.position;
        const maxLeafDistance = 50.0; // Distance at which leaf spawn chance becomes 0
        const nearCameraSpawnChance = 0.1; // 0.1% spawn chance near camera
        // For each tree, place a leaf at each vertex position
        for (const treeNode of treeNodes) {
            // Update the tree's transformation matrix
            treeNode.updateMatrix();
            // Transform each vertex from local space to world space
            for (const [localX, localY, localZ] of treeVertices) {
                // Create a vec3 from the local vertex position
                const localVertex = gl_matrix_1.vec3.fromValues(localX, localY, localZ);
                const worldVertex = gl_matrix_1.vec3.create();
                // Transform the vertex using the tree's model matrix
                gl_matrix_1.vec3.transformMat4(worldVertex, localVertex, treeNode.modelMatrix);
                // Calculate distance from camera (only X and Z, ignoring Y height)
                const distanceFromCamera = Math.sqrt((worldVertex[0] - camPos[0]) ** 2 + (worldVertex[2] - camPos[2]) ** 2);
                // Calculate distance-based spawn chance (linear falloff from nearCameraSpawnChance to 0)
                let spawnChance = 0;
                if (distanceFromCamera < maxLeafDistance) {
                    // Linear interpolation: 0.1% at distance 0, 0% at maxLeafDistance
                    spawnChance = nearCameraSpawnChance * (1.0 - distanceFromCamera / maxLeafDistance);
                }
                // Chance of spawning a leaf at this vertex (using distance-based spawn chance)
                if (Math.random() >= spawnChance) {
                    continue;
                }
                // Random size variation for leaves
                const leafSize = 0.6 + Math.random() * 0.4; // Size between 0.8 and 1.4
                // Create a leaf at the transformed vertex position
                const leaf = (0, leafHelper_1.createLeafNode)(scene, worldVertex, gl_matrix_1.vec3.fromValues(leafSize, leafSize, 1), quadMesh, leafMaterial);
                leaves.push(leaf);
                totalLeaves++;
            }
        }
        console.log(`Added ${totalLeaves} leaves at tree vertices (${treeNodes.length} trees × ${treeVertices.length} vertices each)`);
        return leaves;
    }
}
exports.Tree = Tree;
//# sourceMappingURL=tree.js.map