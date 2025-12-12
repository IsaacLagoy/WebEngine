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
export class Engine {
    gl: WebGL2RenderingContext;  // WebGL 2.0 context (modern standard)
    scene?: Scene;
    meshes: Mesh[] = [];
    materials: Material[] = [];
    width: number = 0;
    height: number = 0;
    aspectRatio: number = 1.0;  // Window aspect ratio (width / height)

    framebuffer: FrameBuffer;
    fullscreenQuad: Quad;
    quadShader: Shader;

    private uniformCache = new Map<string, WebGLUniformLocation | null>();

    constructor(gl: WebGL2RenderingContext, quadShader: Shader, fullscreenQuad: Quad) {
        this.gl = gl;
        this.updateAspectRatio();

        this.quadShader = quadShader;
        this.fullscreenQuad = fullscreenQuad;
        
        // Get initial canvas size
        // When canvas is sized via CSS, width/height may be 0 initially
        // We'll set a default size and let resizeCanvas() update it properly
        const canvas = gl.canvas as HTMLCanvasElement;
        const dpr = window.devicePixelRatio || 1;
        const cssWidth = canvas.clientWidth || 300;
        const cssHeight = canvas.clientHeight || 150;
        
        // Calculate initial size in device pixels
        this.width = Math.round(cssWidth * dpr);
        this.height = Math.round(cssHeight * dpr);
        
        // Set canvas internal resolution to match
        canvas.width = this.width;
        canvas.height = this.height;
        
        // Create framebuffer AFTER setting dimensions (needs correct size)
        // Framebuffer is where we render the scene before post-processing
        this.framebuffer = new FrameBuffer(this);

        // Set clear color (background color when clearing the screen)
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        // Enable depth testing (objects closer to camera occlude farther ones)
        gl.enable(gl.DEPTH_TEST);
        // Enable back-face culling to reduce overdraw and z-fighting artifacts
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
    }

    /**
     * Factory method to create an Engine instance
     * Loads shaders and initializes all systems
     */
    static async create(gl: WebGL2RenderingContext): Promise<Engine> {
        const quadShader = await Shader.create(gl, "/shaders/quad.vert", "/shaders/quad.frag");
        const fullscreenQuad = new Quad(gl);
        const engine = new Engine(gl, quadShader, fullscreenQuad);
        return engine;
    }

    /**
     * Bind the engine framebuffer, set viewport, and clear.
     */
    beginFrame() {
        const gl = this.gl;

        // Sync with current canvas dimensions (handles any resize timing)
        const canvas = gl.canvas as HTMLCanvasElement;
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
        this.framebuffer.clear();
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
    present(texture: WebGLTexture, program: Shader, beforeDraw?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void) {
        const gl = this.gl;
        const canvas = gl.canvas as HTMLCanvasElement;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvasWidth, canvasHeight);
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
    blitToFramebuffer(texture: WebGLTexture, program: Shader, targetFramebuffer: FrameBuffer, beforeDraw?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void) {
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
     */
    resizeCanvas() {
        const canvas = this.gl.canvas as HTMLCanvasElement;

        // Lookup the size the browser is displaying the canvas in CSS pixels
        const dpr = window.devicePixelRatio || 1;
        const { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();
        
        // Calculate display size in device pixels
        const displayWidth = Math.round(cssWidth * dpr);
        const displayHeight = Math.round(cssHeight * dpr);

        // Don't resize if dimensions are invalid (0 or negative)
        if (displayWidth <= 0 || displayHeight <= 0) {
            return;
        }

        // Check if the canvas is not the same size
        const needsResize = canvas.width !== displayWidth || canvas.height !== displayHeight;
        if (needsResize) {
            // Make the canvas the same size
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            this.width = displayWidth;
            this.height = displayHeight;

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
        } else {
            // Even if dimensions haven't changed, ensure camera aspect ratio is correct
            // This handles the case where engine was initialized with wrong dimensions
            const currentAspectRatio = this.height > 0 ? this.width / this.height : 1.0;
            if (Math.abs(this.aspectRatio - currentAspectRatio) > 0.001) {
                this.aspectRatio = currentAspectRatio;
                if (this.scene && this.scene.camera) {
                    this.scene.camera.updateAspectRatio();
                }
            }
        }
        
        // Always set viewport to current dimensions
        // This is critical - WebGL doesn't automatically update viewport when canvas resizes
        this.gl.viewport(0, 0, this.width, this.height);
    } 

    getUniformLocation(program: WebGLProgram, name: string): WebGLUniformLocation | null {
        const key = name;
        if (!this.uniformCache.has(key)) {
            this.uniformCache.set(key, this.gl.getUniformLocation(program, name));
        }
        return this.uniformCache.get(key)!;
    }

    /**
     * Update aspect ratio from current width/height
     */
    private updateAspectRatio() {
        if (this.height > 0) {
            this.aspectRatio = this.width / this.height;
            this.scene?.camera.updateAspectRatio();
        }
    }

    render() {
        // Don't render engine.framebuffer - it's just cleared and empty
        // The actual rendering happens via secondaryFramebuffer.render() in the main loop
    }
}