import { Engine } from "./engine";
import { Mesh } from "./mesh";

/**
 * Terrain class - generates terrain geometry
 */
export class Terrain {
    /**
     * Simple 2D noise function (simplified Perlin-like noise)
     * @param x - X coordinate
     * @param z - Z coordinate
     * @returns Noise value between -1 and 1
     */
    private static noise(x: number, z: number): number {
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
    private static smoothNoise(x: number, z: number): number {
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
    private static fractalNoise(x: number, z: number, octaves: number = 4, persistence: number = 0.5): number {
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
     * Calculates normal for a vertex based on neighboring vertices
     */
    private static calculateNormal(
        vertices: number[],
        x: number,
        z: number,
        segmentsX: number,
        segmentsZ: number
    ): [number, number, number] {
        const getVertex = (ix: number, iz: number): [number, number, number] => {
            const idx = (iz * (segmentsX + 1) + ix) * 3;
            return [vertices[idx], vertices[idx + 1], vertices[idx + 2]];
        };

        const current = getVertex(x, z);
        const right = x < segmentsX ? getVertex(x + 1, z) : current;
        const left = x > 0 ? getVertex(x - 1, z) : current;
        const forward = z < segmentsZ ? getVertex(x, z + 1) : current;
        const back = z > 0 ? getVertex(x, z - 1) : current;

        // Calculate two edge vectors
        const edge1 = [right[0] - left[0], right[1] - left[1], right[2] - left[2]];
        const edge2 = [forward[0] - back[0], forward[1] - back[1], forward[2] - back[2]];

        // Cross product to get normal
        const nx = edge1[1] * edge2[2] - edge1[2] * edge2[1];
        const ny = edge1[2] * edge2[0] - edge1[0] * edge2[2];
        const nz = edge1[0] * edge2[1] - edge1[1] * edge2[0];

        // Normalize
        const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (length > 0.0001) {
            return [nx / length, ny / length, nz / length];
        }
        return [0, 1, 0]; // Default to up if calculation fails
    }

    /**
     * Distance-based amplitude multiplier - increases variance with distance from origin
     * @param distance - Distance from origin
     * @param flatRadius - Radius around origin where terrain is completely flat (default 0, no flat zone)
     * @param maxDistance - Distance where amplitude reaches maximum
     * @param power - Power curve for the increase (default 2.5 for faster increase)
     * @returns Amplitude multiplier (0 at origin, 1 at maxDistance)
     */
    private static distanceAmplitudeMultiplier(
        distance: number,
        flatRadius: number = 0.0,
        maxDistance: number = 100.0,
        power: number = 2.5
    ): number {
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
     * @param width - Width of the plane
     * @param height - Height (depth) of the plane
     * @param segmentsX - Number of segments along X axis
     * @param segmentsZ - Number of segments along Z axis
     * @param noiseScale - Scale of noise (higher = larger features)
     * @param noiseAmplitude - Maximum height amplitude of noise (at max distance)
     * @param noiseOctaves - Number of noise octaves for detail
     * @param originX - X coordinate of the origin point (where terrain is flat, default 0)
     * @param originZ - Z coordinate of the origin point (where terrain is flat, default 0)
     * @param flatRadius - Radius around origin where terrain is completely flat (default 2.0)
     * @param maxDistance - Distance where amplitude reaches maximum (default: auto-calculated)
     * @param amplitudePower - Power curve for amplitude increase (default 2.5 for faster increase)
     * @returns Geometry data (vertices, normals, textures, indices)
     */
    static generatePlane(
        width: number = 1,
        height: number = 1,
        segmentsX: number = 1,
        segmentsZ: number = 1,
        noiseScale: number = 0.02, // Smaller scale for larger, rolling features
        noiseAmplitude: number = 15.0, // Maximum amplitude at max distance
        noiseOctaves: number = 3, // Fewer octaves for smoother hills
        originX: number = 0.0,
        originZ: number = 0.0,
        flatRadius: number = 2.0,
        maxDistance: number | null = null,
        amplitudePower: number = 2.5
    ): {
        vertices: number[];
        vertexNormals: number[];
        textures: number[];
        indices: number[];
    } {
        const vertices: number[] = [];
        const vertexNormals: number[] = [];
        const textures: number[] = [];
        const indices: number[] = [];

        const halfWidth = width / 2;
        const halfHeight = height / 2;

        // Calculate max distance for amplitude scaling (use diagonal distance to corner if not specified)
        const calculatedMaxDistance = maxDistance !== null ? maxDistance : Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight);

        // Generate vertices with noise
        for (let z = 0; z <= segmentsZ; z++) {
            for (let x = 0; x <= segmentsX; x++) {
                // Position: X and Z vary
                const px = (x / segmentsX) * width - halfWidth;
                const pz = (z / segmentsZ) * height - halfHeight;
                
                // Calculate distance from origin (campfire location)
                const dx = px - originX;
                const dz = pz - originZ;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                // Generate normal noise (standard fractal noise)
                const noiseValue = Terrain.fractalNoise(px * noiseScale, pz * noiseScale, noiseOctaves, 0.6);
                
                // Increase amplitude variance with distance from origin
                // At origin: amplitude is 0 (completely flat)
                // Far from origin: amplitude reaches full noiseAmplitude
                const amplitudeMultiplier = Terrain.distanceAmplitudeMultiplier(distance, flatRadius, calculatedMaxDistance, amplitudePower);
                const py = noiseValue * noiseAmplitude * amplitudeMultiplier;
                
                vertices.push(px, py, pz);

                // Texture coordinates
                const u = x / segmentsX;
                const v = z / segmentsZ;
                textures.push(u, v);
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
                const a = z * (segmentsX + 1) + x;
                const b = a + 1;
                const c = a + (segmentsX + 1);
                const d = c + 1;

                // First triangle
                indices.push(a, c, b);
                // Second triangle
                indices.push(b, c, d);
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
     * @param width - Width of the plane
     * @param height - Height (depth) of the plane
     * @param segmentsX - Number of segments along X axis
     * @param segmentsZ - Number of segments along Z axis
     * @param noiseScale - Scale of noise (higher = larger features, default 0.02 for rolling hills)
     * @param noiseAmplitude - Maximum height amplitude of noise at max distance (default 15.0)
     * @param noiseOctaves - Number of noise octaves for detail (default 3 for smoother hills)
     * @param originX - X coordinate of the origin point (where terrain is flat, default 0)
     * @param originZ - Z coordinate of the origin point (where terrain is flat, default 0)
     * @param flatRadius - Radius around origin where terrain is completely flat (default 2.0)
     * @param maxDistance - Distance where amplitude reaches maximum (default: auto-calculated)
     * @param amplitudePower - Power curve for amplitude increase (default 2.5 for faster increase)
     * @returns A new Mesh instance representing the plane
     */
    static createPlaneMesh(
        engine: Engine,
        width: number = 1,
        height: number = 1,
        segmentsX: number = 1,
        segmentsZ: number = 1,
        noiseScale: number = 0.02,
        noiseAmplitude: number = 15.0,
        noiseOctaves: number = 3,
        originX: number = 0.0,
        originZ: number = 0.0,
        flatRadius: number = 2.0,
        maxDistance: number | null = null,
        amplitudePower: number = 2.5
    ): Mesh {
        const geometry = Terrain.generatePlane(
            width,
            height,
            segmentsX,
            segmentsZ,
            noiseScale,
            noiseAmplitude,
            noiseOctaves,
            originX,
            originZ,
            flatRadius,
            maxDistance,
            amplitudePower
        );
        return Mesh.createFromGeometry(
            engine,
            geometry.vertices,
            geometry.vertexNormals,
            geometry.textures,
            geometry.indices
        );
    }
}
