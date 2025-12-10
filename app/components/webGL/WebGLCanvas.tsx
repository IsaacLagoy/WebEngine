"use client";

import { useRef, useEffect } from "react";
import { Program } from "./engine/core/program";
import { Scene } from "./engine/objects/scene";
import { Engine } from "./engine/objects/engine";
import { Mesh } from "./engine/objects/mesh";
import { Node } from "./engine/objects/node";
import { vec3, quat } from "gl-matrix";
import { Material } from "./engine/objects/material";
import { randomVec3 } from "./math/random";
import { FrameBuffer } from "./engine/core/frameBuffer";

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
      const program = await Program.create(
        gl,
        "/shaders/default.vert",
        "/shaders/default.frag"
      );

      const engine = await Engine.create(gl);

      const quantizeProgram = await Program.create(
        gl,
        "/shaders/quad.vert",
        "/shaders/quantize.frag"
      );

      const greyscaleProgram = await Program.create(
        gl,
        "/shaders/quad.vert",
        "/shaders/greyscale.frag"
      );

      const secondaryFramebuffer = new FrameBuffer(engine);

      let lastWidth = engine.width;
      let lastHeight = engine.height;

      const sphereMesh = await Mesh.fromObj(engine, "/models/sphere.obj");
      const cubeMesh = await Mesh.fromObj(engine, "/models/cube.obj");

      const rockMaterial = new Material(engine);
      rockMaterial.setDiffuse("/materials/rocks/rocks_Color.jpg");
      rockMaterial.setNormal("/materials/rocks/rocks_NormalGL.jpg");
      rockMaterial.setSpecular("/materials/rocks/rocks_Roughness.jpg");

      const barkMaterial = new Material(engine);
      barkMaterial.setDiffuse("/materials/bark/bark_Color.jpg");
      barkMaterial.setNormal("/materials/bark/bark_NormalGL.jpg");
      barkMaterial.setSpecular("/materials/bark/bark_Roughness.jpg");

      const plainMaterial = new Material(engine);

      const scene = new Scene(engine);
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

        if (engine.width !== lastWidth || engine.height !== lastHeight) {
          secondaryFramebuffer.resize();
          lastWidth = engine.width;
          lastHeight = engine.height;
        }

        const dt = Math.min((time - lastTime) / 1000, 0.1);
        lastTime = time;

        for (const node of nodes) node.update(dt);

        // Set framebuffer as render location
        engine.framebuffer.use();
        engine.gl.viewport(0, 0, engine.width, engine.height);
        engine.gl.clear(engine.gl.COLOR_BUFFER_BIT | engine.gl.DEPTH_BUFFER_BIT);

        // Render scene to framebuffer using the scene's shader programs
        scene.render(program.program);

        // Unbind framebuffer so we can read from its texture
        engine.framebuffer.unbind();

        // Apply greyscale to framebuffer, output to secondaryFramebuffer
        if (engine.framebuffer.colorTexture && secondaryFramebuffer.colorTexture) {
          engine.blitToFramebuffer(
            engine.framebuffer.colorTexture,
            greyscaleProgram,
            secondaryFramebuffer
          );
        }

        // Set screen as render location
        engine.use();

        // Render framebuffer to screen using quantize program
        if (secondaryFramebuffer.colorTexture) {
          secondaryFramebuffer.render(
            quantizeProgram,
            (glCtx, prog) => {
              const quantizeLoc = glCtx.getUniformLocation(prog, "uQuantizationLevel");
              if (quantizeLoc) glCtx.uniform1f(quantizeLoc, 8.0);
              const resolutionLoc = glCtx.getUniformLocation(prog, "uResolution");
              if (resolutionLoc) glCtx.uniform2f(resolutionLoc, engine.width, engine.height);
            }
          );
        }

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