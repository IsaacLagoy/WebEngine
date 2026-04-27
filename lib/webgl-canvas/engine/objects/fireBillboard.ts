import { Billboard } from "./billboard";
import { Engine } from "./engine";
import { vec3, mat4 } from "gl-matrix";
import { Shader } from "../core/shader";

/**
 * FireBillboard - animated fire effect using sprite sheets
 * Extends Billboard with texture animation support
 */
export class FireBillboard extends Billboard {
    textures: WebGLTexture[] = [];
    currentFrame: number = 0;
    frameTime: number = 0;
    frameDuration: number = 0.05; // 50ms per frame = 20 FPS animation
    
    constructor(
        engine: Engine,
        position: vec3,
        size: [number, number] = [10, 15],
        textures: WebGLTexture[] = []
    ) {
        // Initialize with white color (will be overridden by texture)
        super(engine, position, size, [1, 1, 1]);
        this.textures = textures;
    }

    /**
     * Load all fire sprite frames
     */
    static async loadFrames(engine: Engine): Promise<WebGLTexture[]> {
        const gl = engine.gl;
        const textures: WebGLTexture[] = [];
        const numFrames = 30; // fire_sample00.png through fire_sample29.png

        // Load all frames
        const loadPromises: Promise<WebGLTexture>[] = [];
        for (let i = 0; i < numFrames; i++) {
            const frameNum = i.toString().padStart(2, '0');
            const url = `/images/sprite_sheets/fire_sample/fire_sample${frameNum}.png`;
            
            loadPromises.push(
                new Promise<WebGLTexture>((resolve, reject) => {
                    const texture = gl.createTexture();
                    if (!texture) {
                        reject(new Error("Failed to create texture"));
                        return;
                    }

                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    
                    // Temporary placeholder
                    const pixel = new Uint8Array([255, 255, 255, 255]);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

                    const image = new Image();
                    image.crossOrigin = "anonymous";
                    image.onload = () => {
                        gl.bindTexture(gl.TEXTURE_2D, texture);
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                        
                        // Use linear filtering for smooth animation
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                        
                        resolve(texture);
                    };
                    image.onerror = () => {
                        reject(new Error(`Failed to load fire frame: ${url}`));
                    };
                    image.src = url;
                })
            );
        }

        return Promise.all(loadPromises);
    }

    /**
     * Update animation frame
     */
    update(dt: number) {
        if (this.textures.length === 0) return;
        
        this.frameTime += dt;
        if (this.frameTime >= this.frameDuration) {
            this.frameTime = 0;
            this.currentFrame = (this.currentFrame + 1) % this.textures.length;
        }
    }

    /**
     * Render the fire billboard with current animation frame
     */
    render(viewProjMatrix: mat4, cameraPos: vec3) {
        if (!this.shader || this.textures.length === 0) return;
        
        const gl = this.gl();
        const currentTexture = this.textures[this.currentFrame];
        
        this.shader.use();
        
        // Set all the same uniforms as base Billboard
        const vpLoc = gl.getUniformLocation(this.shader.program, "uViewProj");
        if (vpLoc !== null) {
            gl.uniformMatrix4fv(vpLoc, false, viewProjMatrix);
        }
        
        const posLoc = gl.getUniformLocation(this.shader.program, "uPosition");
        if (posLoc !== null) {
            gl.uniform3fv(posLoc, this.position);
        }
        
        const sizeLoc = gl.getUniformLocation(this.shader.program, "uSize");
        if (sizeLoc !== null) {
            gl.uniform2f(sizeLoc, this.size[0], this.size[1]);
        }
        
        const camPosLoc = gl.getUniformLocation(this.shader.program, "uCameraPos");
        if (camPosLoc !== null) {
            gl.uniform3fv(camPosLoc, cameraPos);
        }
        
        // Bind current frame texture instead of using color
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, currentTexture);
        const texLoc = gl.getUniformLocation(this.shader.program, "uTexture");
        if (texLoc !== null) {
            gl.uniform1i(texLoc, 0);
        }
        
        // Set color to white (texture will provide the color)
        const colorLoc = gl.getUniformLocation(this.shader.program, "uColor");
        if (colorLoc !== null) {
            gl.uniform3f(colorLoc, 1.0, 1.0, 1.0);
        }
        
        // Set useTexture to true (texture mode)
        const useTextureLoc = gl.getUniformLocation(this.shader.program, "uUseTexture");
        if (useTextureLoc !== null) {
            gl.uniform1i(useTextureLoc, 1);
        }
        
        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        
        // Draw
        this.quad.draw(this.shader.program);
        
        // Restore
        gl.depthMask(true);
        gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
    }
}
