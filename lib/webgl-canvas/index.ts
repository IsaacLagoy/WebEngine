/**
 * Main entry point for webgl-canvas package
 * 
 * @example
 * ```tsx
 * import { WebGLCanvas } from '@/lib/webgl-canvas';
 * import { createMyScene } from '@/lib/scenes'; // User-defined scene
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
};

export type SceneFactory = (gl: WebGL2RenderingContext) => Promise<RenderFunction>;

