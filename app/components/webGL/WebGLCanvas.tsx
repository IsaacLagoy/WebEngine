"use client";

import { useRef, useEffect } from "react";
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

      const quantizeProgram = await Shader.create(
        gl,
        "/shaders/quad.vert",
        "/shaders/quad.frag"
      );

      const sphereMesh = await Mesh.fromObj(engine, "/models/sphere.obj");
      const cubeMesh = await Mesh.fromObj(engine, "/models/cube.obj");

      const rockMaterial = new Material(engine);
      rockMaterial.setDiffuse("/materials/rocks/rocks_Color.jpg");
      rockMaterial.setNormal("/materials/rocks/rocks_NormalGL.jpg");
      rockMaterial.setSpecular("/materials/rocks/rocks_Roughness.jpg");
      rockMaterial.roughnessMultiplier = 0.1;

      const barkMaterial = new Material(engine);
      barkMaterial.setDiffuse("/materials/bark/bark_Color.jpg");
      barkMaterial.setNormal("/materials/bark/bark_NormalGL.jpg");
      barkMaterial.setSpecular("/materials/bark/bark_Roughness.jpg");

      const plainMaterial = new Material(engine);
      plainMaterial.roughnessMultiplier = 0.1;
      
      // Match C++: Scene constructor takes shader
      const scene = new Scene(engine, program);
      scene.camera.setPosition(vec3.fromValues(0, 0, 50));
      
      // Assign quantize program to engine framebuffer for final output
      engine.framebuffer.program = quantizeProgram;
      
      const nodes: Node[] = [];

      for (let i = 0; i < 1000; i++) {
        const node = new Node(
          scene,
          getRandomPosition(50, 50, -50, 50),
          vec3.fromValues(0.5, 0.5, 0.5),
          quat.create(),
          i % 2 === 0 ? cubeMesh : sphereMesh,
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
        scene.render(); // Renders to engine.framebuffer
        engine.use(); // Set screen as render location
        engine.framebuffer.render(
          // (glCtx, prog) => {
          //   const quantizeLoc = glCtx.getUniformLocation(prog, "uQuantizationLevel");
          //   if (quantizeLoc) glCtx.uniform1f(quantizeLoc, 8.0);
          //   const resolutionLoc = glCtx.getUniformLocation(prog, "uResolution");
          //   if (resolutionLoc) glCtx.uniform2f(resolutionLoc, engine.width, engine.height);
          //   const aspectRatioLoc = glCtx.getUniformLocation(prog, "uAspectRatio");
          //   if (aspectRatioLoc) glCtx.uniform1f(aspectRatioLoc, engine.aspectRatio);
          // }
        );

        requestAnimationFrame(render);
      }

      requestAnimationFrame(render);
    };

    init().catch(console.error);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}