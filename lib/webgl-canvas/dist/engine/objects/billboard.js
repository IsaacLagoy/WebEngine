"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Billboard = void 0;
const quad_1 = require("../core/quad");
/**
 * Billboard - renders a solid color quad that faces the camera
 */
class Billboard {
    constructor(engine, position, size = [1, 1], color = [1, 0, 0]) {
        this.shader = null;
        this.engine = engine;
        this.position = position;
        this.size = size;
        this.color = color;
        this.quad = new quad_1.Quad(engine.gl);
    }
    gl() {
        return this.engine.gl;
    }
    async init(shader) {
        this.shader = shader;
    }
    render(viewProjMatrix, cameraPos) {
        if (!this.shader)
            return;
        const gl = this.gl();
        this.shader.use();
        // Set uniforms
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
        const colorLoc = gl.getUniformLocation(this.shader.program, "uColor");
        if (colorLoc !== null) {
            gl.uniform3f(colorLoc, this.color[0], this.color[1], this.color[2]);
        }
        // Set useTexture to false (solid color mode)
        const useTextureLoc = gl.getUniformLocation(this.shader.program, "uUseTexture");
        if (useTextureLoc !== null) {
            gl.uniform1i(useTextureLoc, 0);
        }
        // Disable depth test so it always shows
        gl.disable(gl.DEPTH_TEST);
        // Draw
        this.quad.draw(this.shader.program);
        // Restore
        gl.enable(gl.DEPTH_TEST);
    }
}
exports.Billboard = Billboard;
//# sourceMappingURL=billboard.js.map