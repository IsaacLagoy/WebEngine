"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Terrain = void 0;
const mesh_1 = require("./mesh");
/**
 * Terrain class - generates terrain geometry
 */
class Terrain {
    /**
     * Simple 2D noise function (simplified Perlin-like noise)
     * @param x - X coordinate
     * @param z - Z coordinate
     * @returns Noise value between -1 and 1
     */
    static noise(x, z) {
        // Simple hash-based noise
        const n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
        return (n - Math.floor(n)) * 2.0 - 1.0; // Return -1 to 1
    }
    /**
     * Smooth noise using interpolation
     * @param x - X coordinate
     * @param z - Z coordinate
     * @returns Smoothed noise value
     */
    static smoothNoise(x, z) {
        // Get integer and fractional parts
        const ix = Math.floor(x);
        const iz = Math.floor(z);
        const fx = x - ix;
        const fz = z - iz;
        // Sample noise at four corners
        const n00 = Terrain.noise(ix, iz);
        const n10 = Terrain.noise(ix + 1, iz);
        const n01 = Terrain.noise(ix, iz + 1);
        const n11 = Terrain.noise(ix + 1, iz + 1);
        // Smooth interpolation (cosine interpolation for smoother results)
        const sx = fx * fx * (3.0 - 2.0 * fx);
        const sz = fz * fz * (3.0 - 2.0 * fz);
        const a = n00 + sx * (n10 - n00);
        const b = n01 + sx * (n11 - n01);
        return a + sz * (b - a);
    }
    /**
     * Fractal noise (octaves of noise for more natural terrain)
     * @param x - X coordinate
     * @param z - Z coordinate
     * @param octaves - Number of noise octaves
     * @param persistence - How much each octave contributes
     * @returns Combined noise value
     */
    static fractalNoise(x, z, octaves = 4, persistence = 0.5) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;
        for (let i = 0; i < octaves; i++) {
            value += Terrain.smoothNoise(x * frequency, z * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }
        return value / maxValue; // Normalize to -1 to 1
    }
    /**
     * Calculates triangle normal from three vertices
     * @param v0 - First vertex
     * @param v1 - Second vertex
     * @param v2 - Third vertex
     * @returns Normalized normal vector or null if calculation fails
     */
    static calcTriangleNormal(v0, v1, v2) {
        // Edge vectors from v0
        const edge1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
        const edge2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
        // Cross product: edge1 × edge2
        const nx = edge1[1] * edge2[2] - edge1[2] * edge2[1];
        const ny = edge1[2] * edge2[0] - edge1[0] * edge2[2];
        const nz = edge1[0] * edge2[1] - edge1[1] * edge2[0];
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (len > 0.0001) {
            return [nx / len, ny / len, nz / len];
        }
        return null;
    }
    /**
     * Accumulates a normal into the running sum
     * @param normal - Normal vector to accumulate
     * @param accumulator - Running sum [x, y, z, count]
     */
    static accumulateNormal(normal, accumulator) {
        if (normal) {
            accumulator.x += normal[0];
            accumulator.y += normal[1];
            accumulator.z += normal[2];
            accumulator.count++;
        }
    }
    /**
     * Calculates normal for a vertex based on neighboring triangle faces
     * This method averages the normals of all triangles that share this vertex
     * Quad structure: a(x,z) --- b(x+1,z)
     *                 |  \       |
     *                 |   \      |
     *                 c(x,z+1) - d(x+1,z+1)
     * Triangles: a->c->b and b->c->d
     */
    static calculateNormal(vertices, x, z, segmentsX, segmentsZ) {
        const getVertex = (ix, iz) => {
            const idx = (iz * (segmentsX + 1) + ix) * 3;
            return [vertices[idx], vertices[idx + 1], vertices[idx + 2]];
        };
        const current = getVertex(x, z);
        const accumulator = { x: 0, y: 0, z: 0, count: 0 };
        // Quad where current is 'a' (top-left): triangle a->c->b
        if (x < segmentsX && z < segmentsZ) {
            const right = getVertex(x + 1, z); // b
            const bottom = getVertex(x, z + 1); // c
            Terrain.accumulateNormal(Terrain.calcTriangleNormal(current, bottom, right), accumulator);
        }
        // Quad where current is 'b' (top-right): triangle a->c->b
        if (x > 0 && z < segmentsZ) {
            const left = getVertex(x - 1, z); // a
            const bottom = getVertex(x, z + 1); // c
            Terrain.accumulateNormal(Terrain.calcTriangleNormal(left, bottom, current), accumulator);
        }
        // Quad where current is 'b' (top-right): triangle b->c->d
        if (x > 0 && z < segmentsZ) {
            const bottom = getVertex(x, z + 1); // c
            const bottomLeft = getVertex(x - 1, z + 1); // d
            Terrain.accumulateNormal(Terrain.calcTriangleNormal(current, bottom, bottomLeft), accumulator);
        }
        // Quad where current is 'c' (bottom-left): triangle b->c->d  
        if (x < segmentsX && z > 0) {
            const topRight = getVertex(x + 1, z - 1); // b
            const right = getVertex(x + 1, z); // d
            Terrain.accumulateNormal(Terrain.calcTriangleNormal(topRight, current, right), accumulator);
        }
        // Average and normalize
        if (accumulator.count > 0) {
            const length = Math.sqrt(accumulator.x * accumulator.x + accumulator.y * accumulator.y + accumulator.z * accumulator.z);
            if (length > 0.0001) {
                return [accumulator.x / length, accumulator.y / length, accumulator.z / length];
            }
        }
        return [0, 1, 0]; // Default to up if calculation fails
    }
    /**
     * Distance-based amplitude multiplier - increases variance with distance from origin
     * @param distance - Distance from origin
     * @param params - Amplitude parameters (flatRadius, maxDistance, power)
     * @returns Amplitude multiplier (0 at origin, 1 at maxDistance)
     */
    static distanceAmplitudeMultiplier(distance, params = {}) {
        const flatRadius = params.flatRadius ?? Terrain.distanceAmplitudeParams.flatRadius;
        const maxDistance = params.maxDistance ?? Terrain.distanceAmplitudeParams.maxDistance;
        const power = params.power ?? Terrain.distanceAmplitudeParams.power;
        // If within flat radius, return 0 (completely flat)
        if (distance <= flatRadius) {
            return 0.0;
        }
        // Normalize distance to 0-1 range (starting from flatRadius)
        const normalizedDistance = Math.min((distance - flatRadius) / (maxDistance - flatRadius), 1.0);
        // Apply power curve for faster increase
        const scaledDistance = Math.pow(normalizedDistance, power);
        return scaledDistance;
    }
    /**
     * Generates a plane geometry with noise (rolling hills, flat at origin)
     * @param params - Terrain generation parameters
     * @returns Geometry data (vertices, normals, textures, indices)
     */
    static generatePlane(params = {}) {
        const { width = Terrain.defaultParams.width, height = Terrain.defaultParams.height, segmentsX = Terrain.defaultParams.segmentsX, segmentsZ = Terrain.defaultParams.segmentsZ, noiseScale = Terrain.defaultParams.noiseScale, noiseAmplitude = Terrain.defaultParams.noiseAmplitude, noiseOctaves = Terrain.defaultParams.noiseOctaves, originX = Terrain.defaultParams.originX, originZ = Terrain.defaultParams.originZ, flatRadius = Terrain.defaultParams.flatRadius, maxDistance = Terrain.defaultParams.maxDistance, amplitudePower = Terrain.defaultParams.amplitudePower } = params;
        const vertices = [];
        const vertexNormals = [];
        const textures = [];
        const indices = [];
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        // Calculate max distance for amplitude scaling (use diagonal distance to corner if not specified)
        const calculatedMaxDistance = maxDistance !== null ? maxDistance : Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight);
        // Generate vertices with noise
        for (let z = 0; z <= segmentsZ; z++) {
            for (let x = 0; x <= segmentsX; x++) {
                // Calculate world position
                const px = (x / segmentsX) * width - halfWidth;
                const pz = (z / segmentsZ) * height - halfHeight;
                // Calculate height with noise and distance-based amplitude
                const distance = Math.sqrt((px - originX) ** 2 + (pz - originZ) ** 2);
                const noiseValue = Terrain.fractalNoise(px * noiseScale, pz * noiseScale, noiseOctaves, 0.6);
                const amplitudeMultiplier = Terrain.distanceAmplitudeMultiplier(distance, {
                    flatRadius,
                    maxDistance: calculatedMaxDistance,
                    power: amplitudePower
                });
                const py = noiseValue * noiseAmplitude * amplitudeMultiplier;
                vertices.push(px, py, pz);
                textures.push(x / segmentsX, z / segmentsZ);
            }
        }
        // Calculate normals based on actual vertex positions
        for (let z = 0; z <= segmentsZ; z++) {
            for (let x = 0; x <= segmentsX; x++) {
                const normal = Terrain.calculateNormal(vertices, x, z, segmentsX, segmentsZ);
                vertexNormals.push(normal[0], normal[1], normal[2]);
            }
        }
        // Generate indices (two triangles per quad)
        for (let z = 0; z < segmentsZ; z++) {
            for (let x = 0; x < segmentsX; x++) {
                const rowSize = segmentsX + 1;
                const a = z * rowSize + x;
                const b = a + 1;
                const c = a + rowSize;
                const d = c + 1;
                // Two triangles: a->c->b and b->c->d
                indices.push(a, c, b, b, c, d);
            }
        }
        return {
            vertices,
            vertexNormals,
            textures,
            indices
        };
    }
    /**
     * Creates a plane mesh with noise (rolling hills, flat near origin)
     * @param engine - The WebGL engine
     * @param params - Terrain generation parameters
     * @returns A new Mesh instance representing the plane
     */
    static createPlaneMesh(engine, params = {}) {
        const geometry = Terrain.generatePlane(params);
        return mesh_1.Mesh.createFromGeometry(engine, geometry.vertices, geometry.vertexNormals, geometry.textures, geometry.indices);
    }
    /**
     * Queries the terrain height at a given X, Z position
     * Uses the same noise generation logic as terrain generation
     * @param x - X coordinate in world space
     * @param z - Z coordinate in world space
     * @param params - Terrain generation parameters (must match those used to generate the terrain)
     * @returns Y coordinate (height) at the given position
     */
    static getHeightAt(x, z, params = {}) {
        const { width = Terrain.defaultParams.width, height = Terrain.defaultParams.height, noiseScale = Terrain.defaultParams.noiseScale, noiseAmplitude = Terrain.defaultParams.noiseAmplitude, noiseOctaves = Terrain.defaultParams.noiseOctaves, originX = Terrain.defaultParams.originX, originZ = Terrain.defaultParams.originZ, flatRadius = Terrain.defaultParams.flatRadius, maxDistance = Terrain.defaultParams.maxDistance, amplitudePower = Terrain.defaultParams.amplitudePower } = params;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        // Calculate max distance for amplitude scaling (use diagonal distance to corner if not specified)
        const calculatedMaxDistance = maxDistance !== null ? maxDistance : Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight);
        // Calculate height with noise and distance-based amplitude (same logic as generatePlane)
        const distance = Math.sqrt((x - originX) ** 2 + (z - originZ) ** 2);
        const noiseValue = Terrain.fractalNoise(x * noiseScale, z * noiseScale, noiseOctaves, 0.6);
        const amplitudeMultiplier = Terrain.distanceAmplitudeMultiplier(distance, {
            flatRadius,
            maxDistance: calculatedMaxDistance,
            power: amplitudePower
        });
        const y = noiseValue * noiseAmplitude * amplitudeMultiplier;
        return y;
    }
}
exports.Terrain = Terrain;
/**
 * Distance-based amplitude multiplier parameters
 */
Terrain.distanceAmplitudeParams = {
    flatRadius: 0.0,
    maxDistance: 100.0,
    power: 2.5
};
/**
 * Default terrain generation parameters
 */
Terrain.defaultParams = {
    width: 1,
    height: 1,
    segmentsX: 1,
    segmentsZ: 1,
    noiseScale: 0.02,
    noiseAmplitude: 15.0,
    noiseOctaves: 3,
    originX: 0.0,
    originZ: 0.0,
    flatRadius: 2.0,
    maxDistance: null,
    amplitudePower: 2.5
};
//# sourceMappingURL=terrain.js.map