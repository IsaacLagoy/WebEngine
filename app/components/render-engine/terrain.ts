import * as THREE from "three";

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

const defaultParams: Required<Omit<TerrainParams, "maxDistance">> & {
  maxDistance: number | null;
} = {
  width: 1,
  height: 1,
  segmentsX: 1,
  segmentsZ: 1,
  noiseScale: 0.02,
  noiseAmplitude: 15.0,
  noiseOctaves: 3,
  originX: 0,
  originZ: 0,
  flatRadius: 2.0,
  maxDistance: null,
  amplitudePower: 2.5,
};

function noise(x: number, z: number): number {
  const n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return (n - Math.floor(n)) * 2.0 - 1.0;
}

function smoothNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;

  const n00 = noise(ix, iz);
  const n10 = noise(ix + 1, iz);
  const n01 = noise(ix, iz + 1);
  const n11 = noise(ix + 1, iz + 1);

  const sx = fx * fx * (3.0 - 2.0 * fx);
  const sz = fz * fz * (3.0 - 2.0 * fz);

  const a = n00 + sx * (n10 - n00);
  const b = n01 + sx * (n11 - n01);
  return a + sz * (b - a);
}

function fractalNoise(
  x: number,
  z: number,
  octaves = 4,
  persistence = 0.5,
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i += 1) {
    value += smoothNoise(x * frequency, z * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  return value / maxValue;
}

function distanceAmplitudeMultiplier(
  distance: number,
  params: { flatRadius?: number; maxDistance?: number; power?: number } = {},
): number {
  const flatRadius = params.flatRadius ?? 0;
  const maxDistance = params.maxDistance ?? 100;
  const power = params.power ?? 2.5;

  if (distance <= flatRadius) {
    return 0;
  }

  const normalizedDistance = Math.min(
    (distance - flatRadius) / (maxDistance - flatRadius),
    1.0,
  );
  return Math.pow(normalizedDistance, power);
}

export function getTerrainHeightAt(
  x: number,
  z: number,
  params: TerrainParams = {},
): number {
  const {
    width = defaultParams.width,
    height = defaultParams.height,
    noiseScale = defaultParams.noiseScale,
    noiseAmplitude = defaultParams.noiseAmplitude,
    noiseOctaves = defaultParams.noiseOctaves,
    originX = defaultParams.originX,
    originZ = defaultParams.originZ,
    flatRadius = defaultParams.flatRadius,
    maxDistance = defaultParams.maxDistance,
    amplitudePower = defaultParams.amplitudePower,
  } = params;

  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const calculatedMaxDistance =
    maxDistance !== null
      ? maxDistance
      : Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight);

  const distance = Math.sqrt((x - originX) ** 2 + (z - originZ) ** 2);
  const noiseValue = fractalNoise(x * noiseScale, z * noiseScale, noiseOctaves, 0.6);
  const amplitudeMultiplier = distanceAmplitudeMultiplier(distance, {
    flatRadius,
    maxDistance: calculatedMaxDistance,
    power: amplitudePower,
  });

  return noiseValue * noiseAmplitude * amplitudeMultiplier;
}

export function createTerrainGeometry(
  params: TerrainParams = {},
): THREE.BufferGeometry {
  const {
    width = defaultParams.width,
    height = defaultParams.height,
    segmentsX = defaultParams.segmentsX,
    segmentsZ = defaultParams.segmentsZ,
    noiseScale = defaultParams.noiseScale,
    noiseAmplitude = defaultParams.noiseAmplitude,
    noiseOctaves = defaultParams.noiseOctaves,
    originX = defaultParams.originX,
    originZ = defaultParams.originZ,
    flatRadius = defaultParams.flatRadius,
    maxDistance = defaultParams.maxDistance,
    amplitudePower = defaultParams.amplitudePower,
  } = params;

  const geometry = new THREE.PlaneGeometry(width, height, segmentsX, segmentsZ);
  geometry.rotateX(-Math.PI / 2);

  const position = geometry.attributes.position;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const calculatedMaxDistance =
    maxDistance !== null
      ? maxDistance
      : Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight);

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);

    const distance = Math.sqrt((x - originX) ** 2 + (z - originZ) ** 2);
    const noiseValue = fractalNoise(x * noiseScale, z * noiseScale, noiseOctaves, 0.6);
    const amplitudeMultiplier = distanceAmplitudeMultiplier(distance, {
      flatRadius,
      maxDistance: calculatedMaxDistance,
      power: amplitudePower,
    });
    const y = noiseValue * noiseAmplitude * amplitudeMultiplier;
    position.setY(i, y);
  }

  geometry.computeVertexNormals();
  return geometry;
}
