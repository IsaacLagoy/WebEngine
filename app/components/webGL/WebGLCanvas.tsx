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

function getRandomPositionOnPlane(rangeX: number, rangeZ: number, yHeight: number) {
  const x = (Math.random() - 0.5) * rangeX;
  const z = (Math.random() - 0.5) * rangeZ;
  return vec3.fromValues(x, yHeight, z);
}

export default function WebGLCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

      // Ground plane material - make it visible for debugging
      const groundMaterial = new Material(engine);
      groundMaterial.setDiffuse("/materials/rocks/rocks_Color.jpg");
      groundMaterial.setNormal("/materials/rocks/rocks_NormalGL.jpg");
      groundMaterial.setSpecular("/materials/rocks/rocks_Roughness.jpg");
      groundMaterial.metallic = 0.0;
      groundMaterial.roughnessMultiplier = 1.5;
      // Make material color brighter to help see it (0-255 range)
      groundMaterial.color = [255, 255, 255]; // White
      // Add slight emission to make it more visible
      groundMaterial.emission = [20, 20, 20]; // Slight glow
      
      // Match C++: Scene constructor takes shader
      const scene = new Scene(engine, program);
      scene.camera.setPosition(vec3.fromValues(0, 30, 50));
      
      // Add a point light at the center of the screen
      const centerLight = new PointLight(
        vec3.fromValues(0, 5, 0),  // Position: center, slightly above ground
        vec3.fromValues(1.0, 0.0, 0.0),  // Red light
        10.0,  // Intensity - much higher for visibility
        1.0,  // Constant attenuation
        0.09,  // Linear attenuation
        0.032  // Quadratic attenuation
      );
      scene.addPointLight(centerLight);
      
      // Assign quad program to engine framebuffer for final output
      engine.framebuffer.program = quadProgram;
      
      const nodes: Node[] = [];

      // Create a large ground plane using a flattened cube
      // Find the cube mesh by index
      const cubeMeshIndex = modelPaths.findIndex(path => path === "/models/cube.obj");
      if (cubeMeshIndex !== -1) {
        const cubeMesh = meshes[cubeMeshIndex];
        const groundPlane = new Node(
          scene,
          vec3.fromValues(0, -3, 0), // Position at origin
          vec3.fromValues(20, 0.25, 20), // Scale to create a large flat plane (100x100 units, very thin)
          quat.create(),
          cubeMesh,
          groundMaterial
        );
        // Mark this as the ground plane so we can render it with culling disabled
        (groundPlane as any).isGroundPlane = true;
        nodes.push(groundPlane);
        scene.add(groundPlane);
      } else {
        console.warn("Could not find cube.obj mesh for ground plane");
      }

      // Create objects on the plane
      const numObjects = 100;
      const planeSize = 40; // Objects will be placed within 40 units from center
      
      // Filter out cube mesh for objects (we only want 3D objects, not the ground plane)
      const objectMeshes = meshes.filter((_, index) => modelPaths[index] !== "/models/cube.obj");
      
      for (let i = 0; i < numObjects; i++) {
        const mesh = objectMeshes[Math.floor(Math.random() * objectMeshes.length)];

        // Random scale between 0.3 and 1.0
        const scale = 0.3 + Math.random() * 0.7;
        const scaleVec = vec3.fromValues(scale, scale, scale);
        
        // Position on plane - use a fixed y offset to ensure objects sit on the plane
        // Most objects are roughly centered, so scale * 0.5 should work, but add a bit more for safety
        const yHeight = scale * 0.6;
        const position = getRandomPositionOnPlane(planeSize, planeSize, yHeight);

        const node = new Node(
          scene,
          position,
          scaleVec,
          quat.create(),
          mesh,
          i % 3 === 0 ? rockMaterial : i % 3 === 1 ? plainMaterial : barkMaterial
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

      let lastTime = performance.now();
      const startTime = performance.now();

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
        
        // Animate point light
        const elapsed = (time - startTime) / 1000; // Time in seconds
        
        // Animate position - circular motion in XZ plane, slight vertical movement
        const radius = 15.0;
        const height = 8.0;
        const speed = 0.5; // Rotation speed
        centerLight.setPosition(vec3.fromValues(
          Math.cos(elapsed * speed) * radius,
          height + Math.sin(elapsed * speed * 0.7) * 3.0, // Vertical bobbing
          Math.sin(elapsed * speed) * radius
        ));
        
        // Animate color - warm colors (orange/red/yellow)
        // Cycle through warm color palette
        const colorPhase = elapsed * 0.8; // Color change speed
        const r = 1.0; // Always full red component for warm colors
        const g = 0.4 + Math.sin(colorPhase) * 0.3; // Vary green: 0.4-0.7
        const b = Math.max(0.0, Math.sin(colorPhase * 0.7) * 0.2); // Vary blue: 0.0-0.2
        centerLight.setColor(vec3.fromValues(r, g, b));
        
        // Animate intensity - flicker like a fire
        const intensityBase = 16.0;
        const intensityVariation = 8.0;
        // Use multiple sine waves for more natural flicker
        const flicker1 = Math.sin(elapsed * 8.0) * 0.5;
        const flicker2 = Math.sin(elapsed * 13.0) * 0.3;
        const flicker3 = Math.sin(elapsed * 5.0) * 0.2;
        const intensity = intensityBase + (flicker1 + flicker2 + flicker3) * intensityVariation;
        centerLight.setIntensity(Math.max(5.0, intensity)); // Minimum intensity of 5.0

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