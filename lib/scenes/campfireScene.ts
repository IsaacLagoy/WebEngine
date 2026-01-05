import { Scene } from "@/lib/webgl-canvas/engine/objects/scene";
import { Engine } from "@/lib/webgl-canvas/engine/objects/engine";
import { Shader } from "@/lib/webgl-canvas/engine/core/shader";
import { Mesh } from "@/lib/webgl-canvas/engine/objects/mesh";
import { Material } from "@/lib/webgl-canvas/engine/objects/material";
import { Node } from "@/lib/webgl-canvas/engine/objects/node";
import { Terrain } from "@/lib/webgl-canvas/engine/objects/terrain";
import { PointLight } from "@/lib/webgl-canvas/engine/objects/pointLight";
import { Skybox } from "@/lib/webgl-canvas/engine/objects/skybox";
import { Tree, TreeSpawnConfig } from "@/lib/webgl-canvas/engine/objects/tree";
import { vec3, quat, mat4 } from "gl-matrix";
import type { RenderFunction } from "@/lib/webgl-canvas";

/**
 * CampfireScene - Extends Scene with fire light animation
 */
class CampfireScene extends Scene {
  fireLight: PointLight;
  startTime: number;

  constructor(engine: Engine, shader: Shader, fireLight: PointLight) {
    super(engine, shader);
    this.fireLight = fireLight;
    this.startTime = performance.now();
  }

  update(dt: number): void {
    // Call parent update first
    super.update(dt);

    // Animate fire light
    const elapsed = (performance.now() - this.startTime) / 1000;

    // Animate fire light intensity
    const fireIntensityBase = 25.0;
    const fireIntensityVariation = 6.0;
    const fireFlicker1 = Math.sin(elapsed * 8.0) * 0.5;
    const fireFlicker2 = Math.sin(elapsed * 13.0) * 0.3;
    const fireFlicker3 = Math.sin(elapsed * 5.0) * 0.2;
    const fireIntensity = fireIntensityBase + (fireFlicker1 + fireFlicker2 + fireFlicker3) * fireIntensityVariation;
    this.fireLight.setIntensity(Math.max(18.0, fireIntensity));

    // Animate fire light color
    const colorWave1 = Math.sin(elapsed * 2.0) * 0.06;
    const colorWave2 = Math.sin(elapsed * 3.5) * 0.04;
    const fireRed = 1.0;
    const fireGreen = 0.4 + colorWave1 + colorWave2;
    this.fireLight.setColor(vec3.fromValues(
      fireRed,
      Math.max(0.3, Math.min(0.5, fireGreen)),
      0.0
    ));

    // Animate fire light position
    const posWaveX = Math.sin(elapsed * 1.5) * 0.15 + Math.sin(elapsed * 2.7) * 0.08;
    const posWaveY = Math.sin(elapsed * 1.2) * 0.1 + Math.sin(elapsed * 3.1) * 0.05;
    const posWaveZ = Math.sin(elapsed * 1.8) * 0.12 + Math.sin(elapsed * 2.3) * 0.06;
    this.fireLight.setPosition(vec3.fromValues(0 + posWaveX, 0.0 + posWaveY, 0 + posWaveZ));
  }
}

/**
 * Factory function to create a campfire scene and return a render function
 * Takes WebGL context and returns a render function that handles all rendering
 */
export async function createCampfireScene(gl: WebGL2RenderingContext): Promise<RenderFunction> {
  // Create engine
  const engine = await Engine.create(gl);
  
  // Ensure canvas is properly sized and aspect ratio is correct
  engine.resizeCanvas();

  // Load quantizeBucket shader for post-processing
  const quadProgram = await Shader.create(
    gl,
    "/shaders/quad.vert",
    "/shaders/quantizeBucket.frag"
  );

  // Assign quad program to engine framebuffer for final output
  engine.framebuffer.program = quadProgram;

  // Load all scene shaders
  const program = await Shader.create(
    gl,
    "/shaders/default.vert",
    "/shaders/default.frag"
  );

  const skyboxShader = await Shader.create(
    gl,
    "/shaders/skybox.vert",
    "/shaders/skybox.frag"
  );

  // Create fire light
  const fireLight = new PointLight(
    vec3.fromValues(0, 0.25, 0),
    vec3.fromValues(1.0, 0.35, 0.0),
    30.0,
    1.0,
    0.15,
    0.12
  );

  // Create scene
  const scene = new CampfireScene(engine, program, fireLight);
  engine.scene = scene;

  // Ensure camera has correct aspect ratio after scene creation
  scene.camera.updateAspectRatio();

  // Set camera initial state
  // Target: [0.31, 2.62, 1.80], Yaw: -172.75°, Pitch: 2.07°
  const target = vec3.fromValues(0.31, 2.62, 1.80);
  const yawRad = (-172.75 * Math.PI) / 180;
  const pitchRad = (2.07 * Math.PI) / 180;
  
  const forward = vec3.create();
  forward[1] = Math.sin(pitchRad);
  const cosPitch = Math.cos(pitchRad);
  forward[0] = cosPitch * Math.sin(yawRad);
  forward[2] = cosPitch * Math.cos(yawRad);
  
  const distance = 10.0;
  const position = vec3.create();
  const forwardScaled = vec3.create();
  vec3.scale(forwardScaled, forward, distance);
  vec3.subtract(position, target, forwardScaled);
  
  scene.camera.setPosition(position);
  scene.camera.target = target;
  scene.camera.updateMatrices();

  // Load meshes
  const modelPaths = [
    "/models/log.obj",
    "/models/tree.obj",
    "/models/sphere.obj",
    "/models/cube.obj",
  ];
  const meshes = await Promise.all(
    modelPaths.map((path) => Mesh.fromObj(engine, path))
  );

  // Create skybox
  const skyboxCubeMeshIndex = modelPaths.findIndex(path => path === "/models/cube.obj");
  if (skyboxCubeMeshIndex !== -1) {
    const skyboxCubeMesh = meshes[skyboxCubeMeshIndex];
    const skybox = new Skybox(engine, scene, skyboxCubeMesh, skyboxShader);
    scene.skybox = skybox;
    scene.setCycleTime(0.785);
  }

  // Create materials
  const rockMaterial = new Material(engine);
  rockMaterial.setDiffuse("/materials/rocks/rocks_Color.jpg");
  rockMaterial.setNormal("/materials/rocks/rocks_NormalGL.jpg");
  rockMaterial.setSpecular("/materials/rocks/rocks_Roughness.jpg");
  rockMaterial.textureTiling = 8.0;

  const grassMaterial = new Material(engine);
  grassMaterial.setDiffuse("/materials/grass/grass_Color.jpg");
  grassMaterial.setNormal("/materials/grass/grass_NormalGL.jpg");
  grassMaterial.setSpecular("/materials/grass/grass_Roughness.jpg");
  grassMaterial.textureTiling = 8.0;

  const barkMaterial = new Material(engine);
  barkMaterial.setDiffuse("/materials/bark/bark_Color.jpg");
  barkMaterial.setNormal("/materials/bark/bark_NormalGL.jpg");
  barkMaterial.setSpecular("/materials/bark/bark_Roughness.jpg");

  const logMaterial = new Material(engine);
  logMaterial.setDiffuse("/materials/log/log_albedo.jpg");
  logMaterial.setNormal("/materials/log/log_normal.png");
  logMaterial.setSpecular("/materials/log/log_roughness.jpg");

  // Add fire light to scene
  scene.addPointLight(fireLight);

  // Create terrain
  const terrainOffsetZ = -40;
  const groundMesh = Terrain.createPlaneMesh(engine, {
    width: 150,
    height: 150,
    segmentsX: 128,
    segmentsZ: 128,
    noiseScale: 0.02,
    noiseAmplitude: 45.0,
    noiseOctaves: 3,
    originX: 0.0,
    originZ: -terrainOffsetZ
  });
  
  const groundPlane = new Node(
    scene,
    vec3.fromValues(0, -1, terrainOffsetZ),
    vec3.fromValues(1, 1, 1),
    quat.create(),
    groundMesh,
    grassMaterial
  );
  scene.add(groundPlane);

  // Create campfire scene with logs in triangle and rocks around
  const logMeshIndex = modelPaths.findIndex(path => path === "/models/log.obj");
  const sphereMeshIndex = modelPaths.findIndex(path => path === "/models/sphere.obj");
  const fireCenter = vec3.fromValues(0, -0.25, 0);

  // Add tripod logs
  if (logMeshIndex !== -1) {
    const logMesh = meshes[logMeshIndex];
    const logBaseScale = 0.01 / 2;
    const numLogs = 3;
    const logBaseRadius = 0.6;
    const logTopHeight = 1.6;
    const logAngles = [0, 120, 240];

    for (let i = 0; i < numLogs; i++) {
      const angle = (logAngles[i] * Math.PI) / 180;
      const scaleX = logBaseScale;
      const scaleY = logBaseScale * 2;
      const scaleZ = logBaseScale;
      const scaleVec = vec3.fromValues(scaleX, scaleY, scaleZ);

      const logBottomX = Math.cos(angle) * logBaseRadius;
      const logBottomZ = Math.sin(angle) * logBaseRadius;
      const logBottomY = fireCenter[1] + logBaseScale;

      const topX = fireCenter[0];
      const topY = fireCenter[1] + logTopHeight;
      const topZ = fireCenter[2];

      const directionX = topX - logBottomX;
      const directionY = topY - logBottomY;
      const directionZ = topZ - logBottomZ;

      const position = vec3.fromValues(logBottomX, logBottomY, logBottomZ);
      const horizontalAngle = Math.atan2(directionX, directionZ);
      const verticalAngle = Math.atan2(directionY, Math.sqrt(directionX * directionX + directionZ * directionZ));

      const rotation = quat.create();
      quat.fromEuler(rotation,
        (verticalAngle * 180) / Math.PI,
        (horizontalAngle * 180) / Math.PI,
        0
      );

      const logNode = new Node(scene, position, scaleVec, rotation, logMesh, logMaterial);
      scene.add(logNode);
    }

    // Add bench logs
    const benchRadius = 7.5;
    const numBenchLogs = 3;
    const benchLogBaseScale = 0.01 / 2;
    const benchTerrainParams = {
      width: 150,
      height: 150,
      segmentsX: 128,
      segmentsZ: 128,
      noiseScale: 0.02,
      noiseAmplitude: 45.0,
      noiseOctaves: 3,
      originX: 0.0,
      originZ: -terrainOffsetZ,
      flatRadius: 2.0,
      maxDistance: null,
      amplitudePower: 2.5
    };

    for (let i = 0; i < numBenchLogs; i++) {
      const angle = (i / numBenchLogs) * 2 * Math.PI + 80 * Math.PI / 180;
      const benchX = fireCenter[0] + Math.cos(angle) * benchRadius;
      const benchZ = fireCenter[2] + Math.sin(angle) * benchRadius;
      const terrainLocalX = benchX;
      const terrainLocalZ = benchZ - terrainOffsetZ;
      const terrainY = Terrain.getHeightAt(terrainLocalX, terrainLocalZ, benchTerrainParams);

      const benchPosition = vec3.fromValues(
        benchX,
        terrainY - 0.5 + benchLogBaseScale,
        benchZ
      );

      const benchScaleX = benchLogBaseScale * 2;
      const benchScaleY = benchLogBaseScale * 4;
      const benchScaleZ = benchLogBaseScale * 2;
      const benchScaleVec = vec3.fromValues(benchScaleX, benchScaleY, benchScaleZ);

      const benchRotation = quat.create();
      quat.fromEuler(benchRotation, 90, -(angle * 180) / Math.PI, 0);

      const benchLogNode = new Node(scene, benchPosition, benchScaleVec, benchRotation, logMesh, logMaterial);
      scene.add(benchLogNode);
    }
  }

  // Add rocks around fire
  if (sphereMeshIndex !== -1 && logMeshIndex !== -1) {
    const sphereMesh = meshes[sphereMeshIndex];
    const numRocks = 18;
    const rockRadius = 2.5;
    const rockBaseScale = 0.35;
    const rockScaleVariation = 0.25;

    for (let i = 0; i < numRocks; i++) {
      const angle = (i / numRocks) * Math.PI * 2;
      const radiusOffset = (Math.random() - 0.5) * 0.8;
      const angleOffset = (Math.random() - 0.5) * 0.3;

      const rockX = Math.cos(angle + angleOffset) * (rockRadius + radiusOffset);
      const rockZ = Math.sin(angle + angleOffset) * (rockRadius + radiusOffset);
      const rockY = -1.25 + rockBaseScale;
      const position = vec3.fromValues(rockX, rockY, rockZ);

      const scale = rockBaseScale + Math.random() * rockScaleVariation;
      const scaleVec = vec3.fromValues(scale, scale, scale);

      const rotation = quat.create();
      quat.fromEuler(rotation,
        Math.random() * 360,
        Math.random() * 360,
        Math.random() * 360
      );

      const rockNode = new Node(scene, position, scaleVec, rotation, sphereMesh, rockMaterial);
      scene.add(rockNode);
    }
  }

  // Add trees
  const treeMeshIndex = modelPaths.findIndex(path => path === "/models/tree.obj");
  if (treeMeshIndex !== -1) {
    const treeMesh = meshes[treeMeshIndex];
    const terrainParams = {
      width: 150,
      height: 150,
      segmentsX: 128,
      segmentsZ: 128,
      noiseScale: 0.02,
      noiseAmplitude: 45.0,
      noiseOctaves: 3,
      originX: 0.0,
      originZ: -terrainOffsetZ,
      flatRadius: 2.0,
      maxDistance: null,
      amplitudePower: 2.5
    };

    const treeConfig: TreeSpawnConfig = {
      numTrees: 150,
      treeSeed: 150,
      sizeSeed: 200,
      fireExclusionRadius: 7.0,
      fireCenter: vec3.fromValues(0, -0.25, 0),
      cameraExclusionRadius: 6.0,
      terrainOffsetZ: terrainOffsetZ,
      terrainParams: terrainParams,
      logBaseScale: 0.012 * 3 * 2,
      logHeightVariation: 0.008 * 3 * 2,
      leafSpawnChance: 0.025,
    };

    const { treeNodes } = await Tree.spawnTrees(engine, scene, treeMesh, barkMaterial, treeConfig);
    // Tree nodes are already added to the scene by spawnTrees
  }

  // Create and return render function
  const renderFn = (dt: number) => {
    // Don't resize canvas on every frame - only resize when needed via resize() method
    // This prevents layout thrashing during scroll
    const canvas = engine.gl.canvas as HTMLCanvasElement;
    if (canvas.width === 0 || canvas.height === 0 || engine.width === 0 || engine.height === 0) {
      return;
    }

    // Update scene (includes camera update with input handling and fire light animation)
    scene.update(dt);

    // Render
    engine.update();
    scene.render();
    engine.use();
    engine.framebuffer.render((gl, program) => {
      // Set quantization level for quantizeBucket shader
      const quantizationLevelLoc = gl.getUniformLocation(program, "uQuantizationLevel");
      if (quantizationLevelLoc !== null) {
        gl.uniform1f(quantizationLevelLoc, 8.0);
      }

      // Set resolution
      const resolutionLoc = gl.getUniformLocation(program, "uResolution");
      if (resolutionLoc !== null) {
        gl.uniform2f(resolutionLoc, engine.width, engine.height);
      }
    });
  };

  // Create render function with methods
  const render = Object.assign(renderFn, {
    cleanup: () => {
      scene.disableCameraControls();
      if (scene.camera) {
        // Camera no longer has destroy method, but keep for compatibility
      }
    },
    resize: () => {
      engine.resizeCanvas();
    },
    enableControls: (canvas: HTMLCanvasElement) => {
      // Camera controls disabled - no movement allowed
      // scene.enableCameraControls(canvas);
    }
  }) as RenderFunction;

  return render;
}
