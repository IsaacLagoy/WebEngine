import { Mesh } from "./mesh";
import { Material } from "./material";
import { Scene } from "./scene";
import { FrameBuffer } from "../core/frameBuffer";
import { Quad } from "../core/quad";
import { Shader } from "../core/shader";
/**
 * Engine class - the main rendering engine
 * Manages the WebGL context, scene, camera, framebuffers, and post-processing
 * This is the central hub that coordinates all rendering
 */
export declare class Engine {
    gl: WebGL2RenderingContext;
    scene?: Scene;
    meshes: Mesh[];
    materials: Material[];
    width: number;
    height: number;
    aspectRatio: number;
    resolutionScale: number;
    private lastCssWidth;
    private lastCssHeight;
    framebuffer: FrameBuffer;
    fullscreenQuad: Quad;
    quadShader: Shader;
    private uniformCache;
    constructor(gl: WebGL2RenderingContext, quadShader: Shader, fullscreenQuad: Quad, resolutionScale?: number);
    /**
     * Factory method to create an Engine instance
     * Loads shaders and initializes all systems
     * @param resolutionScale - Resolution scale factor (0.0 to 1.0) for performance optimization
     *                          If not provided, will try to read from canvas.__resolutionScale
     */
    static create(gl: WebGL2RenderingContext, resolutionScale?: number): Promise<Engine>;
    /**
     * Bind the engine framebuffer, set viewport, and clear.
     */
    beginFrame(): void;
    update(): void;
    /**
     * Unbind the engine framebuffer (returns to default framebuffer).
     */
    endFrame(): void;
    /**
     * Set screen as render location (bind to null framebuffer)
     */
    use(): void;
    /**
     * Present a texture to the screen using the given shader program.
     * The program is expected to sample uTexture at sampler2D unit 0.
     */
    present(texture: WebGLTexture, program: Shader, beforeDraw?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void): void;
    /**
     * Render a texture to a target framebuffer using a fullscreen quad and the given program.
     * The program is expected to sample uTexture at sampler2D unit 0.
     */
    blitToFramebuffer(texture: WebGLTexture, program: Shader, targetFramebuffer: FrameBuffer, beforeDraw?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void): void;
    /**
     * Resize canvas to match display size
     * Uses ResizeObserver with devicePixelContentBoxSize for best accuracy (Chrome/Edge)
     * Falls back to getBoundingClientRect * devicePixelRatio for other browsers
     * Based on: https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
     *
     * Caches CSS dimensions to prevent unnecessary resizes during scroll/transforms
     */
    resizeCanvas(): void;
    getUniformLocation(program: WebGLProgram, name: string): WebGLUniformLocation | null;
    /**
     * Set the resolution scale factor for performance optimization
     * @param scale - Resolution scale (0.1 to 1.0). Lower values improve performance but reduce quality.
     */
    setResolutionScale(scale: number): void;
    /**
     * Update aspect ratio from current width/height
     */
    private updateAspectRatio;
}
//# sourceMappingURL=engine.d.ts.map