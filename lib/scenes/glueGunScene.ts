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
 * Factory function to create a glue gun scene with a spinning glue gun
 * Takes WebGL context and returns a render function that handles all rendering
 */
export async function createGlueGunScene(gl: WebGL2RenderingContext): Promise<RenderFunction> {
  // Create engine
  const engine = await Engine.create(gl);

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

  // Load meshes
  const glueGunMesh = await Mesh.fromObj(engine, "/models/glue_gun.obj");
  const cubeMesh = await Mesh.fromObj(engine, "/models/cube.obj");

  // Create skybox
  const skybox = new Skybox(engine, scene, cubeMesh, skyboxShader);
  scene.skybox = skybox;
  scene.setCycleTime(0.5); // Noon

  // Create material
  const material = new Material(engine);
  material.setDiffuse("/materials/rocks/rocks_Color.jpg"); // Reuse existing texture
  material.roughnessMultiplier = 0.5;
  material.metallic = 0.0;

  // Create glue gun node
  const glueGunNode = new Node(
    scene,
    vec3.fromValues(0, 0, 0),
    vec3.fromValues(1, 1, 1),
    quat.create(),
    glueGunMesh,
    material
  );
  scene.add(glueGunNode);

  let rotationAngle = 0;

  // Create and return render function
  const render: RenderFunction = (dt: number) => {
    // Resize canvas
    engine.resizeCanvas();

    const canvas = engine.gl.canvas as HTMLCanvasElement;
    if (canvas.width === 0 || canvas.height === 0 || engine.width === 0 || engine.height === 0) {
      return;
    }

    // Update camera
    scene.camera.update(dt);

    // Rotate glue gun around Y axis (slowly)
    rotationAngle += dt * 0.5; // Slow rotation (0.5 radians per second)
    const rotation = quat.create();
    quat.fromEuler(rotation, 0, (rotationAngle * 180) / Math.PI, 0);
    glueGunNode.rotation = rotation;

    // Update scene
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

  // Add cleanup function
  render.cleanup = () => {
    if (scene.camera) {
      scene.camera.destroy();
    }
  };

  return render;
}

