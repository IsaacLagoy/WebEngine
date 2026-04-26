import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { createTerrainGeometry, getTerrainHeightAt, TerrainParams } from "./terrain";

export interface CampSceneController {
  dispose: () => void;
}

export function createCampScene(container: HTMLDivElement): CampSceneController {
  const renderScale = 0.7;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06080f);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 300);
  const yawRad = (9.26 * Math.PI) / 180;
  const pitchRad = (1.28 * Math.PI) / 180;
  camera.position.set(1.42, 2.27, 8.5);
  camera.up.set(0, 1, 0);
  camera.filmOffset = 0;
  camera.clearViewOffset();
  camera.rotation.set(pitchRad, yawRad, 0, "YXZ");

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * renderScale);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const quantizePass = new ShaderPass({
    uniforms: {
      uTexture: { value: null },
      uQuantizationLevel: { value: 8.0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: `
      varying vec2 vTexCoord;
      void main() {
        vTexCoord = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      varying vec2 vTexCoord;
      void main() {
        gl_FragColor = texture2D(uTexture, vTexCoord);
      }
    `,
  });
  quantizePass.material.uniforms.tDiffuse = quantizePass.material.uniforms.uTexture;
  composer.addPass(quantizePass);

  let quantizeShaderLoaded = false;
  fetch("/shaders/quantizeBucket.frag")
    .then((response) => {
      if (!response.ok) throw new Error(`Failed loading quantize shader: ${response.status}`);
      return response.text();
    })
    .then((fragmentShader) => {
      quantizePass.material.fragmentShader = fragmentShader;
      quantizePass.material.needsUpdate = true;
      quantizeShaderLoaded = true;
    })
    .catch((error) => {
      console.error(error);
    });

  const ambient = new THREE.AmbientLight(0x223046, 0.7);
  scene.add(ambient);

  const directionalFill = new THREE.DirectionalLight(0xa8c4ff, 3.0);
  directionalFill.position.set(-18, 26, 14);
  scene.add(directionalFill);

  const fireLight = new THREE.PointLight(0xff6a1a, 20, 35, 0.5);
  fireLight.position.set(0, 0.75, 0);
  scene.add(fireLight);

  const terrainParams: TerrainParams = {
    width: 150,
    height: 150,
    segmentsX: 128,
    segmentsZ: 128,
    noiseScale: 0.02,
    noiseAmplitude: 45.0,
    noiseOctaves: 3,
    originX: 0.0,
    originZ: 40.0,
    flatRadius: 2.0,
    maxDistance: null,
    amplitudePower: 2.5,
  };

  const textureLoader = new THREE.TextureLoader();
  const configureTiledTexture = (texture: THREE.Texture, tiling = 1) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(tiling, tiling);
    texture.colorSpace = THREE.SRGBColorSpace;
  };
  const configureLinearTexture = (texture: THREE.Texture, tiling = 1) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(tiling, tiling);
  };

  const grassColor = textureLoader.load("/materials/grass/grass_Color.jpg");
  configureTiledTexture(grassColor, 8);
  const grassNormal = textureLoader.load("/materials/grass/grass_NormalGL.jpg");
  configureLinearTexture(grassNormal, 8);
  const grassRoughness = textureLoader.load("/materials/grass/grass_Roughness.jpg");
  configureLinearTexture(grassRoughness, 8);

  const rocksColor = textureLoader.load("/materials/rocks/rocks_Color.jpg");
  configureTiledTexture(rocksColor, 1);
  const rocksNormal = textureLoader.load("/materials/rocks/rocks_NormalGL.jpg");
  configureLinearTexture(rocksNormal, 1);
  const rocksRoughness = textureLoader.load("/materials/rocks/rocks_Roughness.jpg");
  configureLinearTexture(rocksRoughness, 1);

  const barkColor = textureLoader.load("/materials/bark/bark_Color.jpg");
  configureTiledTexture(barkColor, 1);
  const barkNormal = textureLoader.load("/materials/bark/bark_NormalGL.jpg");
  configureLinearTexture(barkNormal, 1);
  const barkRoughness = textureLoader.load("/materials/bark/bark_Roughness.jpg");
  configureLinearTexture(barkRoughness, 1);

  const logColor = textureLoader.load("/materials/log/log_albedo.jpg");
  configureTiledTexture(logColor, 1);
  const logNormal = textureLoader.load("/materials/log/log_normal.png");
  configureLinearTexture(logNormal, 1);
  const logRoughness = textureLoader.load("/materials/log/log_roughness.jpg");
  configureLinearTexture(logRoughness, 1);

  const terrainMaterial = new THREE.MeshStandardMaterial({
    map: grassColor,
    normalMap: grassNormal,
    roughnessMap: grassRoughness,
    roughness: 1.0,
    metalness: 0.0,
    flatShading: false,
  });
  const terrain = new THREE.Mesh(createTerrainGeometry(terrainParams), terrainMaterial);
  terrain.position.set(0, -1, -40);
  scene.add(terrain);

  const terrainWorldHeight = (x: number, z: number) =>
    terrain.position.y +
    getTerrainHeightAt(
      x - terrain.position.x,
      z - terrain.position.z,
      terrainParams,
    );

  const logMaterial = new THREE.MeshStandardMaterial({
    map: logColor,
    normalMap: logNormal,
    roughnessMap: logRoughness,
    roughness: 1.0,
    metalness: 0.0,
  });
  const rockMaterial = new THREE.MeshStandardMaterial({
    map: rocksColor,
    normalMap: rocksNormal,
    roughnessMap: rocksRoughness,
    roughness: 1.0,
    metalness: 0.0,
  });
  const barkMaterial = new THREE.MeshStandardMaterial({
    map: barkColor,
    normalMap: barkNormal,
    roughnessMap: barkRoughness,
    roughness: 1.0,
    metalness: 0.0,
  });
  const leafMaterial = new THREE.SpriteMaterial({
    color: 0x75b66d,
    transparent: true,
    opacity: 1.0,
    depthWrite: false,
  });

  const sceneObjects: THREE.Object3D[] = [];

  // --- Rocks ---
  const rockGeometry = new THREE.IcosahedronGeometry(0.35, 1);
  const rockCount = 18;
  let rockSeed = 8842;
  const rockRandom = () => {
    rockSeed = (rockSeed * 1664525 + 1013904223) >>> 0;
    return rockSeed / 4294967296;
  };

  for (let i = 0; i < rockCount; i += 1) {
    const angle = (i / rockCount) * Math.PI * 2;
    const radiusOffset = (rockRandom() - 0.5) * 0.8;
    const angleOffset = (rockRandom() - 0.5) * 0.3;
    const rockX = Math.cos(angle + angleOffset) * (2.5 + radiusOffset);
    const rockZ = Math.sin(angle + angleOffset) * (2.5 + radiusOffset);

    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    const rockScale = 0.85 + rockRandom() * 0.65;
    rock.scale.setScalar(rockScale);
    rock.position.set(rockX, -0.9, rockZ);
    rock.rotation.set(
      rockRandom() * Math.PI * 2,
      rockRandom() * Math.PI * 2,
      rockRandom() * Math.PI * 2,
    );
    scene.add(rock);
    sceneObjects.push(rock);
  }

  // --- Tree placement RNG ---
  let treeSeed = 150;
  const treeRandom = () => {
    treeSeed = (treeSeed * 1103515245 + 12345) >>> 0;
    return treeSeed / 4294967296;
  };

  // Separate leaf RNG — never consumes from treeRandom sequence
  let leafSeed = 200;
  const leafRandom = () => {
    leafSeed = (leafSeed * 1664525 + 1013904223) >>> 0;
    return leafSeed / 4294967296;
  };

  const treeCount = 150;
  const fireExclusionRadius = 7;
  const cameraExclusionRadius = 6;
  const cameraXZ = new THREE.Vector2(camera.position.x, camera.position.z);

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.normalize();
  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();

  const camNear = camera.near;
  const camFar = Math.min(camera.far, 100);
  const camFov = THREE.MathUtils.degToRad(camera.fov);
  const aspect = camera.aspect;
  const frustumHeightNear = 2 * camNear * Math.tan(camFov / 2);
  const frustumWidthNear = frustumHeightNear * aspect;
  const frustumHeightFar = 2 * camFar * Math.tan(camFov / 2);
  const frustumWidthFar = frustumHeightFar * aspect;

  const isInSpawnFrustum = (point: THREE.Vector3) => {
    const toPoint = point.clone().sub(camera.position);
    const distance = toPoint.dot(forward);
    if (distance < camNear || distance > camFar) return false;
    const rightDist = toPoint.dot(right);
    const upDist = toPoint.dot(up);
    const t = (distance - camNear) / (camFar - camNear);
    const widthAtDist = frustumWidthNear + t * (frustumWidthFar - frustumWidthNear);
    const heightAtDist = frustumHeightNear + t * (frustumHeightFar - frustumHeightNear);
    const widened = 2.0;
    const margin = 0.1;
    return (
      Math.abs(rightDist) <= widthAtDist * (0.5 + margin) * widened &&
      Math.abs(upDist) <= heightAtDist * (0.5 + margin) * widened
    );
  };

  const treeInstances: Array<{ x: number; z: number; targetHeight: number; yaw: number }> = [];
  let placedTrees = 0;
  let attempts = 0;
  const maxAttempts = treeCount * 20;
  while (placedTrees < treeCount && attempts < maxAttempts) {
    attempts += 1;
    let accepted = false;
    let x = 0;
    let z = 0;

    for (let tryCount = 0; tryCount < 50; tryCount += 1) {
      const randomDist = treeRandom() * (camFar - camNear) + camNear;
      const t = (randomDist - camNear) / (camFar - camNear);
      const widthAtDist = (frustumWidthNear + t * (frustumWidthFar - frustumWidthNear)) * 2.0;
      const heightAtDist = (frustumHeightNear + t * (frustumHeightFar - frustumHeightNear)) * 2.0;

      const candidate = camera.position
        .clone()
        .add(forward.clone().multiplyScalar(randomDist))
        .add(right.clone().multiplyScalar((treeRandom() - 0.5) * widthAtDist * 0.9))
        .add(up.clone().multiplyScalar((treeRandom() - 0.5) * heightAtDist * 0.9));

      if (!isInSpawnFrustum(candidate)) continue;
      x = candidate.x;
      z = candidate.z;
      accepted = true;
      break;
    }
    if (!accepted) continue;
    if (new THREE.Vector2(x, z).length() < fireExclusionRadius) continue;
    if (new THREE.Vector2(x, z).distanceTo(cameraXZ) < cameraExclusionRadius) continue;

    treeInstances.push({
      x,
      z,
      targetHeight: 2.6 + treeRandom() * 3.8,
      yaw: treeRandom() * Math.PI * 2,
    });
    placedTrees += 1;
  }

  let disposed = false;
  const objLoader = new OBJLoader();

  // --- Logs (tripod + benches) ---
  const LOG_BASE_SCALE = 0.005;
  const fireCenter = new THREE.Vector3(0, -0.245, 0);
  const logBaseRadius = 0.6;
  const logTopHeight = 1.6;
  const numTripodLogs = 3;
  const tripodAngles = [0, 120, 240];
  const benchRadius = 7.5;
  const numBenchLogs = 3;
  const BENCH_SCALE = LOG_BASE_SCALE;

  objLoader.load("/models/log.obj", (logTemplate) => {
    if (disposed) return;

    const applyMaterial = (obj: THREE.Object3D) => {
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = logMaterial;
        }
      });
    };

    for (let i = 0; i < numTripodLogs; i++) {
      const angle = (tripodAngles[i] * Math.PI) / 180;
      const bottomX = Math.cos(angle) * logBaseRadius;
      const bottomZ = Math.sin(angle) * logBaseRadius;
      const bottomY = fireCenter.y + LOG_BASE_SCALE;
      const dirX = fireCenter.x - bottomX;
      const dirY = fireCenter.y + logTopHeight - bottomY;
      const dirZ = fireCenter.z - bottomZ;
      const horizontalAngle = Math.atan2(dirX, dirZ);
      const verticalAngle = Math.atan2(dirY, Math.sqrt(dirX * dirX + dirZ * dirZ));

      const logObj = logTemplate.clone(true);
      applyMaterial(logObj);
      logObj.scale.set(LOG_BASE_SCALE, LOG_BASE_SCALE * 2, LOG_BASE_SCALE);
      logObj.rotation.set(verticalAngle, horizontalAngle, 0, "YXZ");
      logObj.position.set(bottomX, bottomY, bottomZ);
      scene.add(logObj);
      sceneObjects.push(logObj);
    }

    for (let i = 0; i < numBenchLogs; i++) {
      const angle = (i / numBenchLogs) * 2 * Math.PI + (80 * Math.PI) / 180;
      const bx = Math.cos(angle) * benchRadius;
      const bz = Math.sin(angle) * benchRadius;
      const by = terrainWorldHeight(bx, bz) + 0.495;

      const benchObj = logTemplate.clone(true);
      applyMaterial(benchObj);
      benchObj.scale.set(BENCH_SCALE * 2, BENCH_SCALE * 4, BENCH_SCALE * 2);
      benchObj.rotation.set(Math.PI / 2, -angle, 0, "YXZ");
      benchObj.position.set(bx, by, bz);
      scene.add(benchObj);
      sceneObjects.push(benchObj);
    }
  });

  // --- Trees + Leaves ---
  // Leaves use LEAF_SPAWN_CHANCE matching original (0.025).
  // Each leaf sprite is parented to treeObj in local space so it inherits
  // the tree's world position correctly. leafRandom() is fully separate
  // from treeRandom() so placement is never affected.
  const LEAF_SPAWN_CHANCE = 0.025;
  const LEAF_ATTEMPTS = 400;

  objLoader.load("/models/tree.obj", (treeTemplate) => {
    if (disposed) return;

    treeTemplate.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = barkMaterial;
      }
    });

    const templateBox = new THREE.Box3().setFromObject(treeTemplate);
    const templateSize = templateBox.getSize(new THREE.Vector3());
    const templateHeight = Math.max(templateSize.y, 0.001);
    const templateHalfWidth = Math.max(templateSize.x, templateSize.z, 0.001) / 2;

    for (const tree of treeInstances) {
      const treeObj = treeTemplate.clone(true);
      const uniformScale = (tree.targetHeight / templateHeight) * 5.0;
      treeObj.scale.setScalar(uniformScale);
      treeObj.rotation.set(0, 0, 0);
      treeObj.rotateY(tree.yaw);
      treeObj.position.set(tree.x, 0, tree.z);

      scene.add(treeObj);

      // Ground-snap
      const worldBox = new THREE.Box3().setFromObject(treeObj);
      const groundY = terrainWorldHeight(tree.x, tree.z);
      treeObj.position.y += groundY - worldBox.min.y;
      sceneObjects.push(treeObj);

      // Leaf sprites in local space, parented to treeObj.
      // Local Y: 0 is root, localHeight is top.
      // Sprites use world-space billboarding but inherit parent translation.
      const localHeight = templateHeight * uniformScale;
      const localHalfWidth = templateHalfWidth * uniformScale;

      for (let s = 0; s < LEAF_ATTEMPTS; s++) {
        if (leafRandom() > LEAF_SPAWN_CHANCE) continue;

        // Scatter in upper 70% of tree volume
        const lx = (leafRandom() * 2 - 1) * localHalfWidth;
        const ly = localHeight * 0.3 + leafRandom() * localHeight * 0.7;
        const lz = (leafRandom() * 2 - 1) * localHalfWidth;

        const leaf = new THREE.Sprite(leafMaterial.clone());
        const leafSize = (0.8 + leafRandom() * 1.2) * uniformScale * 40.0;
        leaf.scale.set(leafSize, leafSize, 1);
        leaf.position.set(lx, ly, lz);

        treeObj.add(leaf);
        sceneObjects.push(leaf);
      }
    }
  });

  // --- Resize ---
  const setSize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2) * renderScale;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, true);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(width, height);

    camera.aspect = width / Math.max(height, 1);
    camera.filmOffset = 0;
    camera.clearViewOffset();
    camera.updateProjectionMatrix();
    const drawingBufferSize = renderer.getDrawingBufferSize(new THREE.Vector2());
    quantizePass.material.uniforms.uResolution.value.copy(drawingBufferSize);
  };
  setSize();
  window.addEventListener("resize", setSize);

  // --- Animate ---
  const startTime = performance.now();
  const frameIntervalMs = 1000 / 20;
  let lastRenderTime = 0;
  let animationFrame = 0;

  const animate = () => {
    const now = performance.now();
    if (now - lastRenderTime < frameIntervalMs) {
      animationFrame = window.requestAnimationFrame(animate);
      return;
    }
    lastRenderTime = now;
    const elapsed = (now - startTime) / 1000;

    const intensityBase = 25.0;
    const intensityVariation = 6.0;
    const flicker =
      Math.sin(elapsed * 8.0) * 0.5 +
      Math.sin(elapsed * 13.0) * 0.3 +
      Math.sin(elapsed * 5.0) * 0.2;
    fireLight.intensity = Math.max(18.0, intensityBase + flicker * intensityVariation);

    const colorWave1 = Math.sin(elapsed * 2.0) * 0.06;
    const colorWave2 = Math.sin(elapsed * 3.5) * 0.04;
    const green = Math.max(0.3, Math.min(0.5, 0.4 + colorWave1 + colorWave2));
    fireLight.color.setRGB(1.0, green, 0.0);

    const posWaveX = Math.sin(elapsed * 1.5) * 0.15 + Math.sin(elapsed * 2.7) * 0.08;
    const posWaveY = Math.sin(elapsed * 1.2) * 0.1 + Math.sin(elapsed * 3.1) * 0.05;
    const posWaveZ = Math.sin(elapsed * 1.8) * 0.12 + Math.sin(elapsed * 2.3) * 0.06;
    fireLight.position.set(posWaveX, 0.25 + posWaveY, posWaveZ);

    if (quantizeShaderLoaded) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
    animationFrame = window.requestAnimationFrame(animate);
  };
  animate();

  return {
    dispose: () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", setSize);
      disposed = true;
      for (const object of sceneObjects) {
        scene.remove(object);
      }
      rockGeometry.dispose();
      logMaterial.dispose();
      rockMaterial.dispose();
      barkMaterial.dispose();
      leafMaterial.dispose();
      grassColor.dispose();
      grassNormal.dispose();
      grassRoughness.dispose();
      rocksColor.dispose();
      rocksNormal.dispose();
      rocksRoughness.dispose();
      barkColor.dispose();
      barkNormal.dispose();
      barkRoughness.dispose();
      logColor.dispose();
      logNormal.dispose();
      logRoughness.dispose();
      terrain.geometry.dispose();
      terrainMaterial.dispose();
      composer.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}