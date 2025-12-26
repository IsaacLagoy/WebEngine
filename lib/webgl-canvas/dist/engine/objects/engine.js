"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Engine = void 0;
const frameBuffer_1 = require("../core/frameBuffer");
const quad_1 = require("../core/quad");
const shader_1 = require("../core/shader");
/**
 * Engine class - the main rendering engine
 * Manages the WebGL context, scene, camera, framebuffers, and post-processing
 * This is the central hub that coordinates all rendering
 */
class Engine {
    constructor(gl, quadShader, fullscreenQuad, resolutionScale = 1.0) {
        this.meshes = [];
        this.materials = [];
        this.width = 0;
        this.height = 0;
        this.aspectRatio = 1.0; // Window aspect ratio (width / height)
        // Resolution scale for performance optimization (0.0 to 1.0)
        // Renders at lower resolution and scales up to fit screen
        this.resolutionScale = 1.0;
        // Cache last known CSS dimensions to prevent unnecessary resizes
        this.lastCssWidth = 0;
        this.lastCssHeight = 0;
        this.uniformCache = new Map();
        this.gl = gl;
        this.quadShader = quadShader;
        this.fullscreenQuad = fullscreenQuad;
        this.resolutionScale = Math.max(0.1, Math.min(1.0, resolutionScale)); // Clamp between 0.1 and 1.0
        // Get initial canvas size
        // When canvas is sized via CSS, width/height may be 0 initially
        // We'll set a default size and let resizeCanvas() update it properly
        const canvas = gl.canvas;
        const dpr = window.devicePixelRatio || 1;
        const cssWidth = canvas.clientWidth || 300;
        const cssHeight = canvas.clientHeight || 150;
        // Calculate initial size in device pixels, scaled by resolution scale
        const displayWidth = Math.round(cssWidth * dpr);
        const displayHeight = Math.round(cssHeight * dpr);
        this.width = Math.round(displayWidth * this.resolutionScale);
        this.height = Math.round(displayHeight * this.resolutionScale);
        // Set canvas internal resolution to match
        canvas.width = this.width;
        canvas.height = this.height;
        // Update aspect ratio AFTER setting dimensions
        this.updateAspectRatio();
        // Create framebuffer AFTER setting dimensions (needs correct size)
        // Framebuffer is where we render the scene before post-processing
        this.framebuffer = new frameBuffer_1.FrameBuffer(this);
        // Set clear color (background color when clearing the screen) - pale night sky
        gl.clearColor(0.2, 0.2, 0.35, 1.0);
        // Enable depth testing (objects closer to camera occlude farther ones)
        gl.enable(gl.DEPTH_TEST);
        // Enable back-face culling to reduce overdraw and z-fighting artifacts
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
    }
    /**
     * Factory method to create an Engine instance
     * Loads shaders and initializes all systems
     * @param resolutionScale - Resolution scale factor (0.0 to 1.0) for performance optimization
     *                          If not provided, will try to read from canvas.__resolutionScale
     */
    static async create(gl, resolutionScale) {
        // If resolutionScale not provided, try to read from canvas
        if (resolutionScale === undefined) {
            const canvas = gl.canvas;
            resolutionScale = canvas.__resolutionScale ?? 1.0;
        }
        const quadShader = await shader_1.Shader.create(gl, "/shaders/quad.vert", "/shaders/quad.frag");
        const fullscreenQuad = new quad_1.Quad(gl);
        const engine = new Engine(gl, quadShader, fullscreenQuad, resolutionScale);
        return engine;
    }
    /**
     * Bind the engine framebuffer, set viewport, and clear.
     */
    beginFrame() {
        const gl = this.gl;
        // Sync with current canvas dimensions (handles any resize timing)
        const canvas = gl.canvas;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        if (this.width !== canvasWidth || this.height !== canvasHeight) {
            this.width = canvasWidth;
            this.height = canvasHeight;
            this.updateAspectRatio();
            if (this.framebuffer) {
                this.framebuffer.resize();
            }
        }
        this.framebuffer.bind();
        gl.viewport(0, 0, this.width, this.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
    update() {
        this.framebuffer.use();
        // Clear with pale night sky background
        this.framebuffer.clear([0.2, 0.2, 0.35, 1.0]);
    }
    /**
     * Unbind the engine framebuffer (returns to default framebuffer).
     */
    endFrame() {
        this.framebuffer.unbind();
    }
    /**
     * Set screen as render location (bind to null framebuffer)
     */
    use() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }
    /**
     * Present a texture to the screen using the given shader program.
     * The program is expected to sample uTexture at sampler2D unit 0.
     */
    present(texture, program, beforeDraw) {
        const gl = this.gl;
        const canvas = gl.canvas;
        // Use CSS display size for viewport (not internal render resolution)
        // This ensures the texture is stretched to fill the display
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = Math.round(canvas.clientWidth * dpr);
        const displayHeight = Math.round(canvas.clientHeight * dpr);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, displayWidth, displayHeight);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.DEPTH_TEST);
        program.use();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const texLoc = gl.getUniformLocation(program.program, "uTexture");
        if (texLoc !== null) {
            gl.uniform1i(texLoc, 0);
        }
        if (beforeDraw) {
            beforeDraw(gl, program.program);
        }
        this.fullscreenQuad.draw(program.program);
        gl.enable(gl.DEPTH_TEST);
    }
    /**
     * Render a texture to a target framebuffer using a fullscreen quad and the given program.
     * The program is expected to sample uTexture at sampler2D unit 0.
     */
    blitToFramebuffer(texture, program, targetFramebuffer, beforeDraw) {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer.framebuffer);
        gl.viewport(0, 0, this.width, this.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.DEPTH_TEST);
        program.use();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const texLoc = gl.getUniformLocation(program.program, "uTexture");
        if (texLoc !== null) {
            gl.uniform1i(texLoc, 0);
        }
        if (beforeDraw) {
            beforeDraw(gl, program.program);
        }
        this.fullscreenQuad.draw(program.program);
        gl.enable(gl.DEPTH_TEST);
    }
    /**
     * Resize canvas to match display size
     * Uses ResizeObserver with devicePixelContentBoxSize for best accuracy (Chrome/Edge)
     * Falls back to getBoundingClientRect * devicePixelRatio for other browsers
     * Based on: https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
     *
     * Caches CSS dimensions to prevent unnecessary resizes during scroll/transforms
     */
    resizeCanvas() {
        const canvas = this.gl.canvas;
        // Lookup the size the browser is displaying the canvas in CSS pixels
        const dpr = window.devicePixelRatio || 1;
        const { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();
        // Only proceed if CSS dimensions actually changed (prevents resize on scroll/transform)
        if (cssWidth === this.lastCssWidth && cssHeight === this.lastCssHeight) {
            // Dimensions haven't changed, just ensure viewport is correct
            this.gl.viewport(0, 0, this.width, this.height);
            return;
        }
        // Update cached CSS dimensions
        this.lastCssWidth = cssWidth;
        this.lastCssHeight = cssHeight;
        // Calculate display size in device pixels
        const displayWidth = Math.round(cssWidth * dpr);
        const displayHeight = Math.round(cssHeight * dpr);
        // Don't resize if dimensions are invalid (0 or negative)
        if (displayWidth <= 0 || displayHeight <= 0) {
            return;
        }
        // Calculate render resolution (scaled down for performance)
        const renderWidth = Math.round(displayWidth * this.resolutionScale);
        const renderHeight = Math.round(displayHeight * this.resolutionScale);
        // Check if the canvas internal resolution needs to change
        // Note: canvas CSS size stays at display size, but internal resolution is scaled
        const needsResize = canvas.width !== renderWidth || canvas.height !== renderHeight;
        if (needsResize) {
            // Set canvas internal resolution to scaled size
            // CSS will automatically scale it up to display size
            canvas.width = renderWidth;
            canvas.height = renderHeight;
            this.width = renderWidth;
            this.height = renderHeight;
            // Update aspect ratio
            this.updateAspectRatio();
            // Update camera aspect ratio if scene exists
            if (this.scene && this.scene.camera) {
                this.scene.camera.updateAspectRatio();
            }
            // Resize framebuffer to match new canvas size
            if (this.framebuffer) {
                this.framebuffer.resize();
            }
        }
        else {
            // Even if dimensions haven't changed, ensure aspect ratio and camera are correct
            // This handles the case where engine was initialized with wrong dimensions
            const currentAspectRatio = this.height > 0 ? this.width / this.height : 1.0;
            if (Math.abs(this.aspectRatio - currentAspectRatio) > 0.001) {
                this.aspectRatio = currentAspectRatio;
            }
            // Always update camera aspect ratio when resizeCanvas is called, even if size didn't change
            // This ensures camera is correct on initial load
            if (this.scene && this.scene.camera) {
                this.scene.camera.updateAspectRatio();
            }
        }
        // Always set viewport to current dimensions
        // This is critical - WebGL doesn't automatically update viewport when canvas resizes
        this.gl.viewport(0, 0, this.width, this.height);
    }
    getUniformLocation(program, name) {
        const key = name;
        if (!this.uniformCache.has(key)) {
            this.uniformCache.set(key, this.gl.getUniformLocation(program, name));
        }
        return this.uniformCache.get(key);
    }
    /**
     * Set the resolution scale factor for performance optimization
     * @param scale - Resolution scale (0.1 to 1.0). Lower values improve performance but reduce quality.
     */
    setResolutionScale(scale) {
        this.resolutionScale = Math.max(0.1, Math.min(1.0, scale));
        // Trigger a resize to apply the new scale
        this.resizeCanvas();
    }
    /**
     * Update aspect ratio from current width/height
     */
    updateAspectRatio() {
        if (this.height > 0) {
            this.aspectRatio = this.width / this.height;
            this.scene?.camera.updateAspectRatio();
        }
    }
}
exports.Engine = Engine;
//# sourceMappingURL=engine.js.map