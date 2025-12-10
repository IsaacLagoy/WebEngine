import { Engine } from "../objects/engine";

/**
 * FrameBuffer class - represents an off-screen rendering target
 * 
 * Framebuffers allow you to render to a texture instead of directly to the screen.
 * This is essential for post-processing effects - you render the scene to a texture,
 * then apply effects to that texture before displaying it.
 * 
 * Components:
 * - Color texture: stores the rendered image (RGBA pixels)
 * - Depth buffer: stores depth information for proper occlusion
 */
export class FrameBuffer {
    engine: Engine;
    framebuffer: WebGLFramebuffer | null = null;
    colorTexture: WebGLTexture | null = null;  // The rendered image
    depthBuffer: WebGLRenderbuffer | null = null;  // Depth information

    constructor(engine: Engine) {
        this.engine = engine;
        this.init();
    }

    gl(): WebGL2RenderingContext {
        return this.engine.gl;
    }

    bind() {
        this.gl().bindFramebuffer(this.gl().FRAMEBUFFER, this.framebuffer);
    }

    unbind() {
        this.gl().bindFramebuffer(this.gl().FRAMEBUFFER, null);
    }

    /**
     * Set this framebuffer as the render target
     */
    use() {
        this.bind();
    }

    /**
     * Render this framebuffer's texture to the screen using the given shader program
     */
    render(program: any, beforeDraw?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void) {
        if (!this.colorTexture) return;
        
        const gl = this.gl();
        const canvas = gl.canvas as HTMLCanvasElement;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Bind to screen (null framebuffer)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvasWidth, canvasHeight);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.DEPTH_TEST);

        program.use();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
        const texLoc = gl.getUniformLocation(program.program, "uTexture");
        if (texLoc !== null) {
            gl.uniform1i(texLoc, 0);
        }

        if (beforeDraw) {
            beforeDraw(gl, program.program);
        }

        this.engine.fullscreenQuad.draw(program.program);
        gl.enable(gl.DEPTH_TEST);
    }

    resize() {
        this.destroy();
        this.init();
    }

    destroy() {
        const gl = this.gl();
        if (this.colorTexture) gl.deleteTexture(this.colorTexture);
        if (this.depthBuffer) gl.deleteRenderbuffer(this.depthBuffer);
        if (this.framebuffer) gl.deleteFramebuffer(this.framebuffer);
        this.colorTexture = null;
        this.depthBuffer = null;
        this.framebuffer = null;
    }

    /**
     * Initializes the framebuffer with color texture and depth buffer
     * This sets up an off-screen rendering target
     */
    init() {
        const gl = this.gl();

        // Create framebuffer object (the container)
        this.framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

        // Create color texture - this is where the rendered image will be stored
        this.colorTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
        // Allocate texture memory (RGBA = Red, Green, Blue, Alpha channels)
        // null = don't upload data yet, we'll render into it
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.engine.width, this.engine.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        // Set texture filtering (how pixels are sampled when scaled)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);  // When minified
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);  // When magnified
        // Clamp to edge prevents texture wrapping (no repeating)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        // Attach color texture to framebuffer (this is where color data goes)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTexture, 0);

        // Create depth buffer - stores depth information for proper 3D rendering
        // Depth buffer ensures closer objects occlude farther ones
        this.depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
        // Prefer 24-bit depth for better precision; fall back if unsupported
        const depthFormat = gl.DEPTH_COMPONENT24 || gl.DEPTH_COMPONENT16;
        gl.renderbufferStorage(gl.RENDERBUFFER, depthFormat, this.engine.width, this.engine.height);
        // Attach depth buffer to framebuffer
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);

        // Check framebuffer completeness
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            const statusNames: { [key: number]: string } = {
                [gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT]: "FRAMEBUFFER_INCOMPLETE_ATTACHMENT",
                [gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT]: "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT",
                [gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS]: "FRAMEBUFFER_INCOMPLETE_DIMENSIONS",
                [gl.FRAMEBUFFER_UNSUPPORTED]: "FRAMEBUFFER_UNSUPPORTED"
            };
            throw new Error(`Framebuffer incomplete: ${statusNames[status] || status}`);
        }

        // unbind
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}