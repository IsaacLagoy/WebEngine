"use client";

import { useRef, useEffect, useState } from "react";
import { Scene } from "./engine/objects/scene";
import { Engine } from "./engine/objects/engine";
import { Mesh } from "./engine/objects/mesh";
import { Node } from "./engine/objects/node";
import { Terrain } from "./engine/objects/terrain";
import { vec3, quat } from "gl-matrix";
import { Material } from "./engine/objects/material";
import { randomVec3 } from "./math/random";
import { Shader } from "./engine/core/shader";
import { PointLight } from "./engine/objects/pointLight";
import { Billboard } from "./engine/objects/billboard";
import { FireBillboard } from "./engine/objects/fireBillboard";
import { Skybox } from "./engine/objects/skybox";

export default function WebGLCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fpsRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2");
    if (!gl) {
      console.error("WebGL 2.0 not supported.");
      return;
    }

    const init = async () => {
      const program = await Shader.create(
        gl,
        "/shaders/default.vert",
        "/shaders/default.frag"
      );

      const engine = await Engine.create(gl);

      const quadProgram = await Shader.create(
        gl,
        "/shaders/quad.vert",
        "/shaders/quantizeBucket.frag"
      );

      // Load all available meshes from public/models so we can pick randomly
      const modelPaths = [
        "/models/log.obj",
        "/models/sphere.obj",
        "/models/cube.obj",
      ];

      const meshes = await Promise.all(
        modelPaths.map((path) => Mesh.fromObj(engine, path))
      );

      const rockMaterial = new Material(engine);
      rockMaterial.setDiffuse("/materials/rocks/rocks_Color.jpg");
      rockMaterial.setNormal("/materials/rocks/rocks_NormalGL.jpg");
      rockMaterial.setSpecular("/materials/rocks/rocks_Roughness.jpg");
      rockMaterial.textureTiling = 8.0; // Tile texture 8 times for more detail on terrain

      const grassMaterial = new Material(engine);
      grassMaterial.setDiffuse("/materials/grass/grass_Color.jpg");
      grassMaterial.setNormal("/materials/grass/grass_NormalGL.jpg");
      grassMaterial.setSpecular("/materials/grass/grass_Roughness.jpg");
      grassMaterial.textureTiling = 8.0; // Tile texture 8 times for more detail on terrain

      const barkMaterial = new Material(engine);
      barkMaterial.setDiffuse("/materials/bark/bark_Color.jpg");
      barkMaterial.setNormal("/materials/bark/bark_NormalGL.jpg");
      barkMaterial.setSpecular("/materials/bark/bark_Roughness.jpg");

      const logMaterial = new Material(engine);
      logMaterial.setDiffuse("/materials/log/log_albedo.jpg");
      logMaterial.setNormal("/materials/log/log_normal.png");
      logMaterial.setSpecular("/materials/log/log_roughness.jpg");

      const plainMaterial = new Material(engine);
      plainMaterial.roughnessMultiplier = 0.3;  // Lower roughness = shinier (more specular)
      plainMaterial.metallic = 0.8;  // Higher metallic = more reflective
      
      // Match C++: Scene constructor takes shader
      const scene = new Scene(engine, program);
      sceneInstance = scene; // Store reference for cleanup
      // Set camera to match saved state
      // Target: [0.31, 2.62, 1.80], Yaw: -172.75°, Pitch: 2.07°
      const target = vec3.fromValues(0.31, 2.62, 1.80);
      const yawRad = (-172.75 * Math.PI) / 180;
      const pitchRad = (2.07 * Math.PI) / 180;
      
      // Calculate forward direction from yaw and pitch (normalized)
      const forward = vec3.create();
      forward[1] = Math.sin(pitchRad); // Pitch component
      const cosPitch = Math.cos(pitchRad);
      forward[0] = cosPitch * Math.sin(yawRad); // Yaw X component
      forward[2] = cosPitch * Math.cos(yawRad); // Yaw Z component
      
      // Calculate position from target and forward direction
      // Use a reasonable distance estimate (10 units) to position camera
      const distance = 10.0;
      const position = vec3.create();
      const forwardScaled = vec3.create();
      vec3.scale(forwardScaled, forward, distance);
      vec3.subtract(position, target, forwardScaled);
      
      scene.camera.setPosition(position);
      scene.camera.target = target;
      scene.camera.updateMatrices();
      
      // Create skybox with Preetham atmospheric scattering
      const skyboxShader = await Shader.create(
        gl,
        "/shaders/skybox.vert",
        "/shaders/skybox.frag"
      );
      const skyboxCubeMeshIndex = modelPaths.findIndex(path => path === "/models/cube.obj");
      if (skyboxCubeMeshIndex !== -1) {
        const skyboxCubeMesh = meshes[skyboxCubeMeshIndex];
        const skybox = new Skybox(engine, scene, skyboxCubeMesh, skyboxShader);
        scene.skybox = skybox;
        // Set to early night (0.9 = late evening/early night, moon visible)
        scene.setCycleTime(0.785);
      }
      
      // Add blue-moonlight directional light (set in scene uniforms)
      // This is handled by the directional light in the shader (uLightDir)
      
      // Add reddish-orange to orange fire light at center
      const fireLight = new PointLight(
        vec3.fromValues(0, 0.25, 0),  // Position: center, at fire height (matches fire position)
        vec3.fromValues(1.0, 0.35, 0.0),  // Reddish-orange light (will animate to orange)
        30.0,  // Intensity - stronger fire light
        1.0,  // Constant attenuation
        0.15,  // Linear attenuation (increased for faster falloff)
        0.12  // Quadratic attenuation (increased significantly for smaller radius)
      );
      scene.addPointLight(fireLight);
      
      // Assign quad program to engine framebuffer for final output
      engine.framebuffer.program = quadProgram;
      
      const nodes: Node[] = [];

      // Create ground plane using programmatically generated mesh
      // Using 128x128 segments to stay under Uint16 index limit (65,535 vertices max)
      // 129x129 = 16,641 vertices, well under the limit
      // Set origin at campfire location in terrain's local space (0, 40) since terrain is offset backward by 40
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
        vec3.fromValues(0, -1, terrainOffsetZ), // Position slightly below origin, moved backward (Z-40) to show more terrain in front of camera
        vec3.fromValues(1, 1, 1), // Scale: 1:1 since mesh is already 30x30
        quat.create(),
        groundMesh,
        grassMaterial
      );
      // Mark as ground plane for special rendering if needed
      (groundPlane as any).isGroundPlane = true;
      nodes.push(groundPlane);
      scene.add(groundPlane);

      // Create fire billboard at center
      const billboardShader = await Shader.create(
        gl,
        "/shaders/billboard.vert",
        "/shaders/billboard.frag"
      );
      
      // Load fire sprite frames
      const fireTextures = await FireBillboard.loadFrames(engine);
      console.log(`Loaded ${fireTextures.length} fire frames`);
      
      // Create single fire at center, partially clipped into ground
      // const centerFire = new FireBillboard(
      //   engine,
      //   vec3.fromValues(0, 0.5, 0),  // Position: center, partially in ground (ground top is at y=-0.75)
      //   [8, 12],  // Size: 8 wide, 12 tall
      //   fireTextures
      // );
      // await centerFire.init(billboardShader);
      // scene.addFireBillboard(centerFire);
      
      // Create campfire scene with logs in triangle and rocks around
      const logMeshIndex = modelPaths.findIndex(path => path === "/models/log.obj");
      const sphereMeshIndex = modelPaths.findIndex(path => path === "/models/sphere.obj");
      const fireCenter = vec3.fromValues(0, -0.25, 0); // Fire center
      
      if (logMeshIndex !== -1) {
        const logMesh = meshes[logMeshIndex];
        const logBaseScale = 0.01 / 2; // Base scale for logs (scaled down by 2)
        const numLogs = 3; // Number of logs in tripod
        
        // Tripod/teepee formation: logs lean against each other
        const logBaseRadius = 0.6; // Distance from center where log bottoms are
        const logTopHeight = 1.6; // Height where log tops meet (increased for higher angle)
        const logAngles = [0, 120, 240]; // 120 degrees apart (triangle)
        
        for (let i = 0; i < numLogs; i++) {
          const angle = (logAngles[i] * Math.PI) / 180; // Convert to radians
          
          // Scale: X and Z same, Y is double (length - extend vertically)
          const scaleX = logBaseScale;
          const scaleY = logBaseScale * 2; // Double length in Y axis
          const scaleZ = logBaseScale;
          const scaleVec = vec3.fromValues(scaleX, scaleY, scaleZ);
          
          // Position log bottom at base radius, top meets at center top
          const logBottomX = Math.cos(angle) * logBaseRadius;
          const logBottomZ = Math.sin(angle) * logBaseRadius;
          const logBottomY = fireCenter[1] + logBaseScale; // Bottom raised by 1 unit
          
          // Calculate direction from bottom to top (where logs meet)
          const topX = fireCenter[0];
          const topY = fireCenter[1] + logTopHeight;
          const topZ = fireCenter[2];
          
          const directionX = topX - logBottomX;
          const directionY = topY - logBottomY;
          const directionZ = topZ - logBottomZ;
          
          // Position is at the bottom of the log
          const position = vec3.fromValues(logBottomX, logBottomY, logBottomZ);
          
          // Calculate rotation to lean log toward center top
          // First rotate to point in the direction, then account for log's Y extension
          const horizontalAngle = Math.atan2(directionX, directionZ);
          const verticalAngle = Math.atan2(directionY, Math.sqrt(directionX * directionX + directionZ * directionZ));
          
          // Rotate log: first around Y to face the right direction, then around X to lean
          const rotation = quat.create();
          quat.fromEuler(rotation, 
            (verticalAngle * 180) / Math.PI, // Pitch (lean angle)
            (horizontalAngle * 180) / Math.PI, // Yaw (direction)
            0 // No roll
          );
          
          const logNode = new Node(
            scene,
            position,
            scaleVec,
            rotation,
            logMesh,
            logMaterial
          );
          
          nodes.push(logNode);
          scene.add(logNode);
        }
        
        console.log(`Added ${numLogs} logs in tripod formation`);
      } else {
        console.warn("Could not find log.obj mesh");
      }
      
      // Add rocks (spheres) around the fire
      if (sphereMeshIndex !== -1 && logMeshIndex !== -1) {
        const sphereMesh = meshes[sphereMeshIndex];
        const numRocks = 18; // Number of rocks around the fire (3x original)
        const rockRadius = 2.5; // Base distance from fire center
        const rockBaseScale = 0.35; // Base scale for rocks (increased from 0.2)
        const rockScaleVariation = 0.25; // Scale variation range
        
        for (let i = 0; i < numRocks; i++) {
          const angle = (i / numRocks) * Math.PI * 2; // Evenly spaced around circle
          
          // Add random offset to position for more natural placement
          const radiusOffset = (Math.random() - 0.5) * 0.8; // Random radius variation
          const angleOffset = (Math.random() - 0.5) * 0.3; // Random angle variation
          
          // Position rock around fire with random offset
          const rockX = Math.cos(angle + angleOffset) * (rockRadius + radiusOffset);
          const rockZ = Math.sin(angle + angleOffset) * (rockRadius + radiusOffset);
          const rockY = -1.25 + rockBaseScale; // Sit on ground
          const position = vec3.fromValues(rockX, rockY, rockZ);
          
          // Variable scale for rocks (0.35 to 0.6)
          const scale = rockBaseScale + Math.random() * rockScaleVariation;
          const scaleVec = vec3.fromValues(scale, scale, scale);
          
          // Random rotation for rocks
          const rotation = quat.create();
          quat.fromEuler(rotation,
            Math.random() * 360,
            Math.random() * 360,
            Math.random() * 360
          );
          
          // Use rock material for the rocks
          const rockNode = new Node(
            scene,
            position,
            scaleVec,
            rotation,
            sphereMesh,
            rockMaterial
          );
          
          nodes.push(rockNode);
          scene.add(rockNode);
        }
        
        console.log(`Added ${numRocks} rocks around fire`);
      } else {
        console.warn("Could not find sphere.obj mesh for rocks");
      }
      
      // Add vertical logs (trees) scattered across the terrain
      if (logMeshIndex !== -1) {
        const logMesh = meshes[logMeshIndex];
        const numTreeLogs = 250; // Number of vertical logs/trees
        const terrainWidth = 150;
        const terrainHeight = 150;
        const terrainCenterX = 0;
        const terrainCenterZ = terrainOffsetZ; // Account for terrain offset
        
        // Terrain parameters (must match those used to generate the terrain)
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
        
        // Seeded random number generator for deterministic tree placement
        const treeSeed = 134; // Seed for tree generation
        let seedState = treeSeed;
        const seededRandom = () => {
          seedState = (seedState * 9301 + 49297) % 233280;
          return seedState / 233280;
        };
        
        // Campfire exclusion radius - no trees within this distance
        // Fire is at world position (0, -0.25, 0) - use fireCenter coordinates
        const fireExclusionRadius = 10.0; // Increased radius around campfire
        const fireCenterX = 0; // Fire X position
        const fireCenterZ = 0; // Fire Z position (not terrainCenterZ!)
        
        let treesPlaced = 0;
        let attempts = 0;
        const maxAttempts = numTreeLogs * 10; // Prevent infinite loop
        
        while (treesPlaced < numTreeLogs && attempts < maxAttempts) {
          attempts++;
          
          // Random position across terrain using seeded RNG
          const logX = (seededRandom() - 0.5) * terrainWidth;
          const logZ = (seededRandom() - 0.5) * terrainHeight + terrainCenterZ;
          
          // Check distance from fire - skip if too close
          // Fire is at world position (0, -0.25, 0), so check distance from (0, 0) in XZ plane
          const distanceFromFire = Math.sqrt(
            (logX - fireCenterX) ** 2 + (logZ - fireCenterZ) ** 2
          );
          if (distanceFromFire < fireExclusionRadius) {
            continue; // Skip this position, try again
          }
          
          // Convert world coordinates to terrain local coordinates
          // Terrain mesh is positioned at (0, -1, terrainOffsetZ) in world space
          // Terrain local coordinates: X is same (centered at 0), Z needs to account for offset
          // Since terrain is positioned at Z = terrainOffsetZ, local Z = world Z - terrainOffsetZ
          const terrainLocalX = logX; // X is the same (terrain centered at world X=0)
          const terrainLocalZ = logZ - terrainOffsetZ; // Convert world Z to terrain local Z
          
          // Query actual terrain height at this position (in terrain local coordinates)
          const terrainY = Terrain.getHeightAt(terrainLocalX, terrainLocalZ, terrainParams);
          
          // Scale: taller logs standing vertically (using seeded RNG)
          const logBaseScale = 0.012 * 3; // Scaled up by 3
          const logHeightVariation = 0.008 * 3; // Variation in height (scaled up by 3)
          const logHeight = logBaseScale + seededRandom() * logHeightVariation;
          const logWidth = logBaseScale * 0.4; // Narrower width
          const scaleVec = vec3.fromValues(logWidth, logHeight, logWidth);
          
          // Position: bottom of log on terrain (account for terrain Y offset = -1)
          const position = vec3.fromValues(logX, terrainY - 1.0 + logWidth + 6, logZ);
          
          // Random rotation around Y axis (vertical, using seeded RNG)
          const rotation = quat.create();
          quat.fromEuler(rotation,
            0, // No pitch (vertical)
            seededRandom() * 360, // Random yaw rotation
            0 // No roll
          );
          
          const treeLogNode = new Node(
            scene,
            position,
            scaleVec,
            rotation,
            logMesh,
            logMaterial
          );
          
          nodes.push(treeLogNode);
          scene.add(treeLogNode);
          treesPlaced++;
        }
        
        console.log(`Added ${treesPlaced} vertical logs (trees) across terrain (${attempts} attempts)`);
      }

      let lastTime = performance.now();
      const startTime = performance.now();
      
      // Framerate tracking
      let frameCount = 0;
      let fpsLastTime = performance.now();
      const fpsUpdateInterval = 500; // Update FPS display every 500ms
      
      // Camera state printing
      let cameraPrintLastTime = performance.now();
      const cameraPrintInterval = 1000; // Print camera state every 1 second

      function render(time: number) {
        // Always resize canvas first - this ensures dimensions are correct
        engine.resizeCanvas();
        
        // Skip rendering if canvas doesn't have valid dimensions yet
        const canvas = engine.gl.canvas as HTMLCanvasElement;
        if (canvas.width === 0 || canvas.height === 0 || engine.width === 0 || engine.height === 0) {
          requestAnimationFrame(render);
          return;
        }
        
        const dt = Math.min((time - lastTime) / 1000, 0.1);
        lastTime = time;
        
        // Update camera controls (handled by Camera class)
        scene.camera.update(dt);
        
        // Print camera state periodically
        const cameraPrintElapsed = time - cameraPrintLastTime;
        if (cameraPrintElapsed >= cameraPrintInterval) {
          scene.camera.printState();
          cameraPrintLastTime = time;
        }
        
        // Calculate and update framerate
        frameCount++;
        const fpsElapsed = time - fpsLastTime;
        if (fpsElapsed >= fpsUpdateInterval && fpsRef.current) {
          const fps = Math.round((frameCount * 1000) / fpsElapsed);
          fpsRef.current.textContent = `FPS: ${fps}`;
          frameCount = 0;
          fpsLastTime = time;
        }
        
        // Animate fire light intensity - flicker like a real fire
        const elapsed = (time - startTime) / 1000; // Time in seconds
        const fireIntensityBase = 25.0; // Increased base intensity
        const fireIntensityVariation = 6.0; // Increased variation for more dramatic flicker
        // Use multiple sine waves for natural fire flicker
        const fireFlicker1 = Math.sin(elapsed * 8.0) * 0.5;
        const fireFlicker2 = Math.sin(elapsed * 13.0) * 0.3;
        const fireFlicker3 = Math.sin(elapsed * 5.0) * 0.2;
        const fireIntensity = fireIntensityBase + (fireFlicker1 + fireFlicker2 + fireFlicker3) * fireIntensityVariation;
        fireLight.setIntensity(Math.max(18.0, fireIntensity)); // Minimum intensity increased
        
        // Animate fire light color - reddish-orange to orange variations
        // Use slow, gentle waves for subtle color shifts
        const colorWave1 = Math.sin(elapsed * 2.0) * 0.06;
        const colorWave2 = Math.sin(elapsed * 3.5) * 0.04;
        
        // Base reddish-orange to orange color range (more red, less yellow)
        // Reddish-orange: RGB(1.0, 0.3, 0.0), Orange: RGB(1.0, 0.5, 0.0)
        const fireRed = 1.0; // Keep red constant at maximum
        const fireGreen = 0.4 + colorWave1 + colorWave2; // Shift between reddish-orange (0.3) and orange (0.5)
        const fireBlue = 0.0; // No blue for warm fire tones
        
        fireLight.setColor(vec3.fromValues(
          fireRed,
          Math.max(0.3, Math.min(0.5, fireGreen)), // Clamp between reddish-orange and orange (no yellow)
          fireBlue
        ));
        
        // Animate fire light position - subtle movement
        const posWaveX = Math.sin(elapsed * 1.5) * 0.15 + Math.sin(elapsed * 2.7) * 0.08;
        const posWaveY = Math.sin(elapsed * 1.2) * 0.1 + Math.sin(elapsed * 3.1) * 0.05;
        const posWaveZ = Math.sin(elapsed * 1.8) * 0.12 + Math.sin(elapsed * 2.3) * 0.06;
        
        fireLight.setPosition(vec3.fromValues(
          0 + posWaveX,
          0.0 + posWaveY,
          0 + posWaveZ
        ));

        engine.update(); // Clears engine.framebuffer
        scene.update(dt);
        scene.render(); // Renders to engine.framebuffer (with emission)
        engine.use(); // Set screen as render location
        engine.framebuffer.render((gl, program) => {
          // Set quantize shader uniforms
          const quantizationLevelLoc = gl.getUniformLocation(program, "uQuantizationLevel");
          if (quantizationLevelLoc !== null) {
            gl.uniform1f(quantizationLevelLoc, 8.0);
          }
          
          const resolutionLoc = gl.getUniformLocation(program, "uResolution");
          if (resolutionLoc !== null) {
            gl.uniform2f(resolutionLoc, engine.width, engine.height);
          }
        });

        requestAnimationFrame(render);
      }

      requestAnimationFrame(render);
    };

    let sceneInstance: Scene | null = null;

    init()
      .then(() => {
        // All resources loaded, fade out overlay
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        // Even on error, hide overlay so user can see what's happening
        setIsLoading(false);
      });

    // Cleanup function to remove event listeners when component unmounts
    return () => {
      if (sceneInstance?.camera) {
        sceneInstance.camera.destroy();
      }
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
      {/* FPS Debug Display */}
      <div
        ref={fpsRef}
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          color: "white",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: "8px 12px",
          borderRadius: "4px",
          fontFamily: "monospace",
          fontSize: "14px",
          fontWeight: "bold",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        FPS: --
      </div>
      {/* Black overlay that fades out when loaded */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-1000 ${
          isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ zIndex: 1 }}
      />
    </div>
  );
}