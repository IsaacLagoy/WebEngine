import { Engine } from "./engine";
import { Mesh } from "./mesh";
/**
 * Terrain generation parameters
 */
export interface TerrainParams {
    width?: number;
    height?: number;
    segmentsX?: number;
    segmentsZ?: number;
    noiseScale?: number;
    noiseAmplitude?: number;
    noiseOctaves?: number;
    originX?: number;
    originZ?: number;
    flatRadius?: number;
    maxDistance?: number | null;
    amplitudePower?: number;
}
/**
 * Terrain class - generates terrain geometry
 */
export declare class Terrain {
    /**
     * Simple 2D noise function (simplified Perlin-like noise)
     * @param x - X coordinate
     * @param z - Z coordinate
     * @returns Noise value between -1 and 1
     */
    private static noise;
    /**
     * Smooth noise using interpolation
     * @param x - X coordinate
     * @param z - Z coordinate
     * @returns Smoothed noise value
     */
    private static smoothNoise;
    /**
     * Fractal noise (octaves of noise for more natural terrain)
     * @param x - X coordinate
     * @param z - Z coordinate
     * @param octaves - Number of noise octaves
     * @param persistence - How much each octave contributes
     * @returns Combined noise value
     */
    private static fractalNoise;
    /**
     * Calculates triangle normal from three vertices
     * @param v0 - First vertex
     * @param v1 - Second vertex
     * @param v2 - Third vertex
     * @returns Normalized normal vector or null if calculation fails
     */
    private static calcTriangleNormal;
    /**
     * Accumulates a normal into the running sum
     * @param normal - Normal vector to accumulate
     * @param accumulator - Running sum [x, y, z, count]
     */
    private static accumulateNormal;
    /**
     * Calculates normal for a vertex based on neighboring triangle faces
     * This method averages the normals of all triangles that share this vertex
     * Quad structure: a(x,z) --- b(x+1,z)
     *                 |  \       |
     *                 |   \      |
     *                 c(x,z+1) - d(x+1,z+1)
     * Triangles: a->c->b and b->c->d
     */
    private static calculateNormal;
    /**
     * Distance-based amplitude multiplier parameters
     */
    private static distanceAmplitudeParams;
    /**
     * Distance-based amplitude multiplier - increases variance with distance from origin
     * @param distance - Distance from origin
     * @param params - Amplitude parameters (flatRadius, maxDistance, power)
     * @returns Amplitude multiplier (0 at origin, 1 at maxDistance)
     */
    private static distanceAmplitudeMultiplier;
    /**
     * Default terrain generation parameters
     */
    private static readonly defaultParams;
    /**
     * Generates a plane geometry with noise (rolling hills, flat at origin)
     * @param params - Terrain generation parameters
     * @returns Geometry data (vertices, normals, textures, indices)
     */
    static generatePlane(params?: TerrainParams): {
        vertices: number[];
        vertexNormals: number[];
        textures: number[];
        indices: number[];
    };
    /**
     * Creates a plane mesh with noise (rolling hills, flat near origin)
     * @param engine - The WebGL engine
     * @param params - Terrain generation parameters
     * @returns A new Mesh instance representing the plane
     */
    static createPlaneMesh(engine: Engine, params?: TerrainParams): Mesh;
    /**
     * Queries the terrain height at a given X, Z position
     * Uses the same noise generation logic as terrain generation
     * @param x - X coordinate in world space
     * @param z - Z coordinate in world space
     * @param params - Terrain generation parameters (must match those used to generate the terrain)
     * @returns Y coordinate (height) at the given position
     */
    static getHeightAt(x: number, z: number, params?: TerrainParams): number;
}
//# sourceMappingURL=terrain.d.ts.map