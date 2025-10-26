import { Mesh } from "./mesh";
import { Material } from "./material";
import { Scene } from "./scene";
import { FrameBuffer } from "../core/frameBuffer";
import { Camera } from "../core/camera";
import { Program } from "../core/program";
import { Quad } from "../core/quad";
import { vec3 } from "gl-matrix";


export class Engine {
    gl: WebGLRenderingContext;
    scene?: Scene;
    meshes: Mesh[] = [];
    materials: Material[] = [];
    width: number = 0;
    height: number = 0;
    camera: Camera;

    framebuffer: FrameBuffer;
    quadShader: Program;
    fullscreenQuad: Quad;

    private uniformCache = new Map<string, WebGLUniformLocation | null>();

    constructor(gl: WebGLRenderingContext, quadShader: Program, fullscreenQuad: Quad) {
        this.gl = gl;
        this.camera = new Camera();
        this.camera.setPosition(vec3.fromValues(0, 0, 50));

        this.quadShader = quadShader;
        this.fullscreenQuad = fullscreenQuad;
        
        // Get initial canvas size from attributes (not clientWidth/clientHeight)
        const canvas = gl.canvas as HTMLCanvasElement;
        this.width = canvas.width || 800;
        this.height = canvas.height || 600;
        
        // Create framebuffer AFTER setting dimensions
        this.framebuffer = new FrameBuffer(this);

        gl.clearColor(0.2, 0.3, 0.3, 1.0);
        gl.enable(gl.DEPTH_TEST);
    }

    static async create(gl: WebGLRenderingContext): Promise<Engine> {
        const quadShader = await Program.create(gl, "/shaders/quad.vert", "/shaders/quad.frag");
        const fullscreenQuad = new Quad(gl);
        return new Engine(gl, quadShader, fullscreenQuad);
    }

    render(program: WebGLProgram) {
        const gl = this.gl;

        // PASS 1: Render scene to framebuffer
        this.framebuffer.bind();
        gl.viewport(0, 0, this.width, this.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        if (this.scene) {
            this.scene.draw(program, this.camera);
        }

        // PASS 2: Render framebuffer texture to screen  
        this.framebuffer.unbind();
        gl.viewport(0, 0, this.width, this.height);
        gl.disable(gl.DEPTH_TEST);

        this.quadShader.use();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.framebuffer.colorTexture);
        const texLoc = gl.getUniformLocation(this.quadShader.program, "uTexture");
        gl.uniform1i(texLoc, 0);
        
        this.fullscreenQuad.draw(this.quadShader.program);
        gl.enable(gl.DEPTH_TEST);
    }

    resizeCanvas() {
        const canvas = this.gl.canvas as HTMLCanvasElement;

        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;

        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            this.gl.viewport(0, 0, displayWidth, displayHeight);
            this.width = displayWidth;
            this.height = displayHeight;

            if (this.framebuffer) this.framebuffer.resize();
        }
    } 

    getUniformLocation(program: WebGLProgram, name: string): WebGLUniformLocation | null {
        const key = name;
        if (!this.uniformCache.has(key)) {
            this.uniformCache.set(key, this.gl.getUniformLocation(program, name));
        }
        return this.uniformCache.get(key)!;
    }
}