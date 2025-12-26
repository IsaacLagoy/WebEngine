"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameBuffer = void 0;
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
class FrameBuffer {
    constructor(engine) {
        this.framebuffer = null;
        this.colorTexture = null; // The rendered image
        this.depthTexture = null; // Depth information (as texture for sampling)
        this.program = null;
        this.lastWidth = 0;
        this.lastHeight = 0;
        this.engine = engine;
        this.lastWidth = engine.width;
        this.lastHeight = engine.height;
        this.init();
    }
    gl() {
        return this.engine.gl;
    }
    bind() {
        const gl = this.gl();
        // Match C++ FBO: bind() sets viewport automatically
        gl.viewport(0, 0, this.engine.width, this.engine.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        // Ensure depth testing is enabled for 3D rendering
        gl.enable(gl.DEPTH_TEST);
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
     * Clear the framebuffer with the specified color
     * @param color - Optional vec4 color [r, g, b, a]. Defaults to black [0, 0, 0, 1]
     */
    clear(color) {
        const gl = this.gl();
        this.bind();
        gl.viewport(0, 0, this.engine.width, this.engine.height);
        if (color) {
            gl.clearColor(color[0], color[1], color[2], color[3]);
        }
        else {
            gl.clearColor(0.0, 0.0, 0.0, 1.0); // Default: black
        }
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
    /**
     * Render this framebuffer's texture to the screen using the given shader program
     * Matches C++ Frame::render() - saves/restores viewport
     */
    render(beforeDraw) {
        if (!this.colorTexture || !this.program)
            return;
        // Check if engine size has changed and resize if needed
        if (this.engine.width !== this.lastWidth || this.engine.height !== this.lastHeight) {
            this.lastWidth = this.engine.width;
            this.lastHeight = this.engine.height;
            this.resize();
            if (!this.colorTexture)
                return; // Resize might have failed
        }
        const gl = this.gl();
        // Save current viewport (match C++ Frame::render())
        const viewport = gl.getParameter(gl.VIEWPORT);
        const canvas = gl.canvas;
        // Use CSS display size for final viewport (not internal render resolution)
        // This ensures the scaled framebuffer is stretched to fill the display
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = Math.round(canvas.clientWidth * dpr);
        const displayHeight = Math.round(canvas.clientHeight * dpr);
        // Bind to screen (null framebuffer) - ensure we're rendering to screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, displayWidth, displayHeight);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.DEPTH_TEST);
        if (!this.program) {
            // Restore viewport before returning
            gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);
            return;
        }
        this.program.use();
        // Use shader's bindTexture method (matches C++ shader->bind())
        this.program.bindTexture("uTexture", this.colorTexture, 0);
        // Also bind depth texture if available (for post-processing effects like edge detection)
        if (this.depthTexture) {
            this.program.bindTexture("uDepthTexture", this.depthTexture, 1);
        }
        if (beforeDraw) {
            beforeDraw(gl, this.program.program);
        }
        this.engine.fullscreenQuad.draw(this.program.program);
        gl.enable(gl.DEPTH_TEST);
        // Restore viewport (match C++ Frame::render())
        gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);
    }
    resize() {
        this.destroy();
        this.lastWidth = this.engine.width;
        this.lastHeight = this.engine.height;
        this.init();
    }
    destroy() {
        const gl = this.gl();
        if (this.colorTexture)
            gl.deleteTexture(this.colorTexture);
        if (this.depthTexture)
            gl.deleteTexture(this.depthTexture);
        if (this.framebuffer)
            gl.deleteFramebuffer(this.framebuffer);
        this.colorTexture = null;
        this.depthTexture = null;
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
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // When minified
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); // When magnified
        // Clamp to edge prevents texture wrapping (no repeating)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // Attach color texture to framebuffer (this is where color data goes)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTexture, 0);
        // Create depth texture - stores depth information for proper 3D rendering and post-processing
        // Depth texture allows us to sample depth in shaders for effects like edge detection
        this.depthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
        // Allocate depth texture (DEPTH_COMPONENT24 for 24-bit depth precision)
        // WebGL2 supports DEPTH_COMPONENT24, DEPTH_COMPONENT32F, DEPTH24_STENCIL8, etc.
        // Using DEPTH_COMPONENT24 with UNSIGNED_INT type
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, this.engine.width, this.engine.height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        // Set texture filtering for depth texture
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); // Nearest for depth (no interpolation)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); // Nearest for depth
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // Attach depth texture to framebuffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture, 0);
        // Check framebuffer completeness
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            const statusNames = {
                [gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT]: "FRAMEBUFFER_INCOMPLETE_ATTACHMENT",
                [gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT]: "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT",
                [gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS]: "FRAMEBUFFER_INCOMPLETE_DIMENSIONS",
                [gl.FRAMEBUFFER_UNSUPPORTED]: "FRAMEBUFFER_UNSUPPORTED"
            };
            throw new Error(`Framebuffer incomplete: ${statusNames[status] || status}`);
        }
        // unbind
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}
exports.FrameBuffer = FrameBuffer;
//# sourceMappingURL=frameBuffer.js.map