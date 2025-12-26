# Usage Guide

## Installation

In your Next.js project, install the package:

```bash
npm install @isaaclagoy/webgl-canvas
```

Or with yarn:

```bash
yarn add @isaaclagoy/webgl-canvas
```

Or with pnpm:

```bash
pnpm add @isaaclagoy/webgl-canvas
```

## Dependencies

The package also requires:
- `gl-matrix` (installed automatically)
- `webgl-obj-loader` (installed automatically)
- `react` >= 18.0.0 (you should already have this in Next.js)
- `react-dom` >= 18.0.0 (you should already have this in Next.js)

## Basic Setup

### 1. Create a Scene Factory

Create a file `lib/scenes/myScene.ts` (or wherever you want):

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
} from '@isaaclagoy/webgl-canvas';
import { vec3, quat } from 'gl-matrix';

export async function createMyScene(
  gl: WebGL2RenderingContext
): Promise<RenderFunction> {
  // Create engine
  const engine = await Engine.create(gl);

  // Load shaders (paths relative to /public)
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

  // Load a mesh (path relative to /public)
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

### 2. Create a Scene Component (Client Component)

Create `app/components/MyScene.tsx`:

```tsx
"use client";

import { WebGLCanvas } from '@isaaclagoy/webgl-canvas';
import { createMyScene } from '@/lib/scenes/myScene';

export default function MyScene() {
  return <WebGLCanvas sceneFactory={createMyScene} />;
}
```

### 3. Use in Your Layout or Page

In `app/layout.tsx` or any page:

```tsx
import MyScene from './components/MyScene';

export default function Layout({ children }) {
  return (
    <html>
      <body>
        <div className="fixed inset-0 z-0">
          <MyScene />
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
```

## Important Notes

### Shaders and Assets

The package expects shaders and models to be in your `/public` directory:

```
public/
  shaders/
    default.vert
    default.frag
    skybox.vert
    skybox.frag
  models/
    my-model.obj
  textures/
    diffuse.jpg
```

Paths in your scene factory should be relative to `/public` (e.g., `/shaders/default.vert`).

### Next.js Client Components

The `WebGLCanvas` component must be used in a Client Component (marked with `"use client"`). Since scene factories are async functions that can't be passed directly from Server Components, wrap the `WebGLCanvas` in a Client Component like the example above.

### TypeScript

The package includes TypeScript definitions, so you'll get full type checking and IntelliSense.

## Example Project Structure

```
my-next-app/
  app/
    layout.tsx
    page.tsx
    components/
      MyScene.tsx          # Client component wrapper
  lib/
    scenes/
      myScene.ts           # Scene factory
  public/
    shaders/
      default.vert
      default.frag
      skybox.vert
      skybox.frag
    models/
      my-model.obj
    textures/
      diffuse.jpg
```

## Next Steps

- Check out the [README.md](./README.md) for more detailed API documentation
- Look at the source code in your main project's `lib/scenes/` for more examples
- Customize your scene with different meshes, materials, and lighting

