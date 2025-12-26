import { Scene } from "@/lib/webgl-canvas/engine/objects/scene";
import { Engine } from "@/lib/webgl-canvas/engine/objects/engine";
import { Shader } from "@/lib/webgl-canvas/engine/core/shader";
import { Mesh } from "@/lib/webgl-canvas/engine/objects/mesh";
import { Material } from "@/lib/webgl-canvas/engine/objects/material";
import { Node } from "@/lib/webgl-canvas/engine/objects/node";
import { Skybox } from "@/lib/webgl-canvas/engine/objects/skybox";
import { vec3, quat } from "gl-matrix";
import type { RenderFunction } from "@/lib/webgl-canvas";

/**
 * Factory function to create a cube scene with a spinning cube
 * Takes WebGL context and returns a render function that handles all rendering
 */
export async function createCubeScene(gl: WebGL2RenderingContext): Promise<RenderFunction> {
  // Create engine
  const engine = await Engine.create(gl);
  
  // Ensure canvas is properly sized and aspect ratio is correct
  engine.resizeCanvas();

  // Load quad shader for post-processing
  const quadProgram = await Shader.create(
    gl,
    "/shaders/quad.vert",
    "/shaders/quantizeBucket.frag"
  );

  // Assign quad program to engine framebuffer for final output
  engine.framebuffer.program = quadProgram;

  // Load scene shader
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

  // Create scene
  const scene = new Scene(engine, program);
  engine.scene = scene;

  // Set camera to look at origin
  scene.camera.setPosition(vec3.fromValues(0, 0, 5));
  scene.camera.target = vec3.fromValues(0, 0, 0);
  scene.camera.updateMatrices();

  // Load multiple different meshes
  const meshPaths = [
    "/models/cube.obj",
    "/models/sphere.obj",
    "/models/log.obj",
    "/models/tree.obj",
    "/models/mug.obj",
    "/models/lamp.obj",
    "/models/key.obj",
    "/models/battery.obj",
    "/models/brick.obj",
    "/models/john.obj",
    "/models/bass.obj",
    "/models/flounder.obj",
    "/models/herring.obj",
    "/models/squid.obj",
    "/models/tilapia.obj",
    "/models/tuna.obj",
    "/models/Stone1.obj",
    "/models/Stone2.obj",
    "/models/Stone3.obj",
    "/models/Stone4.obj",
    "/models/Stone5.obj",
  ];

  // Load all meshes in parallel
  const meshes = await Promise.all(
    meshPaths.map(path => Mesh.fromObj(engine, path))
  );

  // Load cube mesh for skybox
  const cubeMesh = await Mesh.fromObj(engine, "/models/cube.obj");

  // Create skybox
  const skybox = new Skybox(engine, scene, cubeMesh, skyboxShader);
  scene.skybox = skybox;
  scene.setCycleTime(0.5); // Noon

  // Create material
  const material = new Material(engine);
  material.setDiffuse("/materials/rocks/rocks_Color.jpg"); // Reuse existing texture
  material.roughnessMultiplier = 0.3;
  material.metallic = 0.8;

  // Create multiple nodes at the same position, each with a random mesh
  const numNodes = 50; // Number of nodes to create
  for (let i = 0; i < numNodes; i++) {
    // Randomly select a mesh
    const randomMesh = meshes[Math.floor(Math.random() * meshes.length)];
    
    const node = new Node(
      scene,
      vec3.fromValues(0, 0, 0),
      vec3.fromValues(1, 1, 1),
      quat.create(),
      randomMesh,
      material
    );
    node.angularVelocity = vec3.fromValues(0, 1, 0);
    scene.add(node);
  }

  // Create and return render function
  const renderFn = (dt: number) => {
    // Don't resize canvas on every frame - only resize when needed via resize() method
    // This prevents layout thrashing during scroll
    const canvas = engine.gl.canvas as HTMLCanvasElement;
    if (canvas.width === 0 || canvas.height === 0 || engine.width === 0 || engine.height === 0) {
      return;
    }

    // Update scene (includes camera update with input handling)
    scene.update(dt);

    // Render
    engine.update();
    scene.render();
    engine.use();
    engine.framebuffer.render((gl, program) => {
      const quantizationLevelLoc = gl.getUniformLocation(program, "uQuantizationLevel");
      if (quantizationLevelLoc !== null) {
        gl.uniform1f(quantizationLevelLoc, 8.0);
      }

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
      scene.enableCameraControls(canvas);
    }
  }) as RenderFunction;

  return render;
}

