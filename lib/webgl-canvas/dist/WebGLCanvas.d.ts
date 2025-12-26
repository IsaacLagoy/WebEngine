import type { RenderFunction } from "./index";
interface WebGLCanvasProps {
    sceneFactory: (gl: WebGL2RenderingContext) => Promise<RenderFunction>;
    /**
     * Resolution scale factor (0.0 to 1.0)
     * Renders at a lower resolution and scales up to fit the screen
     * Lower values improve performance but reduce quality
     * Default: 1.0 (full resolution)
     */
    resolutionScale?: number;
}
export default function WebGLCanvas({ sceneFactory, resolutionScale }: WebGLCanvasProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=WebGLCanvas.d.ts.map