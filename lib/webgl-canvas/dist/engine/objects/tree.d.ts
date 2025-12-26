import { vec3 } from "gl-matrix";
import { Engine } from "./engine";
import { Scene } from "./scene";
import { Mesh } from "./mesh";
import { Material } from "./material";
import { Node } from "./node";
import { TerrainParams } from "./terrain";
/**
 * Configuration for tree spawning
 */
export interface TreeSpawnConfig {
    numTrees: number;
    treeSeed: number;
    sizeSeed: number;
    fireExclusionRadius: number;
    fireCenter: vec3;
    cameraExclusionRadius: number;
    terrainOffsetZ: number;
    terrainParams: TerrainParams;
    logBaseScale: number;
    logHeightVariation: number;
    leafSpawnChance: number;
}
/**
 * Tree class - handles tree spawning and leaf placement
 */
export declare class Tree {
    /**
     * Seeded random number generator for deterministic tree placement
     */
    private static seededRandom;
    /**
     * Check if a point is within the camera's view frustum
     */
    private static isInFrustum;
    /**
     * Spawn trees in the scene based on camera view frustum
     */
    static spawnTrees(engine: Engine, scene: Scene, treeMesh: Mesh, barkMaterial: Material, config: TreeSpawnConfig): Promise<{
        treeNodes: Node[];
        leaves: Node[];
    }>;
    /**
     * Add leaves to all trees
     */
    static addLeavesToTrees(engine: Engine, scene: Scene, treeNodes: Node[], treeVertices: [number, number, number][], config: TreeSpawnConfig): Promise<Node[]>;
}
//# sourceMappingURL=tree.d.ts.map