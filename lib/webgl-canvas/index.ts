/**
 * Main entry point for webgl-canvas package
 * 
 * @example
 * ```tsx
 * import { WebGLCanvas } from '@isaaclagoy/webgl-canvas';
 * import { createMyScene } from './scenes'; // User-defined scene
 * 
 * function App() {
 *   return <WebGLCanvas sceneFactory={createMyScene} />;
 * }
 * ```
 */

// Export main component
export { default as WebGLCanvas } from './WebGLCanvas';

// Export RenderFunction type for users to use in their scenes
export type RenderFunction = ((dt: number) => void) & {
  cleanup?: () => void;
  resize?: () => void; // Optional resize method to handle canvas resizing
  enableControls?: (canvas: HTMLCanvasElement) => void; // Optional method to enable camera controls
};

export type SceneFactory = (gl: WebGL2RenderingContext) => Promise<RenderFunction>;

// Export engine classes and types that users need to create scenes
export { Engine } from './engine/objects/engine';
export { Scene } from './engine/objects/scene';
export { Camera } from './engine/core/camera';
export { Shader } from './engine/core/shader';
export { Mesh } from './engine/objects/mesh';
export { Material } from './engine/objects/material';
export { Node } from './engine/objects/node';
export { PointLight } from './engine/objects/pointLight';
export { Skybox } from './engine/objects/skybox';
export { Terrain } from './engine/objects/terrain';
export { Tree, type TreeSpawnConfig } from './engine/objects/tree';
export { FrameBuffer } from './engine/core/frameBuffer';
export { Quad } from './engine/core/quad';

// Export math utilities
export * from './math/random';
export * from './math/tangents';
export * from './math/glConstants';

