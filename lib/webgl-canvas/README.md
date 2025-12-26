# @isaaclagoy/webgl-canvas

A React component for WebGL 2.0 rendering with a full-featured 3D engine.

## Installation

```bash
npm install @isaaclagoy/webgl-canvas
```

See [USAGE.md](./USAGE.md) for detailed setup instructions in a Next.js project.

## Quick Start

```tsx
import { WebGLCanvas } from '@isaaclagoy/webgl-canvas';
import { createMyScene } from './my-scene';

function App() {
  return <WebGLCanvas sceneFactory={createMyScene} />;
}
```

## Creating a Scene

A scene is created using a factory function that returns a `RenderFunction`:

```tsx
import { 
  Engine, 
  Scene, 
  Shader, 
  Mesh, 
  Material, 
  Node,
  Skybox,
  type RenderFunction 
} from '@your-org/webgl-canvas';
import { vec3, quat } from 'gl-matrix';

export async function createMyScene(
  gl: WebGL2RenderingContext
): Promise<RenderFunction> {
  // Create engine
  const engine = await Engine.create(gl);

  // Load shaders
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

  // Setup camera
  scene.camera.position = vec3.fromValues(0, 0, 5);
  scene.camera.target = vec3.fromValues(0, 0, 0);

  // Create skybox
  const skybox = new Skybox(engine, skyboxShader);
  scene.skybox = skybox;

  // Load a mesh
  const mesh = await Mesh.load(engine, "/models/my-model.obj");

  // Create material
  const material = new Material(engine);
  material.setDiffuse("/textures/diffuse.jpg");

  // Create a node
  const node = new Node(
    scene,
    vec3.fromValues(0, 0, 0), // position
    vec3.fromValues(1, 1, 1), // scale
    quat.create(), // rotation
    mesh,
    material
  );
  scene.add(node);

  // Return render function
  const render: RenderFunction = (dt: number) => {
    engine.resizeCanvas();
    
    const canvas = engine.gl.canvas as HTMLCanvasElement;
    if (canvas.width === 0 || canvas.height === 0) return;

    scene.camera.update(dt);
    scene.update(dt);
    engine.update();
    scene.render();
    engine.use();
  };

  render.cleanup = () => {
    scene.camera.destroy();
  };

  render.resize = () => {
    engine.resizeCanvas();
  };

  return render;
}
```

## API

### WebGLCanvas Component

#### Props

- `sceneFactory: (gl: WebGL2RenderingContext) => Promise<RenderFunction>` - Factory function that creates and returns a render function for the scene.

### RenderFunction

A function that takes `dt` (delta time in seconds) and renders the scene. It can have optional properties:

- `cleanup?: () => void` - Called when the component unmounts
- `resize?: () => void` - Called when the canvas container resizes

### Engine Classes

- **Engine** - Main rendering engine
- **Scene** - Container for 3D objects
- **Camera** - Viewport camera with controls
- **Mesh** - 3D model loaded from OBJ files
- **Material** - Material properties and textures
- **Node** - Scene graph node (position, rotation, scale)
- **PointLight** - Point light source
- **Skybox** - Skybox rendering
- **Terrain** - Procedural terrain generation
- **Tree** - Procedural tree generation
- **Shader** - GLSL shader compilation
- **FrameBuffer** - Framebuffer for post-processing

## Building

To build the package:

```bash
npm run build
```

This will compile TypeScript to JavaScript in the `dist` folder.

## Publishing

1. Update the version in `package.json`
2. Build the package: `npm run build`
3. Publish: `npm publish`

## License

MIT