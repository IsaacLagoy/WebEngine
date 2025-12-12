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
      scene.camera.setPosition(vec3.fromValues(0, 30, 50));
      
      // Add a warm point light (red/orange/yellow)
      const warmLight = new PointLight(
        vec3.fromValues(0, 5, 0),  // Position: center, slightly above ground
        vec3.fromValues(1.0, 0.0, 0.0),  // Red light
        10.0,  // Intensity - much higher for visibility
        1.0,  // Constant attenuation
        0.09,  // Linear attenuation
        0.032  // Quadratic attenuation
      );
      scene.addPointLight(warmLight);
      
      // Add a cool point light (blue/cyan) that orbits opposite to the warm light
      const coolLight = new PointLight(
        vec3.fromValues(0, 5, 0),  // Initial position: center, slightly above ground
        vec3.fromValues(0.0, 0.5, 1.0),  // Cool blue/cyan light
        10.0,  // Intensity - same as warm light
        1.0,  // Constant attenuation
        0.09,  // Linear attenuation
        0.032  // Quadratic attenuation
      );
      scene.addPointLight(coolLight);
      
      // Assign quad program to engine framebuffer for final output
      engine.framebuffer.program = quadProgram;
      
      const nodes: Node[] = [];

      // Create objects in 3D space - using many instances of the same shape to test instancing
      const numObjects = 200; // Large number to really test instancing performance
      const spawnRange = 60; // Range for random 3D positioning
      
      // Use sphere mesh for all instances (same shape = perfect for instancing test)
      const sphereMeshIndex = modelPaths.findIndex(path => path === "/models/sphere.obj");
      if (sphereMeshIndex === -1) {
        console.warn("Could not find sphere.obj mesh for instancing test");
      } else {
        const sphereMesh = meshes[sphereMeshIndex];
        
        // Create many instances of the same sphere with different materials
        // This will create 3 instance groups (one per material) with many instances each
        for (let i = 0; i < numObjects; i++) {
          // Random scale between 0.2 and 0.8
          const scale = 0.2 + Math.random() * 0.6;
          const scaleVec = vec3.fromValues(scale, scale, scale);
          
          // Random 3D position (no plane constraint)
          const position = getRandomPosition3D(spawnRange);

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
        
        // Calculate and update framerate
        frameCount++;
        const fpsElapsed = time - fpsLastTime;
        if (fpsElapsed >= fpsUpdateInterval && fpsRef.current) {
          const fps = Math.round((frameCount * 1000) / fpsElapsed);
          fpsRef.current.textContent = `FPS: ${fps}`;
          frameCount = 0;
          fpsLastTime = time;
        }
        
        // Animate point lights
        const elapsed = (time - startTime) / 1000; // Time in seconds
        
        // Animate warm light position - circular motion in XZ plane, slight vertical movement
        const radius = 15.0;
        const height = 8.0;
        const speed = 0.5; // Rotation speed
        const angle = elapsed * speed;
        warmLight.setPosition(vec3.fromValues(
          Math.cos(angle) * radius,
          height + Math.sin(angle * 0.7) * 3.0, // Vertical bobbing
          Math.sin(angle) * radius
        ));
        
        // Animate cool light position - same direction but offset by π (180 degrees)
        const coolAngle = angle + Math.PI;
        coolLight.setPosition(vec3.fromValues(
          Math.cos(coolAngle) * radius,
          height + Math.sin(coolAngle * 0.7) * 3.0, // Vertical bobbing
          Math.sin(coolAngle) * radius
        ));
        
        // Animate warm light color - warm colors (orange/red/yellow)
        // Cycle through warm color palette
        const warmColorPhase = elapsed * 0.8; // Color change speed
        const warmR = 1.0; // Always full red component for warm colors
        const warmG = 0.4 + Math.sin(warmColorPhase) * 0.3; // Vary green: 0.4-0.7
        const warmB = Math.max(0.0, Math.sin(warmColorPhase * 0.7) * 0.2); // Vary blue: 0.0-0.2
        warmLight.setColor(vec3.fromValues(warmR, warmG, warmB));
        
        // Animate cool light color - cool colors (blue/cyan)
        // Cycle through cool color palette
        const coolColorPhase = elapsed * 0.8; // Color change speed
        const coolR = Math.max(0.0, Math.sin(coolColorPhase * 0.7) * 0.2); // Vary red: 0.0-0.2
        const coolG = 0.4 + Math.sin(coolColorPhase) * 0.3; // Vary green: 0.4-0.7
        const coolB = 1.0; // Always full blue component for cool colors
        coolLight.setColor(vec3.fromValues(coolR, coolG, coolB));
        
        // Animate warm light intensity - flicker like a fire
        const warmIntensityBase = 16.0;
        const warmIntensityVariation = 8.0;
        // Use multiple sine waves for more natural flicker
        const warmFlicker1 = Math.sin(elapsed * 8.0) * 0.5;
        const warmFlicker2 = Math.sin(elapsed * 13.0) * 0.3;
        const warmFlicker3 = Math.sin(elapsed * 5.0) * 0.2;
        const warmIntensity = warmIntensityBase + (warmFlicker1 + warmFlicker2 + warmFlicker3) * warmIntensityVariation;
        warmLight.setIntensity(Math.max(5.0, warmIntensity)); // Minimum intensity of 5.0
        
        // Animate cool light intensity - similar flicker but slightly out of phase
        const coolIntensityBase = 16.0;
        const coolIntensityVariation = 8.0;
        // Use multiple sine waves with different phases for variation
        const coolFlicker1 = Math.sin(elapsed * 8.0 + Math.PI) * 0.5; // Out of phase
        const coolFlicker2 = Math.sin(elapsed * 13.0 + Math.PI * 0.5) * 0.3;
        const coolFlicker3 = Math.sin(elapsed * 5.0 + Math.PI) * 0.2;
        const coolIntensity = coolIntensityBase + (coolFlicker1 + coolFlicker2 + coolFlicker3) * coolIntensityVariation;
        coolLight.setIntensity(Math.max(5.0, coolIntensity)); // Minimum intensity of 5.0

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