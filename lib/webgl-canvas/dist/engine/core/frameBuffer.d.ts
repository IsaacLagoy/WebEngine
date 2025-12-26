import { Engine } from "../objects/engine";
import { Shader } from "./shader";
import { vec4 } from "gl-matrix";
/**
 * FrameBuffer class - represents an off-screen rendering target
 *
 * Framebuffers allow you to render to a texture instead of directly to the screen.
 * This is essential for post-processing effects - you render the scene to a texture,
 * then apply effects to that texture before displaying it.
 *
 * Components:
 * - Color texture: stores the rendered image (RGBA pixels)
 * - Depth texture: stores depth information for proper occlusion and post-processing
 */
export declare class FrameBuffer {
    engine: Engine;
    framebuffer: WebGLFramebuffer | null;
    colorTexture: WebGLTexture | null;
    depthTexture: WebGLTexture | null;
    program: Shader | null;
    lastWidth: number;
    lastHeight: number;
    constructor(engine: Engine);
    gl(): WebGL2RenderingContext;
    bind(): void;
    unbind(): void;
    /**
     * Set this framebuffer as the render target
     */
    use(): void;
    /**
     * Clear the framebuffer with the specified color
     * @param color - Optional vec4 color [r, g, b, a]. Defaults to black [0, 0, 0, 1]
     */
    clear(color?: vec4): void;
    /**
     * Render this framebuffer's texture to the screen using the given shader program
     * Matches C++ Frame::render() - saves/restores viewport
     */
    render(beforeDraw?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void): void;
    resize(): void;
    destroy(): void;
    /**
     * Initializes the framebuffer with color texture and depth buffer
     * This sets up an off-screen rendering target
     */
    init(): void;
}
//# sourceMappingURL=frameBuffer.d.ts.map