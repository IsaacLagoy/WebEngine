"use client";

import { useRef, useEffect, useState } from "react";
import { Scene } from "./engine/objects/scene";
import { Engine } from "./engine/objects/engine";
import { Mesh } from "./engine/objects/mesh";
import { Node } from "./engine/objects/node";
import { vec3, quat } from "gl-matrix";
import { Material } from "./engine/objects/material";
import { randomVec3 } from "./math/random";
import { Shader } from "./engine/core/shader";
import { PointLight } from "./engine/objects/pointLight";
import { Billboard } from "./engine/objects/billboard";
import { FireBillboard } from "./engine/objects/fireBillboard";
import { Skybox } from "./engine/objects/skybox";

function getRandomPosition3D(range: number) {
  const x = (Math.random() - 0.5) * range;
  const y = (Math.random() - 0.5) * range;
  const z = (Math.random() - 0.5) * range;
  return vec3.fromValues(x, y, z);
}

export default function WebGLCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fpsRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const keysPressed = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Keyboard event handlers for camera controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown" || 
          e.key === "ArrowLeft" || e.key === "ArrowRight" ||
          e.key === "w" || e.key === "W" ||
          e.key === "a" || e.key === "A" ||
          e.key === "s" || e.key === "S" ||
          e.key === "d" || e.key === "D") {
        e.preventDefault();
        keysPressed.current.add(e.key.toLowerCase());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown" || 
          e.key === "ArrowLeft" || e.key === "ArrowRight" ||
          e.key === "w" || e.key === "W" ||
          e.key === "a" || e.key === "A" ||
          e.key === "s" || e.key === "S" ||
          e.key === "d" || e.key === "D") {
        keysPressed.current.delete(e.key.toLowerCase());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

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
        "/shaders/quad.frag"
      );

      // Load all available meshes from public/models so we can pick randomly
      const modelPaths = [
        "/models/art_table.obj",
        "/models/bass.obj",
        "/models/battery.obj",
        "/models/cube.obj",
        "/models/flounder.obj",
        "/models/herring.obj",
        "/models/key.obj",
        "/models/lamp.obj",
        "/models/office_chair.obj",
        "/models/sphere.obj",
        "/models/squid.obj",
        "/models/tilapia.obj",
        "/models/tuna.obj",
      ];

      const meshes = await Promise.all(
        modelPaths.map((path) => Mesh.fromObj(engine, path))
      );

      const rockMaterial = new Material(engine);
      rockMaterial.setDiffuse("/materials/rocks/rocks_Color.jpg");
      rockMaterial.setNormal("/materials/rocks/rocks_NormalGL.jpg");
      rockMaterial.setSpecular("/materials/rocks/rocks_Roughness.jpg");

      const barkMaterial = new Material(engine);
      barkMaterial.setDiffuse("/materials/bark/bark_Color.jpg");
      barkMaterial.setNormal("/materials/bark/bark_NormalGL.jpg");
      barkMaterial.setSpecular("/materials/bark/bark_Roughness.jpg");

      const plainMaterial = new Material(engine);
      plainMaterial.roughnessMultiplier = 0.3;  // Lower roughness = shinier (more specular)
      plainMaterial.metallic = 0.8;  // Higher metallic = more reflective
      
      // Match C++: Scene constructor takes shader
      const scene = new Scene(engine, program);
      // Position camera at ground level (eye height ~1.8 units) looking forward
      scene.camera.setPosition(vec3.fromValues(0, 3, 10));
      scene.camera.target = vec3.fromValues(0, 5, 0); // Look at origin
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
      
      // Add orange-yellow fire light at center
      const fireLight = new PointLight(
        vec3.fromValues(0, 0.5, 0),  // Position: center, at fire height (matches fire position)
        vec3.fromValues(1.0, 0.6, 0.2),  // Orange-yellow light (warm fire color)
        15.0,  // Intensity - bright fire light
        1.0,  // Constant attenuation
        0.09,  // Linear attenuation
        0.032  // Quadratic attenuation
      );
      scene.addPointLight(fireLight);
      
      // Assign quad program to engine framebuffer for final output
      engine.framebuffer.program = quadProgram;
      
      const nodes: Node[] = [];

      // Create ground plane using a stretched cube
      const cubeMeshIndex = modelPaths.findIndex(path => path === "/models/cube.obj");
      if (cubeMeshIndex !== -1) {
        const cubeMesh = meshes[cubeMeshIndex];
        const groundPlane = new Node(
          scene,
          vec3.fromValues(0, -1, 0), // Position slightly below origin
          vec3.fromValues(30, 0.5, 30), // Scale: large flat plane, thin
          quat.create(),
          cubeMesh,
          rockMaterial
        );
        // Mark as ground plane for special rendering if needed
        (groundPlane as any).isGroundPlane = true;
        nodes.push(groundPlane);
        scene.add(groundPlane);
      }

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
      
      // Create a few objects on the ground
      const numObjects = 10; // Just a few objects
      const spawnRange = 20; // Objects within 20 units of center
      
      // Use sphere mesh for objects on the ground
      const sphereMeshIndex = modelPaths.findIndex(path => path === "/models/sphere.obj");
      if (sphereMeshIndex === -1) {
        console.warn("Could not find sphere.obj mesh");
      } else {
        const sphereMesh = meshes[sphereMeshIndex];
        
        // Create objects positioned on the ground
        for (let i = 0; i < numObjects; i++) {
          // Random scale between 0.5 and 1.5
          const scale = 0.5 + Math.random() * 1.0;
          const scaleVec = vec3.fromValues(scale, scale, scale);
          
          // Random position on ground (X and Z random, Y = scale/2 to sit on ground)
          // Ground plane is at y=-1 with height 0.5, so top surface is at y=-0.75
          const x = (Math.random() - 0.5) * spawnRange;
          const z = (Math.random() - 0.5) * spawnRange;
          const y = -0.75 + scale * 0.5; // Sit on top of ground plane
          const position = vec3.fromValues(x, y, z);

          // Distribute materials evenly to create 3 instance groups
          const material = i % 3 === 0 ? rockMaterial : i % 3 === 1 ? plainMaterial : barkMaterial;

          const node = new Node(
            scene,
            position,
            scaleVec,
            quat.create(),
            sphereMesh,
            material
          );

          // Random rotation but no angular velocity (objects stay in place)
          quat.fromEuler(node.rotation, 
            Math.random() * 360, 
            Math.random() * 360, 
            Math.random() * 360
          );

          nodes.push(node);
          scene.add(node);
        }
        
        console.log(`Created ${numObjects} sphere instances for instancing test`);
        console.log(`Expected ~3 instance groups (one per material)`);
      }

      let lastTime = performance.now();
      const startTime = performance.now();
      
      // Framerate tracking
      let frameCount = 0;
      let fpsLastTime = performance.now();
      const fpsUpdateInterval = 500; // Update FPS display every 500ms

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
        
        // Handle camera rotation with arrow keys
        const rotationSpeed = 1.5; // radians per second
        const rotationDelta = rotationSpeed * dt;
        const moveSpeed = 5.0; // units per second
        const moveDelta = moveSpeed * dt;
        
        if (keysPressed.current.size > 0) {
          const camera = scene.camera;
          
          // Calculate forward direction (from position to target)
          const forward = vec3.create();
          vec3.subtract(forward, camera.target, camera.position);
          const distance = vec3.length(forward);
          vec3.normalize(forward, forward);
          
          // Calculate right direction (cross product of forward and up)
          const right = vec3.create();
          vec3.cross(right, forward, camera.up);
          vec3.normalize(right, right);
          
          // Calculate actual up direction (cross product of right and forward)
          const up = vec3.create();
          vec3.cross(up, right, forward);
          vec3.normalize(up, up);
          
          let horizontalRotation = 0.0; // Yaw (around Y axis)
          let verticalRotation = 0.0; // Pitch (around right axis)
          let moveDirection = vec3.create(); // Movement direction
          
          // Arrow key rotation
          if (keysPressed.current.has("arrowleft")) {
            // Rotate left (yaw left)
            horizontalRotation = rotationDelta;
          }
          if (keysPressed.current.has("arrowright")) {
            // Rotate right (yaw right)
            horizontalRotation = -rotationDelta;
          }
          if (keysPressed.current.has("arrowup")) {
            // Look up (pitch up)
            verticalRotation = rotationDelta;
          }
          if (keysPressed.current.has("arrowdown")) {
            // Look down (pitch down)
            verticalRotation = -rotationDelta;
          }
          
          // WASD movement
          if (keysPressed.current.has("w")) {
            // Move forward
            vec3.add(moveDirection, moveDirection, forward);
          }
          if (keysPressed.current.has("s")) {
            // Move backward
            vec3.subtract(moveDirection, moveDirection, forward);
          }
          if (keysPressed.current.has("a")) {
            // Move left
            vec3.subtract(moveDirection, moveDirection, right);
          }
          if (keysPressed.current.has("d")) {
            // Move right
            vec3.add(moveDirection, moveDirection, right);
          }
          
          // Apply horizontal rotation (yaw) - rotate around Y axis
          if (horizontalRotation !== 0.0) {
            const yawAxis = vec3.fromValues(0, 1, 0);
            const rotationQuat = quat.create();
            quat.setAxisAngle(rotationQuat, yawAxis, horizontalRotation);
            vec3.transformQuat(forward, forward, rotationQuat);
          }
          
          // Apply vertical rotation (pitch) - rotate around right axis
          if (verticalRotation !== 0.0) {
            const pitchAxis = right;
            const rotationQuat = quat.create();
            quat.setAxisAngle(rotationQuat, pitchAxis, verticalRotation);
            vec3.transformQuat(forward, forward, rotationQuat);
            
            // Clamp pitch to prevent flipping
            const pitchAngle = Math.asin(forward[1]);
            const maxPitch = Math.PI / 2.0 - 0.1; // Almost 90 degrees
            if (Math.abs(pitchAngle) > maxPitch) {
              forward[1] = Math.sign(forward[1]) * Math.sin(maxPitch);
              const horizontalLength = Math.sqrt(forward[0] * forward[0] + forward[2] * forward[2]);
              const scale = Math.cos(maxPitch) / horizontalLength;
              forward[0] *= scale;
              forward[2] *= scale;
            }
          }
          
          // Apply movement
          if (vec3.length(moveDirection) > 0.0) {
            vec3.normalize(moveDirection, moveDirection);
            vec3.scale(moveDirection, moveDirection, moveDelta);
            vec3.add(camera.position, camera.position, moveDirection);
            vec3.add(camera.target, camera.target, moveDirection);
            camera.updateMatrices();
          }
          
          // Update camera target based on new forward direction
          if (horizontalRotation !== 0.0 || verticalRotation !== 0.0) {
            vec3.scale(forward, forward, distance);
            vec3.add(camera.target, camera.position, forward);
            camera.updateMatrices();
          }
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
        const fireIntensityBase = 12.0;
        const fireIntensityVariation = 4.0;
        // Use multiple sine waves for natural fire flicker
        const fireFlicker1 = Math.sin(elapsed * 8.0) * 0.5;
        const fireFlicker2 = Math.sin(elapsed * 13.0) * 0.3;
        const fireFlicker3 = Math.sin(elapsed * 5.0) * 0.2;
        const fireIntensity = fireIntensityBase + (fireFlicker1 + fireFlicker2 + fireFlicker3) * fireIntensityVariation;
        fireLight.setIntensity(Math.max(8.0, fireIntensity)); // Minimum intensity of 8.0
        
        // Animate fire light color - subtle orange to yellow variations
        // Use slow, gentle waves for subtle color shifts
        const colorWave1 = Math.sin(elapsed * 2.0) * 0.05;
        const colorWave2 = Math.sin(elapsed * 3.5) * 0.03;
        
        // Base orange-yellow color with subtle variation
        // Orange: RGB(1.0, 0.65, 0.0), Yellow: RGB(1.0, 0.85, 0.0)
        const fireRed = 1.0; // Keep red constant
        const fireGreen = 0.35 + colorWave1 + colorWave2; // Subtle shift between orange and yellow
        const fireBlue = 0.0; // No blue for warm fire tones
        
        fireLight.setColor(vec3.fromValues(
          fireRed,
          Math.max(0.25, Math.min(0.65, fireGreen)),
          fireBlue
        ));
        
        // Animate fire light position - subtle movement
        const posWaveX = Math.sin(elapsed * 1.5) * 0.15 + Math.sin(elapsed * 2.7) * 0.08;
        const posWaveY = Math.sin(elapsed * 1.2) * 0.1 + Math.sin(elapsed * 3.1) * 0.05;
        const posWaveZ = Math.sin(elapsed * 1.8) * 0.12 + Math.sin(elapsed * 2.3) * 0.06;
        
        fireLight.setPosition(vec3.fromValues(
          0 + posWaveX,
          0.5 + posWaveY,
          0 + posWaveZ
        ));

        engine.update(); // Clears engine.framebuffer
        scene.update(dt);
        scene.render(); // Renders to engine.framebuffer (with emission)
        engine.use(); // Set screen as render location
        engine.framebuffer.render((gl, program) => {
          // Set quantize shader uniforms
          // const quantizationLevelLoc = gl.getUniformLocation(program, "uQuantizationLevel");
          // if (quantizationLevelLoc !== null) {
          //   gl.uniform1f(quantizationLevelLoc, 8.0);
          // }
          
          // const resolutionLoc = gl.getUniformLocation(program, "uResolution");
          // if (resolutionLoc !== null) {
          //   gl.uniform2f(resolutionLoc, engine.width, engine.height);
          // }
        });

        requestAnimationFrame(render);
      }

      requestAnimationFrame(render);
    };

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