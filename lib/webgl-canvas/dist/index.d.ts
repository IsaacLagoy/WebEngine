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
export { default as WebGLCanvas } from './WebGLCanvas';
export type RenderFunction = ((dt: number) => void) & {
    cleanup?: () => void;
    resize?: () => void;
    enableControls?: (canvas: HTMLCanvasElement) => void;
};
export type SceneFactory = (gl: WebGL2RenderingContext) => Promise<RenderFunction>;
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
export * from './math/random';
export * from './math/tangents';
export * from './math/glConstants';
//# sourceMappingURL=index.d.ts.map