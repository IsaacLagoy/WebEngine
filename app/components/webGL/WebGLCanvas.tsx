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

function getRandomPosition(rangeX: number, rangeY: number, minZ: number, maxZ: number) {
  const x = (Math.random() - 0.5) * rangeX;
  const y = (Math.random() - 0.5) * rangeY;
  const z = minZ + Math.random() * (maxZ - minZ);
  return vec3.fromValues(x, y, z);
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
        "/shaders/quantize.frag"
      );

      // Load all available meshes from public/models so we can pick randomly
      const modelPaths = [
        "/models/art_table.obj",
        "/models/bass.obj",
        "/models/battery.obj",
        "/models/brick.obj",
        "/models/cube.obj",
        "/models/flounder.obj",
        "/models/herring.obj",
        "/models/john.obj",
        "/models/key.obj",
        "/models/lamp.obj",
        "/models/mug.obj",
        "/models/office_chair.obj",
        "/models/quad.obj",
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
      // rockMaterial.roughnessMultiplier = 0.1;

      const barkMaterial = new Material(engine);
      barkMaterial.setDiffuse("/materials/bark/bark_Color.jpg");
      barkMaterial.setNormal("/materials/bark/bark_NormalGL.jpg");
      barkMaterial.setSpecular("/materials/bark/bark_Roughness.jpg");

      const plainMaterial = new Material(engine);
      plainMaterial.roughnessMultiplier = 1.0;
      plainMaterial.metallic = 0.5;
      // plainMaterial.emission = [255, 1, 1];
      
      // Match C++: Scene constructor takes shader
      const scene = new Scene(engine, program);
      scene.camera.setPosition(vec3.fromValues(0, 0, 50));
      
      // Assign quad program to engine framebuffer for final output
      engine.framebuffer.program = quadProgram;
      
      const nodes: Node[] = [];

      for (let i = 0; i < 1000; i++) {
        const mesh = meshes[Math.floor(Math.random() * meshes.length)];

        const node = new Node(
          scene,
          getRandomPosition(50, 50, -50, 50),
          vec3.fromValues(0.5, 0.5, 0.5),
          quat.create(),
          mesh,
          i % 3 === 0 ? rockMaterial : i % 3 === 1 ? plainMaterial : barkMaterial
        );

        node.angularVelocity = randomVec3(
          vec3.fromValues(-2, -2, -2),
          vec3.fromValues(2, 2, 2)
        );

        nodes.push(node);
        scene.add(node);
      }

      let lastTime = performance.now();

      function render(time: number) {
        engine.resizeCanvas();
        const dt = Math.min((time - lastTime) / 1000, 0.1);
        lastTime = time;

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